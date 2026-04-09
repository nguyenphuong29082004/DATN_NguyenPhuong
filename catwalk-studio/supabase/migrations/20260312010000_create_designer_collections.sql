-- Migration: Create designer_collections table
-- Stores user-curated collections of wardrobe items

CREATE TABLE IF NOT EXISTS public.designer_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    item_ids UUID[] DEFAULT '{}',
    likes INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_designer_collections_user_id ON public.designer_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_designer_collections_is_public ON public.designer_collections(is_public);

-- RLS
ALTER TABLE public.designer_collections ENABLE ROW LEVEL SECURITY;

-- Users can read their own collections
CREATE POLICY "designer_collections_select_own"
    ON public.designer_collections FOR SELECT
    USING (auth.uid() = user_id);

-- Users can read public collections
CREATE POLICY "designer_collections_select_public"
    ON public.designer_collections FOR SELECT
    USING (is_public = true);

-- Users can insert their own collections
CREATE POLICY "designer_collections_insert_own"
    ON public.designer_collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own collections
CREATE POLICY "designer_collections_update_own"
    ON public.designer_collections FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own collections
CREATE POLICY "designer_collections_delete_own"
    ON public.designer_collections FOR DELETE
    USING (auth.uid() = user_id);
