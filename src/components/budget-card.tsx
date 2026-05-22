import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { CategoryWithSpending } from '@/types/database'
import { cn } from '@/lib/utils'

interface BudgetCardProps {
  category: CategoryWithSpending
}

export function BudgetCard({ category }: BudgetCardProps) {
  const { name, icon, monthly_limit, spent, color } = category
  const hasLimit = monthly_limit > 0
  const pct = hasLimit ? Math.min((spent / monthly_limit) * 100, 100) : 0
  const isOver = hasLimit && spent > monthly_limit
  const isWarning = pct >= 75 && pct < 90

  const barColor = isOver
    ? 'bg-destructive'
    : isWarning
    ? 'bg-yellow-500'
    : 'bg-green-500'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <span className="text-2xl" role="img" aria-label={name}>{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className={cn('text-xs', isOver ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
            {!hasLimit ? 'No budget set' : isOver ? 'Over budget!' : `${Math.round(pct)}% used`}
          </p>
        </div>
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {hasLimit && (
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className={cn('font-medium', isOver && 'text-destructive')}>
            ${spent.toFixed(2)} spent
          </span>
          {hasLimit && <span>${monthly_limit.toFixed(2)} budget</span>}
        </div>
      </CardContent>
    </Card>
  )
}
