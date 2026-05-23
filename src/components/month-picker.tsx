'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, parseISO, startOfMonth, isFuture } from 'date-fns'

interface MonthPickerProps {
  currentMonth: string // 'YYYY-MM'
}

export function MonthPicker({ currentMonth }: MonthPickerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const date = parseISO(currentMonth + '-01')
  const prevMonth = format(subMonths(date, 1), 'yyyy-MM')
  const nextMonth = format(addMonths(date, 1), 'yyyy-MM')
  const isCurrentMonth = currentMonth === format(new Date(), 'yyyy-MM')
  const nextIsFuture = isFuture(startOfMonth(addMonths(date, 1)))

  function navigate(month: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', month)
    router.push(`/dashboard?${params.toString()}`)
  }

  const circleBtn = [
    'flex items-center justify-center w-10 h-10 rounded-full',
    'border-2 border-border bg-card text-foreground',
    'shadow-[var(--shadow-hard-sm)]',
    'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    'hover:bg-[var(--tertiary)] hover:text-[var(--tertiary-foreground)]',
    'active:shadow-none active:translate-x-[1px] active:translate-y-[1px]',
    'disabled:opacity-30 disabled:pointer-events-none',
  ].join(' ')

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => navigate(prevMonth)} className={circleBtn} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
      </button>

      <span className="font-heading font-extrabold text-2xl min-w-[180px] text-center">
        {format(date, 'MMMM yyyy')}
      </span>

      <button
        onClick={() => navigate(nextMonth)}
        disabled={nextIsFuture}
        className={circleBtn}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </button>

      {!isCurrentMonth && (
        <button
          onClick={() => navigate(format(new Date(), 'yyyy-MM'))}
          className={[
            'ml-1 px-3 py-1 rounded-full text-xs font-heading font-bold',
            'bg-[var(--tertiary)] text-[var(--tertiary-foreground)]',
            'border-2 border-border shadow-[var(--shadow-hard-sm)]',
            'transition-all duration-200',
            'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_var(--border)]',
            'active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
          ].join(' ')}
        >
          Today
        </button>
      )}
    </div>
  )
}
