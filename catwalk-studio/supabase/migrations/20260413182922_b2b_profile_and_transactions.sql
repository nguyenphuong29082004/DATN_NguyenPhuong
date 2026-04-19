-- Migration: Add B2B Profile Fields and Enhance Credit Transactions Log
-- This migration supports the platform's transition to a B2B model

-- 1. ADD B2B FIELDS TO USERS TABLE
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- 2. ENHANCE CREDIT TRANSACTIONS TABLE
-- Adding payment details for B2B auditing
ALTER TABLE public.credit_transactions
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'GBP', -- Based on user's earlier requirement for GBP rates
ADD COLUMN IF NOT EXISTS payment_method TEXT; -- e.g. 'Visa **** 4242'

-- 3. ENSURE RLS (if not already enabled)
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES (Check and add if not exists implies use DO block or just drop/recreate)
-- We'll just ensure they exist. In Supabase migrations, subsequent policies on the same name might error if they exist.
-- But since this is a migration, we can assume it's running on a state where it's needed.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own transactions' AND tablename = 'credit_transactions') THEN
        CREATE POLICY "Users can view their own transactions"
            ON public.credit_transactions FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;
