-- Advanced version with customizable default discussions based on project type
-- This allows for different default discussions based on project characteristics

-- Create a table to store default discussion templates
CREATE TABLE IF NOT EXISTS default_discussion_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  project_type VARCHAR(50), -- 'fire_alarm', 'sprinkler', 'general', etc.
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default templates
INSERT INTO default_discussion_templates (template_name, content, is_internal, project_type, sort_order) VALUES
-- General project templates
('welcome_client', 'Welcome to your new project! We''re excited to work with you on {{PROJECT_TITLE}} at {{PROJECT_ADDRESS}}. Our team will be in touch soon to discuss the next steps.', false, 'general', 1),
('internal_kickoff', 'New project created: {{PROJECT_TITLE}} at {{PROJECT_ADDRESS}}. Please review project details and assign appropriate team members.', true, 'general', 2),
('kickoff_checklist', 'Project Kickoff Checklist:
✓ Project created and documented
✓ Client notified
⏳ Site visit scheduled
⏳ Initial proposal prepared
⏳ Team assigned', true, 'general', 3),
('client_next_steps', 'Next Steps for {{CLIENT_NAME}}:
1. We will schedule a site visit within 2-3 business days
2. Our team will prepare a detailed proposal based on your requirements
3. You will receive updates via email at {{CLIENT_EMAIL}}
4. Feel free to reach out with any questions', false, 'general', 4),

-- Fire alarm specific templates
('fire_alarm_welcome', 'Welcome to your fire alarm system project! We specialize in comprehensive fire protection solutions and look forward to ensuring your safety at {{PROJECT_ADDRESS}}.', false, 'fire_alarm', 1),
('fire_alarm_internal', 'Fire alarm project initiated: {{PROJECT_TITLE}}. Ensure compliance with local fire codes and NFPA standards. Schedule site survey for system design.', true, 'fire_alarm', 2),
('fire_alarm_checklist', 'Fire Alarm Project Checklist:
✓ Project scope defined
✓ Local fire code requirements reviewed
⏳ Site survey scheduled
⏳ System design in progress
⏳ Permit applications prepared
⏳ Installation timeline established', true, 'fire_alarm', 3),

-- Sprinkler specific templates
('sprinkler_welcome', 'Welcome to your sprinkler system project! Our certified technicians will design and install a reliable fire suppression system for {{PROJECT_ADDRESS}}.', false, 'sprinkler', 1),
('sprinkler_internal', 'Sprinkler system project created: {{PROJECT_TITLE}}. Review water supply requirements and hydraulic calculations needed.', true, 'sprinkler', 2),
('sprinkler_checklist', 'Sprinkler System Project Checklist:
✓ Water supply analysis required
✓ Hydraulic calculations needed
⏳ System design in progress
⏳ Material specifications prepared
⏳ Installation planning underway', true, 'sprinkler', 3);

-- Enhanced function that uses templates
CREATE OR REPLACE FUNCTION assign_template_discussions_to_project()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  template_record RECORD;
  project_type VARCHAR(50);
  processed_content TEXT;
BEGIN
  -- Determine project type based on project data
  -- You can customize this logic based on your project fields
  project_type := CASE 
    WHEN NEW.title ILIKE '%fire alarm%' OR NEW.title ILIKE '%fire detection%' THEN 'fire_alarm'
    WHEN NEW.title ILIKE '%sprinkler%' OR NEW.title ILIKE '%fire suppression%' THEN 'sprinkler'
    ELSE 'general'
  END;
  
  -- Insert discussions based on templates
  FOR template_record IN 
    SELECT * FROM default_discussion_templates 
    WHERE (project_type = template_record.project_type OR project_type = 'general')
    AND is_active = true
    ORDER BY sort_order
  LOOP
    -- Replace placeholders with actual project data
    processed_content := template_record.content;
    processed_content := REPLACE(processed_content, '{{PROJECT_TITLE}}', COALESCE(NEW.title, 'Your Project'));
    processed_content := REPLACE(processed_content, '{{PROJECT_ADDRESS}}', COALESCE(NEW.address, 'the specified location'));
    processed_content := REPLACE(processed_content, '{{CLIENT_NAME}}', 'Client'); -- You might want to join with profiles table
    processed_content := REPLACE(processed_content, '{{CLIENT_EMAIL}}', 'your email'); -- You might want to join with profiles table
    
    INSERT INTO discussion (
      project_id,
      author_id,
      message,
      internal,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.author_id,
      processed_content,
      template_record.is_internal,
      NOW(),
      NOW()
    );
  END LOOP;
  
  -- Note: Logging removed since project_logs table doesn't exist
  -- You can add logging later if needed
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the enhanced trigger
DROP TRIGGER IF EXISTS trigger_assign_template_discussions ON projects;

CREATE TRIGGER trigger_assign_template_discussions
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION assign_template_discussions_to_project();

-- Function to manage templates
CREATE OR REPLACE FUNCTION add_discussion_template(
  template_name_param VARCHAR(100),
  content_param TEXT,
  is_internal_param BOOLEAN DEFAULT false,
  project_type_param VARCHAR(50) DEFAULT 'general',
  sort_order_param INTEGER DEFAULT 0
)
RETURNS INTEGER AS $$
DECLARE
  template_id INTEGER;
BEGIN
  INSERT INTO default_discussion_templates (
    template_name,
    content,
    is_internal,
    project_type,
    sort_order
  ) VALUES (
    template_name_param,
    content_param,
    is_internal_param,
    project_type_param,
    sort_order_param
  ) RETURNING id INTO template_id;
  
  RETURN template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update existing templates
CREATE OR REPLACE FUNCTION update_discussion_template(
  template_id_param INTEGER,
  template_name_param VARCHAR(100) DEFAULT NULL,
  content_param TEXT DEFAULT NULL,
  is_internal_param BOOLEAN DEFAULT NULL,
  project_type_param VARCHAR(50) DEFAULT NULL,
  sort_order_param INTEGER DEFAULT NULL,
  is_active_param BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE default_discussion_templates SET
    template_name = COALESCE(template_name_param, template_name),
    content = COALESCE(content_param, content),
    is_internal = COALESCE(is_internal_param, is_internal),
    project_type = COALESCE(project_type_param, project_type),
    sort_order = COALESCE(sort_order_param, sort_order),
    is_active = COALESCE(is_active_param, is_active),
    updated_at = NOW()
  WHERE id = template_id_param;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE default_discussion_templates IS 'Stores templates for default discussion comments that are automatically added to new projects';
COMMENT ON FUNCTION assign_template_discussions_to_project() IS 'Enhanced trigger function that assigns discussion comments based on project type and templates';
COMMENT ON FUNCTION add_discussion_template(VARCHAR, TEXT, BOOLEAN, VARCHAR, INTEGER) IS 'Adds a new discussion template';
COMMENT ON FUNCTION update_discussion_template(INTEGER, VARCHAR, TEXT, BOOLEAN, VARCHAR, INTEGER, BOOLEAN) IS 'Updates an existing discussion template';
