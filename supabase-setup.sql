-- ============================================================
-- AI Receipt Budget Tracker — Supabase Setup
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Budget categories
CREATE TABLE IF NOT EXISTS budget_categories (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  monthly_limit DECIMAL(10,2) NOT NULL DEFAULT 0,
  color         TEXT NOT NULL DEFAULT '#6366f1',
  icon          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_name    TEXT,
  receipt_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount  DECIMAL(10,2),
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Receipt line items
CREATE TABLE IF NOT EXISTS receipt_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id  UUID REFERENCES receipts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

-- Budget categories RLS
CREATE POLICY "Users can manage their own categories"
  ON budget_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Receipts RLS
CREATE POLICY "Users can manage their own receipts"
  ON receipts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Receipt items RLS
CREATE POLICY "Users can manage their own receipt items"
  ON receipt_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Storage bucket (run in SQL or create via Dashboard)
-- Dashboard → Storage → New bucket → name: "receipts", Public: OFF
-- ============================================================

-- If using SQL for storage:
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own folder
CREATE POLICY "Users can upload their own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_budget_categories_user ON budget_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_date ON receipts(user_id, receipt_date);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_user_category ON receipt_items(user_id, category_id);
