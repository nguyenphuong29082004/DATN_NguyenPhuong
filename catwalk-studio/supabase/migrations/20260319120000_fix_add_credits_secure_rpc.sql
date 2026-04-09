-- Migration: Fix add_credits_secure RPC function
-- Issue: When called from Edge Functions using service_role key, auth.uid() returns NULL.
-- The function previously relied on auth.uid() or metadata fallback which was fragile.
-- Fix: Add explicit p_user_id parameter (matching deduct_credits signature).

-- Drop the old function signature first (3 params without p_user_id)
DROP FUNCTION IF EXISTS public.add_credits_secure(integer, text, jsonb);

-- Drop if existing 4-param version exists too
DROP FUNCTION IF EXISTS public.add_credits_secure(uuid, integer, text, jsonb);

-- Recreate with explicit p_user_id parameter
CREATE OR REPLACE FUNCTION public.add_credits_secure(
    p_user_id UUID,
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
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
    END IF;

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

    v_new_balance := v_current_balance + p_amount;

    -- Update user balance
    UPDATE public.users
    SET credits_balance = v_new_balance,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, amount, balance_before, balance_after, reason, metadata)
    VALUES (p_user_id, p_amount, v_current_balance, v_new_balance, p_reason, p_metadata);

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- DOWN migration (rollback to original)
-- DROP FUNCTION IF EXISTS public.add_credits_secure(uuid, integer, text, jsonb);
-- CREATE OR REPLACE FUNCTION public.add_credits_secure(
--     p_amount INTEGER,
--     p_reason TEXT,
--     p_metadata JSONB DEFAULT '{}'
-- )
-- RETURNS JSONB
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- DECLARE
--     v_current_balance INTEGER;
--     v_new_balance INTEGER;
--     v_user_id UUID;
-- BEGIN
--     v_user_id := auth.uid();
--     IF v_user_id IS NULL THEN
--         v_user_id := (p_metadata->>'user_id')::UUID;
--     END IF;
--     IF v_user_id IS NULL THEN
--         RETURN jsonb_build_object('success', false, 'error', 'Could not identify user');
--     END IF;
--     IF p_amount <= 0 THEN
--         RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
--     END IF;
--     SELECT credits_balance INTO v_current_balance
--     FROM public.users WHERE user_id = v_user_id FOR UPDATE;
--     v_new_balance := v_current_balance + p_amount;
--     UPDATE public.users SET credits_balance = v_new_balance, updated_at = now() WHERE user_id = v_user_id;
--     INSERT INTO public.credit_transactions (user_id, amount, balance_before, balance_after, reason, metadata)
--     VALUES (v_user_id, p_amount, v_current_balance, v_new_balance, p_reason, p_metadata);
--     RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
-- END;
-- $$;
