import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ==============================
// R2 Upload Helpers (shared with replicate-webhook)
// ==============================
function toHex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256(data: Uint8Array | string): Promise<string> {
    const encoded = typeof data === 'string' ? new TextEncoder().encode(data) : data
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
    return toHex(hashBuffer)
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<ArrayBuffer> {
    const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + key), dateStamp)
    const kRegion = await hmacSha256(kDate, regionName)
    const kService = await hmacSha256(kRegion, serviceName)
    const kSigning = await hmacSha256(kService, 'aws4_request')
    return kSigning
}

function getAmzDateAndStamp(): { amzDate: string; dateStamp: string } {
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const hours = String(now.getUTCHours()).padStart(2, '0')
    const minutes = String(now.getUTCMinutes()).padStart(2, '0')
    const seconds = String(now.getUTCSeconds()).padStart(2, '0')
    const dateStamp = `${year}${month}${day}`
    const amzDate = `${dateStamp}T${hours}${minutes}${seconds}Z`
    return { amzDate, dateStamp }
}

async function uploadToR2(buffer: ArrayBuffer, fileName: string, contentType: string = 'image/webp'): Promise<string> {
    const accountId = Deno.env.get("R2_ACCOUNT_ID")
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const bucketName = Deno.env.get("R2_WARDROBE_BUCKET_NAME") || "catwalk-studio"

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error(`Missing R2 credentials`)
    }

    const host = `${accountId}.r2.cloudflarestorage.com`
    const url = `https://${host}/${bucketName}/${fileName}`

    const body = new Uint8Array(buffer)
    const { amzDate, dateStamp } = getAmzDateAndStamp()

    const payloadHash = await sha256(body)
    const canonicalHeaders = [
        `content-type:${contentType}`,
        `host:${host}`,
        `x-amz-content-sha256:${payloadHash}`,
        `x-amz-date:${amzDate}`,
    ].join('\n') + '\n'

    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'
    const canonicalRequest = ['PUT', `/${bucketName}/${fileName}`, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')

    const canonicalRequestHash = await sha256(canonicalRequest)
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, canonicalRequestHash].join('\n')

    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, 'auto', 's3')
    const signatureBuffer = await hmacSha256(signingKey, stringToSign)
    const signature = toHex(signatureBuffer)

    const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': authHeader,
            'Content-Type': contentType,
            'x-amz-date': amzDate,
            'x-amz-content-sha256': payloadHash,
        },
        body: body,
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`R2 upload failed: ${response.status} ${errorText}`)
    }

    let publicBaseUrl = Deno.env.get("R2_PUBLIC_URL") || Deno.env.get("R2_PUBLIC_DOMAIN") || ''
    publicBaseUrl = publicBaseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

    return publicBaseUrl ? `https://${publicBaseUrl}/${fileName}` : `https://${host}/${bucketName}/${fileName}`
}

// ==============================
// Migrate a single draft photo: download from Supabase → upload to R2 → return R2 URL
// ==============================
async function migrateDraftToR2(
    supabaseAdmin: any,
    draftUrl: string,
    userId: string,
    label: string
): Promise<string> {
    // Extract path from Supabase Storage URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/media/draft-model-photos/...
    const pathMatch = draftUrl.match(/\/storage\/v1\/object\/public\/media\/(.+)$/)
    if (!pathMatch) {
        console.warn(`[R2 Migration] Could not parse draft URL, keeping original: ${draftUrl}`)
        return draftUrl
    }
    const storagePath = decodeURIComponent(pathMatch[1])

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('media')
        .download(storagePath)

    if (downloadError || !fileData) {
        console.error(`[R2 Migration] Download failed for ${storagePath}:`, downloadError)
        return draftUrl // Fallback: keep original Supabase URL
    }

    // Determine content type and R2 filename
    const ext = storagePath.split('.').pop() || 'webp'
    const contentType = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg'
    const r2FileName = `model-photos/${userId}/${label}_${Date.now()}.${ext}`

    // Upload to R2
    const arrayBuffer = await fileData.arrayBuffer()
    const r2Url = await uploadToR2(arrayBuffer, r2FileName, contentType)
    console.log(`[R2 Migration] Uploaded ${label} → ${r2Url}`)

    // Delete draft from Supabase Storage (fire-and-forget)
    supabaseAdmin.storage.from('media').remove([storagePath]).catch((err: any) => {
        console.warn(`[R2 Migration] Cleanup draft failed: ${storagePath}`, err)
    })

    return r2Url
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
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const discordWebhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL') || ''
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Authenticate user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('No authorization header')

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !user) throw new Error('Unauthorized')

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

        // 3. Validate minimum photos for real/both types
        const draftGalleryUrls = modelData.galleryImageUrls || []
        const draftProfileUrl = modelData.profileImageUrl
        const totalPhotos = (draftProfileUrl ? 1 : 0) + draftGalleryUrls.length

        if (accountType !== 'ai_only' && totalPhotos < 5) {
            throw new Error(`Minimum 5 photos required for ${accountType} registration. Currently: ${totalPhotos}`)
        }

        // 4. Validate content preferences
        const contentPreferences = modelData.contentPreferences || []
        if (contentPreferences.length === 0) {
            throw new Error('At least one content preference must be selected')
        }

        // 5. Migrate draft photos from Supabase Storage → Cloudflare R2
        console.log(`[Register Model] Migrating ${totalPhotos} photos to R2...`)

        let finalProfileUrl = draftProfileUrl
        const finalGalleryUrls: string[] = []

        // Migrate profile photo
        if (draftProfileUrl) {
            try {
                finalProfileUrl = await migrateDraftToR2(supabaseAdmin, draftProfileUrl, user.id, 'profile')
            } catch (err) {
                console.error('[R2 Migration] Profile photo migration failed, using draft URL:', err)
            }
        }

        // Migrate gallery photos (in parallel for speed)
        const galleryMigrations = draftGalleryUrls.map(async (url: string, i: number) => {
            try {
                return await migrateDraftToR2(supabaseAdmin, url, user.id, `gallery_${i}`)
            } catch (err) {
                console.error(`[R2 Migration] Gallery photo ${i} migration failed, using draft URL:`, err)
                return url // Fallback
            }
        })
        const migratedGallery = await Promise.all(galleryMigrations)
        finalGalleryUrls.push(...migratedGallery)

        console.log(`[Register Model] R2 migration complete. Profile: ${!!finalProfileUrl}, Gallery: ${finalGalleryUrls.length}`)

        // 6. Generate Unique Username
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

        // 7. Database Insert (with R2 URLs)
        const { data: model, error: modelError } = await supabaseAdmin
            .from('models')
            .insert({
                display_name: modelData.displayName,
                username: uniqueUsername,
                created_by_user_id: user.id,
                status: 'in_review',
                account_type: accountType,
                is_ai: isAi,
                can_book: canBook,
                profile_image_url: finalProfileUrl,
                gallery_image_urls: finalGalleryUrls,
                modelling_type: isAi ? ['AI'] : ['Real'],
                model_types: modelData.modelTypes || [],
                style_tags: modelData.styleTags || [],
                description: modelData.bio || null,
                content_preferences: contentPreferences,
                location: modelData.location || null,
                monthly_target: modelData.monthlyTarget || 0,
                is_elite: modelData.elite || false,
                is_elite_exp_date: modelData.elite ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
                hourly_rate: modelData.hourlyRate || null,
                half_day_rate: modelData.halfDayRate || null,
                full_day_rate: modelData.fullDayRate || null,
                social_links: modelData.socialLinks || [],
            })
            .select()
            .single()

        if (modelError) throw modelError

        // 8. Update user type
        await supabaseAdmin
            .from('users')
            .update({ user_type: 'model' })
            .eq('user_id', user.id)

        // 9. Discord Notification
        const accountTypeLabels: Record<string, string> = {
            'ai_only': '🤖 AI Only',
            'real_only': '💃 Real Bookings',
            'both': '🌟 AI + Real'
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
                { name: 'Photos', value: `${totalPhotos} uploaded (R2)`, inline: true },
            ],
            thumbnail: model.profile_image_url ? { url: model.profile_image_url } : undefined,
            timestamp: new Date().toISOString()
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
