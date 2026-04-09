-- Migration: Add is_saved column to generations table
-- Separates Generate (temporary preview) from Save (permanent storage)
-- Per requirement 4.1: "Prompt to register appears when user attempts to save"

-- UP
ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS is_saved boolean NOT NULL DEFAULT false;

-- Index for querying unsaved generations (for future cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_generations_is_saved
ON public.generations(is_saved) WHERE is_saved = false;

-- DOWN (rollback)
-- DROP INDEX IF EXISTS idx_generations_is_saved;
-- ALTER TABLE public.generations DROP COLUMN IF EXISTS is_saved;
