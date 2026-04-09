-- up
-- Migrate gallery to map directly with generations
ALTER TABLE public.gallery
ADD COLUMN IF NOT EXISTS generation_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'gallery_generation_id_fkey'
    ) THEN
        ALTER TABLE public.gallery
        ADD CONSTRAINT gallery_generation_id_fkey
        FOREIGN KEY (generation_id)
        REFERENCES public.generations(id)
        ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE public.gallery
ALTER COLUMN generated_content_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gallery_generation_id ON public.gallery(generation_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gallery_generation_id_unique ON public.gallery(generation_id) WHERE generation_id IS NOT NULL;

-- down
DROP INDEX IF EXISTS idx_gallery_generation_id_unique;
DROP INDEX IF EXISTS idx_gallery_generation_id;

ALTER TABLE public.gallery
DROP CONSTRAINT IF EXISTS gallery_generation_id_fkey;

ALTER TABLE public.gallery
DROP COLUMN IF EXISTS generation_id;

ALTER TABLE public.gallery
ALTER COLUMN generated_content_id SET NOT NULL;
