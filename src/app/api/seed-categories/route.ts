import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only seed if user has no categories yet
    const { count } = await supabase
      .from('budget_categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (count && count > 0) {
      return NextResponse.json({ message: 'Already seeded' })
    }

    const { error } = await supabase.from('budget_categories').insert(
      DEFAULT_CATEGORIES.map(cat => ({ ...cat, user_id: user.id }))
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Seeded successfully' })
  } catch (err) {
    console.error('Seed error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
