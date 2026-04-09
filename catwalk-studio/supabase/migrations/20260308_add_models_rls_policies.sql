-- Migration: Enable RLS on models table and add security policies
-- Fixes critical security gap: any authenticated user could read/write all model records

-- 1. Enable Row Level Security
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- 2. Public read: anyone can read active models (needed for /models page and /{username} profile)
CREATE POLICY "Anyone can read active models"
    ON public.models FOR SELECT
    USING (status = 'active');

-- 3. Owner can read their own models regardless of status (for dashboard / in_review)
CREATE POLICY "Owners can read own models"
    ON public.models FOR SELECT
    USING (created_by_user_id = auth.uid());

-- 4. Authenticated non-guest users can create models linked to themselves
CREATE POLICY "Authenticated users can create own models"
    ON public.models FOR INSERT
    WITH CHECK (
        created_by_user_id = auth.uid()
        AND auth.uid() IS NOT NULL
    );

-- 5. Owners can update their own models
CREATE POLICY "Owners can update own models"
    ON public.models FOR UPDATE
    USING (created_by_user_id = auth.uid())
    WITH CHECK (created_by_user_id = auth.uid());

-- 6. Owners can delete (soft-delete) their own models
CREATE POLICY "Owners can delete own models"
    ON public.models FOR DELETE
    USING (created_by_user_id = auth.uid());
