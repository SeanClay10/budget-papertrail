export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Receipt, ScanLine } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { ReceiptActions } from '@/components/receipt-actions'
import { ReceiptThumbnail } from '@/components/receipt-thumbnail'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default async function ReceiptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: receipts } = await supabase
    .from('receipts')
    .select('*, receipt_items(*, budget_categories(name, color, icon))')
    .eq('user_id', user!.id)
    .order('receipt_date', { ascending: false })

  type ItemRow = {
    id: string; name: string; price: number; category_id: string | null
    budget_categories: { name: string; color: string; icon: string } | null
  }
  type ReceiptRow = NonNullable<typeof receipts>[number] & { receipt_items: ItemRow[] }

  // Pick the dominant category color (first categorized item)
  function getDominantColor(items: ItemRow[]): string {
    return items.find(i => i.budget_categories?.color)?.budget_categories?.color ?? 'var(--primary)'
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-extrabold text-2xl">Receipts</h1>
        <Link href="/scan" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
          <ScanLine className="h-4 w-4" strokeWidth={2.5} />
          Scan New
        </Link>
      </div>

      {!receipts?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border-2 border-dashed border-border/50 bg-card">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted border-2 border-border">
            <Receipt className="h-7 w-7 text-muted-foreground" strokeWidth={2} />
          </div>
          <div className="text-center">
            <p className="font-heading font-bold text-base">No receipts yet</p>
            <p className="text-sm text-muted-foreground">Scan your first receipt to get started</p>
          </div>
          <Link href="/scan" className={buttonVariants({})}>Scan a Receipt</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(receipts as ReceiptRow[]).map(receipt => {
            const items = receipt.receipt_items ?? []
            const accentColor = getDominantColor(items)
            return (
              <div
                key={receipt.id}
                className="rounded-2xl border-2 border-border bg-card shadow-[5px_5px_0px_0px_var(--border)] overflow-hidden animate-pop-in"
              >
                {/* Colored top stripe */}
                <div className="h-1.5" style={{ backgroundColor: accentColor }} />

                <div className="p-4">
                  {/* Header row: [thumbnail] [store/date ── amount/actions] */}
                  <div className="flex items-start gap-3 mb-3">
                    <ReceiptThumbnail
                      imageUrl={receipt.image_url}
                      storeName={receipt.store_name}
                      receiptDate={receipt.receipt_date}
                    />
                    <div className="flex-1 flex items-start justify-between min-w-0">
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-base truncate">{receipt.store_name || 'Unknown store'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(receipt.receipt_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <div className="text-right">
                          <p className="font-heading font-bold text-lg">${Number(receipt.total_amount ?? 0).toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">{items.length} items</p>
                        </div>
                        <ReceiptActions receipt={{
                          id: receipt.id, store_name: receipt.store_name,
                          receipt_date: receipt.receipt_date,
                          items: items.map(i => ({ id: i.id, name: i.name, price: Number(i.price), category_id: i.category_id })),
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Line items */}
                  {items.length > 0 && (
                    <div className="space-y-1.5 border-t-2 border-border/20 pt-3">
                      {items.map((item: ItemRow) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-muted-foreground truncate">{item.name}</span>
                            {item.budget_categories && (
                              <span
                                className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-bold border"
                                style={{
                                  backgroundColor: item.budget_categories.color + '22',
                                  borderColor: item.budget_categories.color,
                                  color: item.budget_categories.color,
                                }}
                              >
                                {item.budget_categories.icon} {item.budget_categories.name}
                              </span>
                            )}
                          </div>
                          <span className="font-heading font-bold ml-2 shrink-0">${Number(item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
