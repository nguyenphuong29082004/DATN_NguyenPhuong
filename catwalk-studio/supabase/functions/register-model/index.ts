import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

// ==============================
// Discord Notification
// ==============================
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

// ==============================
// Main Handler
// ==============================
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const discordWebhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL') || ''
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Auth is REQUIRED - only registered users can use Become a Model
        let userId: string | null = null
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Authentication required')
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !user) {
            throw new Error('Authentication required')
        }

        if (user.is_anonymous) {
            throw new Error('Please sign in with a registered account to use Become a Model')
        }

        userId = user.id

        // Ensure user exists in public users table (upsert to avoid FK violation)
        try {
            const { error: upsertError } = await supabaseAdmin
                .from('users')
                .upsert({
                    user_id: userId,
                    email: user.email || '',
                    user_type: 'model',
                }, { onConflict: 'user_id' })

            if (upsertError) {
                console.error('User upsert failed:', upsertError.message)
                throw new Error('Unable to verify user profile')
            }
        } catch (e) {
            console.error('User upsert exception:', e)
            throw new Error('Unable to verify user profile')
        }

        const { modelData } = await req.json()
        if (!modelData) throw new Error('Missing model data')

        // 2. Derive is_ai and can_book from accountType
        const accountType = modelData.accountType || 'both'
        let isAi = false
        let canBook = false
        switch (accountType) {
            case 'ai_only':
                isAi = true
                canBook = false
                break
            case 'real_only':
                isAi = false
                canBook = true
                break
            case 'both':
            default:
                isAi = true
                canBook = true
                break
        }

        // 3. Validate minimum source photos for real/both types
        const galleryImageUrls = modelData.galleryImageUrls || []
        const videoUrls = modelData.videoUrls || []
        const totalPhotos = galleryImageUrls.length

        if (accountType !== 'ai_only' && totalPhotos < 5) {
            throw new Error(`Minimum 5 source photos required for ${accountType} registration. Currently: ${totalPhotos}`)
        }

        // 4. Validate content preferences
        const contentPreferences = modelData.contentPreferences || []
        if (contentPreferences.length === 0) {
            throw new Error('At least one content preference must be selected')
        }

        // 5. Use provided bioDraft; bio is optional, no AI fallback
        const description = modelData.bioDraft?.trim() || ''

        // 6. Generate unique username from displayName
        const baseUsername = modelData.displayName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')

        let uniqueUsername = baseUsername
        let attempts = 0
        let isUnique = false

        while (!isUnique && attempts < 5) {
            const { data: existing } = await supabaseAdmin
                .from('models')
                .select('username')
                .eq('username', uniqueUsername)
                .maybeSingle()

            if (!existing) {
                isUnique = true
            } else {
                const randomSuffix = Math.floor(1000 + Math.random() * 9000)
                uniqueUsername = `${baseUsername}-${randomSuffix}`
                attempts++
            }
        }

        // 7. Insert model record — photos already live in R2
        const { data: model, error: modelError } = await supabaseAdmin
            .from('models')
            .insert({
                display_name: modelData.displayName,
                username: uniqueUsername,
                created_by_user_id: userId,
                status: 'active',
                account_type: accountType,
                is_ai: isAi,
                can_book: canBook,
                profile_image_url: modelData.profileImageUrl || null,
                gallery_image_urls: galleryImageUrls,
                video_url: videoUrls[0] || null,
                modelling_type: isAi ? ['AI'] : ['Real'],
                model_types: modelData.modelTypes || [],
                style_tags: modelData.styleTags || [],
                description,
                content_preferences: contentPreferences,
                location: modelData.location || null,
                monthly_target: modelData.monthlyTarget || 0,
                is_elite: modelData.elite || false,
                elite_exp_date: modelData.elite ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
                hourly_rate: modelData.hourlyRate || null,
                half_day_rate: modelData.halfDayRate || null,
                full_day_rate: modelData.fullDayRate || null,
                social_links: modelData.socialLinks || [],
            })
            .select()
            .single()

        if (modelError) throw modelError

        // 8. Update user type if authenticated
        if (userId) {
            await supabaseAdmin
                .from('users')
                .update({ user_type: 'model' })
                .eq('user_id', userId)
        }

        // 9. Discord notification
        const accountTypeLabels: Record<string, string> = {
            'ai_only': '🤖 AI Only',
            'real_only': '💃 Real Bookings',
            'both': '🌟 AI + Real',
        }
        await sendDiscordMessage(discordWebhookUrl, `✨ **New Model Registered!**`, {
            title: model.display_name,
            description: `A new model profile has been created and is awaiting review.`,
            color: 0xF1E0B6,
            fields: [
                { name: 'Username', value: `@${model.username}`, inline: true },
                { name: 'Type', value: accountTypeLabels[accountType] || accountType, inline: true },
                { name: 'Content', value: contentPreferences.join(', '), inline: false },
                { name: 'Location', value: modelData.location || 'Not specified', inline: true },
                { name: 'Photos', value: `${totalPhotos} uploaded`, inline: true },
            ],
            thumbnail: model.profile_image_url ? { url: model.profile_image_url } : undefined,
            timestamp: new Date().toISOString(),
        })

        return new Response(JSON.stringify({ success: true, model }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('[Register Model] Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

