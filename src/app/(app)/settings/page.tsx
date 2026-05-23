'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BudgetCategory } from '@/types/database'
import { Button } from '@/components/ui/button'
import { CategoryForm } from '@/components/category-form'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetCategory | undefined>()

  async function loadCategories() {
    const { data } = await supabase.from('budget_categories').select('*').order('name')
    setCategories(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadCategories() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Items already assigned will become uncategorized.')) return
    await supabase.from('budget_categories').delete().eq('id', id)
    loadCategories()
  }

  const iconBtnBase = cn(
    'flex items-center justify-center w-9 h-9 rounded-full border-2 border-border bg-card',
    'shadow-[var(--shadow-hard-sm)]',
    'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_var(--border)]',
    'active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
  )

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-extrabold text-2xl">Budget Categories</h1>
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

      <CategoryForm
        key={editing?.id ?? 'new'}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={loadCategories}
        existing={editing}
      />
    </div>
  )
}
