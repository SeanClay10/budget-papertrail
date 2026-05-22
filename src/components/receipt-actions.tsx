'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ItemReviewTable } from '@/components/item-review-table'
import { createClient } from '@/lib/supabase/client'
import type { BudgetCategory, ScannedItem } from '@/types/database'

export interface ReceiptForActions {
  id: string
  store_name: string | null
  receipt_date: string
  items: {
    id: string
    name: string
    price: number
    category_id: string | null
  }[]
}

interface ReceiptActionsProps {
  receipt: ReceiptForActions
}

export function ReceiptActions({ receipt }: ReceiptActionsProps) {
  const router = useRouter()
  const supabase = createClient()

  const [deleting, setDeleting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [storeName, setStoreName] = useState(receipt.store_name ?? '')
  const [receiptDate, setReceiptDate] = useState(receipt.receipt_date)
  const [items, setItems] = useState<ScannedItem[]>([])

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from('budget_categories').select('*').order('name')
    setCategories(data ?? [])
  }, [supabase])

  // Reset edit state each time the dialog opens
  useEffect(() => {
    if (editOpen) {
      loadCategories()
      setStoreName(receipt.store_name ?? '')
      setReceiptDate(receipt.receipt_date)
      setItems(
        receipt.items.map(item => ({
          name: item.name,
          price: item.price,
          category_id: item.category_id,
          suggested_category: '',
          included: true,
        }))
      )
      setError(null)
    }
  }, [editOpen, receipt, loadCategories])

  async function handleDelete() {
    if (!confirm('Delete this receipt and all its items?')) return
    setDeleting(true)
    const res = await fetch(`/api/receipts/${receipt.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('Failed to delete receipt')
      setDeleting(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/receipts/${receipt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_name: storeName, receipt_date: receiptDate, items }),
    })
    if (res.ok) {
      setEditOpen(false)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save changes')
    }
    setSaving(false)
  }

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setEditOpen(true)}
          aria-label="Edit receipt"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete receipt"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Receipt</DialogTitle>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
          )}
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
        </DialogContent>
      </Dialog>
    </>
  )
}
