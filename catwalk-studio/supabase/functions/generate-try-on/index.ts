import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_TRY_ON_MODEL = 'google/nano-banana'
const DEFAULT_PREP_MODEL = 'prunaai/p-image'
const DEFAULT_TRY_ON_COST = 5
const DEFAULT_PREP_TTL_MS = 60 * 60 * 1000
const PREP_SYSTEM_PROMPT = 'Professional fashion editorial portrait of the same model identity, clear facial details, 3/4 body framing, front-facing stance, neutral studio background, sharp focus, realistic skin texture, natural body proportions, clean silhouette, no garment occlusion, ready for virtual try-on input.'

function resolveAspectRatio(width?: number, height?: number): string {
    if (!width || !height) return '3:4'

    const ratio = width / height
    const supported: [number, string][] = [
        [1, '1:1'],
        [2 / 3, '2:3'],
        [3 / 2, '3:2'],
        [3 / 4, '3:4'],
        [4 / 3, '4:3'],
        [4 / 5, '4:5'],
        [5 / 4, '5:4'],
        [9 / 16, '9:16'],
        [16 / 9, '16:9'],
        [21 / 9, '21:9'],
    ]

    let best = '3:4'
    let smallestDiff = Number.POSITIVE_INFINITY
    for (const [candidateRatio, label] of supported) {
        const diff = Math.abs(ratio - candidateRatio)
        if (diff < smallestDiff) {
            smallestDiff = diff
            best = label
        }
    }

    return best
}

function parseSeed(seed?: string | number | null): number | undefined {
    if (seed === undefined || seed === null || seed === '') return undefined
    const parsed = typeof seed === 'number' ? seed : parseInt(seed, 10)
    return Number.isNaN(parsed) ? undefined : parsed
}

function buildFinalPrompt({
    modelName,
    clothingDescription,
    prompt,
    negativePrompt,
    quality,
}: {
    modelName: string
    clothingDescription: string
    prompt?: string
    negativePrompt?: string
    quality?: string
}) {
    let finalPrompt = `A professional fashion photo of ${modelName} wearing ${clothingDescription || 'a stylish outfit'}`

    if (prompt) {
        finalPrompt += `, ${prompt}`
    }

    if (quality === 'hd') {
        finalPrompt += ', premium high-definition detail, crisp fabric texture, refined facial detail'
    }

    if (negativePrompt) {
        finalPrompt += `. Avoid: ${negativePrompt}`
    }

    finalPrompt += '. Full body shot, studio lighting, fashion editorial style, high quality, detailed clothing texture.'
    return finalPrompt
}

function buildSourceSignature(trainingData: unknown) {
    return JSON.stringify(trainingData || [])
}

function derivePreparationReference(trainingData: unknown): string | null {
    if (typeof trainingData === 'string' && trainingData.trim()) {
        return trainingData.trim()
    }

    if (Array.isArray(trainingData)) {
        for (const entry of trainingData) {
            if (typeof entry === 'string' && entry.trim()) {
                return entry.trim()
            }
            if (!entry || typeof entry !== 'object') continue
            const record = entry as Record<string, unknown>
            const candidate = record.lora_weights
                || record.weightsUrl
                || record.weightUrl
                || record.modelUrl
                || record.referenceUrl
                || record.imageUrl
                || record.url

            if (typeof candidate === 'string' && candidate.trim()) {
                return candidate.trim()
            }
        }
    }

    if (trainingData && typeof trainingData === 'object') {
        const record = trainingData as Record<string, unknown>
        const candidate = record.lora_weights
            || record.weightsUrl
            || record.weightUrl
            || record.modelUrl
            || record.referenceUrl
            || record.imageUrl
            || record.url

        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim()
        }
    }

    return null
}

async function probeUrl(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Range: 'bytes=0-0' },
        })
        return response.ok
    } catch {
        return false
    }
}

async function deductCredits(supabaseAdmin: any, userId: string, amount: number, metadata: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: 'try_on_generation',
        p_metadata: metadata,
    })

    if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Insufficient credits')
    }
}

async function refundCredits(supabaseAdmin: any, userId: string, amount: number, metadata: Record<string, unknown>) {
    await supabaseAdmin.rpc('add_credits_secure', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: 'refund_failed_try_on',
        p_metadata: metadata,
    })
}

async function resolveGarmentDetails(supabaseAdmin: any, wardrobeItemId: string | null, garmentUrl: string | null) {
    let clothingDescription = ''
    let resolvedGarmentUrl = garmentUrl || null
    let garmentCategory = 'tops'

    if (wardrobeItemId && wardrobeItemId !== 'custom_upload') {
        const { data: wardrobeItem } = await supabaseAdmin
            .from('wardrobe_items')
            .select('title, category, brand, colour, high_res_image_url, thumbnail_url')
            .eq('item_id', wardrobeItemId)
            .single()

        if (wardrobeItem) {
            const parts = [wardrobeItem.title].filter(Boolean)
            if (wardrobeItem.colour) parts.push(wardrobeItem.colour)
            if (wardrobeItem.brand) parts.push(`by ${wardrobeItem.brand}`)
            if (wardrobeItem.category) {
                parts.push(`(${wardrobeItem.category})`)
                const cat = wardrobeItem.category.toLowerCase()
                if (cat.includes('bottom') || cat.includes('pant') || cat.includes('skirt') || cat.includes('trousers') || cat.includes('jeans')) {
                    garmentCategory = 'bottoms'
                } else if (cat.includes('dress') || cat.includes('one-piece') || cat.includes('suit') || cat.includes('jumpsuit')) {
                    garmentCategory = 'one-pieces'
                }
            }
            clothingDescription = parts.join(' ')
            resolvedGarmentUrl = wardrobeItem.high_res_image_url || wardrobeItem.thumbnail_url || resolvedGarmentUrl
        }
    } else if (wardrobeItemId === 'custom_upload') {
        clothingDescription = 'Custom Uploaded Garment'
    }

    return { clothingDescription, resolvedGarmentUrl, garmentCategory }
}

async function resolvePreparedMarketplaceImage({
    supabaseAdmin,
    model,
    userId,
    replicateApiToken,
}: {
    supabaseAdmin: any
    model: any
    userId: string
    replicateApiToken: string
}) {
    const sourceSignature = buildSourceSignature(model.training_data)
    const existingAssetQuery = await supabaseAdmin
        .from('try_on_temp_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('model_id', model.model_id)
        .maybeSingle()

    const existingAsset = existingAssetQuery.data
    const nowIso = new Date().toISOString()

    if (existingAsset?.prepared_image_url && existingAsset?.source_signature === sourceSignature) {
        const stillValid = await probeUrl(existingAsset.prepared_image_url)
        await supabaseAdmin
            .from('try_on_temp_assets')
            .update({
                last_checked_at: nowIso,
                last_verified_at: stillValid ? nowIso : existingAsset.last_verified_at,
                status: stillValid ? 'ready' : 'failed',
                error_message: stillValid ? null : 'Prepared image URL expired or is no longer reachable',
                updated_at: nowIso,
            })
            .eq('id', existingAsset.id)

        if (stillValid) {
            return {
                modelImageUrl: existingAsset.prepared_image_url,
                reusedPreparedImage: true,
                sourceSignature,
            }
        }
    }

    await supabaseAdmin
        .from('try_on_temp_assets')
        .upsert({
            user_id: userId,
            model_id: model.model_id,
            prepared_image_url: existingAsset?.prepared_image_url || 'pending://preparing',
            provider: 'replicate',
            status: 'preparing',
            source_signature: sourceSignature,
            error_message: null,
            updated_at: nowIso,
        }, { onConflict: 'user_id,model_id' })

    const preparationReference = derivePreparationReference(model.training_data)
    if (!preparationReference) {
        await supabaseAdmin
            .from('try_on_temp_assets')
            .update({
                status: 'failed',
                error_message: 'Marketplace model is missing training_data reference for try-on preparation',
                updated_at: nowIso,
            })
            .eq('user_id', userId)
            .eq('model_id', model.model_id)

        throw new Error('Selected marketplace model is missing try-on preparation data')
    }

    const preparationResponse = await fetch(`https://api.replicate.com/v1/models/${DEFAULT_PREP_MODEL}/predictions`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${replicateApiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: {
                prompt: PREP_SYSTEM_PROMPT,
                aspect_ratio: '3:4',
                lora_weights: preparationReference,
                lora_scale: 0.8,
                prompt_upsampling: false,
                disable_safety_checker: true,
            },
        }),
    })

    if (!preparationResponse.ok) {
        const errorData = await preparationResponse.json().catch(() => ({}))
        const message = errorData.detail || 'Replicate preparation API error'

        await supabaseAdmin
            .from('try_on_temp_assets')
            .update({
                status: 'failed',
                error_message: message,
                updated_at: nowIso,
            })
            .eq('user_id', userId)
            .eq('model_id', model.model_id)

        throw new Error(`Failed to prepare marketplace model: ${message}`)
    }

    const prediction = await preparationResponse.json()
    let preparedImageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
    const predictionId = prediction.id || null

    if (!preparedImageUrl && predictionId) {
        for (let attempt = 0; attempt < 15 && !preparedImageUrl; attempt += 1) {
            await new Promise(resolve => setTimeout(resolve, 2000))
            const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                headers: { 'Authorization': `Token ${replicateApiToken}` },
            })
            if (!pollResponse.ok) {
                continue
            }

            const pollData = await pollResponse.json()
            if (pollData.status === 'failed' || pollData.status === 'canceled') {
                const message = pollData.error || `Preparation ${pollData.status}`
                await supabaseAdmin
                    .from('try_on_temp_assets')
                    .update({
                        status: 'failed',
                        prediction_id: predictionId,
                        error_message: message,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId)
                    .eq('model_id', model.model_id)
                throw new Error(`Failed to prepare marketplace model: ${message}`)
            }

            preparedImageUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output
        }
    }

    if (!preparedImageUrl) {
        await supabaseAdmin
            .from('try_on_temp_assets')
            .update({
                status: 'failed',
                prediction_id: predictionId,
                error_message: 'Preparation did not produce an output image',
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('model_id', model.model_id)

        throw new Error('Failed to prepare marketplace model image')
    }

    const expiresAt = new Date(Date.now() + DEFAULT_PREP_TTL_MS).toISOString()
    const updatedAt = new Date().toISOString()

    await supabaseAdmin
        .from('try_on_temp_assets')
        .upsert({
            user_id: userId,
            model_id: model.model_id,
            prepared_image_url: preparedImageUrl,
            provider: 'replicate',
            status: 'ready',
            source_signature: sourceSignature,
            prediction_id: predictionId,
            error_message: null,
            expires_at: expiresAt,
            last_checked_at: updatedAt,
            last_verified_at: updatedAt,
            updated_at: updatedAt,
        }, { onConflict: 'user_id,model_id' })

    return {
        modelImageUrl: preparedImageUrl,
        reusedPreparedImage: false,
        sourceSignature,
    }
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const replicateApiToken = Deno.env.get('REPLICATE_API_TOKEN')
        const webhookSecret = Deno.env.get('WEBHOOK_SECRET') || 'default-secret-change-me-in-production'
        const supabaseApiUrl = Deno.env.get('PUBLIC_SUPABASE_URL_FOR_WEBHOOK') || supabaseUrl
        const webhookUrl = `${supabaseApiUrl}/functions/v1/replicate-webhook?secret=${webhookSecret}`

        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !replicateApiToken) {
            throw new Error('Missing environment configuration')
        }

        const token = authHeader.replace('Bearer ', '')
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        })

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const {
            prompt,
            negativePrompt,
            modelId,
            aiCharacterId,
            wardrobeItemId,
            garmentUrl,
            modelImageUrl: clientModelImageUrl,
            width,
            height,
            seed,
            quality,
            format,
        } = await req.json()

        const hasModelId = !!modelId
        const hasAiCharacterId = !!aiCharacterId
        if (hasModelId === hasAiCharacterId) {
            throw new Error('Try-on requires exactly one source: modelId or aiCharacterId')
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
        const { clothingDescription, resolvedGarmentUrl, garmentCategory } = await resolveGarmentDetails(supabaseAdmin, wardrobeItemId || null, garmentUrl || null)

        if (!resolvedGarmentUrl) {
            throw new Error('A valid garment image is required. Please select or upload a clothing item.')
        }

        let modelName = 'a fashion model'
        let modelImageUrl: string | null = null
        let resolvedAiModelId: string | null = null
        let sourceModelType = 'marketplace_model'
        let reusedPreparedImage = false

        if (aiCharacterId) {
            sourceModelType = 'ai_character'
            const { data: aiChar } = await supabaseAdmin
                .from('ai_models')
                .select('id, name, preview_images')
                .eq('id', aiCharacterId)
                .single()

            if (!aiChar) {
                throw new Error('Selected AI character could not be found')
            }

            modelName = aiChar.name || modelName
            resolvedAiModelId = aiChar.id
            modelImageUrl = aiChar.preview_images?.[0] || clientModelImageUrl || null

            if (!modelImageUrl) {
                throw new Error('Selected AI character is missing a usable image')
            }
        } else {
            const { data: model } = await supabaseAdmin
                .from('models')
                .select('model_id, display_name, ai_model_id, training_data')
                .eq('model_id', modelId)
                .eq('status', 'active')
                .single()

            if (!model) {
                throw new Error('Selected marketplace model is unavailable')
            }

            modelName = model.display_name || modelName
            resolvedAiModelId = model.ai_model_id || null

            const preparedResult = await resolvePreparedMarketplaceImage({
                supabaseAdmin,
                model,
                userId: user.id,
                replicateApiToken,
            })

            modelImageUrl = preparedResult.modelImageUrl
            reusedPreparedImage = preparedResult.reusedPreparedImage
        }

        const finalPrompt = buildFinalPrompt({
            modelName,
            clothingDescription,
            prompt,
            negativePrompt,
            quality,
        })

        const cost = quality === 'hd' ? 10 : DEFAULT_TRY_ON_COST
        await deductCredits(supabaseAdmin, user.id, cost, {
            prompt: finalPrompt.substring(0, 50),
            wardrobe_item_id: wardrobeItemId || null,
            source_model_type: sourceModelType,
            reused_prepared_image: reusedPreparedImage,
        })

        let predictionId = null
        try {
            const replicateResponse = await fetch(`https://api.replicate.com/v1/models/${DEFAULT_TRY_ON_MODEL}/predictions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${replicateApiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: {
                        prompt: finalPrompt,
                        image_input: [modelImageUrl, resolvedGarmentUrl],
                        aspect_ratio: resolveAspectRatio(width, height),
                        output_format: format === 'png' ? 'png' : 'jpg',
                    },
                    webhook: webhookUrl,
                    webhook_events_filter: ['completed'],
                }),
            })

            if (!replicateResponse.ok) {
                const errorData = await replicateResponse.json().catch(() => ({}))
                throw new Error(errorData.detail || 'Replicate API error')
            }

            const prediction = await replicateResponse.json()
            predictionId = prediction.id
        } catch (apiError: any) {
            await refundCredits(supabaseAdmin, user.id, cost, {
                error: apiError.message,
                source_model_type: sourceModelType,
                stage: 'final_try_on',
            })
            throw new Error(`Failed to start try-on generation: ${apiError.message}`)
        }

        try {
            const { data: generation, error: genError } = await supabaseAdmin
                .from('generations')
                .insert({
                    user_id: user.id,
                    model_id: modelId || null,
                    ai_model_id: sourceModelType === 'ai_character' ? resolvedAiModelId : null,
                    type: 'quick_shoot',
                    prompt_text: finalPrompt,
                    parameters_json: {
                        original_prompt: prompt,
                        negative_prompt: negativePrompt,
                        wardrobe_item_id: wardrobeItemId,
                        ai_character_id: aiCharacterId,
                        width,
                        height,
                        seed,
                        quality: quality || 'standard',
                        format: format || 'png',
                        source_model_type: sourceModelType,
                        reused_prepared_image: reusedPreparedImage,
                        processing_stage: 'applying_clothing',
                        ui_seed_supported: false,
                        ui_negative_prompt_applied_via_prompt_text: !!negativePrompt,
                        ui_quality_applied_via_prompt_text: quality === 'hd',
                    },
                    credits_used: cost,
                    status: 'processing',
                    replicate_job_id: predictionId,
                })
                .select()
                .single()

            if (genError) {
                throw genError
            }

            return new Response(JSON.stringify({
                success: true,
                generation,
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        } catch (dbError: any) {
            await refundCredits(supabaseAdmin, user.id, cost, {
                error: dbError.message,
                replicate_job_id: predictionId,
                stage: 'db_insert',
            })
            throw new Error(`Failed to save generation record: ${dbError.message}`)
        }
    } catch (error: any) {
        console.error('Error in generate-try-on:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
