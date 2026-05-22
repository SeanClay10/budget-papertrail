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

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navigate(prevMonth)}
        className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xl font-bold min-w-[160px] text-center">
        {format(date, 'MMMM yyyy')}
      </span>
      <button
        onClick={() => navigate(nextMonth)}
        disabled={nextIsFuture}
        className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => navigate(format(new Date(), 'yyyy-MM'))}
          className="ml-1 text-xs text-primary underline-offset-4 hover:underline"
        >
          Today
        </button>
      )}
    </div>
  )
}
