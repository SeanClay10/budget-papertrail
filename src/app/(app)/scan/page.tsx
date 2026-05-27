'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ReceiptScanner } from '@/components/receipt-scanner'
import { ItemReviewTable } from '@/components/item-review-table'
import { createClient } from '@/lib/supabase/client'
import type { BudgetCategory, ScannedItem, ScanResult, UserProfile } from '@/types/database'
import { CheckCircle2, PenLine, Sparkles, Lock } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { SCAN_FREE_LIMIT } from '@/lib/stripe'

type Step = 'upload' | 'review' | 'saved'

export default function ScanPage() {
  // Memoize to prevent a new client instance on every render, which would
  // cause useCallback → useEffect to re-run and race against the scan update.
  const supabase = useMemo(() => createClient(), [])
  const [step, setStep] = useState<Step>('upload')
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [upgradingCheckout, setUpgradingCheckout] = useState(false)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [storeName, setStoreName] = useState('')
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<ScannedItem[]>([])

  const loadData = useCallback(async () => {
    const [catResult, profileResult] = await Promise.all([
      supabase.from('budget_categories').select('*').order('name'),
      supabase.from('user_profiles').select('*').single(),
    ])
    setCategories(catResult.data ?? [])
    setProfile(profileResult.data ?? null)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  function handleAddManually() {
    setImageUrl(''); setStoreName(''); setReceiptDate(new Date().toISOString().slice(0, 10))
    setItems([]); setError(null); setLimitReached(false); setStep('review')
  }

  async function handleScan(file: File) {
    setScanning(true); setError(null); setLimitReached(false)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/scan', { method: 'POST', body: fd })
      const data: (ScanResult & { error?: string; scans_used?: number; new_scans_used?: number }) = await res.json()

      if (res.status === 402 && data.error === 'scan_limit_reached') {
        setLimitReached(true)
        return
      }

      if (!res.ok) throw new Error(data.error ?? 'Scan failed')

      // Update scan count directly from the API response — avoids a separate
      // Supabase round-trip and the race condition it could cause.
      if (typeof data.new_scans_used === 'number') {
        setProfile(prev => prev ? { ...prev, scans_used: data.new_scans_used as number } : prev)
      }

      setImageUrl(data.image_url)
      setStoreName(data.store_name ?? '')
      setReceiptDate(data.receipt_date ?? new Date().toISOString().slice(0, 10))
      const matched = data.items.map((item: ScannedItem) => {
        const cat = categories.find(c => c.name.toLowerCase() === item.suggested_category.toLowerCase())
        return { ...item, category_id: cat?.id ?? null }
      })
      setItems(matched); setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setScanning(false) }
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_name: storeName, receipt_date: receiptDate, image_url: imageUrl, items }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setStep('saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setSaving(false) }
  }

  function handleReset() {
    setStep('upload'); setItems([]); setImageUrl(''); setStoreName('')
    setReceiptDate(new Date().toISOString().slice(0, 10)); setError(null); setLimitReached(false)
  }

  async function handleUpgrade() {
    setUpgradingCheckout(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setError('Could not start checkout. Please try again.')
    } finally {
      setUpgradingCheckout(false)
    }
  }

  // Determine quota state for the banner
  const isGrandfathered = profile?.is_grandfathered ?? false
  const isSubscribed =
    profile?.subscription_status === 'active' ||
    (profile?.subscription_status === 'cancelled' &&
      !!profile.subscription_period_end &&
      new Date(profile.subscription_period_end) > new Date())
  const scansUsed = profile?.scans_used ?? 0
  const scansLeft = Math.max(0, SCAN_FREE_LIMIT - scansUsed)
  const showQuotaBanner = profile !== null && !isGrandfathered && !isSubscribed

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto w-full space-y-5">
      <h1 className="font-heading font-extrabold text-2xl">
        {step === 'upload' && 'Scan Receipt'}
        {step === 'review' && 'Review Items'}
        {step === 'saved' && 'Receipt Saved!'}
      </h1>

      {/* Free scan quota banner */}
      {showQuotaBanner && step === 'upload' && (
        <div className={[
          'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm',
          scansLeft === 0
            ? 'border-destructive/40 bg-destructive/10 text-destructive'
            : scansLeft <= 3
              ? 'border-amber-400/60 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
              : 'border-border/50 bg-muted/30 text-muted-foreground',
        ].join(' ')}>
          <Sparkles className="h-4 w-4 flex-shrink-0" strokeWidth={2.5} />
          <span>
            <span className="font-heading font-bold">{scansLeft} of {SCAN_FREE_LIMIT} free scans remaining.</span>
            {scansLeft <= 3 && scansLeft > 0 && (
              <>{' '}<Link href="/settings" className="underline underline-offset-2 hover:text-primary">Upgrade to Pro</Link> to scan unlimited receipts.</>
            )}
          </span>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl border-2 border-destructive/30">
          {error}
        </div>
      )}

      {/* Scan limit gate */}
      {limitReached && (
        <div className="rounded-2xl border-2 border-border bg-card shadow-[5px_5px_0px_0px_var(--border)] overflow-hidden">
          <div className="px-6 py-8 flex flex-col items-center text-center space-y-4">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-border"
              style={{ backgroundColor: 'var(--secondary)', boxShadow: 'var(--shadow-hard-sm)' }}
            >
              <Lock className="h-7 w-7" style={{ color: 'var(--secondary-foreground)' }} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl">You&apos;ve used all 10 free scans</h2>
              <p className="text-muted-foreground mt-1 text-sm max-w-xs mx-auto">
                Upgrade to Pro for unlimited receipt scanning — just $5/month.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button
                onClick={handleUpgrade}
                disabled={upgradingCheckout}
                className={[
                  'flex-1 h-12 flex items-center justify-center gap-2 rounded-full',
                  'bg-primary text-white font-heading font-bold text-sm',
                  'border-2 border-border shadow-[5px_5px_0px_0px_var(--border)]',
                  'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                  'hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[7px_7px_0px_0px_var(--border)]',
                  'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0px_0px_var(--border)]',
                  'disabled:opacity-50 disabled:pointer-events-none',
                ].join(' ')}
              >
                <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                {upgradingCheckout ? 'Redirecting…' : 'Upgrade to Pro — $5/mo'}
              </button>
            </div>
            <button
              onClick={() => setLimitReached(false)}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Add receipt manually instead
            </button>
          </div>
        </div>
      )}

      {!limitReached && step === 'upload' && (
        <div className="space-y-4">
          <ReceiptScanner onScan={handleScan} loading={scanning} />
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-[2px] bg-border/30" />
            <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-widest">or</span>
            <div className="flex-1 h-[2px] bg-border/30" />
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={handleAddManually} disabled={scanning}>
            <PenLine className="h-4 w-4" strokeWidth={2.5} />
            Add manually
          </Button>
        </div>
      )}

      {step === 'review' && (
        <ItemReviewTable
          items={items} categories={categories} storeName={storeName} receiptDate={receiptDate}
          onStoreNameChange={setStoreName} onReceiptDateChange={setReceiptDate}
          onItemsChange={setItems} onSave={handleSave} saving={saving}
        />
      )}

      {step === 'saved' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-5 text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-quaternary/20 border-2 border-border shadow-[var(--shadow-hard-emerald)] animate-pop-in">
            <CheckCircle2 className="h-10 w-10 text-quaternary" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-2xl">All done!</h2>
            <p className="text-muted-foreground mt-1">Your items have been added to your budget.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/dashboard" className={buttonVariants({})}>
              View Dashboard
            </Link>
            <Button variant="outline" onClick={handleReset}>Scan Another</Button>
          </div>
        </div>
      )}
    </div>
  )
}
