-- Add displayOrder column to profiles for drag/drop sort order
-- Run this in Supabase SQL Editor before using Admin Users reorder

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS "displayOrder" smallint DEFAULT 0;

-- Optional: backfill existing rows by createdAt (newest first = higher order)
-- UPDATE public.profiles p
-- SET "displayOrder" = sub.rn
-- FROM (
--   SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" DESC NULLS LAST) - 1 AS rn
--   FROM public.profiles
-- ) sub
-- WHERE p.id = sub.id;
