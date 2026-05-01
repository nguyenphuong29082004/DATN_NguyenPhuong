-- Migration: Fix credit_transactions schema
-- Add missing balance_before and balance_after columns
-- Drop NOT NULL constraint on transaction_type since RPCs do not insert it

ALTER TABLE public.credit_transactions
ADD COLUMN IF NOT EXISTS balance_before INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_after INTEGER DEFAULT 0;

ALTER TABLE public.credit_transactions
ALTER COLUMN transaction_type DROP NOT NULL;
