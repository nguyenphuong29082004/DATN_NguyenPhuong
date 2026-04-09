import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_REPLICATE_VIDEO_MODEL = 'minimax/video-01'
const DEFAULT_VIDEO_SHOOT_COST = 20 // Video costs more credits usually

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

        const { prompt, source, modelId, aiModelId, wardrobeItemIds, width, height, aiModelProviderName } = await req.json()
        
        if (!prompt) {
            throw new Error('Missing prompt')
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

        // 2. Resolve AI Model and Cost
        let replicateModel = DEFAULT_REPLICATE_VIDEO_MODEL
        let cost = DEFAULT_VIDEO_SHOOT_COST
        let finalPrompt = prompt

        // For video, we might want to inject model context or use an image (image-to-video)
        // If image-to-video is supported later, we could fetch model image url.
        if (aiModelId) {
            const { data: aiModel } = await supabaseAdmin
                .from('ai_models')
                .select('name, image_url')
                .eq('id', aiModelId)
                .single()
            
            if (aiModel?.name) {
                finalPrompt = `Video of ${aiModel.name}, ${prompt}`
            }
        }

        if (aiModelProviderName) {
            const { data: mapper } = await supabaseAdmin
                .from('aimodel_mapper')
                .select('backend_model_name, cost_per_token')
                .eq('frontend_slug', aiModelProviderName)
                .single()
            
            if (mapper) {
                replicateModel = mapper.backend_model_name
                // If mapper has cost_per_token, use it
                cost = Math.ceil(5 * (mapper.cost_per_token || 4)); // e.g. base cost * multiplier
            }
        }

        // 3. Deduct Credits
        const { data: deductData, error: deductError } = await supabaseAdmin.rpc('deduct_credits', {
            p_user_id: user.id,
            p_amount: cost,
            p_reason: 'video_generation',
            p_metadata: { prompt: prompt.substring(0, 50), source }
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
                    input: {
                        prompt: finalPrompt,
                        // common video inputs
                        aspect_ratio: width && height ? `${width}:${height}` : '16:9',
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
        } catch (apiError: any) {
            // Refund
            await supabaseAdmin.rpc('add_credits_secure', {
                p_user_id: user.id,
                p_amount: cost,
                p_reason: 'refund_failed_generation',
                p_metadata: { error: apiError.message }
            })
            throw new Error(`Failed to start video generation: ${apiError.message}`)
        }

        // 5. Save to generations table
        try {
            const { data: generation, error: genError } = await supabaseAdmin
                .from('generations')
                .insert({
                    user_id: user.id,
                    model_id: modelId || null,
                    ai_model_id: aiModelId || null,
                    type: source || 'quick_shoot', // tracks where it was invoked from
                    generation_type: 'video', // 'video' vs 'photo'
                    prompt_text: prompt,
                    parameters_json: { 
                        width, 
                        height, 
                        wardrobe_items: wardrobeItemIds 
                    },
                    credits_used: cost,
                    api_cost: cost,
                    status: 'processing',
                    replicate_job_id: predictionId
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
            // Must refund since Replicate job was already started
            await supabaseAdmin.rpc('add_credits_secure', {
                p_user_id: user.id,
                p_amount: cost,
                p_reason: 'refund_db_error',
                p_metadata: { error: dbError.message, replicate_job_id: predictionId }
            })
            throw new Error(`Failed to save generation record: ${dbError.message}`)
        }

    } catch (error: any) {
        console.error('Error in generate-video:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })
    }
})
