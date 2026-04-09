-- =====================================================
-- CATWALK.AI Database Schema (Source of Truth)
-- Reflects production database as of 2026-03-04
-- =====================================================

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT,
  user_type TEXT CHECK (user_type IS NULL OR user_type IN ('brand', 'model', 'creator', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'banned')),
  business_name TEXT,
  business_details JSONB NOT NULL DEFAULT '{}',
  credits_balance INTEGER NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  is_guest BOOLEAN NOT NULL DEFAULT false,
  device_fingerprint TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

-- =====================================================
-- 2. BRANDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.brands (
  brand_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  website_url TEXT,
  logo_url TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_status ON public.brands(status);

-- =====================================================
-- 3. AI MODEL MAPPER TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.aimodel_mapper (
  ai_model_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  frontend_name TEXT NOT NULL,
  frontend_slug TEXT NOT NULL UNIQUE,
  backend_provider TEXT NOT NULL DEFAULT 'replicate',
  backend_model_name TEXT NOT NULL,
  backend_model_version TEXT,
  parameters JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cost_per_token NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_aimodel_mapper_status ON public.aimodel_mapper(status);

-- =====================================================
-- 4. MODELS TABLE (human & AI fashion models)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.models (
  model_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  profile_url TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'in_review' CHECK (status IN ('in_review', 'active', 'paused', 'deleted')),
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  model_types TEXT[] NOT NULL DEFAULT '{}',
  modelling_type TEXT[] NOT NULL DEFAULT '{}',
  is_ai BOOLEAN NOT NULL DEFAULT false,
  ai_model_id UUID REFERENCES public.aimodel_mapper(ai_model_id),
  profile_image_url TEXT,
  video_url TEXT,
  gallery_image_urls TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  style_tags TEXT[] NOT NULL DEFAULT '{}',
  can_book BOOLEAN NOT NULL DEFAULT false,
  book_url TEXT,
  can_travel BOOLEAN NOT NULL DEFAULT false,
  hourly_rate NUMERIC,
  half_day_rate NUMERIC,
  full_day_rate NUMERIC,
  currency TEXT NOT NULL DEFAULT 'GBP',
  elite BOOLEAN NOT NULL DEFAULT false,
  elite_exp_date DATE,
  price_per_image NUMERIC,
  price_per_video NUMERIC,
  royalty_split_percent NUMERIC CHECK (royalty_split_percent IS NULL OR (royalty_split_percent >= 0 AND royalty_split_percent <= 100)),
  license_terms TEXT,
  usage_rights TEXT,
  monthly_target NUMERIC,
  social_links JSONB NOT NULL DEFAULT '[]',
  locations JSONB NOT NULL DEFAULT '[]',
  training_data JSONB NOT NULL DEFAULT '[]',
  account_type TEXT DEFAULT 'both' CHECK (account_type IN ('ai_only', 'real_only', 'both')),
  content_preferences JSONB NOT NULL DEFAULT '[]',
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_models_status ON public.models(status);
CREATE INDEX IF NOT EXISTS idx_models_is_ai ON public.models(is_ai);
CREATE INDEX IF NOT EXISTS idx_models_is_flagged ON public.models(is_flagged);
CREATE INDEX IF NOT EXISTS idx_models_can_book ON public.models(can_book);
CREATE INDEX IF NOT EXISTS idx_models_ai_model_id ON public.models(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_models_account_type ON public.models(account_type);

-- =====================================================
-- 5. PROMPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prompts (
  prompt_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  style_tags TEXT[] NOT NULL DEFAULT '{}',
  default_parameters JSONB NOT NULL DEFAULT '{}',
  prompt_type TEXT NOT NULL DEFAULT 'user_saved' CHECK (prompt_type IN ('system', 'platform_default', 'user_saved')),
  created_by_user_id UUID REFERENCES public.users(user_id),
  is_public BOOLEAN NOT NULL DEFAULT false,
  usage_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  prompt_category TEXT CHECK (prompt_category IS NULL OR prompt_category IN (
    'fashion_design', 'fashion_model', 'quick_shoot', 'try_on',
    'ugc', 'product', 'campaign', 'brand'
  ))
);

CREATE INDEX IF NOT EXISTS idx_prompts_created_by_user_id ON public.prompts(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_public ON public.prompts(is_public);

-- =====================================================
-- 6. CAMPAIGNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  campaign_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(user_id),
  name TEXT NOT NULL,
  details TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

-- =====================================================
-- 7. WARDROBE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.wardrobe_items (
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

CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id ON public.wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_category ON public.wardrobe_items(category);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_brand ON public.wardrobe_items(brand);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_gender ON public.wardrobe_items(gender);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_is_stock ON public.wardrobe_items(is_stock);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_created_at ON public.wardrobe_items(created_at DESC);

-- =====================================================
-- 8. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  product_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(brand_id),
  brand_name TEXT,
  name TEXT NOT NULL,
  sku TEXT,
  product_url TEXT,
  image_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- =====================================================
-- 9. TASKS TABLE (generation jobs)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  task_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(user_id),
  campaign_id UUID REFERENCES public.campaigns(campaign_id),
  prompt_id UUID REFERENCES public.prompts(prompt_id),
  ai_model_id UUID REFERENCES public.aimodel_mapper(ai_model_id),
  model_ids UUID[] NOT NULL DEFAULT '{}',
  wardrobe_ids UUID[] NOT NULL DEFAULT '{}',
  product_ids UUID[] NOT NULL DEFAULT '{}',
  raw_prompt_text TEXT NOT NULL,
  raw_negative_prompt TEXT,
  generation_parameters JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'canceled')),
  error_message TEXT,
  provider TEXT NOT NULL DEFAULT 'replicate',
  provider_task_id TEXT,
  credits_used INTEGER NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
  tokens_used INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  cost_estimate NUMERIC,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON public.tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_provider_task_id ON public.tasks(provider_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- =====================================================
-- 10. GENERATED CONTENT TABLE (output results)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.generated_content (
  generated_content_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL UNIQUE REFERENCES public.tasks(task_id),
  user_id UUID NOT NULL REFERENCES public.users(user_id),
  campaign_id UUID REFERENCES public.campaigns(campaign_id),
  prompt_id UUID REFERENCES public.prompts(prompt_id),
  ai_model_id UUID REFERENCES public.aimodel_mapper(ai_model_id),
  model_ids UUID[] NOT NULL DEFAULT '{}',
  wardrobe_ids UUID[] NOT NULL DEFAULT '{}',
  product_ids UUID[] NOT NULL DEFAULT '{}',
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  output_urls TEXT[] NOT NULL DEFAULT '{}',
  license_type TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON public.generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_campaign_id ON public.generated_content(campaign_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON public.generated_content(created_at DESC);

-- =====================================================
-- 11. GALLERY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gallery (
  gallery_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generated_content_id UUID NOT NULL REFERENCES public.generated_content(generated_content_id),
  embed_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  type_label TEXT,
  brand_id UUID REFERENCES public.brands(brand_id),
  brand_name TEXT,
  username TEXT,
  title TEXT,
  description TEXT,
  likes BIGINT NOT NULL DEFAULT 0 CHECK (likes >= 0),
  views BIGINT NOT NULL DEFAULT 0 CHECK (views >= 0),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_is_public ON public.gallery(is_public);
CREATE INDEX IF NOT EXISTS idx_gallery_brand_id ON public.gallery(brand_id);
CREATE INDEX IF NOT EXISTS idx_gallery_type_label ON public.gallery(type_label);

-- =====================================================
-- 12. PAYOUTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payouts (
  payout_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generated_content_id UUID NOT NULL REFERENCES public.generated_content(generated_content_id),
  model_id UUID NOT NULL REFERENCES public.models(model_id),
  user_id UUID NOT NULL REFERENCES public.users(user_id),
  currency TEXT NOT NULL DEFAULT 'GBP',
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  model_royalty_amount NUMERIC NOT NULL DEFAULT 0,
  platform_fee_amount NUMERIC NOT NULL DEFAULT 0,
  net_payout NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'void')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_model_id ON public.payouts(model_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON public.payouts(created_at DESC);

-- =====================================================
-- 13. CONFIG TABLE (system configuration)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.config (
  config_key TEXT PRIMARY KEY,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 14. GUEST IP TRACKING TABLE (anti-abuse)
-- Tracks guest account creation by IP to prevent
-- credit farming via new browser profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.guest_ip_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  user_id UUID REFERENCES public.users(user_id),
  credits_granted INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_ip_tracking_ip ON public.guest_ip_tracking(ip_address);
CREATE INDEX IF NOT EXISTS idx_guest_ip_tracking_created_at ON public.guest_ip_tracking(created_at DESC);

-- =====================================================
-- NOTES:
-- - RLS is NOT enabled on any table
-- - get_or_create_guest function includes IP rate-limiting
--   (max 2 guest accounts per IP get 100 credits in 30 days)
-- - No RLS policies defined
-- =====================================================
