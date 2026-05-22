'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
    setSaving(true)
    setError(null)

    const payload = {
      name: name.trim(),
      monthly_limit: parseFloat(limit) || 0,
      color,
      icon,
    }

    let err
    if (existing) {
      ({ error: err } = await supabase.from('budget_categories').update(payload).eq('id', existing.id))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      ;({ error: err } = await supabase.from('budget_categories').insert({ ...payload, user_id: user!.id }))
    }

    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Groceries" />
          </div>

          <div className="space-y-1.5">
            <Label>Monthly Budget ($)</Label>
            <Input
              type="number"
              min="0"
              step="10"
              value={limit}
              onChange={e => setLimit(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all',
                    icon === ic ? 'ring-2 ring-primary bg-primary/10 scale-110' : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : existing ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
