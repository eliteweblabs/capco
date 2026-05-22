-- Rename projectStatuses redirect columns: the values are plain post-status URLs,
-- not modal-only state, so drop the "modal" prefix.
--
-- modalAutoRedirectAdmin  -> autoRedirectUrlAdmin
-- modalAutoRedirectClient -> autoRedirectUrlClient
--
-- PostgreSQL RENAME COLUMN preserves data, defaults, NOT NULL, and dependent objects.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projectStatuses'
      AND column_name = 'modalAutoRedirectAdmin'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projectStatuses'
      AND column_name = 'autoRedirectUrlAdmin'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."projectStatuses" RENAME COLUMN "modalAutoRedirectAdmin" TO "autoRedirectUrlAdmin"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projectStatuses'
      AND column_name = 'modalAutoRedirectClient'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projectStatuses'
      AND column_name = 'autoRedirectUrlClient'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."projectStatuses" RENAME COLUMN "modalAutoRedirectClient" TO "autoRedirectUrlClient"';
  END IF;
END$$;
