-- Migration: Add fields to `models` table to support async AI generation via Replicate

ALTER TABLE public.models
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES public.users(user_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS generation_status text NOT NULL DEFAULT 'completed' CHECK (generation_status IN ('processing', 'completed', 'failed', 'timeout')),
ADD COLUMN IF NOT EXISTS replicate_job_id text,
ADD COLUMN IF NOT EXISTS generation_started_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS generation_error text,
ADD COLUMN IF NOT EXISTS prompt text,
ADD COLUMN IF NOT EXISTS parameters_json jsonb DEFAULT '{}'::jsonb;

-- Create indexes for efficient fetching and polling
CREATE INDEX IF NOT EXISTS idx_models_created_by ON public.models(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_models_generation_status ON public.models(generation_status) WHERE generation_status = 'processing';
CREATE INDEX IF NOT EXISTS idx_models_replicate_job ON public.models(replicate_job_id) WHERE replicate_job_id IS NOT NULL;
