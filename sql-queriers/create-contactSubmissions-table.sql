-- Contact Submissions Table
-- Stores contact form submissions from the website
-- Tracks SMS consent and links to user profiles

CREATE TABLE "contactSubmissions" (
  id SERIAL PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  "smsConsent" BOOLEAN DEFAULT false,
  company TEXT,
  address TEXT,
  message TEXT NOT NULL,
  "userId" TEXT,
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "contactSubmissions" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contact submissions
CREATE POLICY "Anyone can insert contact submissions"
  ON "contactSubmissions" FOR INSERT
  WITH CHECK (true);

-- Allow admins to view all contact submissions
CREATE POLICY "Admins can view all contact submissions"
  ON "contactSubmissions" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Add indexes for performance
CREATE INDEX "idx_contactSubmissions_email" ON "contactSubmissions"(email);
CREATE INDEX "idx_contactSubmissions_userId" ON "contactSubmissions"("userId");
CREATE INDEX "idx_contactSubmissions_submittedAt" ON "contactSubmissions"("submittedAt" DESC);

-- Add foreign key constraint to profiles (optional, soft reference)
-- Note: userId may not exist in profiles table for non-authenticated users
-- COMMENT ON COLUMN "contactSubmissions"."userId" IS 'References profiles.id - may be temporary ID for non-authenticated users';
