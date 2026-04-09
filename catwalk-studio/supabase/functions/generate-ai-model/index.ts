import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_MODEL = 'black-forest-labs/flux-dev'
const GENERATION_COST = 15 // Assuming GENERATION_COSTS.ai_model = 15

// Helper to check and deduct credits atomically via RPC
async function deductCredits(supabaseAdmin: any, userId: string, amount: number, reason: string) {
    const { data, error } = await supabaseAdmin.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
        p_metadata: {}
    })

    if (error) throw new Error(error.message)
    if (!data?.success) throw new Error(data?.error || 'Failed to deduct credits')

    return data
}

function buildPrompt(p: any): string {
    const genderDescriptors: Record<string, string> = {
        male: 'male man, masculine features, strong jawline, male model',
        female: 'female woman, feminine features, elegant, female model',
        'non-binary': 'androgynous person, gender-neutral features, fashion model',
    }
    const genderKey = p.gender || 'female'
    const genderDesc = genderDescriptors[genderKey] || genderDescriptors['female']

    const hairDesc = p.hairLength === 'bald'
        ? 'bald head, clean shaven head'
        : `${p.hairColor} ${p.hairLength} ${p.hairStyle} hair`

    return [
        `Portrait of a ${genderDesc}`,
        `${p.ageRange} years old, ${p.ethnicity} ethnicity`,
        `${p.height} height, ${p.bodyType} body type`,
        `${p.faceShape} face shape, ${p.skinTone} skin tone`,
        `${hairDesc}, ${p.eyeColor} eyes`,
        `${p.style} fashion style`,
        `professional studio lighting, 8k ultra-detailed, fashion editorial photography`,
        `shot on Canon EOS R5, 85mm lens, shallow depth of field`,
    ].join(', ') + '.'
}

async function sendDiscordMessage(webhookUrl: string, content: string, embed?: any) {
    if (!webhookUrl) return;
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content,
                embeds: embed ? [embed] : []
            })
        });
    } catch (err) {
        console.error('Failed to send Discord message:', err);
    }
}

serve(async (req) => {
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
        const discordWebhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL') || ''
        const webhookSecret = Deno.env.get('WEBHOOK_SECRET') || 'default-secret-change-me-in-production'

        // This public URL must be accessible heavily from the internet (ngrok in local, or production URL)
        // Adjust logic if you are running local vs production.
        const supabaseApiUrl = Deno.env.get('PUBLIC_SUPABASE_URL_FOR_WEBHOOK') || supabaseUrl;
        const webhookUrl = `${supabaseApiUrl}/functions/v1/replicate-webhook?secret=${webhookSecret}`

        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !replicateApiToken) {
            throw new Error('Missing environment configuration')
        }

        // Client for auth verify (checks user's JWT)
        // Extract the raw token from the Authorization header
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

        const { params } = await req.json()
        if (!params) {
            throw new Error('Missing generation params')
        }

        const prompt = buildPrompt(params)
        const modelName = params.name?.trim() || `AI Model ${new Date().toLocaleDateString()}`

        // Admin client to bypass RLS and execute RPC for billing
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

        // 2. Deduct credits
        try {
            await deductCredits(supabaseAdmin, user.id, GENERATION_COST, 'ai_model_generation')
        } catch (creditError: any) {
            await sendDiscordMessage(discordWebhookUrl, `❌ **AI Generation Failed (Credits)**`, {
                description: `User ${user.email} failed to start generation due to credit error: ${creditError.message}`,
                color: 0xFF0000
            })
            throw creditError
        }

        // 3. Call Replicate API to create prediction
        // If replicate fails, we must catch and refund.
        let predictionId = null;
        try {
            const replicateResponse = await fetch(`https://api.replicate.com/v1/models/${DEFAULT_MODEL}/predictions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${replicateApiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: {
                        prompt: prompt,
                        aspect_ratio: '3:4',
                        output_format: 'webp',
                        output_quality: 90,
                        safety_tolerance: 2,
                    },
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

            // Success notification
            await sendDiscordMessage(discordWebhookUrl, `🚀 **AI Generation Started!**`, {
                title: modelName,
                description: `A new AI model generation has been initiated.`,
                color: 0x3498DB, // Blue color
                fields: [
                    { name: 'User', value: user.email || user.id, inline: true },
                    { name: 'Prediction ID', value: predictionId, inline: true },
                    { name: 'Cost', value: `${GENERATION_COST} credits`, inline: true }
                ],
                timestamp: new Date().toISOString()
            })

        } catch (apiError: any) {
            // Replicate failed before job even started -> Refund
            await supabaseAdmin.rpc('add_credits_secure', {
                p_user_id: user.id,
                p_amount: GENERATION_COST,
                p_reason: 'refund_failed_generation',
                p_metadata: { user_id: user.id }
            })
            
            await sendDiscordMessage(discordWebhookUrl, `❌ **AI Generation Failed (API)**`, {
                description: `Replicate API call failed for ${user.email}. Credits refunded. Error: ${apiError.message}`,
                color: 0xFF0000
            })

            throw new Error(`Failed to start generation: ${apiError.message}`)
        }

        // 4. Save to database (`ai_models` and `generations`)
        let aiModel: any = null
        try {
            const { data: aiModelData, error: aiModelError } = await supabaseAdmin
                .from('ai_models')
                .insert({
                    user_id: user.id,
                    name: modelName,
                    parameters_json: params,
                    is_public: false
                })
                .select()
                .single()

            if (aiModelError) {
                throw aiModelError
            }
            aiModel = aiModelData

            const { data: generation, error: genError } = await supabaseAdmin
                .from('generations')
                .insert({
                    user_id: user.id,
                    ai_model_id: aiModel.id,
                    type: 'ai_model',
                    prompt_text: prompt,
                    parameters_json: params,
                    credits_used: GENERATION_COST,
                    status: 'processing',
                    replicate_job_id: predictionId
                })
                .select()
                .single()

            if (genError) {
                // Rollback: remove orphaned ai_model row
                await supabaseAdmin.from('ai_models').delete().eq('id', aiModel.id)
                throw genError
            }

            return new Response(JSON.stringify({
                success: true,
                model: generation
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            })
        } catch (dbError: any) {
            console.error('Failed to save to database:', dbError.message)
            // Refund credits since Replicate job was already started but we can't track it
            await supabaseAdmin.rpc('add_credits_secure', {
                p_user_id: user.id,
                p_amount: GENERATION_COST,
                p_reason: 'refund_db_error',
                p_metadata: { user_id: user.id, error: dbError.message, replicate_job_id: predictionId }
            })
            throw new Error(`Failed to save generation record: ${dbError.message}`)
        }

        // Response is now returned inside the try block above

    } catch (error: any) {
        console.error('Error in generate-ai-model:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })
    }
})
