export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { BudgetCard } from '@/components/budget-card'
import { SpendingChart } from '@/components/spending-chart'
import { MonthPicker } from '@/components/month-picker'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ScanLine, Receipt } from 'lucide-react'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
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

  // Parse month from URL param (YYYY-MM) or fall back to current month
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

  // Auto-seed default categories on first login (upsert = safe against concurrent calls)
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

  // Step 1: get receipt IDs for the selected month
  const { data: monthReceipts } = await supabase
    .from('receipts')
    .select('id')
    .eq('user_id', user!.id)
    .gte('receipt_date', monthStart)
    .lte('receipt_date', monthEnd)

  const receiptIds = monthReceipts?.map(r => r.id) ?? []

  // Step 2: sum line items for those receipts
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

  // Append a synthetic "Uncategorized" card if any items have no category
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

  const { data: recentReceipts } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user!.id)
    .order('receipt_date', { ascending: false })
    .limit(5)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-0.5">
          <MonthPicker currentMonth={selectedMonthStr} />
          <p className="text-sm text-muted-foreground">
            ${totalSpent.toFixed(2)} of ${totalBudget.toFixed(2)} spent
          </p>
        </div>
        <Link href="/scan" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
          <ScanLine className="h-4 w-4" />
          Scan Receipt
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categoriesWithSpending.map(cat => (
          <BudgetCard key={cat.id} category={cat} />
        ))}
      </div>

      {categoriesWithSpending.some(c => c.spent > 0) && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChart categories={categoriesWithSpending} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Receipts</CardTitle>
          <Link href="/receipts" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {!recentReceipts?.length ? (
            <div className="py-6 text-center space-y-3">
              <Receipt className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No receipts scanned yet.</p>
              <Link href="/scan" className={buttonVariants({ size: 'sm' })}>
                Scan your first receipt
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentReceipts.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{r.store_name || 'Unknown store'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.receipt_date + 'T00:00:00'), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">${Number(r.total_amount ?? 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
