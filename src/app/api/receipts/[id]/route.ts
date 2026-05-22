import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ScannedItem } from '@/types/database'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // RLS double-check

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete receipt error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { store_name, receipt_date, items } = body as {
      store_name: string
      receipt_date: string
      items: ScannedItem[]
    }

    const includedItems = items.filter(i => i.included)
    const total = Math.round(includedItems.reduce((s, i) => s + i.price, 0) * 100) / 100

    // Update the receipt header
    const { error: receiptError } = await supabase
      .from('receipts')
      .update({ store_name: store_name || null, receipt_date, total_amount: total })
      .eq('id', id)
      .eq('user_id', user.id)

    if (receiptError) return NextResponse.json({ error: receiptError.message }, { status: 500 })

    // Replace all items: delete old, insert new
    await supabase.from('receipt_items').delete().eq('receipt_id', id)

    if (includedItems.length > 0) {
      const { error: itemsError } = await supabase.from('receipt_items').insert(
        includedItems.map(item => ({
          receipt_id: id,
          user_id: user.id,
          name: item.name,
          price: item.price,
          category_id: item.category_id ?? null,
        }))
      )
      if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update receipt error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
