import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

// Reusing R2 upload logic helpers from `upload-to-r2` conceptually
function toHex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256(data: Uint8Array | string): Promise<string> {
    const encoded = typeof data === 'string' ? new TextEncoder().encode(data) : data
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded as BufferSource)
    return toHex(hashBuffer)
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
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

// Upload buffer directly to cloudflare R2
async function uploadToR2(buffer: ArrayBuffer, fileName: string, contentType: string = 'image/webp'): Promise<string> {
    const accountId = Deno.env.get("R2_ACCOUNT_ID")
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const bucketName = Deno.env.get("R2_WARDROBE_BUCKET_NAME") || "catwalk-studio"

    console.log(`[R2 Debug] accountId: ${accountId ? accountId.substring(0, 8) + '...' : 'MISSING'}`)
    console.log(`[R2 Debug] accessKeyId: ${accessKeyId ? accessKeyId.substring(0, 8) + '...' : 'MISSING'}`)
    console.log(`[R2 Debug] secretAccessKey: ${secretAccessKey ? 'SET (' + secretAccessKey.length + ' chars)' : 'MISSING'}`)
    console.log(`[R2 Debug] bucketName: ${bucketName}`)
    console.log(`[R2 Debug] fileName: ${fileName}`)

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error(`Missing R2 credentials: accountId=${!!accountId}, accessKeyId=${!!accessKeyId}, secretAccessKey=${!!secretAccessKey}`)
    }

    const host = `${accountId}.r2.cloudflarestorage.com`
    const url = `https://${host}/${bucketName}/${fileName}`
    console.log(`[R2 Debug] Upload URL: ${url}`)

    const body = new Uint8Array(buffer)
    console.log(`[R2 Debug] Body size: ${body.length} bytes`)
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

    console.log(`[R2 Debug] Response status: ${response.status}`)

    if (!response.ok) {
        const errorText = await response.text()
        console.error(`[R2 Debug] Error response: ${errorText}`)
        throw new Error(`R2 upload failed: ${response.status} ${errorText}`)
    }

    let publicBaseUrl = Deno.env.get("R2_PUBLIC_URL") || Deno.env.get("R2_PUBLIC_DOMAIN") || ''
    publicBaseUrl = publicBaseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

    return publicBaseUrl ? `https://${publicBaseUrl}/${fileName}` : `https://${host}/${bucketName}/${fileName}`
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

serve(async (req: Request) => {
    try {
        // 1. Validate Secret Query Parameter
        const url = new URL(req.url)
        const secret = url.searchParams.get('secret')
        const expectedSecret = Deno.env.get('WEBHOOK_SECRET') || 'default-secret-change-me-in-production'
        const discordWebhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL') || ''

        if (secret !== expectedSecret) {
            console.error('Webhook unauthorized secret mismatch')
            return new Response('Unauthorized', { status: 401 })
        }

        const payload = await req.json()
        const predictionId = payload.id
        const status = payload.status // "starting", "processing", "succeeded", "failed", "canceled"

        console.log(`[Webhook] Prediction ${predictionId} updated to ${status}`)

        // If it's just starting or still processing, we ignore it, DB is already 'processing'
        if (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
            return new Response('Ignored', { status: 200 })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

        // 2. Fetch the target row from generations
        const { data: generation, error: selectError } = await supabaseAdmin
            .from('generations')
            .select('*, ai_models:ai_model_id (user_id)')
            .eq('replicate_job_id', predictionId)
            .single()

        if (selectError || !generation) {
            console.error(`Webhook error: Could not find job ${predictionId} in generations DB`)
            return new Response('Job not found', { status: 404 })
        }

        // Job is already finished in DB (in case webhook retries)
        if (generation.status !== 'processing') {
            return new Response('Already processed', { status: 200 })
        }

        // 3. Handle Completion
        if (status === 'succeeded') {
            const imageUrl = Array.isArray(payload.output) ? payload.output[0] : payload.output

            if (!imageUrl) {
                await supabaseAdmin
                    .from('generations')
                    .update({
                        status: 'failed',
                        error_message: 'No output image URL in Replicate payload'
                    })
                    .eq('id', generation.id)

                return new Response('Missing output', { status: 200 })
            }

            await supabaseAdmin
                .from('generations')
                .update({
                    status: 'completed',
                    output_url: imageUrl,
                    output_type: 'image/webp',
                    error_message: null,
                })
                .eq('id', generation.id)

            await sendDiscordMessage(discordWebhookUrl, `✅ **AI Generation Complete!**`, {
                title: 'Generation Success',
                description: 'AI generation completed. Image will be persisted to R2 when added to gallery.',
                color: 0x2ECC71,
                image: { url: imageUrl },
                fields: [
                    { name: 'Job ID', value: predictionId, inline: true },
                    { name: 'Storage', value: 'Replicate (temporary)', inline: true }
                ],
                timestamp: new Date().toISOString()
            })

            if (generation.ai_model_id && generation.type === 'ai_model') {
                await supabaseAdmin.rpc('append_ai_model_preview', {
                    model_id: generation.ai_model_id,
                    new_url: imageUrl
                })
            }
        } else {
            // "failed" or "canceled"
            const errorMessage = payload.error || `Replicate job ${status}`

            await supabaseAdmin
                .from('generations')
                .update({
                    status: status === 'canceled' ? 'canceled' : 'failed',
                    error_message: errorMessage
                })
                .eq('id', generation.id)

            await sendDiscordMessage(discordWebhookUrl, `❌ **AI Generation ${status.toUpperCase()}**`, {
                description: `The Replicate job failed or was canceled.\n**Error**: ${errorMessage}`,
                color: 0xFF0000
            })

            // Refund Credits
            const cost = generation.credits_used || 15
            const userIdToRefund = generation.user_id || generation.ai_models?.user_id

            if (userIdToRefund) {
                await supabaseAdmin.rpc('add_credits_secure', {
                    p_user_id: userIdToRefund,
                    p_amount: cost,
                    p_reason: 'refund_failed_generation',
                    p_metadata: { replicate_job_id: predictionId } 
                })
                console.log(`[Webhook] Refunded ${cost} credits to user ${userIdToRefund}`)
            }
        }

        return new Response('OK', { status: 200 })
    } catch (error: any) {
        console.error('Webhook processing exception:', error)
        return new Response(`Error: ${error.message}`, { status: 500 })
    }
})
