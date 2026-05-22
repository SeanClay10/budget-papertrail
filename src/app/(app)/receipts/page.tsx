export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Receipt, ScanLine } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { ReceiptActions } from '@/components/receipt-actions'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default async function ReceiptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: receipts } = await supabase
    .from('receipts')
    .select(`
      *,
      receipt_items(
        *,
        budget_categories(name, color, icon)
      )
    `)
    .eq('user_id', user!.id)
    .order('receipt_date', { ascending: false })

  type ItemRow = {
    id: string
    name: string
    price: number
    category_id: string | null
    budget_categories: { name: string; color: string; icon: string } | null
  }

  type ReceiptRow = NonNullable<typeof receipts>[number] & {
    receipt_items: ItemRow[]
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Receipts</h1>
        <Link href="/scan" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
          <ScanLine className="h-4 w-4" />
          Scan New
        </Link>
      </div>

      {!receipts?.length ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <Receipt className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No receipts yet.</p>
            <Link href="/scan" className={buttonVariants({ size: 'sm' })}>
              Scan your first receipt
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(receipts as ReceiptRow[]).map(receipt => {
            const items = receipt.receipt_items ?? []
            return (
              <Card key={receipt.id}>
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">{receipt.store_name || 'Unknown store'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(receipt.receipt_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-semibold text-sm">${Number(receipt.total_amount ?? 0).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{items.length} items</p>
                      </div>
                      <ReceiptActions
                        receipt={{
                          id: receipt.id,
                          store_name: receipt.store_name,
                          receipt_date: receipt.receipt_date,
                          items: items.map(i => ({
                            id: i.id,
                            name: i.name,
                            price: Number(i.price),
                            category_id: i.category_id,
                          })),
                        }}
                      />
                    </div>
                  </div>

                  {/* Line items */}
                  {items.length > 0 && (
                    <div className="space-y-1.5 border-t pt-3">
                      {items.map((item: ItemRow) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-muted-foreground truncate">{item.name}</span>
                            {item.budget_categories && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 shrink-0"
                                style={{
                                  backgroundColor: item.budget_categories.color + '22',
                                  color: item.budget_categories.color,
                                }}
                              >
                                {item.budget_categories.icon} {item.budget_categories.name}
                              </Badge>
                            )}
                          </div>
                          <span className="font-medium ml-2 shrink-0">${Number(item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
