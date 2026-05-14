import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
            return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token)
        const user = userData?.user

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const body = await req.json()
        const generationId = body?.generationId || null
        const title = body?.title?.trim() || null
        const description = body?.description?.trim() || null
        const tags = Array.isArray(body?.tags) ? body.tags : []
        const typeLabel = body?.typeLabel || 'quick-shoot'
        const username = body?.username || null

        if (!generationId) {
            return new Response(JSON.stringify({ error: 'Missing generationId' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        if (!title) {
            return new Response(JSON.stringify({ error: 'Missing gallery title' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

        const { data: generation, error: generationError } = await supabaseAdmin
            .from('generations')
            .select('id, user_id, status')
            .eq('id', generationId)
            .single()

        if (generationError || !generation) {
            return new Response(JSON.stringify({ error: generationError?.message || 'Generation not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
            })
        }

        if (generation.user_id !== user.id) {
            return new Response(JSON.stringify({ error: 'You do not have permission to add this generation to the gallery' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        if (generation.status !== 'completed') {
            return new Response(JSON.stringify({ error: 'Only completed generations can be added to the gallery' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const { data: existingGallery } = await supabaseAdmin
            .from('gallery')
            .select('gallery_id')
            .eq('generation_id', generationId)
            .maybeSingle()

        if (existingGallery) {
            return new Response(JSON.stringify({ success: true, alreadyExists: true, galleryId: existingGallery.gallery_id }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        const { data: createdGallery, error: insertError } = await supabaseAdmin
            .from('gallery')
            .insert({
                generation_id: generationId,
                title: title.slice(0, 120),
                description,
                tags,
                type_label: typeLabel,
                username,
            })
            .select()
            .single()

        if (insertError || !createdGallery) {
            return new Response(JSON.stringify({ error: insertError?.message || 'Failed to add gallery item' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        return new Response(JSON.stringify({ success: true, alreadyExists: false, galleryId: createdGallery.gallery_id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
