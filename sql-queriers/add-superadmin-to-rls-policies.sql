-- Adds superAdmin coverage to policy role checks and helper function.
-- Safe to run multiple times.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
BEGIN
  RETURN (
    SELECT role IN ('Admin', 'superAdmin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$fn$;

DO $do$
DECLARE
  rec record;
  new_qual text;
  new_check text;
  alter_sql text;
BEGIN
  FOR rec IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
  LOOP
    new_qual := rec.qual;
    new_check := rec.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, $re$ARRAY\['Admin'::text,\s*'Staff'::text\]$re$, $rep$ARRAY['Admin'::text, 'Staff'::text, 'superAdmin'::text]$rep$, 'g');
      new_qual := regexp_replace(new_qual, $re$ARRAY\['Admin'::text\]$re$, $rep$ARRAY['Admin'::text, 'superAdmin'::text]$rep$, 'g');
      new_qual := regexp_replace(new_qual, $re$role\s*=\s*ANY\s*\(ARRAY\['Admin'::text\]\)$re$, $rep$role = ANY (ARRAY['Admin'::text, 'superAdmin'::text])$rep$, 'g');
      new_qual := regexp_replace(new_qual, $re$role\s+IN\s*\('Admin',\s*'Staff'\)$re$, $rep$role IN ('Admin', 'Staff', 'superAdmin')$rep$, 'g');
      new_qual := regexp_replace(new_qual, $re$role\s*=\s*'Admin'::text$re$, $rep$role = ANY (ARRAY['Admin'::text, 'superAdmin'::text])$rep$, 'g');
      new_qual := regexp_replace(new_qual, $re$role\s*=\s*'Admin'$re$, $rep$role IN ('Admin', 'superAdmin')$rep$, 'g');
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := regexp_replace(new_check, $re$ARRAY\['Admin'::text,\s*'Staff'::text\]$re$, $rep$ARRAY['Admin'::text, 'Staff'::text, 'superAdmin'::text]$rep$, 'g');
      new_check := regexp_replace(new_check, $re$ARRAY\['Admin'::text\]$re$, $rep$ARRAY['Admin'::text, 'superAdmin'::text]$rep$, 'g');
      new_check := regexp_replace(new_check, $re$role\s*=\s*ANY\s*\(ARRAY\['Admin'::text\]\)$re$, $rep$role = ANY (ARRAY['Admin'::text, 'superAdmin'::text])$rep$, 'g');
      new_check := regexp_replace(new_check, $re$role\s+IN\s*\('Admin',\s*'Staff'\)$re$, $rep$role IN ('Admin', 'Staff', 'superAdmin')$rep$, 'g');
      new_check := regexp_replace(new_check, $re$role\s*=\s*'Admin'::text$re$, $rep$role = ANY (ARRAY['Admin'::text, 'superAdmin'::text])$rep$, 'g');
      new_check := regexp_replace(new_check, $re$role\s*=\s*'Admin'$re$, $rep$role IN ('Admin', 'superAdmin')$rep$, 'g');
    END IF;

    IF (new_qual IS DISTINCT FROM rec.qual) OR (new_check IS DISTINCT FROM rec.with_check) THEN
      alter_sql := format('ALTER POLICY %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);

      IF new_qual IS NOT NULL THEN
        alter_sql := alter_sql || format(' USING (%s)', new_qual);
      END IF;

      IF new_check IS NOT NULL THEN
        alter_sql := alter_sql || format(' WITH CHECK (%s)', new_check);
      END IF;

      EXECUTE alter_sql;
    END IF;
  END LOOP;
END
$do$;

COMMIT;
