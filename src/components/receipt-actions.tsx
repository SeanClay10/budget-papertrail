'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ItemReviewTable } from '@/components/item-review-table'
import { createClient } from '@/lib/supabase/client'
import type { BudgetCategory, ScannedItem } from '@/types/database'
import { cn } from '@/lib/utils'

export interface ReceiptForActions {
  id: string
  store_name: string | null
  receipt_date: string
  notes: string | null
  items: { id: string; name: string; price: number; category_id: string | null }[]
}

export function ReceiptActions({ receipt }: { receipt: ReceiptForActions }) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [storeName, setStoreName] = useState(receipt.store_name ?? '')
  const [receiptDate, setReceiptDate] = useState(receipt.receipt_date)
  const [notes, setNotes] = useState(receipt.notes ?? '')
  const [items, setItems] = useState<ScannedItem[]>([])

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from('budget_categories').select('*').order('name')
    setCategories(data ?? [])
  }, [supabase])

  useEffect(() => {
    if (editOpen) {
      loadCategories()
      setStoreName(receipt.store_name ?? '')
      setReceiptDate(receipt.receipt_date)
      setNotes(receipt.notes ?? '')
      setItems(receipt.items.map(item => ({
        name: item.name, price: item.price, category_id: item.category_id,
        suggested_category: '', included: true,
      })))
      setError(null)
    }
  }, [editOpen, receipt, loadCategories])

  async function handleDelete() {
    if (!confirm('Delete this receipt and all its items?')) return
    setDeleting(true)
    const res = await fetch(`/api/receipts/${receipt.id}`, { method: 'DELETE' })
    if (res.ok) { router.refresh() } else { alert('Failed to delete receipt'); setDeleting(false) }
  }

  async function handleSave() {
    setSaving(true); setError(null)
    const res = await fetch(`/api/receipts/${receipt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_name: storeName, receipt_date: receiptDate, notes: notes || null, items }),
    })
    if (res.ok) { setEditOpen(false); router.refresh() } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save changes')
    }
    setSaving(false)
  }

  const iconBtnBase = cn(
    'flex items-center justify-center w-9 h-9 rounded-full border-2 border-border',
    'shadow-[var(--shadow-hard-sm)]',
    'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_var(--border)]',
    'active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
    'disabled:opacity-50 disabled:pointer-events-none',
  )

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setEditOpen(true)}
          className={cn(iconBtnBase, 'bg-card text-muted-foreground hover:bg-[var(--tertiary)] hover:text-[var(--tertiary-foreground)] hover:border-border')}
          aria-label="Edit receipt"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={cn(iconBtnBase, 'bg-card text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive')}
          aria-label="Delete receipt"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate-pop-in">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-xl">Edit Receipt</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">{error}</p>}
          <ItemReviewTable
            items={items} categories={categories} storeName={storeName} receiptDate={receiptDate} notes={notes}
            onStoreNameChange={setStoreName} onReceiptDateChange={setReceiptDate} onNotesChange={setNotes}
            onItemsChange={setItems} onSave={handleSave} saving={saving}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
