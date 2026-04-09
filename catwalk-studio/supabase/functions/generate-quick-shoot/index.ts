import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { resolveEngine } from "./engines.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const QUALITY_COST_MAP: Record<string, number> = {
    standard: 5,
    hd: 10,
    '4k': 25,
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        // 1. Authenticate Request
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const replicateApiToken = Deno.env.get('REPLICATE_API_TOKEN')
        const webhookSecret = Deno.env.get('WEBHOOK_SECRET') || 'default-secret-change-me-in-production'

        const supabaseApiUrl = Deno.env.get('PUBLIC_SUPABASE_URL_FOR_WEBHOOK') || supabaseUrl;
        const webhookUrl = `${supabaseApiUrl}/functions/v1/replicate-webhook?secret=${webhookSecret}`

        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !replicateApiToken) {
            throw new Error('Missing environment configuration')
        }

        const token = authHeader.replace('Bearer ', '')
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            })
        }

        const { prompt, negativePrompt, modelId, aiModelId, aiCharacterId, modelImageUrl: clientModelImageUrl, wardrobeItemIds, width, height, seed, campaignId, promptId, aiModelProviderName, quality, format, metadata: clientMetadata } = await req.json()
        
        if (!prompt) {
            throw new Error('Missing prompt')
        }

        // Resolve cost based on quality
        const qualityKey = (quality || 'standard').toLowerCase()
        const cost = QUALITY_COST_MAP[qualityKey] || QUALITY_COST_MAP.standard

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

        // 2. Resolve AI Model and Cost
        let finalPrompt = prompt
        let modelImageUrl: string | null = null

        if (aiCharacterId) {
            const { data: aiCharacter } = await supabaseAdmin
                .from('ai_models')
                .select('name, preview_images')
                .eq('id', aiCharacterId)
                .single()

            if (aiCharacter?.name) {
                finalPrompt = `A photo of ${aiCharacter.name}, ${prompt}`
            }
            if (aiCharacter?.preview_images?.[0]) {
                modelImageUrl = aiCharacter.preview_images[0]
            }
        } else if (modelId) {
            // If modelId is explicitly supplied, the marketplace model must be active or fail closed.
            const { data: model, error: modelError } = await supabaseAdmin
                .from('models')
                .select('display_name, profile_image_url')
                .eq('model_id', modelId)
                .eq('status', 'active')
                .maybeSingle()

            if (modelError || !model) {
                throw new Error('Selected marketplace model is unavailable')
            }

            if (model.display_name) {
                finalPrompt = `A photo of ${model.display_name}, ${prompt}`
            }
            if (model.profile_image_url) {
                modelImageUrl = model.profile_image_url
            }
        } else if (aiModelId) {
            const { data: aiModel } = await supabaseAdmin
                .from('ai_models')
                .select('name, preview_images')
                .eq('id', aiModelId)
                .single()
            
            if (aiModel?.name) {
                finalPrompt = `A photo of ${aiModel.name}, ${prompt}`
            }
            if (aiModel?.preview_images?.[0]) {
                modelImageUrl = aiModel.preview_images[0]
            }
        }

        if (!modelImageUrl && clientModelImageUrl && !modelId) {
            modelImageUrl = clientModelImageUrl
        }

        const { data: mapper } = aiModelProviderName
            ? await supabaseAdmin
                .from('aimodel_mapper')
                .select('backend_model_name, cost_per_token')
                .eq('frontend_slug', aiModelProviderName)
                .single()
            : { data: null }

        const engine = resolveEngine(aiModelProviderName, mapper?.backend_model_name)
        const replicateModel = engine.modelName
        const replicateInput = engine.buildInput({
            prompt: finalPrompt,
            negativePrompt,
            width,
            height,
            seed,
            format,
            imageUrl: modelImageUrl,
        })

        // 3. Deduct Credits
        const { data: deductData, error: deductError } = await supabaseAdmin.rpc('deduct_credits', {
            p_user_id: user.id,
            p_amount: cost,
            p_reason: 'quick_shoot_generation',
            p_metadata: { prompt: prompt.substring(0, 50) }
        })

        if (deductError || !deductData?.success) {
            throw new Error(deductError?.message || deductData?.error || 'Insufficient credits')
        }

        // 4. Call Replicate API
        let predictionId = null
        try {
            const replicateResponse = await fetch(`https://api.replicate.com/v1/models/${replicateModel}/predictions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${replicateApiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: replicateInput,
                    webhook: webhookUrl,
                    webhook_events_filter: ["completed"]
                }),
            })

            if (!replicateResponse.ok) {
                const errorData = await replicateResponse.json()
                throw new Error(errorData.detail || 'Replicate API error')
            }

            const prediction = await replicateResponse.json()
            predictionId = prediction.id
        } catch (apiError: any) {
            // Refund
            await supabaseAdmin.rpc('add_credits_secure', {
                p_user_id: user.id,
                p_amount: cost,
                p_reason: 'refund_failed_generation',
                p_metadata: { error: apiError.message }
            })
            throw new Error(`Failed to start generation: ${apiError.message}`)
        }

        // 5. Save to generations table
        try {
            const { data: generation, error: genError } = await supabaseAdmin
                .from('generations')
                .insert({
                    user_id: user.id,
                    campaign_id: campaignId || null,
                    model_id: modelId || null,
                    ai_model_id: aiCharacterId ? aiCharacterId : null,
                    prompt_id: promptId || null,
                    type: 'quick_shoot',
                    prompt_text: prompt,
                    parameters_json: { 
                        negative_prompt: negativePrompt,
                        negativePrompt,
                        width, 
                        height, 
                        seed,
                        format: format || 'png',
                        quality: qualityKey,
                        wardrobe_items: wardrobeItemIds,
                        ai_engine: aiModelProviderName || null,
                        model_image_url: modelImageUrl,
                        replicate_model: replicateModel,
                        replicate_input: replicateInput,
                        metadata: clientMetadata || null,
                    },
                    credits_used: cost,
                    status: 'processing',
                    replicate_job_id: predictionId,
                    is_saved: false,
                })
                .select()
                .single()

            if (genError) throw genError

            return new Response(JSON.stringify({
                success: true,
                generation: generation
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            })
        } catch (dbError: any) {
            // If DB insert fails, we MUST refund since Replicate job was already started
            // (or we could try to cancel Replicate job, but refund is safer)
            await supabaseAdmin.rpc('add_credits_secure', {
                p_user_id: user.id,
                p_amount: cost,
                p_reason: 'refund_db_error',
                p_metadata: { error: dbError.message, replicate_job_id: predictionId }
            })
            throw new Error(`Failed to save generation record: ${dbError.message}`)
        }

    } catch (error: any) {
        console.error('Error in generate-quick-shoot:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })
    }
})
