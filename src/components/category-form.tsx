'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import type { BudgetCategory } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#22c55e', '#f97316', '#8b5cf6', '#ef4444',
  '#3b82f6', '#ec4899', '#a16207', '#06b6d4',
  '#6b7280', '#eab308', '#14b8a6', '#f43f5e',
]

const PRESET_ICONS = ['🛒','🍽️','👕','❤️','🚗','🎬','🏠','💻','📦','☕','🎮','✈️','🏋️','📚','🐾','💊']

interface CategoryFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  existing?: BudgetCategory
}

const labelClass = 'block text-[10px] font-heading font-bold uppercase tracking-widest text-muted-foreground mb-2'

export function CategoryForm({ open, onClose, onSaved, existing }: CategoryFormProps) {
  const supabase = createClient()
  const [name, setName] = useState(existing?.name ?? '')
  const [limit, setLimit] = useState(existing?.monthly_limit?.toString() ?? '100')
  const [color, setColor] = useState(existing?.color ?? PRESET_COLORS[0])
  const [icon, setIcon] = useState(existing?.icon ?? '📦')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true); setError(null)
    const payload = { name: name.trim(), monthly_limit: parseFloat(limit) || 0, color, icon }
    let err
    if (existing) {
      ({ error: err } = await supabase.from('budget_categories').update(payload).eq('id', existing.id))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      ;({ error: err } = await supabase.from('budget_categories').insert({ ...payload, user_id: user!.id }))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved(); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm animate-pop-in">
        <DialogHeader>
          <DialogTitle className="font-heading font-extrabold text-xl">
            {existing ? 'Edit Category' : 'New Category'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl border border-destructive/30">{error}</p>}

          <div>
            <label className={labelClass}>Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Groceries" />
          </div>

          <div>
            <label className={labelClass}>Monthly Budget ($)</label>
            <Input type="number" min="0" step="10" value={limit} onChange={e => setLimit(e.target.value)} className="font-heading font-bold text-lg" />
          </div>

          <div>
            <label className={labelClass}>Icon</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={cn(
                    'w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all duration-200 border-2',
                    icon === ic
                      ? 'border-primary bg-accent shadow-[var(--shadow-hard-violet)] scale-110'
                      : 'border-border bg-muted hover:bg-[var(--tertiary)]/20 hover:border-border'
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Color</label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-9 h-9 rounded-full border-2 transition-all duration-200',
                    color === c
                      ? 'border-border scale-125 shadow-[3px_3px_0px_0px_var(--border)]'
                      : 'border-transparent hover:scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : existing ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
