export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { BudgetCard } from '@/components/budget-card'
import { SpendingChart } from '@/components/spending-chart'
import { SpendingHistoryChart } from '@/components/spending-history-chart'
import type { HistoryDataPoint, HistoryCategory } from '@/components/spending-history-chart'
import { MonthPicker } from '@/components/month-picker'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ScanLine, Receipt } from 'lucide-react'
import { format, startOfMonth, endOfMonth, parseISO, subMonths } from 'date-fns'
import type { CategoryWithSpending } from '@/types/database'
import { cn } from '@/lib/utils'

const DEFAULT_CATEGORIES = [
  { name: 'Groceries',      monthly_limit: 500, color: '#22c55e', icon: '🛒' },
  { name: 'Dining Out',     monthly_limit: 150, color: '#f97316', icon: '🍽️' },
  { name: 'Clothing',       monthly_limit: 100, color: '#8b5cf6', icon: '👕' },
  { name: 'Health',         monthly_limit: 100, color: '#ef4444', icon: '❤️' },
  { name: 'Transportation', monthly_limit: 200, color: '#3b82f6', icon: '🚗' },
  { name: 'Entertainment',  monthly_limit: 100, color: '#ec4899', icon: '🎬' },
  { name: 'Household',      monthly_limit: 150, color: '#a16207', icon: '🏠' },
  { name: 'Electronics',    monthly_limit: 100, color: '#06b6d4', icon: '💻' },
  { name: 'Other',          monthly_limit: 100, color: '#6b7280', icon: '📦' },
]

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const currentMonthStr = format(now, 'yyyy-MM')
  const selectedMonthStr = month && /^\d{4}-\d{2}$/.test(month) ? month : currentMonthStr
  const selectedDate = parseISO(selectedMonthStr + '-01')
  const monthStart = startOfMonth(selectedDate).toISOString().slice(0, 10)
  const monthEnd = endOfMonth(selectedDate).toISOString().slice(0, 10)

  let { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('user_id', user!.id)
    .order('name')

  if (!categories || categories.length === 0) {
    await supabase.from('budget_categories').upsert(
      DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: user!.id })),
      { onConflict: 'user_id,name', ignoreDuplicates: true }
    );
    ({ data: categories } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('user_id', user!.id)
      .order('name'))
  }

  // ── Selected month spending ──────────────────────────────────────────────
  const { data: monthReceipts } = await supabase
    .from('receipts')
    .select('id')
    .eq('user_id', user!.id)
    .gte('receipt_date', monthStart)
    .lte('receipt_date', monthEnd)

  const receiptIds = monthReceipts?.map(r => r.id) ?? []

  const { data: spending } = receiptIds.length > 0
    ? await supabase
        .from('receipt_items')
        .select('category_id, price')
        .in('receipt_id', receiptIds)
    : { data: [] as { category_id: string | null; price: number }[] }

  const spendingMap: Record<string, number> = {}
  let uncategorizedTotal = 0
  for (const item of spending ?? []) {
    if (item.category_id) {
      spendingMap[item.category_id] = (spendingMap[item.category_id] ?? 0) + Number(item.price)
    } else {
      uncategorizedTotal += Number(item.price)
    }
  }

  const categoriesWithSpending: CategoryWithSpending[] = (categories ?? []).map(c => ({
    ...c,
    spent: Math.round((spendingMap[c.id] ?? 0) * 100) / 100,
  }))

  if (uncategorizedTotal > 0) {
    categoriesWithSpending.push({
      id: '__uncategorized__',
      user_id: user!.id,
      name: 'Uncategorized',
      monthly_limit: 0,
      color: '#94a3b8',
      icon: '❓',
      created_at: '',
      spent: Math.round(uncategorizedTotal * 100) / 100,
    })
  }

  const totalSpent = Object.values(spendingMap).reduce((a, b) => a + b, 0) + uncategorizedTotal
  const totalBudget = (categories ?? []).reduce((a, c) => a + c.monthly_limit, 0)

  // ── 6-month history ──────────────────────────────────────────────────────
  const historyStart = startOfMonth(subMonths(now, 5)).toISOString().slice(0, 10)
  const historyEnd = endOfMonth(now).toISOString().slice(0, 10)

  const { data: historyReceipts } = await supabase
    .from('receipts')
    .select('id, receipt_date')
    .eq('user_id', user!.id)
    .gte('receipt_date', historyStart)
    .lte('receipt_date', historyEnd)

  const historyReceiptIds = historyReceipts?.map(r => r.id) ?? []

  const { data: historyItems } = historyReceiptIds.length > 0
    ? await supabase
        .from('receipt_items')
        .select('receipt_id, category_id, price')
        .in('receipt_id', historyReceiptIds)
    : { data: [] as { receipt_id: string; category_id: string | null; price: number }[] }

  // Build receipt_id → receipt_date lookup
  const receiptDateMap: Record<string, string> = {}
  for (const r of historyReceipts ?? []) receiptDateMap[r.id] = r.receipt_date

  // Accumulate spending per month per category
  const historySpendingMap: Record<string, Record<string, number>> = {}
  for (const item of historyItems ?? []) {
    const date = receiptDateMap[item.receipt_id]
    if (!date || !item.category_id) continue
    const monthKey = date.slice(0, 7) // 'YYYY-MM'
    if (!historySpendingMap[monthKey]) historySpendingMap[monthKey] = {}
    historySpendingMap[monthKey][item.category_id] =
      (historySpendingMap[monthKey][item.category_id] ?? 0) + Number(item.price)
  }

  // Build the last 6 month labels in order
  const last6Months = Array.from({ length: 6 }, (_, i) =>
    format(subMonths(now, 5 - i), 'yyyy-MM')
  )

  const historyChartData: HistoryDataPoint[] = last6Months.map(monthKey => {
    const point: HistoryDataPoint = { month: format(parseISO(monthKey + '-01'), 'MMM yy') }
    for (const cat of categories ?? []) {
      point[cat.id] = Math.round((historySpendingMap[monthKey]?.[cat.id] ?? 0) * 100) / 100
    }
    return point
  })

  const historyCategories: HistoryCategory[] = (categories ?? []).map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
    icon: c.icon ?? '',
  }))

  // ── Recent receipts ──────────────────────────────────────────────────────
  const { data: recentReceipts } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user!.id)
    .order('receipt_date', { ascending: false })
    .limit(5)

  // Section title helper
  function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
      <div className="space-y-1.5">
        <h2 className="font-heading font-bold text-lg">{children}</h2>
        <div className="w-6 h-1 rounded-full bg-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-7 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <MonthPicker currentMonth={selectedMonthStr} />
          <p className="text-sm text-muted-foreground pl-1">
            <span className="font-heading font-bold text-primary">${totalSpent.toFixed(2)}</span>
            {' '}of ${totalBudget.toFixed(2)} spent
          </p>
        </div>
        <Link href="/scan" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
          <ScanLine className="h-4 w-4" strokeWidth={2.5} />
          Scan Receipt
        </Link>
      </div>

      {/* Budget cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoriesWithSpending.map(cat => (
          <BudgetCard key={cat.id} category={cat} />
        ))}
      </div>

      {/* Donut breakdown */}
      {categoriesWithSpending.some(c => c.spent > 0) && (
        <div className="space-y-3">
          <SectionTitle>{format(selectedDate, 'MMMM yyyy')} Breakdown</SectionTitle>
          <Card>
            <CardContent className="py-4">
              <SpendingChart categories={categoriesWithSpending} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* History chart */}
      <div className="space-y-3">
        <SectionTitle>Spending History</SectionTitle>
        <Card>
          <CardContent className="py-4">
            <SpendingHistoryChart data={historyChartData} categories={historyCategories} />
          </CardContent>
        </Card>
      </div>

      {/* Recent receipts */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <SectionTitle>Recent Receipts</SectionTitle>
          <Link href="/receipts" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            View all
          </Link>
        </div>
        <Card>
          <CardContent className="py-0">
            {!recentReceipts?.length ? (
              <div className="py-10 text-center space-y-3">
                <Receipt className="h-8 w-8 mx-auto text-muted-foreground/40" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">No receipts scanned yet.</p>
                <Link href="/scan" className={buttonVariants({ size: 'sm' })}>
                  Scan your first receipt
                </Link>
              </div>
            ) : (
              <div>
                {recentReceipts.map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      'flex items-center justify-between py-3.5 px-0',
                      i > 0 && 'border-t-2 border-border/15'
                    )}
                  >
                    <div>
                      <p className="font-heading font-semibold text-sm">{r.store_name || 'Unknown store'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(r.receipt_date + 'T00:00:00'), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <p className="font-heading font-bold text-base">${Number(r.total_amount ?? 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
