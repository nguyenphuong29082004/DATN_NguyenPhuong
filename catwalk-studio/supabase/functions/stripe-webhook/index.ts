import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno"
import { errorResponse, jsonResponse } from "../_shared/cors.ts"
import { getActiveCreditPackageById } from "../_shared/creditPackages.ts"

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
      return errorResponse('Missing environment configuration', 500)
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
    })

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return errorResponse('Missing Stripe signature', 400)
    }

    const body = await req.text()
    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      console.error('Stripe signature verification failed:', error)
      return errorResponse('Invalid Stripe signature', 400)
    }

    if (event.type !== 'checkout.session.completed') {
      return jsonResponse({ received: true })
    }

    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata || {}
    const userId = metadata.user_id
    const packageId = metadata.package_id
    const amountUsd = session.amount_total ? session.amount_total / 100 : Number(metadata.amount_usd)
    const paymentMethod = session.payment_method_types?.join(', ') || 'stripe'

    if (!userId || !packageId) {
      return errorResponse('Missing purchase metadata', 400)
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
      p_payment_method: paymentMethod,
      p_provider_payment_id: session.id,
      p_metadata: {
        provider: 'stripe',
        package_id: metadata.package_id || null,
        customer_email: session.customer_details?.email || null,
        payment_status: session.payment_status,
      },
    })

    if (error) {
      console.error('Stripe webhook RPC failed:', error)
      return errorResponse(error.message, 500)
    }

    return jsonResponse(data || { success: true })
  } catch (error) {
    console.error('stripe-webhook error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})
