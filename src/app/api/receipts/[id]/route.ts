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

    // Fetch image_url before deleting so we can clean up storage
    const { data: receipt } = await supabase
      .from('receipts')
      .select('image_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    // Delete the DB row (cascades to receipt_items)
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Delete the photo from Storage if one was uploaded
    if (receipt?.image_url) {
      // URL format: .../storage/v1/object/public/receipts/{user_id}/{filename}
      const match = receipt.image_url.match(/\/storage\/v1\/object\/public\/receipts\/(.+)/)
      if (match?.[1]) {
        await supabase.storage.from('receipts').remove([match[1]])
      }
    }

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
