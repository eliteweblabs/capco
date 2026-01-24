-- Migration: Add scheduling fields to newsletters table
-- Run this if you already have the newsletters table created

-- Add scheduling columns
ALTER TABLE newsletters 
  ADD COLUMN IF NOT EXISTS scheduledFor TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS isScheduled BOOLEAN DEFAULT false;

-- Create index for scheduled newsletters
CREATE INDEX IF NOT EXISTS idx_newsletters_scheduled 
  ON newsletters(isScheduled, scheduledFor) 
  WHERE isScheduled = true;

-- Update existing newsletters to have isScheduled = false if NULL
UPDATE newsletters 
SET isScheduled = false 
WHERE isScheduled IS NULL;
