import Stripe from 'stripe'

// Lazy-initialised so the build doesn't throw when env vars are absent.
// Real API calls will fail with an auth error if the key is missing at runtime.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'placeholder-key', {
      apiVersion: '2026-04-22.dahlia',
    })
  }
  return _stripe
}

// Convenience re-export so callers can do: import { stripe } from '@/lib/stripe'
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const SCAN_FREE_LIMIT = 10
