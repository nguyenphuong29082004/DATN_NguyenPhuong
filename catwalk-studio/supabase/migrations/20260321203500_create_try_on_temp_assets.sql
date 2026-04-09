CREATE TABLE IF NOT EXISTS public.try_on_temp_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.models(model_id) ON DELETE CASCADE,
  prepared_image_url TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'replicate',
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('preparing', 'ready', 'failed')),
  source_signature TEXT NOT NULL,
  prediction_id TEXT,
  error_message TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_checked_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, model_id)
);

CREATE INDEX IF NOT EXISTS idx_try_on_temp_assets_expires_at
  ON public.try_on_temp_assets (expires_at);

CREATE INDEX IF NOT EXISTS idx_try_on_temp_assets_user_model
  ON public.try_on_temp_assets (user_id, model_id);
