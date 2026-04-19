import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const authHeader = req.headers.get('Authorization') || ''

        if (!authHeader) throw new Error('No authorization header')

        const token = authHeader.replace('Bearer ', '')
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !user) throw new Error('Unauthorized')

        const { modelId, bio } = await req.json()
        if (!modelId) throw new Error('Missing modelId')
        if (!bio || !bio.trim()) throw new Error('Bio is required')

        const { data: existingModel, error: modelLookupError } = await supabaseAdmin
            .from('models')
            .select('model_id, username, created_by_user_id, status')
            .eq('model_id', modelId)
            .single()

        if (modelLookupError || !existingModel) throw new Error('Model not found')
        if (existingModel.created_by_user_id !== user.id) throw new Error('Forbidden')

        const { data: updatedModel, error: updateError } = await supabaseAdmin
            .from('models')
            .update({ description: bio.trim() })
            .eq('model_id', modelId)
            .select()
            .single()

        if (updateError) throw updateError

        return new Response(JSON.stringify({ success: true, model: updatedModel }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
