'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BudgetCategory } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryForm } from '@/components/category-form'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetCategory | undefined>()

  async function loadCategories() {
    const { data } = await supabase
      .from('budget_categories')
      .select('*')
      .order('name')
    setCategories(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadCategories() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Items already assigned will become uncategorized.')) return
    await supabase.from('budget_categories').delete().eq('id', id)
    loadCategories()
  }

  function openNew() { setEditing(undefined); setFormOpen(true) }
  function openEdit(cat: BudgetCategory) { setEditing(cat); setFormOpen(true) }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Budget Categories</h1>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {categories.length} categories — monthly limits reset on the 1st
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No categories yet. Add one to start tracking!
            </div>
          ) : (
            <div className="divide-y">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl w-8 text-center">{cat.icon}</span>
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${cat.monthly_limit.toFixed(2)} / month
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={loadCategories}
        existing={editing}
      />
    </div>
  )
}
