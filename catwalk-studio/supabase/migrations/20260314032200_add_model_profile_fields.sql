-- Add advanced demographic columns to models table for Campaign Model Filtering
ALTER TABLE public.models
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS ethnicity text,
ADD COLUMN IF NOT EXISTS body_type text,
ADD COLUMN IF NOT EXISTS age_range text;
