-- Create fileCheckouts table for API compatibility
-- This table tracks file checkout status for version control

-- Drop existing table if it exists
DROP TABLE IF EXISTS "fileCheckouts" CASCADE;

-- Create the fileCheckouts table
CREATE TABLE "fileCheckouts" (
  id SERIAL PRIMARY KEY,
  "fileId" INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  "checkedOutBy" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "assignedTo" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'checked_out', -- 'checked_out', 'checked_in', 'cancelled'
  notes TEXT,
  "checkedOutAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "checkedInAt" TIMESTAMP WITH TIME ZONE,
  "cancelledAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_fileCheckouts_fileId" ON "fileCheckouts"("fileId");
CREATE INDEX IF NOT EXISTS "idx_fileCheckouts_checkedOutBy" ON "fileCheckouts"("checkedOutBy");
CREATE INDEX IF NOT EXISTS "idx_fileCheckouts_status" ON "fileCheckouts"(status);
CREATE INDEX IF NOT EXISTS "idx_fileCheckouts_fileId_status" ON "fileCheckouts"("fileId", status);

-- Enable RLS
ALTER TABLE "fileCheckouts" ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can see all checkouts
DROP POLICY IF EXISTS "Admins can view all checkouts" ON "fileCheckouts";
CREATE POLICY "Admins can view all checkouts" ON "fileCheckouts"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Staff can see checkouts for their projects
DROP POLICY IF EXISTS "Staff can view project checkouts" ON "fileCheckouts";
CREATE POLICY "Staff can view project checkouts" ON "fileCheckouts"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM files f
      JOIN projects p ON f."projectId" = p.id
      WHERE f.id = "fileCheckouts"."fileId"
      AND (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
        )
      )
    )
  );

-- Users can see their own checkouts
DROP POLICY IF EXISTS "Users can view own checkouts" ON "fileCheckouts";
CREATE POLICY "Users can view own checkouts" ON "fileCheckouts"
  FOR SELECT USING ("checkedOutBy" = auth.uid());

-- Admins and Staff can insert checkouts
DROP POLICY IF EXISTS "Admins and Staff can create checkouts" ON "fileCheckouts";
CREATE POLICY "Admins and Staff can create checkouts" ON "fileCheckouts"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
    )
  );

-- Admins and Staff can update checkouts
DROP POLICY IF EXISTS "Admins and Staff can update checkouts" ON "fileCheckouts";
CREATE POLICY "Admins and Staff can update checkouts" ON "fileCheckouts"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
    )
  );

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_fileCheckouts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updatedAt
DROP TRIGGER IF EXISTS "update_fileCheckouts_timestamp" ON "fileCheckouts";
CREATE TRIGGER "update_fileCheckouts_timestamp"
  BEFORE UPDATE ON "fileCheckouts"
  FOR EACH ROW
  EXECUTE FUNCTION update_fileCheckouts_timestamp();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON "fileCheckouts" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE "fileCheckouts_id_seq" TO authenticated;
