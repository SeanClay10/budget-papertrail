# AI Receipt Budget Tracker

Scan store receipts with your phone camera, let Claude Vision AI categorize every line item, and track spending against your monthly budgets — all in a mobile-first web app.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** — Auth, PostgreSQL, Storage
- **Claude Vision API** (`claude-sonnet-4-6`) — Receipt OCR + categorization
- **shadcn/ui v4** + Tailwind CSS
- **Recharts** — Budget charts

---

## Setup (do this before running)

### 1. Supabase Project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `supabase-setup.sql` → **Run**
3. Go to **Storage** → confirm the `receipts` bucket was created (private). If not, create it manually.
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Anthropic API Key

Get a key at [console.anthropic.com](https://console.anthropic.com) → `ANTHROPIC_API_KEY`

### 3. Fill `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/login`.

---

## Usage

1. **Sign up** → default budget categories seeded automatically
2. **Settings** → adjust monthly limits or add custom categories
3. **Scan** → take a photo of a receipt (or upload from gallery on desktop)
4. **Review** → edit any mis-read items or wrong categories → **Save to Budget**
5. **Dashboard** → spending per category with progress bars + donut chart

### Mobile
Open in phone browser → tap **Scan** → native camera opens. Install as a home screen app via browser menu → "Add to Home Screen".

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login, signup      — auth pages (Supabase Auth)
│   ├── (app)/dashboard           — budget overview (server component)
│   ├── (app)/scan                — camera → review → save flow
│   ├── (app)/receipts            — receipt history
│   ├── (app)/settings            — manage categories
│   └── api/scan, receipts, seed-categories
├── components/
│   ├── receipt-scanner.tsx       — camera / file upload / drag-drop
│   ├── item-review-table.tsx     — editable parsed items with category dropdowns
│   ├── budget-card.tsx           — progress bar card per category
│   ├── spending-chart.tsx        — Recharts donut chart
│   ├── category-form.tsx         — create/edit category dialog
│   └── nav.tsx                   — bottom nav (mobile) + sidebar (desktop)
└── lib/supabase/, lib/anthropic.ts
```

## Supabase Tables

| Table | Purpose |
|---|---|
| `budget_categories` | User's categories with monthly limits |
| `receipts` | One row per scanned receipt |
| `receipt_items` | Line items linked to receipts + categories |
