CREATE TABLE IF NOT EXISTS public.credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    usd_amount NUMERIC(10, 2) NOT NULL CHECK (usd_amount > 0),
    credits_amount INTEGER NOT NULL CHECK (credits_amount > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_packages_is_active
ON public.credit_packages(is_active, sort_order);

INSERT INTO public.credit_packages (package_id, name, usd_amount, credits_amount, is_active, sort_order)
VALUES
    ('10-usd', 'Starter', 10.00, 100, true, 10),
    ('30-usd', 'Growth', 30.00, 300, true, 20),
    ('50-usd', 'Scale', 50.00, 1000, true, 30)
ON CONFLICT (package_id) DO UPDATE
SET
    name = EXCLUDED.name,
    usd_amount = EXCLUDED.usd_amount,
    credits_amount = EXCLUDED.credits_amount,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();