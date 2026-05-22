# Budget Papertrail

A mobile-first budgeting app that uses AI to scan and categorize store receipts. Photograph a receipt, review the AI-parsed line items, assign categories, and watch your monthly budget update in real time.

**Live:** https://budget-papertrail.vercel.app

---

## Features

- 📸 **Scan receipts** — take a photo directly from your phone or upload from your desktop
- 🤖 **AI categorization** — Claude Vision reads each line item and suggests a budget category
- ✏️ **Review before saving** — edit item names, prices, and categories before anything hits your budget
- 📊 **Monthly dashboard** — progress bars per category, donut chart breakdown, navigate between months
- 🗂️ **Receipt history** — view, edit, or delete past receipts with full line-item detail
- ⚙️ **Custom categories** — create your own categories with custom icons, colors, and monthly limits
- 🌙 **Dark mode** — follows your system preference, toggleable manually
- 📱 **PWA** — installable to your phone home screen

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS + shadcn/ui v4 |
| Database + Auth | Supabase |
| File Storage | Supabase Storage |
| Receipt OCR | Claude Vision API (`claude-sonnet-4-6`) |
| Charts | Recharts |
| Hosting | Vercel |

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/SeanClay10/budget-papertrail.git
cd budget-papertrail
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase-setup.sql` in the Supabase SQL Editor
3. Go to **Authentication → Providers → Email** → enable the Email provider, disable Sign Ups
4. Go to **Authentication → URL Configuration** → add `http://localhost:3000/auth/callback` to Redirect URLs

### 3. Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

Hosted on Vercel. Every push to `master` triggers an automatic redeployment.

To deploy your own instance:
1. Import the repo into [Vercel](https://vercel.com)
2. Add the four environment variables in the Vercel dashboard
3. Add your Vercel URL to Supabase's redirect allowlist: `https://your-app.vercel.app/auth/callback`

---

## Access

Sign up is disabled — accounts are created manually via the Supabase dashboard under **Authentication → Users → Add User**.

---

## Database Schema

| Table | Purpose |
|---|---|
| `budget_categories` | User-defined categories with monthly limits |
| `receipts` | One row per scanned receipt |
| `receipt_items` | Line items linked to receipts and categories |

All tables have Row Level Security enabled — users can only access their own data.
