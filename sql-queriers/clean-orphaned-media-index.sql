-- Clean orphaned media index rows
-- Use when you've deleted files from storage (e.g. project-media bucket) but
-- admin/media still shows "traces" because the DB tables are the source of truth.
--
-- Index tables:
--   - files       : project files (and global if using targetLocation='global')
--   - filesGlobal : global media (admin uploads to global/)
--
-- Run in Supabase SQL Editor. Adjust WHERE clauses if you only cleared a specific bucket/path.

-- 1) Optional: see how many rows will be affected
-- SELECT COUNT(*) FROM "files" WHERE "bucketName" = 'project-media';
-- SELECT COUNT(*) FROM "filesGlobal";

-- 2) Remove project-media entries from files (bucket you cleared)
DELETE FROM "files"
WHERE "bucketName" = 'project-media';

-- 3) Remove all global media index rows (files in storage global/ are gone)
DELETE FROM "filesGlobal";

-- 4) If your global media lives in "files" with targetLocation='global', also run:
DELETE FROM "files"
WHERE "targetLocation" = 'global';
