-- Add missing columns to contact_messages table
ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS request_id TEXT;

ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS company_name TEXT;

ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS service_type TEXT;

ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS section TEXT;

ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS related_domain TEXT;

-- Rename email column to sender_email if it exists (optional, only if needed)
-- This assumes the old column name was 'email', adjust if different
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contact_messages' AND column_name = 'email') THEN
    ALTER TABLE contact_messages RENAME COLUMN email TO sender_email;
  END IF;
END $$;
