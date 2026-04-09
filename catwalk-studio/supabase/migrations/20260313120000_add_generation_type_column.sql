-- Add type column to generations table to differentiate generation sources
-- UP
ALTER TABLE generations ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'quick_shoot';

-- Backfill: generations with no prompt_id and no campaign_id and credits_used=15 are ai_model
UPDATE generations
SET type = 'ai_model'
WHERE prompt_id IS NULL
  AND campaign_id IS NULL
  AND model_id IS NULL
  AND credits_used = 15;

-- Backfill: everything else is quick_shoot (already default)

-- Add check constraint
ALTER TABLE generations ADD CONSTRAINT generations_type_check
  CHECK (type IN ('ai_model', 'quick_shoot', 'campaign', 'designer'));

-- Index for fast filtering by type
CREATE INDEX IF NOT EXISTS idx_generations_type ON generations(type);

-- DOWN (rollback)
-- ALTER TABLE generations DROP CONSTRAINT IF EXISTS generations_type_check;
-- DROP INDEX IF EXISTS idx_generations_type;
-- ALTER TABLE generations DROP COLUMN IF EXISTS type;
