-- ============================================================
-- Migration: Add generation tracking to ai_models
-- + Create aimodel_credit_mapper table
-- ============================================================

-- 1. Add generation tracking columns to ai_models
ALTER TABLE ai_models
  ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'idle'
    CHECK (generation_status IN ('idle', 'processing', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS replicate_job_id TEXT,
  ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS generation_error TEXT,
  ADD COLUMN IF NOT EXISTS prompt TEXT,
  ADD COLUMN IF NOT EXISTS parameters_json JSONB DEFAULT '{}';

-- 2. Create aimodel_credit_mapper table
-- Maps AI model names to credit costs (SRS: update pricing without code changes)
CREATE TABLE IF NOT EXISTS aimodel_credit_mapper (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_label TEXT NOT NULL,            -- Frontend display name, e.g. "Catwalk.AI Fast Shoot"
  model_name TEXT NOT NULL UNIQUE,      -- Replicate model ID, e.g. "google/imagen-4-fast"
  model_params JSONB DEFAULT '{}',      -- Default params for this model
  model_margin DECIMAL(3,2) DEFAULT 0.30,  -- Margin percentage
  credit_cost INTEGER NOT NULL DEFAULT 15, -- Credits per generation
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Seed initial credit mapper data (from SRS)
INSERT INTO aimodel_credit_mapper (model_label, model_name, model_params, model_margin, credit_cost)
VALUES
  ('Catwalk.AI Fast Shoot', 'google/imagen-4-fast', '{}', 0.30, 10),
  ('Catwalk.AI Ultra HD', 'google/imagen-4-ultra', '{}', 0.30, 20),
  ('Catwalk.AI Model Gen', 'black-forest-labs/flux-dev', '{}', 0.30, 15)
ON CONFLICT (model_name) DO NOTHING;

-- 4. Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_models_generation_status
  ON ai_models (user_id, generation_status)
  WHERE generation_status = 'processing';

-- 5. RLS policies for aimodel_credit_mapper (read-only for authenticated users)
ALTER TABLE aimodel_credit_mapper ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active credit mapper entries"
  ON aimodel_credit_mapper
  FOR SELECT
  USING (is_active = true);
