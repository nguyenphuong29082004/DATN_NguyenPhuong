-- Create a bucket for campaign assets (product images, brand guidelines, etc)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campaign_assets', 'campaign_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
-- Allow public read access to campaign_assets
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'campaign_assets' );

-- Allow authenticated users to upload files
CREATE POLICY "Auth Users Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'campaign_assets' AND auth.role() = 'authenticated' );

-- Allow users to update their own files
CREATE POLICY "Users Update Own Files" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'campaign_assets' AND auth.uid() = owner );

-- Allow users to delete their own files
CREATE POLICY "Users Delete Own Files" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'campaign_assets' AND auth.uid() = owner );
