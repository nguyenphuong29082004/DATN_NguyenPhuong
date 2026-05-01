-- ========================================================
-- SEED DEFAULT MODELS AND AI ENGINES
-- ========================================================

-- 1. Create aimodel_mapper table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.aimodel_mapper (
    ai_model_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frontend_slug VARCHAR(100) NOT NULL UNIQUE,
    frontend_name VARCHAR(100) NOT NULL,
    backend_model_id VARCHAR(255) NOT NULL,
    provider_name VARCHAR(50) DEFAULT 'replicate',
    status VARCHAR(20) DEFAULT 'active',
    cost_per_token NUMERIC DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on aimodel_mapper
ALTER TABLE public.aimodel_mapper ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to aimodel_mapper" ON public.aimodel_mapper FOR SELECT USING (true);

-- 2. Seed Default AI Engines
INSERT INTO public.aimodel_mapper (frontend_slug, frontend_name, backend_model_name, cost_per_token)
VALUES 
('flux-1-schnell', 'Flux.1 Schnell (Fast)', 'black-forest-labs/flux-schnell', 1.0),
('flux-1-dev', 'Flux.1 Dev (Quality)', 'black-forest-labs/flux-dev', 2.0),
('stable-diffusion-3.5', 'SD 3.5 Large', 'stability-ai/stable-diffusion-3-5-large', 1.5)
ON CONFLICT (frontend_slug) DO UPDATE SET 
    frontend_name = EXCLUDED.frontend_name,
    backend_model_name = EXCLUDED.backend_model_name,
    cost_per_token = EXCLUDED.cost_per_token;

-- 3. Seed Default Marketplace Models
-- These models serve as the "Marketplace" options for Try-On
INSERT INTO public.models (
    model_id, 
    display_name, 
    username, 
    profile_image_url, 
    elite, 
    style_tags, 
    price_per_image, 
    status,
    model_type,
    is_ai
)
VALUES 
(
    gen_random_uuid(), 
    'Aria', 
    'aria_fashion', 
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop', 
    true, 
    ARRAY['Studio', 'High-Fashion'], 
    10, 
    'active',
    'both',
    true
),
(
    gen_random_uuid(), 
    'Julian', 
    'julian_style', 
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&h=500&fit=crop', 
    false, 
    ARRAY['Streetwear', 'Casual'], 
    5, 
    'active',
    'both',
    true
),
(
    gen_random_uuid(), 
    'Zoe', 
    'zoe_look', 
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop', 
    true, 
    ARRAY['Editorial', 'Lingerie'], 
    15, 
    'active',
    'both',
    true
)
ON CONFLICT DO NOTHING;
