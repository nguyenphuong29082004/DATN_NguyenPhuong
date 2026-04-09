-- Migration: Rollback `models` tracking fields and create `ai_models` and `generations` tables

-- 1. Rollback previous additions to `models`
ALTER TABLE public.models
DROP COLUMN IF EXISTS generation_status,
DROP COLUMN IF EXISTS replicate_job_id,
DROP COLUMN IF EXISTS generation_started_at,
DROP COLUMN IF EXISTS generation_error,
DROP COLUMN IF EXISTS prompt,
DROP COLUMN IF EXISTS parameters_json;

-- Note: We keep `created_by_user_id` as it was originally present and useful for real models as well.

-- 2. Create `ai_models` table
CREATE TABLE IF NOT EXISTS public.ai_models (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE,
    name text,
    parameters_json jsonb DEFAULT '{}'::jsonb,
    preview_images text[] DEFAULT ARRAY[]::text[],
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 3. Create `generations` table
CREATE TABLE IF NOT EXISTS public.generations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE,
    campaign_id uuid REFERENCES public.campaigns(campaign_id) ON DELETE SET NULL,
    model_id uuid REFERENCES public.models(model_id) ON DELETE SET NULL,
    ai_model_id uuid REFERENCES public.ai_models(id) ON DELETE CASCADE,
    prompt_id uuid REFERENCES public.prompts(prompt_id) ON DELETE SET NULL,
    prompt_text text,
    parameters_json jsonb DEFAULT '{}'::jsonb,
    output_url text,
    output_type text,
    credits_used integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    
    -- Webhook / Processing Tracking fields
    status text NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed', 'timeout', 'canceled')),
    replicate_job_id text,
    error_message text
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_models_user_id ON public.ai_models(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_ai_model_id ON public.generations(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_generations_replicate_job_id ON public.generations(replicate_job_id) WHERE replicate_job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_generations_status ON public.generations(status) WHERE status = 'processing';
