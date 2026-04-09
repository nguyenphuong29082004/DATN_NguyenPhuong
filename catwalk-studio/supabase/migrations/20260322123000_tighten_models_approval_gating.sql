-- Migration: tighten models approval gating
--
-- Up:
-- - Recreate public.models RLS policies with the existing intended semantics:
--   * public can read active models
--   * owners can read their own models
--   * owners can insert/update/delete only their own rows
-- - Add a write-side trigger that prevents non-privileged direct writes from self-approving
--   or self-moderating model rows.
--
-- Down / rollback guidance:
-- 1. DROP TRIGGER IF EXISTS trg_guard_models_approval_fields ON public.models;
-- 2. DROP FUNCTION IF EXISTS public.guard_models_approval_fields();
-- 3. DROP the recreated policies below.
-- 4. Recreate the previous policy layout from 20260308_add_models_rls_policies.sql:
--      CREATE POLICY "Anyone can read active models"
--          ON public.models FOR SELECT
--          USING (status = 'active');
--
--      CREATE POLICY "Owners can read own models"
--          ON public.models FOR SELECT
--          USING (created_by_user_id = auth.uid());
--
--      CREATE POLICY "Authenticated users can create own models"
--          ON public.models FOR INSERT
--          WITH CHECK (
--              created_by_user_id = auth.uid()
--              AND auth.uid() IS NOT NULL
--          );
--
--      CREATE POLICY "Owners can update own models"
--          ON public.models FOR UPDATE
--          USING (created_by_user_id = auth.uid())
--          WITH CHECK (created_by_user_id = auth.uid());
--
--      CREATE POLICY "Owners can delete own models"
--          ON public.models FOR DELETE
--          USING (created_by_user_id = auth.uid());

ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active models" ON public.models;
DROP POLICY IF EXISTS "Owners can read own models" ON public.models;
DROP POLICY IF EXISTS "Authenticated users can create own models" ON public.models;
DROP POLICY IF EXISTS "Owners can update own models" ON public.models;
DROP POLICY IF EXISTS "Owners can delete own models" ON public.models;

CREATE POLICY "Anyone can read active models"
    ON public.models FOR SELECT
    USING (status = 'active');

CREATE POLICY "Owners can read own models"
    ON public.models FOR SELECT
    USING (created_by_user_id = auth.uid());

CREATE POLICY "Authenticated users can create own models"
    ON public.models FOR INSERT
    WITH CHECK (
        created_by_user_id = auth.uid()
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Owners can update own models"
    ON public.models FOR UPDATE
    USING (created_by_user_id = auth.uid())
    WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Owners can delete own models"
    ON public.models FOR DELETE
    USING (created_by_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.guard_models_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    new_row jsonb := to_jsonb(NEW);
    old_row jsonb := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
BEGIN
    IF auth.uid() IS NULL OR auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    IF new_row ? 'status' THEN
        IF TG_OP = 'INSERT' THEN
            IF COALESCE(new_row ->> 'status', 'in_review') <> 'in_review' THEN
                RAISE EXCEPTION 'Only privileged writes may set models.status';
            END IF;
        ELSIF (new_row ->> 'status') IS DISTINCT FROM (old_row ->> 'status') THEN
            RAISE EXCEPTION 'Only privileged writes may change models.status';
        END IF;
    END IF;

    IF new_row ? 'is_flagged' THEN
        IF TG_OP = 'INSERT' THEN
            IF COALESCE(new_row ->> 'is_flagged', 'false') <> 'false' THEN
                RAISE EXCEPTION 'Only privileged writes may set models.is_flagged';
            END IF;
        ELSIF (new_row ->> 'is_flagged') IS DISTINCT FROM (old_row ->> 'is_flagged') THEN
            RAISE EXCEPTION 'Only privileged writes may change models.is_flagged';
        END IF;
    END IF;

    IF new_row ? 'elite' THEN
        IF TG_OP = 'INSERT' THEN
            IF COALESCE(new_row ->> 'elite', 'false') <> 'false' THEN
                RAISE EXCEPTION 'Only privileged writes may set models.elite';
            END IF;
        ELSIF (new_row ->> 'elite') IS DISTINCT FROM (old_row ->> 'elite') THEN
            RAISE EXCEPTION 'Only privileged writes may change models.elite';
        END IF;
    END IF;

    IF new_row ? 'elite_exp_date' THEN
        IF TG_OP = 'INSERT' THEN
            IF new_row ->> 'elite_exp_date' IS NOT NULL THEN
                RAISE EXCEPTION 'Only privileged writes may set models.elite_exp_date';
            END IF;
        ELSIF (new_row ->> 'elite_exp_date') IS DISTINCT FROM (old_row ->> 'elite_exp_date') THEN
            RAISE EXCEPTION 'Only privileged writes may change models.elite_exp_date';
        END IF;
    END IF;

    IF new_row ? 'is_elite' THEN
        IF TG_OP = 'INSERT' THEN
            IF COALESCE(new_row ->> 'is_elite', 'false') <> 'false' THEN
                RAISE EXCEPTION 'Only privileged writes may set models.is_elite';
            END IF;
        ELSIF (new_row ->> 'is_elite') IS DISTINCT FROM (old_row ->> 'is_elite') THEN
            RAISE EXCEPTION 'Only privileged writes may change models.is_elite';
        END IF;
    END IF;

    IF new_row ? 'is_elite_exp_date' THEN
        IF TG_OP = 'INSERT' THEN
            IF new_row ->> 'is_elite_exp_date' IS NOT NULL THEN
                RAISE EXCEPTION 'Only privileged writes may set models.is_elite_exp_date';
            END IF;
        ELSIF (new_row ->> 'is_elite_exp_date') IS DISTINCT FROM (old_row ->> 'is_elite_exp_date') THEN
            RAISE EXCEPTION 'Only privileged writes may change models.is_elite_exp_date';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_models_approval_fields ON public.models;

CREATE TRIGGER trg_guard_models_approval_fields
BEFORE INSERT OR UPDATE ON public.models
FOR EACH ROW
EXECUTE FUNCTION public.guard_models_approval_fields();
