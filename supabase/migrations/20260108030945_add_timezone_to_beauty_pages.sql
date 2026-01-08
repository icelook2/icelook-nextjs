-- Add timezone column to beauty_pages
-- This stores the timezone for the beauty page, used for working hours and appointments

ALTER TABLE beauty_pages
ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Europe/Kyiv';

-- Add a comment explaining the column
COMMENT ON COLUMN beauty_pages.timezone IS 'IANA timezone identifier for the beauty page (e.g., Europe/Kyiv, America/New_York)';
