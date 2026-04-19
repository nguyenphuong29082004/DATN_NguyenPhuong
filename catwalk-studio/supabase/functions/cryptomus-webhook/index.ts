import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts"
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts"
import { errorResponse, jsonResponse } from "../_shared/cors.ts"
import { getActiveCreditPackageById } from "../_shared/creditPackages.ts"

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    const apiKey = Deno.env.get('CRYPTOMUS_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!apiKey || !supabaseUrl || !supabaseServiceRoleKey) {
      return errorResponse('Missing environment configuration', 500)
    }

    const payload = await req.json()
    const receivedSign = payload.sign
    if (!receivedSign) {
      return errorResponse('Missing Cryptomus signature', 400)
    }

    const dataWithoutSign = { ...payload }
    delete dataWithoutSign.sign

    const jsonBody = JSON.stringify(dataWithoutSign)
    const base64Body = btoa(jsonBody)
    const msgBuffer = new TextEncoder().encode(base64Body + apiKey)
    const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer)
    const calculatedSign = encodeHex(new Uint8Array(hashBuffer))

    if (calculatedSign !== receivedSign) {
      return errorResponse('Invalid Cryptomus signature', 401)
    }

    if (!['paid', 'paid_over'].includes(payload.status)) {
      return jsonResponse({ received: true })
    }

    let additionalData: Record<string, unknown> = {}
    if (payload.additional_data) {
      try {
        additionalData = JSON.parse(payload.additional_data)
      } catch (error) {
        console.error('Failed to parse Cryptomus additional_data:', error)
      }
    }

    const userId = typeof additionalData.user_id === 'string' ? additionalData.user_id : null
    const packageId = typeof additionalData.package_id === 'string' ? additionalData.package_id : null
    const amountUsd = Number(payload.amount)

    if (!userId || !packageId || !Number.isFinite(amountUsd) || amountUsd <= 0) {
      return errorResponse('Missing Cryptomus purchase metadata', 400)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const selectedPackage = await getActiveCreditPackageById(supabaseAdmin, packageId)
    if (!selectedPackage) {
      return errorResponse('Invalid credit package', 400)
    }

    const credits = Number(selectedPackage.credits_amount)
    const { data, error } = await supabaseAdmin.rpc('process_credit_purchase_webhook', {
      p_user_id: userId,
      p_credits: credits,
      p_reason: 'purchase',
      p_amount_paid: amountUsd,
      p_currency: 'USD',
      p_payment_method: payload.currency || 'cryptomus',
      p_provider_payment_id: payload.uuid,
      p_metadata: {
        provider: 'cryptomus',
        package_id: additionalData.package_id || null,
        network: payload.network || null,
        payment_status: payload.status,
      },
    })

    if (error) {
      console.error('Cryptomus webhook RPC failed:', error)
      return errorResponse(error.message, 500)
    }

    return jsonResponse(data || { success: true })
  } catch (error) {
    console.error('cryptomus-webhook error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})
