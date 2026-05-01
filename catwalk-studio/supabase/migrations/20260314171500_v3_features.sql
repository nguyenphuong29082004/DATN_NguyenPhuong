-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CATWALK V3: B2B Features
-- This migration adds core B2B elements:
-- 1. Model capabilities/pricing for real shoots vs AI twin
-- 2. Model Booking System
-- 3. Detailed AI generation logging & type
-- 4. User Saved Prompts
-- ========================================================

-- 1. UPDATES TO MODELS TABLE
-- Add support for Real, AI, or Both (hybrid) models
CREATE TYPE model_type_enum AS ENUM ('ai', 'real', 'both');

ALTER TABLE models 
  ADD COLUMN IF NOT EXISTS model_type model_type_enum DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS is_elite BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_generation_cost NUMERIC DEFAULT 5, -- cost in credits
  ADD COLUMN IF NOT EXISTS real_booking_cost NUMERIC DEFAULT 1000; -- cost in fiat (e.g. USD)

-- 2. MODEL BOOKINGS TABLE
DROP TABLE IF EXISTS public.model_bookings CASCADE;
CREATE TABLE public.model_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.models(model_id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  details TEXT,
  amount NUMERIC NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on model_bookings
ALTER TABLE public.model_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for model_bookings
CREATE POLICY "Users can view their own bookings"
  ON public.model_bookings FOR SELECT
  USING (auth.uid() = brand_id);

CREATE POLICY "Models can view bookings made to them"
  ON public.model_bookings FOR SELECT
  USING (auth.uid() IN (SELECT created_by_user_id FROM models WHERE models.model_id = model_bookings.model_id));

CREATE POLICY "Users can create bookings"
  ON public.model_bookings FOR INSERT
  WITH CHECK (auth.uid() = brand_id);

-- Update trigger for model_bookings
CREATE TRIGGER update_model_bookings_updated_at
BEFORE UPDATE ON public.model_bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 3. UPDATES TO GENERATIONS TABLE
-- To support video and try-on tracking
CREATE TYPE generation_type_enum AS ENUM ('photo', 'video', 'try-on');

ALTER TABLE generations 
  ADD COLUMN IF NOT EXISTS generation_type generation_type_enum DEFAULT 'photo',
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER, -- tracking generation time for metrics
  ADD COLUMN IF NOT EXISTS api_cost NUMERIC; -- tracking backend cost in fraction of cents

-- 4. USER PROMPTS TABLE
CREATE TABLE IF NOT EXISTS public.user_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_prompts
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;

-- Policies for user_prompts
CREATE POLICY "Users can manage their own prompts"
  ON public.user_prompts FOR ALL
  USING (auth.uid() = user_id);

-- Update trigger for user_prompts
CREATE TRIGGER update_user_prompts_updated_at
BEFORE UPDATE ON public.user_prompts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
