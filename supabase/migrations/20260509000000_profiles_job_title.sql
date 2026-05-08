-- Job title on user profiles (camelCase column name)
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "jobTitle" text;
