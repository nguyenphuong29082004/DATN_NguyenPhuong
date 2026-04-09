-- Migration: Add credit_transactions table for auditing
-- This table was missing from the original schema but required by SRS.

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Negative for deduction, positive for refund/top-up
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deduction', 'refund', 'purchase', 'bonus')),
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for searching user history
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
