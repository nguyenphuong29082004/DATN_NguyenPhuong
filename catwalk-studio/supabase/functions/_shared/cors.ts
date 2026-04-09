export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Handle CORS preflight request.
 * Usage: if (req.method === 'OPTIONS') return handleCors()
 */
export function handleCors(): Response {
    return new Response('ok', { headers: corsHeaders, status: 200 })
}

/**
 * Create a JSON error response with CORS headers.
 */
export function errorResponse(message: string, status: number = 400): Response {
    return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
    })
}

/**
 * Create a JSON success response with CORS headers.
 */
export function jsonResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
    })
}
