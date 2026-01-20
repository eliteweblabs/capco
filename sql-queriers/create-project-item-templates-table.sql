-- ================================================
-- PROJECT ITEM TEMPLATES TABLE
-- ================================================
-- Stores templates for auto-generated punchlist and discussion items
-- that are created when new projects are deployed.
-- Managed through the CMS at /project/settings
--
-- SAFE MIGRATION PATTERN:
-- This script uses "IF NOT EXISTS" patterns to avoid errors when
-- objects already exist. This allows the script to be run multiple
-- times safely without dropping existing data.

-- Create the table (safe - won't drop existing data)
CREATE TABLE IF NOT EXISTS "projectItemTemplates" (
  id SERIAL PRIMARY KEY,
  
  -- Template identification
  type VARCHAR(20) NOT NULL CHECK (type IN ('punchlist', 'discussion')),
  title VARCHAR(255) NOT NULL,
  
  -- Content
  message TEXT NOT NULL,
  
  -- Properties
  internal BOOLEAN DEFAULT false, -- For discussions: internal-only messages
  "markCompleted" BOOLEAN DEFAULT false, -- Whether item starts as completed
  "orderIndex" INTEGER DEFAULT 0, -- For ordering templates
  
  -- Status
  enabled BOOLEAN DEFAULT true, -- Can be disabled without deleting
  
  -- Metadata
  "companyName" VARCHAR(255) DEFAULT 'CAPCo Fire',
  "createdBy" UUID REFERENCES profiles(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique templates per type/title combination
  UNIQUE(type, title, "companyName")
);

-- Create indexes (safe - won't fail if already exists)
CREATE INDEX IF NOT EXISTS idx_project_item_templates_type ON "projectItemTemplates"(type);
CREATE INDEX IF NOT EXISTS idx_project_item_templates_enabled ON "projectItemTemplates"(enabled);
CREATE INDEX IF NOT EXISTS idx_project_item_templates_order ON "projectItemTemplates"("orderIndex");

-- Enable RLS
ALTER TABLE "projectItemTemplates" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage templates" ON "projectItemTemplates";
CREATE POLICY "Admins can manage templates"
  ON "projectItemTemplates"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Everyone can read enabled templates
DROP POLICY IF EXISTS "Everyone can read enabled templates" ON "projectItemTemplates";
CREATE POLICY "Everyone can read enabled templates"
  ON "projectItemTemplates"
  FOR SELECT
  TO authenticated
  USING (enabled = true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_project_item_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_item_templates_updated_at ON "projectItemTemplates";
CREATE TRIGGER trigger_update_project_item_templates_updated_at
  BEFORE UPDATE ON "projectItemTemplates"
  FOR EACH ROW
  EXECUTE FUNCTION update_project_item_templates_updated_at();

-- ================================================
-- MIGRATE EXISTING DEFAULT DATA
-- ================================================
-- Insert default punchlist templates (from restore-punchlist-trigger.sql)
-- Using ON CONFLICT to avoid duplicates if templates already exist (safe to run multiple times)
INSERT INTO "projectItemTemplates" (type, title, message, internal, "markCompleted", "orderIndex", "companyName")
VALUES 
  ('punchlist', 'Receive CAD files', 'Receive CAD files from client / download from <a class="text-primary dark:text-primary-text" href="{{RAILWAY_PUBLIC_DOMAIN}}/project/{{PROJECT_ID}}?status=documents">Documents</a>', false, false, 1, 'CAPCo Fire'),
  ('punchlist', 'Obtain fire hydrant flow test data', 'Obtain fire hydrant flow test data', false, false, 2, 'CAPCo Fire'),
  ('punchlist', 'Conduct design kickoff', 'Conduct design kickoff and review scope', false, false, 3, 'CAPCo Fire'),
  ('punchlist', 'Coordinate with fire alarm designer', 'Coordinate with fire alarm designer', false, false, 4, 'CAPCo Fire'),
  ('punchlist', 'Complete fire sprinkler layout', 'Complete fire sprinkler layout design', false, false, 5, 'CAPCo Fire'),
  ('punchlist', 'Perform hydraulic calculations', 'Perform hydraulic calculations', false, false, 6, 'CAPCo Fire'),
  ('punchlist', 'Optimize pipe sizing', 'Optimize pipe sizing for efficiency', false, false, 7, 'CAPCo Fire'),
  ('punchlist', 'Add notes and callouts', 'Add notes and leader callouts', false, false, 8, 'CAPCo Fire'),
  ('punchlist', 'Add details and notes', 'Add details and general notes', false, false, 9, 'CAPCo Fire'),
  ('punchlist', 'Finalize design', 'Finalize design and apply titleblock', false, false, 10, 'CAPCo Fire'),
  ('punchlist', 'Print drawings to PDF', 'Print drawings to PDF for submittal / upload to <a class="text-primary dark:text-primary-text" href="{{RAILWAY_PUBLIC_DOMAIN}}/project/{{PROJECT_ID}}?status=deliverables">Deliverables</a>', false, false, 11, 'CAPCo Fire')
ON CONFLICT (type, title, "companyName") DO NOTHING;

-- Insert default discussion templates (from assign-default-discussion-trigger.sql)
-- Using ON CONFLICT to avoid duplicates if templates already exist (safe to run multiple times)
INSERT INTO "projectItemTemplates" (type, title, message, internal, "markCompleted", "orderIndex", "companyName")
VALUES 
  ('discussion', 'Welcome Message', 'Welcome to your new project! We''re excited to work with you on {{PROJECT_TITLE}} at {{PROJECT_ADDRESS}}. Our team will be in touch soon to discuss the next steps.', false, true, 1, 'CAPCo Fire'),
  ('discussion', 'Internal: New Project Created', 'New project created: {{PROJECT_TITLE}} at {{PROJECT_ADDRESS}}. Please review project details and assign appropriate team members.', true, false, 2, 'CAPCo Fire'),
  ('discussion', 'Internal: Project Kickoff Checklist', 'Project Kickoff Checklist:
✓ Project created and documented
✓ Client notified
⏳ Site visit scheduled
⏳ Initial proposal prepared
⏳ Team assigned', true, false, 3, 'CAPCo Fire'),
  ('discussion', 'Client: Next Steps', 'Next Steps for {{COMPANY_NAME}}:
1. We will schedule a site visit within 2-3 business days
2. Our team will prepare a detailed proposal based on your requirements
3. You will receive updates via email at {{CLIENT_EMAIL}}
4. Feel free to reach out with any questions', false, false, 4, 'CAPCo Fire')
ON CONFLICT (type, title, "companyName") DO NOTHING;

-- Grant permissions
GRANT ALL ON "projectItemTemplates" TO authenticated;
GRANT ALL ON "projectItemTemplates" TO service_role;
GRANT USAGE, SELECT ON SEQUENCE "projectItemTemplates_id_seq" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE "projectItemTemplates_id_seq" TO service_role;

-- Verify the templates were created
SELECT 
  id, 
  type, 
  title, 
  LEFT(message, 50) || '...' as message_preview,
  internal,
  "markCompleted",
  "orderIndex",
  enabled
FROM "projectItemTemplates"
ORDER BY type, "orderIndex";
