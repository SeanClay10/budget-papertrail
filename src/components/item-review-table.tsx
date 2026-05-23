'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'
import type { ScannedItem, BudgetCategory } from '@/types/database'
import { cn } from '@/lib/utils'

interface ItemReviewTableProps {
  items: ScannedItem[]
  categories: BudgetCategory[]
  storeName: string
  receiptDate: string
  onStoreNameChange: (v: string) => void
  onReceiptDateChange: (v: string) => void
  onItemsChange: (items: ScannedItem[]) => void
  onSave: () => void
  saving: boolean
}

export function ItemReviewTable({
  items, categories, storeName, receiptDate,
  onStoreNameChange, onReceiptDateChange, onItemsChange, onSave, saving,
}: ItemReviewTableProps) {
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')

  const total = items.filter(i => i.included).reduce((s, i) => s + i.price, 0)

  function updateItem(index: number, patch: Partial<ScannedItem>) {
    onItemsChange(items.map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  function removeItem(index: number) {
    onItemsChange(items.filter((_, i) => i !== index))
  }

  function addItem() {
    if (!newItemName.trim() || !newItemPrice) return
    onItemsChange([...items, {
      name: newItemName.trim(),
      price: parseFloat(newItemPrice),
      suggested_category: 'Other',
      included: true,
      category_id: categories.find(c => c.name === 'Other')?.id ?? null,
    }])
    setNewItemName('')
    setNewItemPrice('')
  }

  const labelClass = 'block text-[10px] font-heading font-bold uppercase tracking-widest text-muted-foreground mb-1'

  return (
    <div className="space-y-4">
      {/* Receipt metadata */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Store</label>
          <Input value={storeName} onChange={e => onStoreNameChange(e.target.value)} placeholder="Store name" />
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <Input type="date" value={receiptDate} onChange={e => onReceiptDateChange(e.target.value)} />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const selectedCat = categories.find(c => c.id === item.category_id)
          return (
            <div
              key={index}
              className={cn(
                'rounded-xl border-2 border-border p-3 space-y-2',
                'transition-all duration-200',
                'focus-within:shadow-[var(--shadow-hard-violet)]',
                'shadow-[var(--shadow-hard-sm)]',
                !item.included && 'opacity-40 bg-muted'
              )}
            >
              {/* Row 1: checkbox · name · delete */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={item.included}
                  onCheckedChange={checked => updateItem(index, { included: !!checked })}
                  className="shrink-0"
                />
                <Input
                  value={item.name}
                  onChange={e => updateItem(index, { name: e.target.value })}
                  className="flex-1 h-8 text-sm"
                />
                <button
                  onClick={() => removeItem(index)}
                  className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full border-2 border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Row 2: price · category */}
              <div className="flex items-center gap-2 pl-6">
                <span className="text-xs text-muted-foreground shrink-0 font-heading font-bold">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.price}
                  onChange={e => updateItem(index, { price: parseFloat(e.target.value) || 0 })}
                  className="w-24 h-8 text-sm"
                />
                <Select
                  value={item.category_id ?? 'none'}
                  onValueChange={val => updateItem(index, { category_id: val === 'none' ? null : val })}
                >
                  <SelectTrigger className="flex-1 h-8 text-xs min-w-0 rounded-xl border-2 border-[var(--input-border)] bg-card">
                    <span className="truncate">
                      {selectedCat ? `${selectedCat.icon} ${selectedCat.name}` : 'Uncategorized'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add item row */}
      <div className="rounded-xl border-2 border-dashed border-border/60 bg-[var(--tertiary)]/5 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 shrink-0" />
          <Input
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            placeholder="Add item…"
            className="flex-1 h-8 text-sm"
            onKeyDown={e => e.key === 'Enter' && addItem()}
          />
          <button
            onClick={addItem}
            className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full border-2 border-border bg-card shadow-[var(--shadow-hard-sm)] hover:bg-[var(--tertiary)] hover:text-[var(--tertiary-foreground)] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 pl-6">
          <span className="text-xs text-muted-foreground shrink-0 font-heading font-bold">$</span>
          <Input
            type="number" step="0.01" min="0"
            value={newItemPrice}
            onChange={e => setNewItemPrice(e.target.value)}
            placeholder="0.00"
            className="w-24 h-8 text-sm"
            onKeyDown={e => e.key === 'Enter' && addItem()}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t-2 border-border/30">
        <div>
          <span className="font-heading font-bold text-lg">${total.toFixed(2)}</span>
          <span className="text-muted-foreground text-xs ml-1.5">
            ({items.filter(i => i.included).length} items)
          </span>
        </div>
        <Button
          onClick={onSave}
          disabled={saving || items.filter(i => i.included).length === 0}
        >
          {saving ? 'Saving…' : 'Save to Budget'}
        </Button>
      </div>
    </div>
  )
}
