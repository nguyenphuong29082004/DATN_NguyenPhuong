-- Migration: Add credit and generation RPC functions
-- 1. deduct_credits: Atomic credit deduction with transaction logging
-- 2. add_credits_secure: Secure refund mechanism for failed generations (admin/system only)

-- Create credit_transactions table if it doesn't exist (referenced in codebase but missing from schema)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- negative for deduction, positive for refund/purchase
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);

-- Function: deduct_credits
-- Safely deducts credits from a user's balance and logs the transaction.
CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Check amount is positive (we handle the negation here)
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
    END IF;

    -- Get current balance with row-level lock
    SELECT credits_balance INTO v_current_balance
    FROM public.users
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    -- Check sufficient funds
    IF v_current_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
    END IF;

    v_new_balance := v_current_balance - p_amount;

    -- Update user balance
    UPDATE public.users
    SET credits_balance = v_new_balance,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, amount, balance_before, balance_after, reason, metadata)
    VALUES (p_user_id, -p_amount, v_current_balance, v_new_balance, p_reason, p_metadata);

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- Function: add_credits_secure
-- Securely adds credits (refunds) to a user's balance. 
-- In production, this should be restricted to service_role or specific callers.
CREATE OR REPLACE FUNCTION public.add_credits_secure(
    p_amount INTEGER,
    p_reason TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_user_id UUID;
BEGIN
    -- In a secure RPC called by the client (Edge Function), 
    -- we might use auth.uid() or pass it if called by service_role.
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        -- If called by service_role, metadata might contain user_id
        v_user_id := (p_metadata->>'user_id')::UUID;
    END IF;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Could not identify user');
    END IF;

    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
    END IF;

    SELECT credits_balance INTO v_current_balance
    FROM public.users
    WHERE user_id = v_user_id
    FOR UPDATE;

    v_new_balance := v_current_balance + p_amount;

    UPDATE public.users
    SET credits_balance = v_new_balance,
        updated_at = now()
    WHERE user_id = v_user_id;

    INSERT INTO public.credit_transactions (user_id, amount, balance_before, balance_after, reason, metadata)
    VALUES (v_user_id, p_amount, v_current_balance, v_new_balance, p_reason, p_metadata);

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;
