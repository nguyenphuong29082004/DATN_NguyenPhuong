-- =====================================================
-- Migration: Rename wardrobe → wardrobe_items
-- Redesign table with new schema to match wardrobe_items spec
-- =====================================================

-- 1. Drop old wardrobe table and its indexes
DROP INDEX IF EXISTS idx_wardrobe_status;
DROP TABLE IF EXISTS public.wardrobe;

-- 2. Create new wardrobe_items table
CREATE TABLE public.wardrobe_items (
  item_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(user_id),
  title TEXT,
  category TEXT,
  brand TEXT,
  style TEXT,
  colour TEXT,
  keywords TEXT[],
  thumbnail_url TEXT,
  high_res_image_url TEXT,
  buy_url TEXT,
  is_stock BOOLEAN NOT NULL DEFAULT false,
  is_user_uploaded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  image_id TEXT,
  alt_text TEXT,
  colour_hex TEXT,
  description TEXT,
  gender TEXT,
  can_buy BOOLEAN NOT NULL DEFAULT false
);

-- 3. Create indexes
CREATE INDEX idx_wardrobe_items_user_id ON public.wardrobe_items(user_id);
CREATE INDEX idx_wardrobe_items_category ON public.wardrobe_items(category);
CREATE INDEX idx_wardrobe_items_brand ON public.wardrobe_items(brand);
CREATE INDEX idx_wardrobe_items_gender ON public.wardrobe_items(gender);
CREATE INDEX idx_wardrobe_items_is_stock ON public.wardrobe_items(is_stock);
CREATE INDEX idx_wardrobe_items_created_at ON public.wardrobe_items(created_at DESC);
