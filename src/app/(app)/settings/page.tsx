'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BudgetCategory, UserProfile } from '@/types/database'
import { Button } from '@/components/ui/button'
import { CategoryForm } from '@/components/category-form'
import { Plus, Pencil, Trash2, Sparkles, CreditCard, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SCAN_FREE_LIMIT } from '@/lib/stripe'

export default function SettingsPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetCategory | undefined>()
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingSuccess, setBillingSuccess] = useState(false)

  async function loadData() {
    const [catResult, profileResult] = await Promise.all([
      supabase.from('budget_categories').select('*').order('name'),
      supabase.from('user_profiles').select('*').single(),
    ])
    setCategories(catResult.data ?? [])
    setProfile(profileResult.data ?? null)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // Check for ?billing=success after Stripe redirect
    const params = new URLSearchParams(window.location.search)
    if (params.get('billing') === 'success') {
      setBillingSuccess(true)
      // Remove the query param from the URL without a full reload
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Items already assigned will become uncategorized.')) return
    await supabase.from('budget_categories').delete().eq('id', id)
    loadData()
  }

  async function handleUpgrade() {
    setBillingLoading(true); setBillingError(null)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Could not start checkout. Please try again.')
      setBillingLoading(false)
    }
  }

  async function handleManageBilling() {
    setBillingLoading(true); setBillingError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Could not open billing portal. Please try again.')
      setBillingLoading(false)
    }
  }

  const iconBtnBase = cn(
    'flex items-center justify-center w-9 h-9 rounded-full border-2 border-border bg-card',
    'shadow-[var(--shadow-hard-sm)]',
    'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_var(--border)]',
    'active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
  )

  // ── Billing helpers ──────────────────────────────────────────────────────────
  const isGrandfathered = profile?.is_grandfathered ?? false
  const status = profile?.subscription_status ?? 'free'
  const periodEnd = profile?.subscription_period_end
    ? new Date(profile.subscription_period_end)
    : null
  const isActiveSubscription = status === 'active'
  const isCancelledButValid = status === 'cancelled' && !!periodEnd && periodEnd > new Date()
  const isPastDue = status === 'past_due'
  const scansUsed = profile?.scans_used ?? 0
  const scansLeft = Math.max(0, SCAN_FREE_LIMIT - scansUsed)

  const hasStripeHistory = !!profile?.stripe_customer_id

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto w-full">

      {/* ── Billing section ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-heading font-extrabold text-2xl mb-4">Billing</h1>

        {billingSuccess && (
          <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border-2 border-quaternary/40 bg-quaternary/10 text-sm">
            <CheckCircle2 className="h-4 w-4 text-quaternary flex-shrink-0" strokeWidth={2.5} />
            <span className="font-heading font-bold text-quaternary">You&apos;re now on Pro! Unlimited scanning unlocked.</span>
          </div>
        )}

        {billingError && (
          <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border-2 border-destructive/40 bg-destructive/10 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" strokeWidth={2.5} />
            {billingError}
          </div>
        )}

        <div className="rounded-2xl border-2 border-border bg-card shadow-[5px_5px_0px_0px_var(--border)] overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-border/20">
            <p className="font-heading font-bold text-sm text-muted-foreground">Subscription</p>
          </div>

          <div className="px-5 py-5 space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : isGrandfathered ? (
              /* ── Legacy / grandfathered account ── */
              <div className="flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-border flex-shrink-0"
                  style={{ backgroundColor: 'var(--tertiary)' }}
                >
                  <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-heading font-bold">Legacy Account</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Unlimited scans . No subscription needed.</p>
                </div>
              </div>
            ) : isActiveSubscription ? (
              /* ── Active Pro subscription ── */
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-border flex-shrink-0"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-heading font-bold">Pro Plan — $5/month</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Unlimited receipt scanning.</p>
                    {periodEnd && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Renews {periodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                >
                  <CreditCard className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {billingLoading ? 'Loading…' : 'Manage Billing'}
                </Button>
              </div>
            ) : isCancelledButValid ? (
              /* ── Cancelled but still in paid period ── */
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-border flex-shrink-0"
                    style={{ backgroundColor: 'var(--tertiary)' }}
                  >
                    <Clock className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-heading font-bold">Pro Plan — Cancelled</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Access continues until {periodEnd!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpgrade}
                    disabled={billingLoading}
                    className={[
                      'h-9 px-4 flex items-center gap-1.5 rounded-full text-sm',
                      'bg-primary text-white font-heading font-bold',
                      'border-2 border-border shadow-[4px_4px_0px_0px_var(--border)]',
                      'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                      'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_0px_var(--border)]',
                      'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_var(--border)]',
                      'disabled:opacity-50 disabled:pointer-events-none',
                    ].join(' ')}
                  >
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {billingLoading ? 'Loading…' : 'Resubscribe'}
                  </button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleManageBilling} disabled={billingLoading}>
                    <CreditCard className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Manage Billing
                  </Button>
                </div>
              </div>
            ) : isPastDue ? (
              /* ── Past due / payment failed ── */
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-border flex-shrink-0"
                    style={{ backgroundColor: 'var(--destructive)' }}
                  >
                    <AlertTriangle className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-heading font-bold">Payment Failed</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Please update your payment method to continue scanning.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleManageBilling} disabled={billingLoading}>
                  <CreditCard className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {billingLoading ? 'Loading…' : 'Update Payment Method'}
                </Button>
              </div>
            ) : (
              /* ── Free tier ── */
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-border flex-shrink-0"
                    style={{ backgroundColor: 'var(--muted)' }}
                  >
                    <Sparkles className="h-5 w-5 text-muted-foreground" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-bold">Free Plan</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {scansLeft > 0
                        ? <>{scansLeft} of {SCAN_FREE_LIMIT} free scans remaining.</>
                        : <>You&apos;ve used all {SCAN_FREE_LIMIT} free scans.</>}
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 h-2 rounded-full bg-muted border border-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (scansUsed / SCAN_FREE_LIMIT) * 100)}%`,
                          backgroundColor: scansLeft === 0 ? 'var(--destructive)' : 'var(--primary)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Upgrade card */}
                <div className="rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-4 space-y-3">
                  <div>
                    <p className="font-heading font-bold text-sm">Upgrade to Pro — $5/month</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Unlimited receipt scanning with AI-powered item extraction.</p>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    disabled={billingLoading}
                    className={[
                      'h-10 px-5 flex items-center gap-2 rounded-full text-sm',
                      'bg-primary text-white font-heading font-bold',
                      'border-2 border-border shadow-[4px_4px_0px_0px_var(--border)]',
                      'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                      'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_0px_var(--border)]',
                      'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_var(--border)]',
                      'disabled:opacity-50 disabled:pointer-events-none',
                    ].join(' ')}
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                    {billingLoading ? 'Loading…' : 'Upgrade to Pro'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Budget Categories section ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-extrabold text-2xl">Budget Categories</h2>
          <Button size="sm" className="gap-1.5" onClick={() => { setEditing(undefined); setFormOpen(true) }}>
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add Category
          </Button>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card shadow-[5px_5px_0px_0px_var(--border)] overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b-2 border-border/20">
            <p className="font-heading font-bold text-sm text-muted-foreground">
              {categories.length} categories · limits reset on the 1st of each month
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Loading…</div>
          ) : categories.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="font-heading font-bold">No categories yet</p>
              <p className="text-sm text-muted-foreground">Add your first category to start tracking</p>
            </div>
          ) : (
            <div>
              {categories.map((cat, i) => (
                <div
                  key={cat.id}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4',
                    i > 0 && 'border-t-2 border-border/15'
                  )}
                >
                  {/* Icon circle */}
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full border-2 text-xl flex-shrink-0"
                    style={{ backgroundColor: cat.color + '22', borderColor: cat.color }}
                  >
                    {cat.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">${cat.monthly_limit.toFixed(2)} / month</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(cat); setFormOpen(true) }}
                      className={cn(iconBtnBase, 'text-muted-foreground hover:bg-[var(--tertiary)] hover:text-[var(--tertiary-foreground)]')}
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className={cn(iconBtnBase, 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive')}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CategoryForm
        key={editing?.id ?? 'new'}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={loadData}
        existing={editing}
      />
    </div>
  )
}
