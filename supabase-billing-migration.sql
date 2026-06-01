-- ============================================================
-- Budget Papertrail — Billing Migration
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  scans_used                INTEGER NOT NULL DEFAULT 0,
  is_admin          BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id        TEXT UNIQUE,
  stripe_subscription_id    TEXT UNIQUE,
  subscription_status       TEXT NOT NULL DEFAULT 'free',
  -- possible values: 'free' | 'active' | 'past_due' | 'cancelled'
  subscription_period_end   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS policy: users can only read their own profile
--    (all writes go through the service role key in API routes)
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, is_admin)
  VALUES (NEW.id, FALSE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill: create profiles for all existing users (non-admin by default)
INSERT INTO public.user_profiles (user_id, is_admin)
SELECT id, FALSE FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
