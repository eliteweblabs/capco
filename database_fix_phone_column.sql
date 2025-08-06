-- Fix phone column type in profiles table
-- Change from BIGINT to TEXT for proper phone number storage

-- First, let's see what the current data looks like
SELECT id, name, phone, role FROM profiles LIMIT 10;

-- Convert phone column from BIGINT to TEXT
-- This will preserve the data while changing the type
ALTER TABLE profiles 
ALTER COLUMN phone TYPE TEXT USING phone::TEXT;

-- Verify the change
SELECT id, name, phone, role FROM profiles LIMIT 10;

-- Update any existing phone numbers to proper format if needed
-- (This is optional - you can format them as needed)
UPDATE profiles 
SET phone = CASE 
  WHEN phone IS NOT NULL AND phone != '' THEN phone
  ELSE NULL
END
WHERE phone IS NOT NULL;

-- Add a check constraint to ensure phone numbers are valid (optional)
-- ALTER TABLE profiles 
-- ADD CONSTRAINT valid_phone_format 
-- CHECK (phone IS NULL OR phone ~ '^[0-9+\-\(\)\s]+$');

-- Verify the final result
SELECT id, name, phone, role FROM profiles ORDER BY created DESC LIMIT 10; 