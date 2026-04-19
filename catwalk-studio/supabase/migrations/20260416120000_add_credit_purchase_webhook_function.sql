-- Add provider payment id tracking and atomic credit purchase finalization

ALTER TABLE public.credit_transactions
ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_provider_payment_id
ON public.credit_transactions(provider_payment_id)
WHERE provider_payment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.process_credit_purchase_webhook(
    p_user_id UUID,
    p_credits INTEGER,
    p_reason TEXT,
    p_amount_paid NUMERIC(10, 2),
    p_currency VARCHAR(3),
    p_payment_method TEXT,
    p_provider_payment_id TEXT,
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

    IF p_credits <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Credits must be positive');
    END IF;

    IF p_provider_payment_id IS NULL OR btrim(p_provider_payment_id) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Provider payment ID is required');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.credit_transactions
        WHERE provider_payment_id = p_provider_payment_id
    ) THEN
        RETURN jsonb_build_object('success', true, 'already_processed', true);
    END IF;

    SELECT credits_balance INTO v_current_balance
    FROM public.users
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    v_new_balance := v_current_balance + p_credits;

    UPDATE public.users
    SET credits_balance = v_new_balance,
        updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        balance_before,
        balance_after,
        reason,
        metadata,
        amount_paid,
        currency,
        payment_method,
        provider_payment_id
    ) VALUES (
        p_user_id,
        p_credits,
        v_current_balance,
        v_new_balance,
        p_reason,
        COALESCE(p_metadata, '{}'::jsonb),
        p_amount_paid,
        COALESCE(p_currency, 'USD'),
        p_payment_method,
        p_provider_payment_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'already_processed', false,
        'new_balance', v_new_balance
    );
END;
$$;
