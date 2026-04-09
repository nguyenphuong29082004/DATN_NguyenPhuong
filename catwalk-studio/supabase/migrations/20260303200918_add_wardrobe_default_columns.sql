-- Add columns to wardrobe table to support default/platform items
-- Similar to prompts table structure

ALTER TABLE public.wardrobe 
    ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'user_saved' 
        CHECK (item_type IN ('user_saved', 'platform_default')),
    ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_wardrobe_user ON public.wardrobe(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_type ON public.wardrobe(item_type);
CREATE INDEX IF NOT EXISTS idx_wardrobe_public ON public.wardrobe(is_public) WHERE is_public = true;
