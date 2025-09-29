-- Function to send email to admins when a discussion item is marked completed
-- This trigger will fire when a discussion's mark_completed status changes to true

-- First, create the function that will be called by the trigger
-- Use SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION notify_admins_discussion_completed()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_info RECORD;
  discussion_author RECORD;
  admin_email TEXT;
  email_subject TEXT;
  email_body TEXT;
  admin_emails TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Only proceed if mark_completed changed from false to true
  IF OLD.mark_completed = false AND NEW.mark_completed = true THEN
    
    -- Debug logging
    RAISE NOTICE 'Discussion completion trigger fired - Discussion ID: %, Author ID: %, Project ID: %', 
      NEW.id, NEW.author_id, NEW.project_id;
    
    -- Get project information
    SELECT 
      p.id,
      p.title,
      p.address,
      p.author_id as project_author_id,
      prof.company_name as project_author_name,
      prof.email as project_author_email
    INTO project_info
    FROM projects p
    LEFT JOIN profiles prof ON p.author_id = prof.id
    WHERE p.id = NEW.project_id;
    
    -- Get discussion author information
    -- Use static company name "CAPCo Fire" and get email/role from profiles table
    SELECT 
      'CAPCo Fire' as author_name,
      prof.email as author_email,
      prof.role as author_role
    INTO discussion_author
    FROM profiles prof
    WHERE prof.id = NEW.author_id;
    
    -- Debug logging for author lookup
    RAISE NOTICE 'Author lookup result - Name: %, Email: %, Role: %, Discussion company_name: %', 
      discussion_author.author_name, discussion_author.author_email, discussion_author.author_role, NEW.company_name;
    
    -- Get all admin email addresses
    SELECT array_agg(email) INTO admin_emails
    FROM profiles 
    WHERE role = 'Admin' AND email IS NOT NULL AND email != '';
    
    -- Build email subject
    email_subject := 'Discussion Item Completed - Project: ' || COALESCE(project_info.title, 'Untitled Project');
    
    -- Build email body with default content (you can customize this)
    email_body := '
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
        Discussion Item Marked Complete
      </h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Project Details</h3>
        <p><strong>Project:</strong> ' || COALESCE(project_info.title, 'Untitled Project') || '</p>
        <p><strong>Address:</strong> ' || COALESCE(project_info.address, 'Not specified') || '</p>
        <p><strong>Project Owner:</strong> ' || COALESCE(project_info.project_author_name, 'Unknown') || '</p>
        <p><strong>Owner Email:</strong> ' || COALESCE(project_info.project_author_email, 'Not provided') || '</p>
      </div>
      
      <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <h3 style="color: #065f46; margin-top: 0;">Completed Discussion Item</h3>
        <p><strong>Completed by:</strong> ' || COALESCE(discussion_author.author_name, 'Unknown User') || ' (' || COALESCE(discussion_author.author_role, 'Unknown Role') || ')</p>
        <p><strong>Completed at:</strong> ' || NEW.updated_at || '</p>
        <p><strong>Discussion Type:</strong> ' || CASE WHEN NEW.internal THEN 'Internal' ELSE 'Client Visible' END || '</p>
        
        <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 15px;">
          <p style="margin: 0;"><strong>Message:</strong></p>
          <div style="margin-top: 10px; padding: 10px; background-color: #f9fafb; border-radius: 4px;">
            ' || REPLACE(REPLACE(NEW.message, E'\n', '<br>'), '''', '&#39;') || '
          </div>
        </div>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #374151; margin-top: 0;">Next Steps</h4>
        <ul style="color: #6b7280;">
          <li>Review the completed discussion item</li>
          <li>Update project status if needed</li>
          <li>Notify client of progress if appropriate</li>
          <li>Archive or follow up as necessary</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://your-domain.com/project/' || project_info.id || '" 
           style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Project Details
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <div style="text-align: center; color: #6b7280; font-size: 14px;">
        <p>This is an automated notification from CAPCo Fire Protection Systems</p>
        <p>Project ID: ' || project_info.id || ' | Discussion ID: ' || NEW.id || '</p>
      </div>
    </div>';
    
    -- Send email to each admin
    IF array_length(admin_emails, 1) > 0 THEN
      FOREACH admin_email IN ARRAY admin_emails
      LOOP
        -- Insert email into outbox for processing
        INSERT INTO email_outbox (
          recipient_email,
          recipient_name,
          subject,
          html_content,
          email_type,
          project_id,
          discussion_id,
          created_at,
          status
        ) VALUES (
          admin_email,
          'Admin',
          email_subject,
          email_body,
          'discussion_completed',
          project_info.id,
          NEW.id,
          NOW(),
          'pending'
        );
      END LOOP;
      
      -- Log the notification
      RAISE NOTICE 'Discussion completion email queued for % admin(s) - Project: %, Discussion: %', 
        array_length(admin_emails, 1), project_info.id, NEW.id;
    ELSE
      RAISE NOTICE 'No admin emails found to notify about discussion completion - Project: %, Discussion: %', 
        project_info.id, NEW.id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that fires after a discussion is updated
DROP TRIGGER IF EXISTS trigger_notify_admins_discussion_completed ON discussion;

CREATE TRIGGER trigger_notify_admins_discussion_completed
  AFTER UPDATE ON discussion
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_discussion_completed();

-- Add a comment to document the trigger
COMMENT ON TRIGGER trigger_notify_admins_discussion_completed ON discussion IS 
'Automatically sends email notifications to admins when a discussion item is marked as completed';

-- Add comment for the function
COMMENT ON FUNCTION notify_admins_discussion_completed() IS 
'Sends email notifications to all admin users when a discussion item is marked as completed. Emails are queued in email_outbox table for processing.';

-- Optional: Create a function to manually test the notification for a specific discussion
CREATE OR REPLACE FUNCTION test_discussion_completion_notification(discussion_id_param INTEGER)
RETURNS VOID 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  discussion_record RECORD;
BEGIN
  -- Get the discussion record
  SELECT * INTO discussion_record FROM discussion WHERE id = discussion_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Discussion with ID % not found', discussion_id_param;
  END IF;
  
  -- Simulate the trigger by calling the function with OLD and NEW values
  -- This is a simplified test - in reality you'd need to set up the trigger context
  RAISE NOTICE 'Testing discussion completion notification for discussion ID: %', discussion_id_param;
  RAISE NOTICE 'Discussion message: %', discussion_record.message;
  RAISE NOTICE 'Marked completed: %', discussion_record.mark_completed;
  
  -- You can manually call the notification logic here if needed for testing
END;
$$ LANGUAGE plpgsql;

-- Example usage for testing:
-- SELECT test_discussion_completion_notification(123); -- Replace 123 with actual discussion ID
