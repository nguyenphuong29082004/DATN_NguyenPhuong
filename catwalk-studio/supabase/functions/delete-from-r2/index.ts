import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

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
        // Authenticate user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase configuration')
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

        // Accept JSON body with file path(s)
        const body = await req.json()
        const { filePath, filePaths } = body

        // Support single path or array of paths
        const pathsToDelete: string[] = filePaths || (filePath ? [filePath] : [])

        if (pathsToDelete.length === 0) {
            return new Response(JSON.stringify({ error: 'No file path(s) provided. Send { filePath: "..." } or { filePaths: ["...", "..."] }' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            })
        }

        const host = `${accountId}.r2.cloudflarestorage.com`
        const results: { path: string; success: boolean; error?: string }[] = []

        for (const path of pathsToDelete) {
            try {
                const objectKey = `/${bucketName}/${path}`
                const url = `https://${host}${objectKey}`
                const { amzDate, dateStamp } = getAmzDateAndStamp()

                // Empty payload for DELETE
                const payloadHash = await sha256('')

                // Canonical Request
                const canonicalHeaders = [
                    `host:${host}`,
                    `x-amz-content-sha256:${payloadHash}`,
                    `x-amz-date:${amzDate}`,
                ].join('\n') + '\n'

                const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'

                const canonicalRequest = [
                    'DELETE',
                    objectKey,
                    '', // empty query string
                    canonicalHeaders,
                    signedHeaders,
                    payloadHash,
                ].join('\n')

                // String to Sign
                const canonicalRequestHash = await sha256(canonicalRequest)
                const credentialScope = `${dateStamp}/auto/s3/aws4_request`
                const stringToSign = [
                    'AWS4-HMAC-SHA256',
                    amzDate,
                    credentialScope,
                    canonicalRequestHash,
                ].join('\n')

                // Signature
                const signingKey = await getSignatureKey(secretAccessKey, dateStamp, 'auto', 's3')
                const signatureBuffer = await hmacSha256(signingKey, stringToSign)
                const signature = toHex(signatureBuffer)

                const awsAuthHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

                // Send DELETE request to R2
                const deleteResponse = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': awsAuthHeader,
                        'x-amz-date': amzDate,
                        'x-amz-content-sha256': payloadHash,
                    },
                })

                // R2 returns 204 on successful delete (even if object doesn't exist)
                if (deleteResponse.ok || deleteResponse.status === 204) {
                    results.push({ path, success: true })
                } else {
                    const errorText = await deleteResponse.text()
                    results.push({ path, success: false, error: `${deleteResponse.status} ${errorText}` })
                }
            } catch (err) {
                results.push({ path, success: false, error: err.message })
            }
        }

        const allSuccess = results.every(r => r.success)

        return new Response(JSON.stringify({
            success: allSuccess,
            results,
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: allSuccess ? 200 : 207, // 207 Multi-Status if partial
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        })
    }
})
