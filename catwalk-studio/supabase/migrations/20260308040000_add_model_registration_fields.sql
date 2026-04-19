-- Migration: Add fields to support SRS-compliant model registration flow
-- Adds account_type, content_preferences, and location columns to models table

ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'both'
    CHECK (account_type IN ('ai_only', 'real_only', 'both')),
  ADD COLUMN IF NOT EXISTS content_preferences JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Index on account_type for filtering
CREATE INDEX IF NOT EXISTS idx_models_account_type ON public.models(account_type);
