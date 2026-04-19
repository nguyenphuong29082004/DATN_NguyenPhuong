import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper: Convert ArrayBuffer to hex string
function toHex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

// Helper: SHA256 hash
async function sha256(data: Uint8Array | string): Promise<string> {
    const encoded = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
    return toHex(hashBuffer)
}

// Helper: HMAC-SHA256
async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    return await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
}

// Helper: Get AWS Signature V4 signing key
async function getSignatureKey(
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

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const accountId = Deno.env.get("R2_ACCOUNT_ID")
        const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")
        const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")
        const bucketName = Deno.env.get("R2_WARDROBE_BUCKET_NAME") || "catwalk-studio"

        if (!accountId || !accessKeyId || !secretAccessKey) {
            return new Response(JSON.stringify({ error: 'Missing R2 credentials' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File
        const folder = formData.get('folder') as string || ''

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file provided' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            })
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${crypto.randomUUID().substring(0, 8)}.${fileExt}`
        const filePath = folder ? `${folder}/${fileName}` : fileName

        const arrayBuffer = await file.arrayBuffer()
        const body = new Uint8Array(arrayBuffer)

        // AWS Signature V4 Signing
        const host = `${accountId}.r2.cloudflarestorage.com`
        const url = `https://${host}/${bucketName}/${filePath}`
        const { amzDate, dateStamp } = getAmzDateAndStamp()
        const contentType = file.type || 'application/octet-stream'

        // 1. Hash the payload
        const payloadHash = await sha256(body)

        // 2. Create Canonical Request
        // IMPORTANT: All headers sent in the request that are also in SignedHeaders
        // must be included in the canonical request
        const canonicalHeaders = [
            `content-type:${contentType}`,
            `host:${host}`,
            `x-amz-content-sha256:${payloadHash}`,
            `x-amz-date:${amzDate}`,
        ].join('\n') + '\n'

        const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'

        const canonicalRequest = [
            'PUT',
            `/${bucketName}/${filePath}`,
            '', // empty query string
            canonicalHeaders,
            signedHeaders,
            payloadHash,
        ].join('\n')

        // 3. Create String to Sign
        const canonicalRequestHash = await sha256(canonicalRequest)
        const credentialScope = `${dateStamp}/auto/s3/aws4_request`
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            amzDate,
            credentialScope,
            canonicalRequestHash,
        ].join('\n')

        // 4. Calculate Signature
        const signingKey = await getSignatureKey(secretAccessKey, dateStamp, 'auto', 's3')
        const signatureBuffer = await hmacSha256(signingKey, stringToSign)
        const signature = toHex(signatureBuffer)

        // 5. Create Authorization header
        const awsAuthHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

        // 6. Send request to R2
        const uploadResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': awsAuthHeader,
                'Content-Type': contentType,
                'x-amz-date': amzDate,
                'x-amz-content-sha256': payloadHash,
            },
            body: body,
        })

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            throw new Error(`R2 upload failed: ${uploadResponse.status} ${errorText}`)
        }

        let publicBaseUrl = Deno.env.get("R2_PUBLIC_URL") || Deno.env.get("R2_PUBLIC_DOMAIN") || ''
        // Normalize: strip protocol and trailing slash, then re-add https://
        publicBaseUrl = publicBaseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
        const publicUrl = publicBaseUrl
            ? `https://${publicBaseUrl}/${filePath}`
            : `https://${host}/${bucketName}/${filePath}`

        return new Response(JSON.stringify({ url: publicUrl, path: filePath }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        })
    }
})
