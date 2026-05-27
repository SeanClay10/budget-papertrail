import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type { SubscriptionStatus } from '@/types/database'
import type Stripe from 'stripe'

// Map Stripe subscription status → our subscription_status column
function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    case 'canceled':
      return 'cancelled'
    default:
      return 'free'
  }
}

// In Stripe API 2026-04-22.dahlia, current_period_end moved from Subscription
// to SubscriptionItem. Use the first item's period end as the authoritative value.
function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  const firstItem = subscription.items?.data?.[0]
  if (firstItem?.current_period_end) {
    return new Date(firstItem.current_period_end * 1000).toISOString()
  }
  // Fallback: use cancel_at or ended_at if available
  if (subscription.cancel_at) {
    return new Date(subscription.cancel_at * 1000).toISOString()
  }
  return null
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabaseAdmin = await createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Fetch full subscription to get period end from items
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items'],
        })

        await supabaseAdmin
          .from('user_profiles')
          .update({
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
            subscription_period_end: getPeriodEnd(subscription),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabaseAdmin
          .from('user_profiles')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: mapStripeStatus(subscription.status),
            subscription_period_end: getPeriodEnd(subscription),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabaseAdmin
          .from('user_profiles')
          .update({
            subscription_status: 'cancelled',
            subscription_period_end: getPeriodEnd(subscription),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabaseAdmin
          .from('user_profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      default:
        // Unhandled event — return 200 so Stripe doesn't retry
        break
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err)
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
