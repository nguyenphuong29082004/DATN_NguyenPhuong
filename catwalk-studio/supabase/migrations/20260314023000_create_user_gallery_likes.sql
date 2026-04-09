-- up
CREATE TABLE IF NOT EXISTS public.user_gallery_likes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gallery_id UUID REFERENCES public.gallery(gallery_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, gallery_id)
);

-- RLS
ALTER TABLE public.user_gallery_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes" 
    ON public.user_gallery_likes FOR SELECT 
    USING (true);

CREATE POLICY "Users can toggle their own likes" 
    ON public.user_gallery_likes FOR ALL 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- down
DROP TABLE IF EXISTS public.user_gallery_likes;
