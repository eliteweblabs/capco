-- Add bio and title columns to profiles table (team member profile)
-- Run in Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS "bio" text,
ADD COLUMN IF NOT EXISTS "title" text;

COMMENT ON COLUMN profiles."bio" IS 'Short bio/description shown on team profile cards';
COMMENT ON COLUMN profiles."title" IS 'Job title (e.g. Project Manager, Engineer) shown on team profile cards';
