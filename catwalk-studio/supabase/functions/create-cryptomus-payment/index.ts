import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts"
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts"
import { corsHeaders, errorResponse, jsonResponse, handleCors } from "../_shared/cors.ts"
import { getActiveCreditPackageById } from "../_shared/creditPackages.ts"

const CRYPTOMUS_API_URL = 'https://api.cryptomus.com/v1/payment'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCors()
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing Authorization header', 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const merchantId = Deno.env.get('CRYPTOMUS_MERCHANT_ID')
    const apiKey = Deno.env.get('CRYPTOMUS_API_KEY')
    const appUrl = Deno.env.get('APP_URL') || Deno.env.get('SITE_URL') || 'http://127.0.0.1:3000'

    if (!supabaseUrl || !supabaseAnonKey || !merchantId || !apiKey) {
      return errorResponse('Missing environment configuration', 500)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('is_guest')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      return errorResponse(profileError.message, 400)
    }

    if (profile?.is_guest) {
      return errorResponse('Guest users must sign up before purchasing credits', 403)
    }

    const { packageId } = await req.json()

    if (!packageId || typeof packageId !== 'string') {
      return errorResponse('Package ID is required', 400)
    }

    const selectedPackage = await getActiveCreditPackageById(supabase, packageId)
    if (!selectedPackage) {
      return errorResponse('Invalid credit package', 400)
    }

    const parsedAmount = Number(selectedPackage.usd_amount)
    const credits = Number(selectedPackage.credits_amount)
    const orderId = `${user.id}-${Date.now()}`
    const payload = {
      amount: parsedAmount.toFixed(2),
      currency: 'USD',
      order_id: orderId,
      url_return: `${appUrl}/studio/credits?status=processing&provider=cryptomus`,
      url_success: `${appUrl}/studio/credits?status=success&provider=cryptomus`,
      url_callback: `${supabaseUrl}/functions/v1/cryptomus-webhook`,
      additional_data: JSON.stringify({
        user_id: user.id,
        credits,
        package_id: selectedPackage.package_id,
        amount_usd: parsedAmount,
      }),
    }

    const jsonBody = JSON.stringify(payload)
    const base64Body = btoa(jsonBody)
    const msgBuffer = new TextEncoder().encode(base64Body + apiKey)
    const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer)
    const sign = encodeHex(new Uint8Array(hashBuffer))

    const response = await fetch(CRYPTOMUS_API_URL, {
      method: 'POST',
      headers: {
        merchant: merchantId,
        sign,
        'Content-Type': 'application/json',
      },
      body: jsonBody,
    })

    const data = await response.json()

    if (!response.ok || !data?.result?.url) {
      return new Response(JSON.stringify({ error: data?.message || 'Failed to create Cryptomus payment' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      })
    }

    return jsonResponse({
      url: data.result.url,
      paymentId: data.result.uuid,
    })
  } catch (error) {
    console.error('create-cryptomus-payment error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})
