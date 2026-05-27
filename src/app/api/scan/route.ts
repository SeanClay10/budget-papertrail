import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, RECEIPT_SYSTEM_PROMPT, DEFAULT_CATEGORIES } from '@/lib/anthropic'
import { SCAN_FREE_LIMIT } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Quota check ────────────────────────────────────────────────────────────
    const supabaseAdmin = await createServiceClient()
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('scans_used, is_grandfathered, subscription_status, subscription_period_end')
      .eq('user_id', user.id)
      .single()

    // If the profile row doesn't exist yet (race condition on first ever request),
    // create it now so subsequent logic works correctly.
    if (!profile) {
      await supabaseAdmin
        .from('user_profiles')
        .insert({ user_id: user.id, is_grandfathered: false })
        .select()
        .single()
    }

    const scansUsed = profile?.scans_used ?? 0

    // A cancelled subscription is still valid until the period ends
    const isSubscriptionActive =
      profile?.subscription_status === 'active' ||
      (profile?.subscription_status === 'cancelled' &&
        !!profile.subscription_period_end &&
        new Date(profile.subscription_period_end) > new Date())

    const canScan =
      profile?.is_grandfathered ||
      isSubscriptionActive ||
      scansUsed < SCAN_FREE_LIMIT

    if (!canScan) {
      return NextResponse.json(
        { error: 'scan_limit_reached', scans_used: scansUsed },
        { status: 402 }
      )
    }
    // ── End quota check ────────────────────────────────────────────────────────

    const formData = await request.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    // Read file as buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload image: ' + uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName)

    // Send to Claude Vision with prompt caching
    const base64Image = buffer.toString('base64')
    const mediaType = (file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif') || 'image/jpeg'

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: RECEIPT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Extract all line items from this receipt. Return ONLY valid JSON in this exact format:
{
  "store_name": "Store name or null",
  "receipt_date": "YYYY-MM-DD or today's date",
  "items": [
    { "name": "Item name", "price": 0.00, "suggested_category": "category" }
  ]
}

For suggested_category, choose the best fit from: ${DEFAULT_CATEGORIES.join(', ')}.
Skip tax lines, totals, subtotals, and payment lines — only include purchased items.`,
            },
          ],
        },
      ],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from the response (Claude might add extra text despite instructions)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse receipt — Claude returned no JSON' }, { status: 422 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    // ── Increment scan counter (for non-grandfathered, regardless of subscription) ──
    // We always track scans_used for visibility; the quota gate above handles access.
    const newScansUsed = scansUsed + 1
    if (!profile?.is_grandfathered) {
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          scans_used: newScansUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to increment scan count:', updateError)
      }
    }

    return NextResponse.json({
      image_url: publicUrl,
      store_name: parsed.store_name ?? '',
      receipt_date: parsed.receipt_date ?? new Date().toISOString().slice(0, 10),
      items: (parsed.items ?? []).map((item: { name: string; price: number; suggested_category: string }) => ({
        name: item.name,
        price: Number(item.price),
        suggested_category: item.suggested_category,
        included: true,
        category_id: null,
      })),
      // Return new scan count so client can update without an extra round-trip
      new_scans_used: profile?.is_grandfathered ? null : newScansUsed,
    })
  } catch (err) {
    console.error('Scan error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
