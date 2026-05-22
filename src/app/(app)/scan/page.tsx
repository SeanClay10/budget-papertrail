'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { ReceiptScanner } from '@/components/receipt-scanner'
import { ItemReviewTable } from '@/components/item-review-table'
import { createClient } from '@/lib/supabase/client'
import type { BudgetCategory, ScannedItem, ScanResult } from '@/types/database'
import { CheckCircle2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'

type Step = 'upload' | 'review' | 'saved'

export default function ScanPage() {
  const supabase = createClient()

  const [step, setStep] = useState<Step>('upload')
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<BudgetCategory[]>([])

  const [imageUrl, setImageUrl] = useState('')
  const [storeName, setStoreName] = useState('')
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<ScannedItem[]>([])

  const loadCategories = useCallback(async () => {
    const { data } = await supabase
      .from('budget_categories')
      .select('*')
      .order('name')
    setCategories(data ?? [])
  }, [supabase])

  useEffect(() => { loadCategories() }, [loadCategories])

  async function handleScan(file: File) {
    setScanning(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/scan', { method: 'POST', body: fd })
      const data: ScanResult & { error?: string } = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scan failed')

      setImageUrl(data.image_url)
      setStoreName(data.store_name ?? '')
      setReceiptDate(data.receipt_date ?? new Date().toISOString().slice(0, 10))

      // Immediately resolve suggested_category names → real category UUIDs
      // so the dropdown shows "Groceries" not a UUID or blank
      const matched = data.items.map((item: ScannedItem) => {
        const cat = categories.find(
          c => c.name.toLowerCase() === item.suggested_category.toLowerCase()
        )
        return { ...item, category_id: cat?.id ?? null }
      })
      setItems(matched)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setScanning(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto w-full space-y-4">
      <h1 className="text-xl font-bold">
        {step === 'upload' && 'Scan Receipt'}
        {step === 'review' && 'Review Items'}
        {step === 'saved' && 'Receipt Saved'}
      </h1>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</div>
      )}

      {step === 'upload' && (
        <ReceiptScanner onScan={handleScan} loading={scanning} />
      )}

      {step === 'review' && (
        <ItemReviewTable
          items={items}
          categories={categories}
          storeName={storeName}
          receiptDate={receiptDate}
          onStoreNameChange={setStoreName}
          onReceiptDateChange={setReceiptDate}
          onItemsChange={setItems}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {step === 'saved' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h2 className="text-lg font-semibold">Receipt saved!</h2>
          <p className="text-sm text-muted-foreground">Your items have been added to your budget.</p>
          <div className="flex gap-3 pt-2">
            <Link href="/dashboard" className={buttonVariants({})}>
              View Dashboard
            </Link>
            <Button variant="outline" onClick={() => { setStep('upload'); setItems([]); setError(null) }}>
              Scan Another
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
