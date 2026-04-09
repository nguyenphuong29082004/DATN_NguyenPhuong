-- Up Migration
ALTER TABLE campaigns ADD COLUMN brand_guidelines_url TEXT;

-- Down Migration
-- ALTER TABLE campaigns DROP COLUMN brand_guidelines_url;
