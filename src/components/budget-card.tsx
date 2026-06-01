'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { CategoryWithSpending } from '@/types/database'
import { cn } from '@/lib/utils'

interface BudgetCardProps {
  category: CategoryWithSpending
}

const SHADOW_COLORS = [
  'var(--shadow-hard-violet)',
  'var(--shadow-hard-pink)',
  'var(--shadow-hard-amber)',
  'var(--shadow-hard-emerald)',
]

function getShadowColor(name: string): string {
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return SHADOW_COLORS[hash % SHADOW_COLORS.length]
}

export function BudgetCard({ category }: BudgetCardProps) {
  const [open, setOpen] = useState(false)
  const { name, icon, monthly_limit, spent, color, items } = category
  const hasLimit = monthly_limit > 0
  const pct = hasLimit ? Math.min((spent / monthly_limit) * 100, 100) : 0
  const isOver = hasLimit && spent > monthly_limit
  const isWarning = pct >= 75 && pct < 90
  const hasItems = items.length > 0

  const barColor = isOver ? '#EF4444' : isWarning ? '#FBBF24' : color
  const shadow = getShadowColor(name)

  return (
    <>
      <div
        role={hasItems ? 'button' : undefined}
        tabIndex={hasItems ? 0 : undefined}
        onClick={hasItems ? () => setOpen(true) : undefined}
        onKeyDown={hasItems ? (e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true) } : undefined}
        className={cn(
          'relative flex flex-col gap-0 rounded-2xl bg-card border-2 border-border overflow-hidden',
          'animate-pop-in',
          'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          'hover:-translate-x-[2px] hover:-translate-y-[2px]',
          hasItems && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
        style={{ boxShadow: shadow }}
      >
        {/* Over-budget badge */}
        {isOver && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive border-2 border-border text-white text-[10px] font-heading font-bold shadow-[2px_2px_0px_0px_var(--border)]">
            🚨 Over budget!
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full border-2 flex-shrink-0 text-2xl hover-wiggle"
            style={{ backgroundColor: color + '22', borderColor: color }}
          >
            <span role="img" aria-label={name}>{icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-base truncate">{name}</p>
            <p className={cn(
              'text-xs',
              isOver ? 'text-destructive font-bold' : 'text-muted-foreground'
            )}>
              {!hasLimit ? 'No limit set' : isOver ? 'Over budget!' : `${Math.round(pct)}% used`}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[2px] bg-border/20 mx-4" />

        {/* Progress + amounts */}
        <div className="px-4 py-3 space-y-2.5">
          {hasLimit && (
            <div className="relative h-[10px] w-full overflow-hidden rounded-full border-2 border-border bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
          )}
          <div className="flex justify-between items-baseline">
            <span className={cn(
              'font-heading font-bold text-base',
              isOver && 'text-destructive'
            )}>
              ${spent.toFixed(2)}
            </span>
            {hasLimit && (
              <span className="text-xs text-muted-foreground">
                of ${monthly_limit.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Items dialog */}
      {hasItems && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className={cn(
              'sm:max-w-md p-0 gap-0 overflow-hidden animate-pop-in',
              'border-2 border-border shadow-[5px_5px_0px_0px_var(--border)] ring-0',
            )}
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 pr-10 border-b-2 border-border/20">
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label={name}>{icon}</span>
                <p className="font-heading font-bold text-base leading-tight">{name}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {items.length} {items.length === 1 ? 'item' : 'items'} · ${spent.toFixed(2)} total
              </p>
            </div>

            {/* Items list */}
            <div className="overflow-y-auto max-h-[60vh]">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center justify-between gap-3 px-4 py-3',
                    i !== 0 && 'border-t border-border/20',
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.store_name && <span>{item.store_name} · </span>}
                      {item.receipt_date
                        ? format(new Date(item.receipt_date + 'T00:00:00'), 'MMM d, yyyy')
                        : '—'}
                    </p>
                  </div>
                  <span className="font-heading font-bold text-sm shrink-0">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
