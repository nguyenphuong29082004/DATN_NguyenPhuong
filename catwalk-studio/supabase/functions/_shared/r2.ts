/**
 * Shared R2 (Cloudflare) upload/delete helpers using AWS Signature V4.
 * Used by: replicate-webhook, register-model, upload-to-r2, delete-from-r2
 */

// Helper: Convert ArrayBuffer to hex string
export function toHex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

// Helper: SHA256 hash
export async function sha256(data: Uint8Array | string): Promise<string> {
    const encoded = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded as BufferSource)
    return toHex(hashBuffer)
}

// Helper: HMAC-SHA256
export async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key as BufferSource,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    return await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
}

// Helper: Get AWS Signature V4 signing key
export async function getSignatureKey(
    key: string,
    dateStamp: string,
    regionName: string,
    serviceName: string
): Promise<ArrayBuffer> {
    const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + key), dateStamp)
    const kRegion = await hmacSha256(kDate, regionName)
    const kService = await hmacSha256(kRegion, serviceName)
    const kSigning = await hmacSha256(kService, 'aws4_request')
    return kSigning
}

// Helper: Format date for AWS
export function getAmzDateAndStamp(): { amzDate: string; dateStamp: string } {
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

/**
 * Upload a buffer directly to Cloudflare R2
 */
export async function uploadToR2(
    buffer: ArrayBuffer,
    fileName: string,
    contentType: string = 'image/webp'
): Promise<string> {
    const accountId = Deno.env.get("R2_ACCOUNT_ID")
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const bucketName = Deno.env.get("R2_WARDROBE_BUCKET_NAME") || "catwalk-studio"

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error(`Missing R2 credentials: accountId=${!!accountId}, accessKeyId=${!!accessKeyId}, secretAccessKey=${!!secretAccessKey}`)
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

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromR2(filePath: string): Promise<{ success: boolean; error?: string }> {
    const accountId = Deno.env.get("R2_ACCOUNT_ID")
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")
    const bucketName = Deno.env.get("R2_WARDROBE_BUCKET_NAME") || "catwalk-studio"

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error('Missing R2 credentials')
    }

    const host = `${accountId}.r2.cloudflarestorage.com`
    const objectKey = `/${bucketName}/${filePath}`
    const url = `https://${host}${objectKey}`
    const { amzDate, dateStamp } = getAmzDateAndStamp()

    const payloadHash = await sha256('')

    const canonicalHeaders = [
        `host:${host}`,
        `x-amz-content-sha256:${payloadHash}`,
        `x-amz-date:${amzDate}`,
    ].join('\n') + '\n'

    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'

    const canonicalRequest = [
        'DELETE', objectKey, '', canonicalHeaders, signedHeaders, payloadHash,
    ].join('\n')

    const canonicalRequestHash = await sha256(canonicalRequest)
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, canonicalRequestHash].join('\n')

    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, 'auto', 's3')
    const signatureBuffer = await hmacSha256(signingKey, stringToSign)
    const signature = toHex(signatureBuffer)

    const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': authHeader,
            'x-amz-date': amzDate,
            'x-amz-content-sha256': payloadHash,
        },
    })

    if (response.ok || response.status === 204) {
        return { success: true }
    } else {
        const errorText = await response.text()
        return { success: false, error: `${response.status} ${errorText}` }
    }
}

/**
 * Discord notification helper
 */
export async function sendDiscordMessage(webhookUrl: string, content: string, embed?: any) {
    if (!webhookUrl) return
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content,
                embeds: embed ? [embed] : []
            })
        })
    } catch (err) {
        console.error('Failed to send Discord message:', err)
    }
}
