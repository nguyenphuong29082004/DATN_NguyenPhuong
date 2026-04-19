import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { corsHeaders, errorResponse, jsonResponse, handleCors } from "../_shared/cors.ts"
import { getActiveCreditPackageById } from "../_shared/creditPackages.ts"

const STRIPE_API_URL = 'https://api.stripe.com/v1/checkout/sessions'

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
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const appUrl = Deno.env.get('APP_URL') || Deno.env.get('SITE_URL') || 'http://127.0.0.1:3000'

    if (!supabaseUrl || !supabaseAnonKey || !stripeSecretKey) {
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
      .select('is_guest, email')
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
    const amountCents = Math.round(parsedAmount * 100)
    const successUrl = `${appUrl}/studio/credits?status=success&provider=stripe`
    const cancelUrl = `${appUrl}/studio/credits?status=error&provider=stripe`

    const form = new URLSearchParams()
    form.set('mode', 'payment')
    form.set('success_url', successUrl)
    form.set('cancel_url', cancelUrl)
    form.set('payment_method_types[0]', 'card')
    form.set('line_items[0][quantity]', '1')
    form.set('line_items[0][price_data][currency]', 'usd')
    form.set('line_items[0][price_data][unit_amount]', String(amountCents))
    form.set('line_items[0][price_data][product_data][name]', `${credits} Catwalk AI credits`)
    form.set('line_items[0][price_data][product_data][description]', `Buy ${credits} AI credits for $${parsedAmount}`)
    form.set('metadata[user_id]', user.id)
    form.set('metadata[amount_usd]', String(parsedAmount))
    form.set('metadata[credits]', String(credits))
    form.set('metadata[currency]', 'USD')
    form.set('metadata[payment_method]', 'stripe')
    form.set('metadata[package_id]', selectedPackage.package_id)
    if (profile?.email) {
      form.set('customer_email', profile.email)
    }

    const response = await fetch(STRIPE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })

    const stripeData = await response.json()

    if (!response.ok) {
      return new Response(JSON.stringify({ error: stripeData?.error?.message || 'Failed to create Stripe checkout' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      })
    }

    return jsonResponse({
      url: stripeData.url,
      sessionId: stripeData.id,
    })
  } catch (error) {
    console.error('create-stripe-checkout error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})
