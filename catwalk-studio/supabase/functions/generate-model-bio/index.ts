import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

function formatContentPreferenceLabel(value: string): string {
    return value
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

function buildBioPrompt(modelData: any): string {
    const typeLabel = modelData.accountType === 'ai_only'
        ? 'AI-only fashion model'
        : modelData.accountType === 'real_only'
            ? 'real-booking fashion model'
            : 'hybrid AI and real-booking fashion model'

    const styles = (modelData.styleTags || []).length ? (modelData.styleTags || []).join(', ') : 'fashion-forward'
    const content = (modelData.contentPreferences || []).map(formatContentPreferenceLabel).join(', ') || 'fashion editorial'
    const location = modelData.location || 'a global market'
    const rateLine = modelData.accountType === 'ai_only'
        ? 'Do not mention booking rates.'
        : `If it feels natural, lightly imply booking availability in ${location} without listing prices.`

    return [
        'Write a polished short fashion model bio in English.',
        'Length: 2 to 3 sentences, max 420 characters.',
        'Tone: premium, modern, confident, editorial, not cheesy.',
        'Avoid hashtags, bullet points, emojis, and quotation marks.',
        `Name: ${modelData.displayName || 'Unknown model'}`,
        `Profile type: ${typeLabel}`,
        `Location: ${location}`,
        `Style tags: ${styles}`,
        `Content preferences: ${content}`,
        rateLine,
        'Return only the bio text.'
    ].join('\n')
}

async function generateModelBio(modelData: any): Promise<string> {
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY') || ''
    const openAiModel = Deno.env.get('OPENAI_MODEL') || 'gpt-4o'

    if (!openAiApiKey) {
        throw new Error('Missing OPENAI_API_KEY')
    }

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openAiApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: openAiModel,
            messages: [
                {
                    role: 'system',
                    content: 'You write concise premium fashion-model biographies for profile onboarding.'
                },
                {
                    role: 'user',
                    content: buildBioPrompt(modelData)
                }
            ],
            temperature: 0.8,
        }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI bio generation failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    const bio = result?.choices?.[0]?.message?.content?.trim()

    if (!bio) {
        throw new Error('OpenAI bio generation returned empty content')
    }

    return bio.slice(0, 500)
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const { modelData } = await req.json()
        if (!modelData) throw new Error('Missing model data')

        const bio = await generateModelBio(modelData)

        return new Response(JSON.stringify({ success: true, bio }), {
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
