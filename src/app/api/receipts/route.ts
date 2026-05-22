import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ScannedItem } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { store_name, receipt_date, image_url, items } = body as {
      store_name: string
      receipt_date: string
      image_url: string
      items: ScannedItem[]
    }

    const includedItems = items.filter(i => i.included)
    const total = includedItems.reduce((sum, i) => sum + i.price, 0)

    // Insert receipt header
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        store_name: store_name || null,
        receipt_date,
        total_amount: Math.round(total * 100) / 100,
        image_url: image_url || null,
      })
      .select()
      .single()

    if (receiptError || !receipt) {
      return NextResponse.json({ error: 'Failed to save receipt' }, { status: 500 })
    }

    // Bulk insert line items
    if (includedItems.length > 0) {
      const { error: itemsError } = await supabase.from('receipt_items').insert(
        includedItems.map(item => ({
          receipt_id: receipt.id,
          user_id: user.id,
          name: item.name,
          price: item.price,
          category_id: item.category_id || null,
        }))
      )
      if (itemsError) {
        return NextResponse.json({ error: 'Failed to save items' }, { status: 500 })
      }
    }

    return NextResponse.json({ receipt_id: receipt.id })
  } catch (err) {
    console.error('Save receipt error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('receipts')
      .select(`*, receipt_items(*, budget_categories(*))`)
      .eq('user_id', user.id)
      .order('receipt_date', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('Get receipts error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
