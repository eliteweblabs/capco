

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."assign_default_discussion_to_project"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$DECLARE
  defaultAuthorId UUID := 'd0bc127f-d816-4aeb-ac48-6ba4b0718491'; -- Replace with your admin user ID
  defaultCompanyName TEXT := 'CAPCO Admin'; -- Replace with your company name
  
  -- Internal variables
  finalAuthorId UUID;
  finalCompanyName TEXT;
  welcomeMessage TEXT;
BEGIN
  -- Use default author ID (you can change logic here if needed)
  finalAuthorId := defaultAuthorId;
  
  -- Use default company name
  finalCompanyName := defaultCompanyName;

  -- Build the welcome message with proper string concatenation
  welcomeMessage := 'Welcome to your new project! We''re excited to work with you on ' || 
                     COALESCE(NEW.title, 'your project') || 
                     '. Please make sure to upload all relevant documents and images to the <a class="text-primary dark:text-primary-dark" href="/project/' || 
                     COALESCE(NEW.id::text, 'your-project') || 
                     '?status=documents">documents section</a>, and submit them by clicking the [
Finished Uploading Documents / Request Review] button so we can review and develop a proposal';

  -- Insert default discussion comments for the new project
  INSERT INTO discussion (
    "projectId",
    "authorId",
    message,
    internal,
    "createdAt",
    "updatedAt",
    "markCompleted",
    "companyName"
  ) VALUES 
    -- 1. Welcome message for the client (Client Visible)
    (
      NEW.id,
      finalAuthorId,
      welcomeMessage,
      false, -- Client visible
      NOW(),
      NOW(),
      false, -- Not completed by default
      finalCompanyName
    );

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."assign_default_discussion_to_project"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."assign_default_discussion_to_project"() IS 'Creates default discussion entries for new projects with proper camelCase field names.';



CREATE OR REPLACE FUNCTION "public"."assign_file"("file_id_param" integer, "assigned_to_param" "uuid", "assigned_by_param" "uuid", "notes_param" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  fileRecord RECORD;
BEGIN
  -- Get file details
  SELECT 
    f.*,
    f."checkedOutBy",
    f."checkedOutAt",
    f."assignedTo",
    f."assignedAt",
    f."checkoutNotes"
  INTO fileRecord 
  FROM files f 
  WHERE f.id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Assign the file
  UPDATE files 
  SET 
    "assignedTo" = assigned_to_param,
    "assignedAt" = NOW()
  WHERE id = file_id_param;
  
  -- Log the assignment
  INSERT INTO fileCheckoutHistory (fileId, userId, action, notes)
  VALUES (file_id_param, assigned_by_param, 'assign', notes_param);
  
  RETURN json_build_object('success', true, 'message', 'File assigned successfully');
END;
$$;


ALTER FUNCTION "public"."assign_file"("file_id_param" integer, "assigned_to_param" "uuid", "assigned_by_param" "uuid", "notes_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_create_punchlist_items"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Only create punchlist items for new projects
    IF TG_OP = 'INSERT' THEN
        -- Call the function to create default punchlist items
        PERFORM create_default_punchlist_items(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_create_punchlist_items"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_create_punchlist_items"() IS 'Automatically creates default punchlist items when a new project is created.';



CREATE OR REPLACE FUNCTION "public"."calculate_ai_cost"("p_model" "text", "p_input_tokens" integer, "p_output_tokens" integer) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  input_cost_per_1k DECIMAL(10, 6);
  output_cost_per_1k DECIMAL(10, 6);
BEGIN
  -- Claude 3.5 Sonnet pricing (as of 2024)
  -- Input: $3.00 per 1M tokens, Output: $15.00 per 1M tokens
  IF p_model LIKE 'claude-3-5-sonnet%' THEN
    input_cost_per_1k := 0.003;
    output_cost_per_1k := 0.015;
  -- Claude 3 Opus pricing
  ELSIF p_model LIKE 'claude-3-opus%' THEN
    input_cost_per_1k := 0.015;
    output_cost_per_1k := 0.075;
  -- Claude 3 Haiku pricing
  ELSIF p_model LIKE 'claude-3-haiku%' THEN
    input_cost_per_1k := 0.00025;
    output_cost_per_1k := 0.00125;
  ELSE
    -- Default to Sonnet pricing
    input_cost_per_1k := 0.003;
    output_cost_per_1k := 0.015;
  END IF;
  
  RETURN (p_input_tokens::DECIMAL / 1000.0 * input_cost_per_1k) + 
         (p_output_tokens::DECIMAL / 1000.0 * output_cost_per_1k);
END;
$_$;


ALTER FUNCTION "public"."calculate_ai_cost"("p_model" "text", "p_input_tokens" integer, "p_output_tokens" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_outstanding_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE invoices 
  SET 
    paid_amount = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = NEW.invoice_id),
    outstanding_balance = total_amount - (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = NEW.invoice_id),
    status = CASE 
      WHEN total_amount <= (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = NEW.invoice_id) 
      THEN 'paid' 
      ELSE 'sent' 
    END
  WHERE id = NEW.invoice_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_outstanding_balance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."checkin_file"("file_id_param" integer, "user_id_param" "uuid", "notes_param" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  fileRecord RECORD;
BEGIN
  -- Get file details
  SELECT 
    f.*,
    f."checkedOutBy",
    f."checkedOutAt",
    f."assignedTo",
    f."assignedAt",
    f."checkoutNotes"
  INTO fileRecord 
  FROM files f 
  WHERE f.id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Check if user has the file checked out
  IF fileRecord."checkedOutBy" != user_id_param THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'You do not have this file checked out'
    );
  END IF;
  
  -- Check in the file
  UPDATE files 
  SET 
    "checkedOutBy" = NULL,
    "checkedOutAt" = NULL,
    "checkoutNotes" = NULL
  WHERE id = file_id_param;
  
  -- Log the checkin
  INSERT INTO fileCheckoutHistory (fileId, userId, action, notes)
  VALUES (file_id_param, user_id_param, 'checkin', notes_param);
  
  RETURN json_build_object('success', true, 'message', 'File checked in successfully');
END;
$$;


ALTER FUNCTION "public"."checkin_file"("file_id_param" integer, "user_id_param" "uuid", "notes_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."checkout_file"("file_id_param" integer, "user_id_param" "uuid", "notes_param" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  fileRecord RECORD;
  result JSON;
BEGIN
  -- Get file details
  SELECT 
    f.*,
    f."checkedOutBy",
    f."checkedOutAt",
    f."assignedTo",
    f."assignedAt",
    f."checkoutNotes"
  INTO fileRecord 
  FROM files f 
  WHERE f.id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Check if file is already checked out
  IF fileRecord."checkedOutBy" IS NOT NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'File is already checked out',
      'checkedOutBy', fileRecord."checkedOutBy",
      'checkedOutAt', fileRecord."checkedOutAt"
    );
  END IF;
  
  -- Check out the file
  UPDATE files 
  SET 
    "checkedOutBy" = user_id_param,
    "checkedOutAt" = NOW(),
    "checkoutNotes" = notes_param
  WHERE id = file_id_param;
  
  -- Log the checkout
  INSERT INTO fileCheckoutHistory (fileId, userId, action, notes)
  VALUES (file_id_param, user_id_param, 'checkout', notes_param);
  
  RETURN json_build_object('success', true, 'message', 'File checked out successfully');
END;
$$;


ALTER FUNCTION "public"."checkout_file"("file_id_param" integer, "user_id_param" "uuid", "notes_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_punchlist_items"("project_id_param" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    project_author_id UUID;
    author_company_name TEXT;
    base_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the project author's ID using camelCase column name
    SELECT "authorId" INTO project_author_id 
    FROM projects 
    WHERE id = project_id_param;
    
    -- Get the author's company name from profiles using camelCase column names
    SELECT COALESCE("companyName", "firstName" || ' ' || "lastName", 'Unknown User') 
    INTO author_company_name
    FROM profiles 
    WHERE id = project_author_id;
    
    -- If we couldn't find the author, exit
    IF project_author_id IS NULL THEN
        RAISE NOTICE 'Could not find author for project %', project_id_param;
        RETURN;
    END IF;

    -- Use current time as base, add seconds to ensure proper ordering
    base_time := NOW();

    -- Insert default punchlist items using camelCase column names
    INSERT INTO punchlist ("projectId", "authorId", message, internal, "markCompleted", "companyName", "createdAt")
    VALUES 
    (project_id_param, project_author_id, 'Receive CAD files from client / download from <a class="text-primary dark:text-primary-text" href="{{RAILWAY_PUBLIC_DOMAIN}}/project/{{PROJECT_ID}}?status=documents">Documents</a>', false, false, author_company_name, base_time + INTERVAL '1 second'),
    (project_id_param, project_author_id, 'Obtain fire hydrant flow test data', false, false, author_company_name, base_time + INTERVAL '2 seconds'),
    (project_id_param, project_author_id, 'Conduct design kickoff and review scope', false, false, author_company_name, base_time + INTERVAL '3 seconds'),
    (project_id_param, project_author_id, 'Coordinate with fire alarm designer', false, false, author_company_name, base_time + INTERVAL '4 seconds'),
    (project_id_param, project_author_id, 'Complete fire sprinkler layout design', false, false, author_company_name, base_time + INTERVAL '5 seconds'),
    (project_id_param, project_author_id, 'Perform hydraulic calculations', false, false, author_company_name, base_time + INTERVAL '6 seconds'),
    (project_id_param, project_author_id, 'Optimize pipe sizing for efficiency', false, false, author_company_name, base_time + INTERVAL '7 seconds'),
    (project_id_param, project_author_id, 'Add notes and leader callouts', false, false, author_company_name, base_time + INTERVAL '8 seconds'),  
    (project_id_param, project_author_id, 'Add details and general notes', false, false, author_company_name, base_time + INTERVAL '9 seconds'),
    (project_id_param, project_author_id, 'Finalize design and apply titleblock', false, false, author_company_name, base_time + INTERVAL '10 seconds'),
    (project_id_param, project_author_id, 'Print drawings to PDF for submittal / upload to <a class="text-primary dark:text-primary-text" href="{{RAILWAY_PUBLIC_DOMAIN}}/project/{{PROJECT_ID}}?status=deliverables">Deliverables</a>', false, false, author_company_name, base_time + INTERVAL '11 seconds');
    
    RAISE NOTICE 'Created default punchlist items for project % with author %', project_id_param, project_author_id;
END;
$$;


ALTER FUNCTION "public"."create_default_punchlist_items"("project_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."extend_project_due_date"("project_id_param" integer, "hours_to_add" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = COALESCE("dueDate", NOW()) + (hours_to_add || ' hours')::INTERVAL
  WHERE id = project_id_param;
END;
$$;


ALTER FUNCTION "public"."extend_project_due_date"("project_id_param" integer, "hours_to_add" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_agent_knowledge"("p_category" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "title" "text", "content" "text", "category" "text", "tags" "text"[], "priority" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id,
    k.title,
    k.content,
    k.category,
    k.tags,
    k.priority
  FROM ai_agent_knowledge k
  WHERE k."isActive" = true
    AND (p_category IS NULL OR k.category = p_category)
  ORDER BY k.priority DESC, k."createdAt" DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_agent_knowledge"("p_category" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_file_checkout_status"("file_id_param" integer) RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  fileRecord RECORD;
  checkoutUser RECORD;
  assignedUser RECORD;
BEGIN
  -- Get file with user details
  SELECT 
    f.*,
    cu.email as checkedOutByEmail,
    cu.raw_user_meta_data->>'companyName' as checkedOutByName,
    au.email as assignedToEmail,
    au.raw_user_meta_data->>'companyName' as assignedToName
  INTO fileRecord
  FROM files f
  LEFT JOIN auth.users cu ON f.checkedOutBy = cu.id
  LEFT JOIN auth.users au ON f.assignedTo = au.id
  WHERE f.id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'fileId', fileRecord.id,
    'checkedOut', fileRecord.checkedOutBy IS NOT NULL,
    'checkedOutBy', fileRecord.checkedOutBy,
    'checkedOutByName', fileRecord.checkedOutByName,
    'checkedOutByEmail', fileRecord.checkedOutByEmail,
    'checkedOutAt', fileRecord.checkedOutAt,
    'checkoutNotes', fileRecord.checkoutNotes,
    'assignedTo', fileRecord.assignedTo,
    'assignedToName', fileRecord.assignedToName,
    'assignedToEmail', fileRecord.assignedToEmail,
    'assignedAt', fileRecord.assignedAt
  );
END;
$$;


ALTER FUNCTION "public"."get_file_checkout_status"("file_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  _firstName text;
  _lastName text;
  _companyName text;
  _avatarUrl text;
BEGIN
  -- Extract first name (try multiple metadata fields for different auth providers)
  _firstName := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'firstName', ''),
    NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'given_name', ''),  -- Google OAuth
    ''
  );
  
  -- Extract last name
  _lastName := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'lastName', ''),
    NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'family_name', ''),  -- Google OAuth
    ''
  );
  
  -- Extract company name (fallback to full name or email)
  _companyName := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'companyName', ''),
    NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),  -- Google OAuth full name
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(NEW.email, '@', 1)  -- Fallback to email username
  );
  
  -- Extract avatar URL (try multiple fields)
  _avatarUrl := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatarUrl', ''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'picture', ''),  -- Google OAuth
    NULL
  );

  -- Insert new profile
  INSERT INTO public.profiles (
    id, 
    email,
    role, 
    "companyName",
    "firstName",
    "lastName",
    "avatarUrl",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id, 
    NEW.email,
    'Client',  -- Default role for new users
    _companyName,
    _firstName,
    _lastName,
    _avatarUrl,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Don't error if profile already exists
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_staff"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Staff')
  );
$$;


ALTER FUNCTION "public"."is_admin_or_staff"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_project_due_date"("project_id_param" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = NOW() + INTERVAL '48 hours'
  WHERE id = project_id_param;
END;
$$;


ALTER FUNCTION "public"."reset_project_due_date"("project_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_project_due_date_on_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Set dueDate to current time + 48 hours for new projects
  NEW."dueDate" = NOW() + INTERVAL '48 hours';
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_project_due_date_on_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_project_due_date_on_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Set due date when project status changes
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Set due date to 30 days from now for new projects
    IF NEW.status = 0 THEN
      NEW."dueDate" := NOW() + INTERVAL '30 days';
    -- Set to 14 days for projects under review
    ELSIF NEW.status = 1 THEN
      NEW."dueDate" := NOW() + INTERVAL '14 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_project_due_date_on_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."to_camel_case"("snake_case" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN regexp_replace(
        regexp_replace(
            lower(snake_case), 
            '_([a-z])', 
            '\1'
        ),
        '([a-z])([a-z]*)', 
        CASE WHEN snake_case ~ '^[A-Z]' 
            THEN '\U\1\L\2' 
            ELSE '\1\2' 
        END
    );
END;
$$;


ALTER FUNCTION "public"."to_camel_case"("snake_case" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ai_knowledge_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ai_knowledge_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_cms_pages_updatedAt"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_cms_pages_updatedAt"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_contact_submissions_updatedat"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_contact_submissions_updatedat"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_filecheckouts_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_filecheckouts_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_missing_due_dates"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = "createdAt" + INTERVAL '48 hours'
  WHERE "dueDate" IS NULL AND "createdAt" IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."update_missing_due_dates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_punchlist_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the project's punchlist counts
    UPDATE projects
    SET 
        "punchlistCount" = (
            SELECT COUNT(*)
            FROM punchlist
            WHERE "projectId" = COALESCE(NEW."projectId", OLD."projectId")
        ),
        "punchlistComplete" = (
            SELECT COUNT(*)
            FROM punchlist
            WHERE "projectId" = COALESCE(NEW."projectId", OLD."projectId")
              AND "markCompleted" = true
        )
    WHERE id = COALESCE(NEW."projectId", OLD."projectId");
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_project_punchlist_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_punchlist_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Handle INSERT, UPDATE, and DELETE operations
    IF TG_OP = 'INSERT' THEN
        -- New punchlist item added - increment count if not completed
        IF NEW."markCompleted" IS NULL OR NOT NEW."markCompleted" THEN
            UPDATE projects 
            SET "punchlistCount" = COALESCE("punchlistCount", 0) + 1
            WHERE id = NEW."projectId";
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Punchlist item updated - adjust count based on markCompleted changes
        IF (OLD."markCompleted" IS NULL OR NOT OLD."markCompleted") != (NEW."markCompleted" IS NULL OR NOT NEW."markCompleted") THEN
            IF NEW."markCompleted" IS NOT NULL AND NEW."markCompleted" THEN
                -- Marked as completed - decrement count
                UPDATE projects 
                SET "punchlistCount" = GREATEST(COALESCE("punchlistCount", 0) - 1, 0)
                WHERE id = NEW."projectId";
            ELSE
                -- Marked as incomplete (including NULL) - increment count
                UPDATE projects 
                SET "punchlistCount" = COALESCE("punchlistCount", 0) + 1
                WHERE id = NEW."projectId";
            END IF;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Punchlist item deleted - decrement count if it was incomplete
        IF OLD."markCompleted" IS NULL OR NOT OLD."markCompleted" THEN
            UPDATE projects 
            SET "punchlistCount" = GREATEST(COALESCE("punchlistCount", 0) - 1, 0)
            WHERE id = OLD."projectId";
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_punchlist_count"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_punchlist_count"() IS 'Updates punchlist count on projects table when punchlist items are inserted, updated, or deleted.';



CREATE OR REPLACE FUNCTION "public"."update_single_project_due_date"("project_id_param" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = "createdAt" + INTERVAL '48 hours'
  WHERE id = project_id_param AND "createdAt" IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."update_single_project_due_date"("project_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_agent_conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "userId" "uuid",
    "title" "text",
    "projectId" integer,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_agent_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_agent_knowledge" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "category" "text",
    "tags" "text"[],
    "priority" integer DEFAULT 0,
    "isActive" boolean DEFAULT true,
    "authorId" "uuid",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "projectId" integer
);


ALTER TABLE "public"."ai_agent_knowledge" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_agent_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversationId" "uuid",
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_agent_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."ai_agent_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_agent_project_memory" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "projectId" integer NOT NULL,
    "purposeContext" "text",
    "currentState" "text",
    "authorId" "uuid",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_agent_project_memory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_agent_usage" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "userId" "uuid",
    "conversationId" "uuid",
    "messageId" "uuid",
    "model" "text" NOT NULL,
    "inputTokens" integer NOT NULL,
    "outputTokens" integer NOT NULL,
    "totalTokens" integer NOT NULL,
    "estimatedCost" numeric(10,6),
    "requestType" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_agent_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_generated_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "projectId" integer NOT NULL,
    "templateId" "uuid",
    "content" "text" NOT NULL,
    "fileUrl" "text",
    "version" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "authorId" "uuid",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_generated_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_generations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "documentId" "uuid",
    "prompt" "text" NOT NULL,
    "response" "text" NOT NULL,
    "model" "text" NOT NULL,
    "tokensUsed" integer,
    "costEstimate" numeric(10,4),
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_generations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bannerAlerts" (
    "id" integer NOT NULL,
    "title" "text",
    "content" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text",
    "position" "text" DEFAULT 'top'::"text",
    "expireMs" integer,
    "dismissible" boolean DEFAULT true,
    "isActive" boolean DEFAULT true,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "createdBy" "uuid",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bannerAlerts_position_check" CHECK (("position" = ANY (ARRAY['top'::"text", 'bottom'::"text"]))),
    CONSTRAINT "bannerAlerts_type_check" CHECK (("type" = ANY (ARRAY['info'::"text", 'success'::"text", 'warning'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."bannerAlerts" OWNER TO "postgres";


COMMENT ON TABLE "public"."bannerAlerts" IS 'Stores banner alerts that appear at the top or bottom of pages. Used for site-wide announcements, maintenance notices, etc.';



COMMENT ON COLUMN "public"."bannerAlerts"."id" IS 'Primary key';



COMMENT ON COLUMN "public"."bannerAlerts"."title" IS 'Alert title/heading - required';



COMMENT ON COLUMN "public"."bannerAlerts"."content" IS 'Optional detailed description or message for the alert';



COMMENT ON COLUMN "public"."bannerAlerts"."type" IS 'Alert type: info (blue), success (green), warning (yellow), or error (red)';



COMMENT ON COLUMN "public"."bannerAlerts"."position" IS 'Display position: top (above header) or bottom (above footer)';



COMMENT ON COLUMN "public"."bannerAlerts"."expireMs" IS 'Auto-dismiss after this many milliseconds. NULL = no auto-dismiss';



COMMENT ON COLUMN "public"."bannerAlerts"."dismissible" IS 'Whether users can manually dismiss the alert with an X button';



COMMENT ON COLUMN "public"."bannerAlerts"."isActive" IS 'Whether the alert is currently active and should be displayed';



COMMENT ON COLUMN "public"."bannerAlerts"."startDate" IS 'Optional: Only show alert starting from this date/time';



COMMENT ON COLUMN "public"."bannerAlerts"."endDate" IS 'Optional: Hide alert after this date/time';



COMMENT ON COLUMN "public"."bannerAlerts"."createdBy" IS 'UUID of the user (admin) who created this alert';



COMMENT ON COLUMN "public"."bannerAlerts"."createdAt" IS 'Timestamp when the alert was created';



COMMENT ON COLUMN "public"."bannerAlerts"."updatedAt" IS 'Timestamp when the alert was last updated';



CREATE SEQUENCE IF NOT EXISTS "public"."bannerAlerts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bannerAlerts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bannerAlerts_id_seq" OWNED BY "public"."bannerAlerts"."id";



CREATE TABLE IF NOT EXISTS "public"."chatMessages" (
    "id" integer NOT NULL,
    "userId" "uuid",
    "companyName" "text" NOT NULL,
    "role" "text" NOT NULL,
    "message" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chatMessages" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."chat_messages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."chat_messages_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."chat_messages_id_seq" OWNED BY "public"."chatMessages"."id";



CREATE TABLE IF NOT EXISTS "public"."cmsPages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "content" "text" NOT NULL,
    "frontmatter" "jsonb" DEFAULT '{}'::"jsonb",
    "template" "text" DEFAULT 'default'::"text",
    "clientId" "text",
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "includeInNavigation" boolean DEFAULT false,
    "navRoles" "text"[] DEFAULT ARRAY['any'::"text"],
    "navPageType" "text" DEFAULT 'frontend'::"text",
    "navButtonStyle" "text",
    "navDesktopOnly" boolean DEFAULT false,
    "navHideWhenAuth" boolean DEFAULT false,
    "displayOrder" smallint,
    CONSTRAINT "cms_pages_nav_button_style_check" CHECK (("navButtonStyle" = ANY (ARRAY['primary'::"text", 'secondary'::"text", 'ghost'::"text", 'outline'::"text"]))),
    CONSTRAINT "cms_pages_nav_page_type_check" CHECK (("navPageType" = ANY (ARRAY['frontend'::"text", 'backend'::"text"])))
);


ALTER TABLE "public"."cmsPages" OWNER TO "postgres";


COMMENT ON TABLE "public"."cmsPages" IS 'CMS pages table for storing markdown content per deployment/client';



COMMENT ON COLUMN "public"."cmsPages"."frontmatter" IS 'Frontmatter fields stored as JSON (title, description, hero, etc.)';



COMMENT ON COLUMN "public"."cmsPages"."clientId" IS 'Optional client identifier (e.g., RAILWAY_PROJECT_NAME) for multi-client deployments';



COMMENT ON COLUMN "public"."cmsPages"."includeInNavigation" IS 'If true, this page will appear in the primary navigation menu';



COMMENT ON COLUMN "public"."cmsPages"."navRoles" IS 'Array of user roles that can see this page in navigation: any, Client, Admin, Staff';



COMMENT ON COLUMN "public"."cmsPages"."navPageType" IS 'Page type: frontend or backend';



COMMENT ON COLUMN "public"."cmsPages"."navButtonStyle" IS 'Optional button style for navigation: primary, secondary, ghost, outline';



COMMENT ON COLUMN "public"."cmsPages"."navDesktopOnly" IS 'If true, show only on desktop navigation';



COMMENT ON COLUMN "public"."cmsPages"."navHideWhenAuth" IS 'If true, hide this navigation item when user is authenticated';



CREATE TABLE IF NOT EXISTS "public"."contactSubmissions" (
    "id" integer NOT NULL,
    "firstName" character varying(100) NOT NULL,
    "lastName" character varying(100) NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(20),
    "company" character varying(255),
    "address" character varying(500),
    "projectType" character varying(50),
    "message" "text" NOT NULL,
    "files" "text"[],
    "submittedAt" timestamp with time zone DEFAULT "now"(),
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "mobileCarrier" "text",
    "smsAlerts" boolean
);


ALTER TABLE "public"."contactSubmissions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."contactsubmissions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."contactsubmissions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."contactsubmissions_id_seq" OWNED BY "public"."contactSubmissions"."id";



CREATE TABLE IF NOT EXISTS "public"."demo_bookings" (
    "id" integer NOT NULL,
    "name" character varying(255),
    "email" character varying(255),
    "phone" character varying(50),
    "company" character varying(255),
    "preferredDate" "date",
    "preferredTime" character varying(20),
    "message" "text",
    "notes" "text",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "assignedTo" "uuid",
    "confirmedAt" timestamp with time zone,
    "completedAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."demo_bookings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."demo_bookings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."demo_bookings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."demo_bookings_id_seq" OWNED BY "public"."demo_bookings"."id";



CREATE TABLE IF NOT EXISTS "public"."directMessages" (
    "id" integer NOT NULL,
    "fromUser" "uuid",
    "toUser" "uuid",
    "fromName" "text",
    "message" "text",
    "isDeleted" boolean DEFAULT false,
    "readAt" timestamp with time zone,
    "messageTimestamp" timestamp with time zone DEFAULT "now"(),
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."directMessages" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."direct_messages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."direct_messages_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."direct_messages_id_seq" OWNED BY "public"."directMessages"."id";



CREATE TABLE IF NOT EXISTS "public"."discussion" (
    "id" bigint NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "authorId" "uuid" DEFAULT "gen_random_uuid"(),
    "message" "text",
    "smsAlert" boolean,
    "projectId" integer,
    "internal" boolean,
    "notifyClient" boolean,
    "markCompleted" boolean,
    "updatedAt" timestamp with time zone,
    "parentId" integer,
    "threadPath" "text",
    "chatMessages" "text",
    "imagePaths" "jsonb",
    "imageUrls" "text",
    "companyName" "text"
);


ALTER TABLE "public"."discussion" OWNER TO "postgres";


ALTER TABLE "public"."discussion" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."discussion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."documentComponents" (
    "id" integer NOT NULL,
    "documentId" integer,
    "componentId" integer,
    "insertionPoint" character varying(100),
    "displayOrder" integer,
    "componentData" "jsonb",
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."documentComponents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documentTemplates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "promptTemplate" "text" NOT NULL,
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."documentTemplates" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."document_components_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."document_components_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."document_components_id_seq" OWNED BY "public"."documentComponents"."id";



CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" integer NOT NULL,
    "type" character varying(50) NOT NULL,
    "priority" character varying(20) NOT NULL,
    "subject" character varying(100) NOT NULL,
    "message" "text" NOT NULL,
    "user_id" "uuid",
    "user_email" character varying(255),
    "user_name" character varying(255),
    "anonymous" boolean DEFAULT false,
    "status" character varying(20) DEFAULT 'new'::character varying,
    "admin_notes" "text",
    "resolved_at" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "feedback_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "feedback_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['new'::character varying, 'in_progress'::character varying, 'resolved'::character varying, 'closed'::character varying])::"text"[]))),
    CONSTRAINT "feedback_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['bug'::character varying, 'feature'::character varying, 'improvement'::character varying, 'design'::character varying, 'general'::character varying])::"text"[])))
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."feedback_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."feedback_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."feedback_id_seq" OWNED BY "public"."feedback"."id";



CREATE TABLE IF NOT EXISTS "public"."fileCheckoutHistory" (
    "id" integer NOT NULL,
    "fileId" integer,
    "userId" "uuid",
    "action" character varying(20) NOT NULL,
    "notes" "text",
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fileCheckoutHistory" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fileCheckoutHistory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fileCheckoutHistory_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fileCheckoutHistory_id_seq" OWNED BY "public"."fileCheckoutHistory"."id";



CREATE TABLE IF NOT EXISTS "public"."fileCheckouts" (
    "id" integer NOT NULL,
    "fileId" integer NOT NULL,
    "checkedOutBy" "uuid" NOT NULL,
    "assignedTo" "uuid",
    "status" character varying(20) DEFAULT 'checked_out'::character varying NOT NULL,
    "notes" "text",
    "checkedOutAt" timestamp with time zone DEFAULT "now"(),
    "checkedInAt" timestamp with time zone,
    "cancelledAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fileCheckouts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fileCheckouts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fileCheckouts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fileCheckouts_id_seq" OWNED BY "public"."fileCheckouts"."id";



CREATE TABLE IF NOT EXISTS "public"."fileVersions" (
    "id" integer NOT NULL,
    "fileId" integer NOT NULL,
    "versionNumber" integer NOT NULL,
    "filePath" "text" NOT NULL,
    "fileSize" bigint NOT NULL,
    "fileType" "text" NOT NULL,
    "uploadedBy" "uuid" NOT NULL,
    "uploadedAt" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fileVersions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."file_versions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."file_versions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."file_versions_id_seq" OWNED BY "public"."fileVersions"."id";



CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" integer NOT NULL,
    "projectId" integer,
    "authorId" "uuid",
    "fileName" "text",
    "filePath" "text",
    "fileType" "text",
    "fileSize" bigint,
    "uploadedAt" timestamp without time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text",
    "comments" "text",
    "title" "text",
    "updatedAt" timestamp with time zone,
    "bucketName" "text" DEFAULT 'project-documents'::"text",
    "targetLocation" "text",
    "targetId" integer,
    "checkedOutBy" "uuid",
    "checkedOutAt" timestamp with time zone,
    "assignedTo" "uuid",
    "assignedAt" timestamp with time zone,
    "checkoutNotes" "text",
    "versionNumber" integer DEFAULT 1,
    "previousVersionId" integer,
    "isCurrentVersion" boolean DEFAULT true,
    "isPrivate" boolean DEFAULT false
);


ALTER TABLE "public"."files" OWNER TO "postgres";


COMMENT ON COLUMN "public"."files"."isPrivate" IS 'Whether the file is private (hidden from clients)';



CREATE TABLE IF NOT EXISTS "public"."filesGlobal" (
    "id" integer NOT NULL,
    "name" "text",
    "fileName" "text",
    "filePath" "text",
    "fileType" "text",
    "fileSize" bigint,
    "type" integer,
    "status" "text",
    "uploadedAt" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."filesGlobal" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."files_global_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."files_global_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."files_global_id_seq" OWNED BY "public"."filesGlobal"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."files_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."files_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."files_id_seq" OWNED BY "public"."files"."id";



CREATE TABLE IF NOT EXISTS "public"."generatedDocuments" (
    "id" integer NOT NULL,
    "projectId" integer,
    "templateId" integer,
    "documentName" character varying(255) NOT NULL,
    "filePath" "text",
    "fileSize" bigint,
    "generationStatus" character varying(50) DEFAULT 'pending'::character varying,
    "errorMessage" "text",
    "generationStartedAt" timestamp with time zone,
    "generationCompletedAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "createdBy" "uuid"
);


ALTER TABLE "public"."generatedDocuments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."generated_documents_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."generated_documents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."generated_documents_id_seq" OWNED BY "public"."generatedDocuments"."id";



CREATE TABLE IF NOT EXISTS "public"."globalSettings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "valueType" "text" DEFAULT 'text'::"text" NOT NULL,
    "updatedBy" "uuid",
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."globalSettings" OWNER TO "postgres";


COMMENT ON TABLE "public"."globalSettings" IS 'Stores global company settings like branding, colors, logos, and company information';



CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" bigint NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "projectId" bigint NOT NULL,
    "createdBy" "uuid" DEFAULT "auth"."uid"(),
    "subject" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "invoiceDate" "date" DEFAULT CURRENT_DATE NOT NULL,
    "dueDate" "date",
    "sentAt" timestamp with time zone,
    "subtotal" numeric(10,2) DEFAULT 0,
    "taxRate" numeric(5,4) DEFAULT 0,
    "taxAmount" numeric(10,2) DEFAULT 0,
    "discountAmount" numeric(10,2) DEFAULT 0,
    "totalAmount" numeric(10,2) DEFAULT 0,
    "paymentTerms" "text" DEFAULT '30 days'::"text",
    "notes" "text",
    "catalogLineItems" "jsonb",
    "proposalNotes" "text",
    "paymentMethod" "text",
    "paymentReference" "text",
    "paidAmount" numeric(10,2) DEFAULT 0,
    "outstandingBalance" numeric(10,2),
    "paymentNotes" "text",
    "paidAt" timestamp with time zone,
    "templateId" integer,
    CONSTRAINT "invoices_discount_check" CHECK (("discountAmount" >= (0)::numeric)),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'paid'::"text", 'cancelled'::"text", 'overdue'::"text", 'proposal'::"text"]))),
    CONSTRAINT "invoices_tax_rate_check" CHECK ((("taxRate" >= (0)::numeric) AND ("taxRate" <= (1)::numeric))),
    CONSTRAINT "invoices_total_amount_check" CHECK (("totalAmount" >= (0)::numeric))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


COMMENT ON TABLE "public"."invoices" IS 'Invoice records for projects with financial tracking';



COMMENT ON COLUMN "public"."invoices"."subject" IS 'Invoice subject/title for proposals and invoices';



COMMENT ON COLUMN "public"."invoices"."status" IS 'Invoice status: draft, sent, paid, cancelled, overdue, proposal';



COMMENT ON COLUMN "public"."invoices"."paymentTerms" IS 'Payment terms like "30 days", "Net 15", etc.';



ALTER TABLE "public"."invoices" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."invoices_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lineItemsCatalog" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "unitPrice" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "category" character varying(100),
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "createdBy" "uuid"
);


ALTER TABLE "public"."lineItemsCatalog" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."line_items_catalog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."line_items_catalog_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."line_items_catalog_id_seq" OWNED BY "public"."lineItemsCatalog"."id";



CREATE TABLE IF NOT EXISTS "public"."magicLinkTokens" (
    "id" integer NOT NULL,
    "token" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "redirectTo" character varying(500),
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "usedAt" timestamp with time zone
);


ALTER TABLE "public"."magicLinkTokens" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."magic_link_tokens_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."magic_link_tokens_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."magic_link_tokens_id_seq" OWNED BY "public"."magicLinkTokens"."id";



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" integer NOT NULL,
    "userId" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "type" character varying(50) DEFAULT 'info'::character varying,
    "priority" character varying(20) DEFAULT 'normal'::character varying,
    "viewed" boolean DEFAULT false,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "expiresAt" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "actionUrl" character varying(500),
    "actionText" character varying(100)
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Internal notifications system for users';



COMMENT ON COLUMN "public"."notifications"."userId" IS 'User who receives the notification';



COMMENT ON COLUMN "public"."notifications"."title" IS 'Short title for the notification';



COMMENT ON COLUMN "public"."notifications"."message" IS 'Main notification message';



COMMENT ON COLUMN "public"."notifications"."type" IS 'Notification type: info, success, warning, error';



COMMENT ON COLUMN "public"."notifications"."priority" IS 'Priority level: low, normal, high, urgent';



COMMENT ON COLUMN "public"."notifications"."viewed" IS 'Whether the user has viewed this notification';



COMMENT ON COLUMN "public"."notifications"."expiresAt" IS 'Optional expiration date for the notification';



COMMENT ON COLUMN "public"."notifications"."metadata" IS 'Additional data stored as JSON';



COMMENT ON COLUMN "public"."notifications"."actionUrl" IS 'Optional URL for action button';



COMMENT ON COLUMN "public"."notifications"."actionText" IS 'Text for action button';



CREATE SEQUENCE IF NOT EXISTS "public"."notifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."notifications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notifications_id_seq" OWNED BY "public"."notifications"."id";



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" bigint NOT NULL,
    "invoiceId" bigint,
    "amount" numeric(10,2) NOT NULL,
    "paymentMethod" "text" NOT NULL,
    "paymentReference" "text",
    "paymentDate" "date" DEFAULT CURRENT_DATE NOT NULL,
    "notes" "text",
    "createdBy" "uuid",
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


ALTER TABLE "public"."payments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."payments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pdfGenerationHistory" (
    "id" integer NOT NULL,
    "jobId" integer,
    "templateId" integer,
    "projectId" integer,
    "authorId" "uuid",
    "recipientEmail" character varying(255),
    "sentAt" timestamp with time zone,
    "downloadCount" integer DEFAULT 0,
    "lastDownloadedAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pdfGenerationHistory" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pdfGenerationHistory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pdfGenerationHistory_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pdfGenerationHistory_id_seq" OWNED BY "public"."pdfGenerationHistory"."id";



CREATE TABLE IF NOT EXISTS "public"."pdfGenerationJobs" (
    "id" integer NOT NULL,
    "templateId" integer,
    "projectId" integer,
    "authorId" "uuid",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "fileName" character varying(255),
    "filePath" "text",
    "fileSize" integer,
    "generationData" "jsonb",
    "errorMessage" "text",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "completedAt" timestamp with time zone
);


ALTER TABLE "public"."pdfGenerationJobs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pdfGenerationJobs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pdfGenerationJobs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pdfGenerationJobs_id_seq" OWNED BY "public"."pdfGenerationJobs"."id";



CREATE TABLE IF NOT EXISTS "public"."pdfTemplateFields" (
    "id" integer NOT NULL,
    "templateId" integer,
    "fieldName" character varying(100) NOT NULL,
    "fieldType" character varying(50) NOT NULL,
    "fieldValue" "text",
    "isRequired" boolean DEFAULT false,
    "regexPattern" "text",
    "placeholder" "text",
    "orderIndex" integer DEFAULT 0,
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pdfTemplateFields" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pdfTemplateFields_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pdfTemplateFields_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pdfTemplateFields_id_seq" OWNED BY "public"."pdfTemplateFields"."id";



CREATE TABLE IF NOT EXISTS "public"."pdfTemplates" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "content" "text" NOT NULL,
    "templateType" character varying(50) DEFAULT 'body'::character varying,
    "pageSize" character varying(20) DEFAULT '8.5x11'::character varying,
    "margins" "jsonb" DEFAULT '{"top": "1in", "left": "1in", "right": "1in", "bottom": "1in"}'::"jsonb",
    "isDefault" boolean DEFAULT false,
    "isActive" boolean DEFAULT true,
    "authorId" "uuid",
    "projectId" integer,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pdfTemplates" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pdfTemplates_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pdfTemplates_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pdfTemplates_id_seq" OWNED BY "public"."pdfTemplates"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "companyName" "text",
    "role" "text" DEFAULT 'Client'::"text",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "firstName" "text",
    "lastName" "text",
    "mobileCarrier" "text",
    "avatarUrl" "text",
    "smsAlerts" boolean,
    "phone" "text",
    "email" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projectStatuses" (
    "id" integer NOT NULL,
    "statusCode" integer NOT NULL,
    "adminStatusName" character varying(100) NOT NULL,
    "clientEmailContent" "text",
    "estTime" character varying(50),
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"(),
    "buttonText" "text",
    "clientEmailSubject" "text",
    "modalAdmin" "text",
    "modalClient" "text",
    "buttonLink" "text" DEFAULT '/dashboard'::"text",
    "clientStatusAction" "text",
    "modalAutoRedirectClient" "text" DEFAULT '/dashboard'::"text",
    "adminEmailContent" "text",
    "adminEmailSubject" "text",
    "modalAutoRedirectAdmin" "text" DEFAULT '/dashboard'::"text",
    "clientStatusName" "text",
    "statusColor" "text",
    "adminStatusAction" "text",
    "status" "text",
    "emailToRoles" "jsonb",
    "nagEmailClient" "text",
    "adminStatusTab" "text",
    "clientStatusTab" "text"
);


ALTER TABLE "public"."projectStatuses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."project_statuses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."project_statuses_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."project_statuses_id_seq" OWNED BY "public"."projectStatuses"."id";



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" integer NOT NULL,
    "authorId" "uuid",
    "description" "text",
    "address" "text",
    "createdAt" timestamp with time zone,
    "sqFt" integer DEFAULT 0,
    "newConstruction" boolean,
    "status" integer,
    "title" "text",
    "building" "jsonb",
    "project" "jsonb",
    "service" "jsonb",
    "requestedDocs" "jsonb",
    "assignedToId" "uuid",
    "updatedAt" timestamp with time zone,
    "units" integer DEFAULT 1,
    "architect" "text",
    "featured" boolean,
    "log" "jsonb" DEFAULT '[]'::"jsonb",
    "subject" "text",
    "featuredImageId" "text",
    "incompleteDiscussions" integer,
    "tier" "jsonb",
    "elapsedTime" interval,
    "featuredImageData" "jsonb",
    "dueDate" timestamp with time zone,
    "punchlistCount" smallint,
    "nfpaVersion" "text",
    "exteriorBeacon" "text",
    "siteAccess" "text",
    "fireSprinklerInstallation" "text",
    "fireServiceType" "jsonb",
    "hazardousMaterial" "text",
    "commencementOfConstruction" "text",
    "suppressionDetectionSystems" "text",
    "buildingHeight" "text",
    "floorsBelowGrade" "text",
    "hpsCommodities" "text",
    "contractData" "jsonb",
    "contractPdfUrl" "text",
    "punchlistComplete" smallint
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."projects"."building" IS 'Building type selection (Residential, Mixed use, Mercantile, etc.)';



COMMENT ON COLUMN "public"."projects"."project" IS 'Project type selection (Sprinkler, Alarm, Mechanical, etc.)';



COMMENT ON COLUMN "public"."projects"."service" IS 'Service type selection (Pump & Tank, 2'' copper, etc.)';



COMMENT ON COLUMN "public"."projects"."requestedDocs" IS 'Requested documents selection (Sprinkler, Alarm, NFPA 241, etc.)';



COMMENT ON COLUMN "public"."projects"."units" IS 'Number of units for the project (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50)';



COMMENT ON COLUMN "public"."projects"."log" IS 'Simple JSON log of project changes and activities';



COMMENT ON COLUMN "public"."projects"."subject" IS 'Custom subject line for the project proposal';



COMMENT ON COLUMN "public"."projects"."featuredImageId" IS 'ID of the featured image file from files table';



COMMENT ON COLUMN "public"."projects"."dueDate" IS 'Automatically set to created_at + 48 hours for new projects. Can be manually updated if needed.';



CREATE SEQUENCE IF NOT EXISTS "public"."projects_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."projects_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."projects_id_seq" OWNED BY "public"."projects"."id";



CREATE TABLE IF NOT EXISTS "public"."punchlist" (
    "id" integer NOT NULL,
    "projectId" integer NOT NULL,
    "authorId" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "internal" boolean DEFAULT false,
    "smsAlert" boolean DEFAULT false,
    "parentId" integer,
    "imagePaths" "text"[] DEFAULT '{}'::"text"[],
    "markCompleted" boolean DEFAULT false,
    "companyName" "text",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."punchlist" OWNER TO "postgres";


COMMENT ON TABLE "public"."punchlist" IS 'Stores punchlist items for projects - similar to discussions but focused on project completion tasks';



COMMENT ON COLUMN "public"."punchlist"."id" IS 'Primary key for punchlist items';



COMMENT ON COLUMN "public"."punchlist"."projectId" IS 'References the project this punchlist item belongs to';



COMMENT ON COLUMN "public"."punchlist"."authorId" IS 'References the user who created this punchlist item';



COMMENT ON COLUMN "public"."punchlist"."message" IS 'The content/description of the punchlist item';



COMMENT ON COLUMN "public"."punchlist"."internal" IS 'Whether this punchlist item is internal only (not visible to clients)';



COMMENT ON COLUMN "public"."punchlist"."smsAlert" IS 'Whether SMS alerts should be sent for this item';



COMMENT ON COLUMN "public"."punchlist"."parentId" IS 'References the parent punchlist item this is replying to. NULL = top-level item';



COMMENT ON COLUMN "public"."punchlist"."imagePaths" IS 'Array of image file paths attached to this punchlist item';



COMMENT ON COLUMN "public"."punchlist"."markCompleted" IS 'Whether this punchlist item has been marked as completed';



COMMENT ON COLUMN "public"."punchlist"."companyName" IS 'Company name of the author (denormalized for performance)';



COMMENT ON COLUMN "public"."punchlist"."createdAt" IS 'When this punchlist item was created';



COMMENT ON COLUMN "public"."punchlist"."updatedAt" IS 'When this punchlist item was last updated';



CREATE SEQUENCE IF NOT EXISTS "public"."punchlist_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."punchlist_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."punchlist_id_seq" OWNED BY "public"."punchlist"."id";



CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "time_zone" character varying(50) DEFAULT 'America/New_York'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."schedules" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."schedules_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."schedules_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."schedules_id_seq" OWNED BY "public"."schedules"."id";



CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" integer NOT NULL,
    "title" character varying(500) NOT NULL,
    "description" "text",
    "category" character varying(100),
    "usageCount" integer DEFAULT 0,
    "isActive" boolean DEFAULT true,
    "createdBy" "uuid",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subjects" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."subjects_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."subjects_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."subjects_id_seq" OWNED BY "public"."subjects"."id";



CREATE TABLE IF NOT EXISTS "public"."template_component_mapping" (
    "id" integer NOT NULL,
    "templateId" integer,
    "componentId" integer,
    "insertionPoint" character varying(100),
    "displayOrder" integer,
    "isRequired" boolean DEFAULT false,
    "createdAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."template_component_mapping" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."template_component_mapping_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."template_component_mapping_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."template_component_mapping_id_seq" OWNED BY "public"."template_component_mapping"."id";



CREATE TABLE IF NOT EXISTS "public"."tutorialConfigs" (
    "id" integer NOT NULL,
    "userId" "uuid" NOT NULL,
    "tutorialId" character varying(100) NOT NULL,
    "completed" boolean DEFAULT false,
    "dismissed" boolean DEFAULT false,
    "lastStep" integer DEFAULT 0,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tutorialConfigs" OWNER TO "postgres";


COMMENT ON TABLE "public"."tutorialConfigs" IS 'Stores user tutorial progress and preferences';



COMMENT ON COLUMN "public"."tutorialConfigs"."userId" IS 'Reference to the user who owns this tutorial config';



COMMENT ON COLUMN "public"."tutorialConfigs"."tutorialId" IS 'Identifier for the specific tutorial (e.g., "onboarding", "dashboard")';



COMMENT ON COLUMN "public"."tutorialConfigs"."completed" IS 'Whether the user has completed this tutorial';



COMMENT ON COLUMN "public"."tutorialConfigs"."dismissed" IS 'Whether the user has dismissed this tutorial';



COMMENT ON COLUMN "public"."tutorialConfigs"."lastStep" IS 'The last step the user reached in the tutorial';



CREATE SEQUENCE IF NOT EXISTS "public"."tutorial_configs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tutorial_configs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tutorial_configs_id_seq" OWNED BY "public"."tutorialConfigs"."id";



CREATE TABLE IF NOT EXISTS "public"."webhooks" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "subscriber_url" character varying(500) NOT NULL,
    "event_triggers" "text"[] NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhooks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."webhooks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."webhooks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."webhooks_id_seq" OWNED BY "public"."webhooks"."id";



ALTER TABLE ONLY "public"."bannerAlerts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bannerAlerts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."chatMessages" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."chat_messages_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."contactSubmissions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."contactsubmissions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."demo_bookings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."demo_bookings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."directMessages" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."direct_messages_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."documentComponents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."document_components_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."feedback" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."feedback_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fileCheckoutHistory" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fileCheckoutHistory_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fileCheckouts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fileCheckouts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fileVersions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."file_versions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."files" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."files_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."filesGlobal" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."files_global_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."generatedDocuments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."generated_documents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lineItemsCatalog" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."line_items_catalog_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."magicLinkTokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."magic_link_tokens_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notifications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pdfGenerationHistory" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pdfGenerationHistory_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pdfGenerationJobs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pdfGenerationJobs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pdfTemplateFields" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pdfTemplateFields_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pdfTemplates" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pdfTemplates_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."projectStatuses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."project_statuses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."projects" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."projects_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."punchlist" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."punchlist_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."schedules" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."schedules_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."subjects" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."subjects_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."template_component_mapping" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."template_component_mapping_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tutorialConfigs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tutorial_configs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."webhooks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."webhooks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_agent_conversations"
    ADD CONSTRAINT "ai_agent_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agent_knowledge"
    ADD CONSTRAINT "ai_agent_knowledge_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agent_messages"
    ADD CONSTRAINT "ai_agent_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agent_project_memory"
    ADD CONSTRAINT "ai_agent_project_memory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agent_project_memory"
    ADD CONSTRAINT "ai_agent_project_memory_projectId_key" UNIQUE ("projectId");



ALTER TABLE ONLY "public"."ai_agent_usage"
    ADD CONSTRAINT "ai_agent_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_generated_documents"
    ADD CONSTRAINT "ai_generated_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_generations"
    ADD CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bannerAlerts"
    ADD CONSTRAINT "bannerAlerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chatMessages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cmsPages"
    ADD CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contactSubmissions"
    ADD CONSTRAINT "contactsubmissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."demo_bookings"
    ADD CONSTRAINT "demo_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."directMessages"
    ADD CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discussion"
    ADD CONSTRAINT "discussion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documentComponents"
    ADD CONSTRAINT "document_components_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documentTemplates"
    ADD CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fileCheckoutHistory"
    ADD CONSTRAINT "fileCheckoutHistory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fileCheckouts"
    ADD CONSTRAINT "fileCheckouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fileVersions"
    ADD CONSTRAINT "file_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."filesGlobal"
    ADD CONSTRAINT "files_global_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generatedDocuments"
    ADD CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."globalSettings"
    ADD CONSTRAINT "global_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."globalSettings"
    ADD CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lineItemsCatalog"
    ADD CONSTRAINT "line_items_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."magicLinkTokens"
    ADD CONSTRAINT "magic_link_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."magicLinkTokens"
    ADD CONSTRAINT "magic_link_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdfGenerationHistory"
    ADD CONSTRAINT "pdfGenerationHistory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdfGenerationJobs"
    ADD CONSTRAINT "pdfGenerationJobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdfTemplateFields"
    ADD CONSTRAINT "pdfTemplateFields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdfTemplates"
    ADD CONSTRAINT "pdfTemplates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projectStatuses"
    ADD CONSTRAINT "project_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projectStatuses"
    ADD CONSTRAINT "project_statuses_status_code_key" UNIQUE ("statusCode");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."punchlist"
    ADD CONSTRAINT "punchlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_component_mapping"
    ADD CONSTRAINT "template_component_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tutorialConfigs"
    ADD CONSTRAINT "tutorial_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tutorialConfigs"
    ADD CONSTRAINT "tutorial_configs_user_id_tutorial_id_key" UNIQUE ("userId", "tutorialId");



ALTER TABLE ONLY "public"."cmsPages"
    ADD CONSTRAINT "unique_slug_per_client" UNIQUE ("slug", "clientId");



ALTER TABLE ONLY "public"."webhooks"
    ADD CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id");



CREATE INDEX "bannerAlerts_createdBy_idx" ON "public"."bannerAlerts" USING "btree" ("createdBy");



CREATE INDEX "bannerAlerts_isActive_idx" ON "public"."bannerAlerts" USING "btree" ("isActive");



CREATE INDEX "bannerAlerts_startDate_endDate_idx" ON "public"."bannerAlerts" USING "btree" ("startDate", "endDate");



CREATE INDEX "idx_ai_documents_author_id" ON "public"."ai_generated_documents" USING "btree" ("authorId");



CREATE INDEX "idx_ai_documents_project_id" ON "public"."ai_generated_documents" USING "btree" ("projectId");



CREATE INDEX "idx_ai_documents_template_id" ON "public"."ai_generated_documents" USING "btree" ("templateId");



CREATE INDEX "idx_ai_generations_created_at" ON "public"."ai_generations" USING "btree" ("createdAt");



CREATE INDEX "idx_ai_generations_document_id" ON "public"."ai_generations" USING "btree" ("documentId");



CREATE INDEX "idx_ai_knowledge_active" ON "public"."ai_agent_knowledge" USING "btree" ("isActive");



CREATE INDEX "idx_ai_knowledge_category" ON "public"."ai_agent_knowledge" USING "btree" ("category");



CREATE INDEX "idx_ai_knowledge_created" ON "public"."ai_agent_knowledge" USING "btree" ("createdAt" DESC);



CREATE INDEX "idx_ai_knowledge_priority" ON "public"."ai_agent_knowledge" USING "btree" ("priority" DESC);



CREATE INDEX "idx_ai_knowledge_project" ON "public"."ai_agent_knowledge" USING "btree" ("projectId");



CREATE INDEX "idx_ai_knowledge_tags" ON "public"."ai_agent_knowledge" USING "gin" ("tags");



CREATE INDEX "idx_ai_project_memory_project" ON "public"."ai_agent_project_memory" USING "btree" ("projectId");



CREATE INDEX "idx_chat_messages_timestamp" ON "public"."chatMessages" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_chat_messages_user_id" ON "public"."chatMessages" USING "btree" ("userId");



CREATE INDEX "idx_cms_pages_active" ON "public"."cmsPages" USING "btree" ("isActive") WHERE ("isActive" = true);



CREATE INDEX "idx_cms_pages_client_id" ON "public"."cmsPages" USING "btree" ("clientId");



CREATE INDEX "idx_cms_pages_navigation" ON "public"."cmsPages" USING "btree" ("includeInNavigation") WHERE ("includeInNavigation" = true);



CREATE INDEX "idx_cms_pages_slug" ON "public"."cmsPages" USING "btree" ("slug");



CREATE INDEX "idx_contactsubmissions_email" ON "public"."contactSubmissions" USING "btree" ("email");



CREATE INDEX "idx_contactsubmissions_submittedat" ON "public"."contactSubmissions" USING "btree" ("submittedAt");



CREATE INDEX "idx_conversations_created_at" ON "public"."ai_agent_conversations" USING "btree" ("createdAt");



CREATE INDEX "idx_conversations_project_id" ON "public"."ai_agent_conversations" USING "btree" ("projectId");



CREATE INDEX "idx_conversations_user_id" ON "public"."ai_agent_conversations" USING "btree" ("userId");



CREATE INDEX "idx_direct_messages_from_user" ON "public"."directMessages" USING "btree" ("fromUser");



CREATE INDEX "idx_direct_messages_to_user" ON "public"."directMessages" USING "btree" ("toUser");



CREATE INDEX "idx_discussion_author_id" ON "public"."discussion" USING "btree" ("authorId");



CREATE INDEX "idx_discussion_created_at" ON "public"."discussion" USING "btree" ("createdAt" DESC);



CREATE INDEX "idx_discussion_project_id" ON "public"."discussion" USING "btree" ("projectId");



CREATE INDEX "idx_document_templates_active" ON "public"."documentTemplates" USING "btree" ("isActive");



CREATE INDEX "idx_document_templates_category" ON "public"."documentTemplates" USING "btree" ("category");



CREATE INDEX "idx_feedback_created_at" ON "public"."feedback" USING "btree" ("createdAt");



CREATE INDEX "idx_feedback_priority" ON "public"."feedback" USING "btree" ("priority");



CREATE INDEX "idx_feedback_status" ON "public"."feedback" USING "btree" ("status");



CREATE INDEX "idx_feedback_type" ON "public"."feedback" USING "btree" ("type");



CREATE INDEX "idx_feedback_user_id" ON "public"."feedback" USING "btree" ("user_id");



CREATE INDEX "idx_fileCheckouts_checkedOutBy" ON "public"."fileCheckouts" USING "btree" ("checkedOutBy");



CREATE INDEX "idx_fileCheckouts_fileId" ON "public"."fileCheckouts" USING "btree" ("fileId");



CREATE INDEX "idx_fileCheckouts_fileId_status" ON "public"."fileCheckouts" USING "btree" ("fileId", "status");



CREATE INDEX "idx_fileCheckouts_status" ON "public"."fileCheckouts" USING "btree" ("status");



CREATE INDEX "idx_file_versions_file_id" ON "public"."fileVersions" USING "btree" ("fileId");



CREATE INDEX "idx_file_versions_uploaded_by" ON "public"."fileVersions" USING "btree" ("uploadedBy");



CREATE INDEX "idx_file_versions_version" ON "public"."fileVersions" USING "btree" ("fileId", "versionNumber");



CREATE INDEX "idx_files_assigned_to" ON "public"."files" USING "btree" ("assignedTo");



CREATE INDEX "idx_files_author_id" ON "public"."files" USING "btree" ("authorId");



CREATE INDEX "idx_files_bucket_name" ON "public"."files" USING "btree" ("bucketName");



CREATE INDEX "idx_files_bucket_target" ON "public"."files" USING "btree" ("bucketName", "targetLocation", "targetId");



CREATE INDEX "idx_files_checked_out_by" ON "public"."files" USING "btree" ("checkedOutBy");



CREATE INDEX "idx_files_comments" ON "public"."files" USING "gin" ("to_tsvector"('"english"'::"regconfig", "comments"));



CREATE INDEX "idx_files_is_private" ON "public"."files" USING "btree" ("isPrivate");



CREATE INDEX "idx_files_project_id" ON "public"."files" USING "btree" ("projectId");



CREATE INDEX "idx_files_projectid" ON "public"."files" USING "btree" ("projectId");



CREATE INDEX "idx_files_projectid_uploadedat" ON "public"."files" USING "btree" ("projectId", "uploadedAt" DESC);



CREATE INDEX "idx_files_status" ON "public"."files" USING "btree" ("status");



CREATE INDEX "idx_files_target_id" ON "public"."files" USING "btree" ("targetId");



CREATE INDEX "idx_files_target_location" ON "public"."files" USING "btree" ("targetLocation");



CREATE INDEX "idx_files_title" ON "public"."files" USING "btree" ("title");



CREATE INDEX "idx_files_uploaded_at" ON "public"."files" USING "btree" ("uploadedAt");



CREATE INDEX "idx_generated_documents_project" ON "public"."generatedDocuments" USING "btree" ("projectId");



CREATE INDEX "idx_generated_documents_status" ON "public"."generatedDocuments" USING "btree" ("generationStatus");



CREATE INDEX "idx_global_settings_category" ON "public"."globalSettings" USING "btree" ("category");



CREATE INDEX "idx_global_settings_key" ON "public"."globalSettings" USING "btree" ("key");



CREATE INDEX "idx_invoices_created_at" ON "public"."invoices" USING "btree" ("createdAt");



CREATE INDEX "idx_invoices_created_by" ON "public"."invoices" USING "btree" ("createdBy");



CREATE INDEX "idx_invoices_due_date" ON "public"."invoices" USING "btree" ("dueDate");



CREATE INDEX "idx_invoices_project_id" ON "public"."invoices" USING "btree" ("projectId");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE INDEX "idx_line_items_catalog_active" ON "public"."lineItemsCatalog" USING "btree" ("isActive");



CREATE INDEX "idx_line_items_catalog_category" ON "public"."lineItemsCatalog" USING "btree" ("category");



CREATE INDEX "idx_line_items_catalog_name" ON "public"."lineItemsCatalog" USING "btree" ("name");



CREATE INDEX "idx_magic_link_tokens_email" ON "public"."magicLinkTokens" USING "btree" ("email");



CREATE INDEX "idx_magic_link_tokens_expires_at" ON "public"."magicLinkTokens" USING "btree" ("expiresAt");



CREATE INDEX "idx_magic_link_tokens_token" ON "public"."magicLinkTokens" USING "btree" ("token");



CREATE INDEX "idx_messages_conversation_id" ON "public"."ai_agent_messages" USING "btree" ("conversationId");



CREATE INDEX "idx_messages_created_at" ON "public"."ai_agent_messages" USING "btree" ("createdAt");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("createdAt");



CREATE INDEX "idx_notifications_priority" ON "public"."notifications" USING "btree" ("priority");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("userId");



CREATE INDEX "idx_notifications_user_viewed_created" ON "public"."notifications" USING "btree" ("userId", "viewed", "createdAt" DESC);



CREATE INDEX "idx_notifications_userid" ON "public"."notifications" USING "btree" ("userId");



CREATE INDEX "idx_notifications_userid_createdat" ON "public"."notifications" USING "btree" ("userId", "createdAt" DESC);



CREATE INDEX "idx_notifications_userid_viewed" ON "public"."notifications" USING "btree" ("userId", "viewed");



CREATE INDEX "idx_notifications_viewed" ON "public"."notifications" USING "btree" ("viewed");



CREATE INDEX "idx_pdf_generation_jobs_project" ON "public"."pdfGenerationJobs" USING "btree" ("projectId");



CREATE INDEX "idx_pdf_generation_jobs_status" ON "public"."pdfGenerationJobs" USING "btree" ("status");



CREATE INDEX "idx_pdf_template_fields_template" ON "public"."pdfTemplateFields" USING "btree" ("templateId");



CREATE INDEX "idx_pdf_templates_active" ON "public"."pdfTemplates" USING "btree" ("isActive");



CREATE INDEX "idx_pdf_templates_author" ON "public"."pdfTemplates" USING "btree" ("authorId");



CREATE INDEX "idx_pdf_templates_project" ON "public"."pdfTemplates" USING "btree" ("projectId");



CREATE INDEX "idx_pdf_templates_type" ON "public"."pdfTemplates" USING "btree" ("templateType");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_project_statuses_status_code" ON "public"."projectStatuses" USING "btree" ("statusCode");



CREATE INDEX "idx_projects_assigned_to" ON "public"."projects" USING "btree" ("assignedToId");



CREATE INDEX "idx_projects_assignedtoid" ON "public"."projects" USING "btree" ("assignedToId");



CREATE INDEX "idx_projects_author_id" ON "public"."projects" USING "btree" ("authorId");



CREATE INDEX "idx_projects_authorid" ON "public"."projects" USING "btree" ("authorId");



CREATE INDEX "idx_projects_authorid_createdat" ON "public"."projects" USING "btree" ("authorId", "createdAt" DESC);



CREATE INDEX "idx_projects_building" ON "public"."projects" USING "btree" ("building");



CREATE INDEX "idx_projects_createdat" ON "public"."projects" USING "btree" ("createdAt" DESC);



CREATE INDEX "idx_projects_featured" ON "public"."projects" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_projects_log" ON "public"."projects" USING "gin" ("log");



CREATE INDEX "idx_projects_project" ON "public"."projects" USING "btree" ("project");



CREATE INDEX "idx_projects_requested_docs" ON "public"."projects" USING "btree" ("requestedDocs");



CREATE INDEX "idx_projects_service" ON "public"."projects" USING "btree" ("service");



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_projects_subject" ON "public"."projects" USING "btree" ("subject");



CREATE INDEX "idx_projects_units" ON "public"."projects" USING "btree" ("units");



CREATE INDEX "idx_projects_updatedat" ON "public"."projects" USING "btree" ("updatedAt" DESC);



CREATE INDEX "idx_punchlist_author_id" ON "public"."punchlist" USING "btree" ("authorId");



CREATE INDEX "idx_punchlist_created_at" ON "public"."punchlist" USING "btree" ("createdAt");



CREATE INDEX "idx_punchlist_internal" ON "public"."punchlist" USING "btree" ("internal");



CREATE INDEX "idx_punchlist_mark_completed" ON "public"."punchlist" USING "btree" ("markCompleted");



CREATE INDEX "idx_punchlist_parent_id" ON "public"."punchlist" USING "btree" ("parentId");



CREATE INDEX "idx_punchlist_project_completed" ON "public"."punchlist" USING "btree" ("projectId", "markCompleted");



CREATE INDEX "idx_punchlist_project_id" ON "public"."punchlist" USING "btree" ("projectId");



CREATE INDEX "idx_punchlist_project_internal" ON "public"."punchlist" USING "btree" ("projectId", "internal");



CREATE INDEX "idx_schedules_user_id" ON "public"."schedules" USING "btree" ("user_id");



CREATE INDEX "idx_subjects_active" ON "public"."subjects" USING "btree" ("isActive");



CREATE INDEX "idx_subjects_category" ON "public"."subjects" USING "btree" ("category");



CREATE INDEX "idx_subjects_title" ON "public"."subjects" USING "btree" ("title");



CREATE INDEX "idx_tutorial_configs_completed" ON "public"."tutorialConfigs" USING "btree" ("completed");



CREATE INDEX "idx_tutorial_configs_dismissed" ON "public"."tutorialConfigs" USING "btree" ("dismissed");



CREATE INDEX "idx_tutorial_configs_tutorial_id" ON "public"."tutorialConfigs" USING "btree" ("tutorialId");



CREATE INDEX "idx_tutorial_configs_user_id" ON "public"."tutorialConfigs" USING "btree" ("userId");



CREATE INDEX "idx_usage_conversation_id" ON "public"."ai_agent_usage" USING "btree" ("conversationId");



CREATE INDEX "idx_usage_created_at" ON "public"."ai_agent_usage" USING "btree" ("createdAt");



CREATE INDEX "idx_usage_request_type" ON "public"."ai_agent_usage" USING "btree" ("requestType");



CREATE INDEX "idx_usage_user_id" ON "public"."ai_agent_usage" USING "btree" ("userId");



CREATE OR REPLACE TRIGGER "set_due_date_on_insert" BEFORE INSERT ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_project_due_date_on_insert"();



CREATE OR REPLACE TRIGGER "set_due_date_on_status_change" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_project_due_date_on_status_change"();



CREATE OR REPLACE TRIGGER "trigger_assign_default_discussion" AFTER INSERT ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."assign_default_discussion_to_project"();



COMMENT ON TRIGGER "trigger_assign_default_discussion" ON "public"."projects" IS 'Automatically creates default discussion entries when a new project is created.';



CREATE OR REPLACE TRIGGER "trigger_auto_create_punchlist" AFTER INSERT ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."auto_create_punchlist_items"();



COMMENT ON TRIGGER "trigger_auto_create_punchlist" ON "public"."projects" IS 'Automatically creates punchlist items when a new project is created.';



CREATE OR REPLACE TRIGGER "trigger_update_contactsubmissions_updatedat" BEFORE UPDATE ON "public"."contactSubmissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_contact_submissions_updatedat"();



CREATE OR REPLACE TRIGGER "trigger_update_punchlist_count" AFTER INSERT OR DELETE OR UPDATE ON "public"."punchlist" FOR EACH ROW EXECUTE FUNCTION "public"."update_punchlist_count"();



COMMENT ON TRIGGER "trigger_update_punchlist_count" ON "public"."punchlist" IS 'Automatically updates punchlist count when punchlist items change.';



CREATE OR REPLACE TRIGGER "update_ai_documents_updated_at" BEFORE UPDATE ON "public"."ai_generated_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_knowledge_updated_at_trigger" BEFORE UPDATE ON "public"."ai_agent_knowledge" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_knowledge_updated_at"();



CREATE OR REPLACE TRIGGER "update_ai_project_memory_updated_at_trigger" BEFORE UPDATE ON "public"."ai_agent_project_memory" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_knowledge_updated_at"();



CREATE OR REPLACE TRIGGER "update_conversations_updated_at" BEFORE UPDATE ON "public"."ai_agent_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_document_templates_updated_at" BEFORE UPDATE ON "public"."documentTemplates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_fileCheckouts_timestamp" BEFORE UPDATE ON "public"."fileCheckouts" FOR EACH ROW EXECUTE FUNCTION "public"."update_filecheckouts_timestamp"();



CREATE OR REPLACE TRIGGER "update_punchlist_counts_delete" AFTER DELETE ON "public"."punchlist" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_punchlist_counts"();



CREATE OR REPLACE TRIGGER "update_punchlist_counts_insert" AFTER INSERT ON "public"."punchlist" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_punchlist_counts"();



CREATE OR REPLACE TRIGGER "update_punchlist_counts_update" AFTER UPDATE ON "public"."punchlist" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_punchlist_counts"();



ALTER TABLE ONLY "public"."ai_agent_conversations"
    ADD CONSTRAINT "ai_agent_conversations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_agent_conversations"
    ADD CONSTRAINT "ai_agent_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_agent_knowledge"
    ADD CONSTRAINT "ai_agent_knowledge_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_agent_knowledge"
    ADD CONSTRAINT "ai_agent_knowledge_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_agent_messages"
    ADD CONSTRAINT "ai_agent_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."ai_agent_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_agent_project_memory"
    ADD CONSTRAINT "ai_agent_project_memory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_agent_project_memory"
    ADD CONSTRAINT "ai_agent_project_memory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_agent_usage"
    ADD CONSTRAINT "ai_agent_usage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."ai_agent_conversations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_agent_usage"
    ADD CONSTRAINT "ai_agent_usage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."ai_agent_messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_agent_usage"
    ADD CONSTRAINT "ai_agent_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_generated_documents"
    ADD CONSTRAINT "ai_generated_documents_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_generated_documents"
    ADD CONSTRAINT "ai_generated_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_generated_documents"
    ADD CONSTRAINT "ai_generated_documents_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."documentTemplates"("id");



ALTER TABLE ONLY "public"."ai_generations"
    ADD CONSTRAINT "ai_generations_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."ai_generated_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bannerAlerts"
    ADD CONSTRAINT "bannerAlerts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."demo_bookings"
    ADD CONSTRAINT "demo_bookings_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."directMessages"
    ADD CONSTRAINT "direct_messages_fromUser_fkey" FOREIGN KEY ("fromUser") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."directMessages"
    ADD CONSTRAINT "direct_messages_toUser_fkey" FOREIGN KEY ("toUser") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion"
    ADD CONSTRAINT "discussion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fileCheckoutHistory"
    ADD CONSTRAINT "fileCheckoutHistory_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fileCheckoutHistory"
    ADD CONSTRAINT "fileCheckoutHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."fileCheckouts"
    ADD CONSTRAINT "fileCheckouts_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fileCheckouts"
    ADD CONSTRAINT "fileCheckouts_checkedOutBy_fkey" FOREIGN KEY ("checkedOutBy") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fileCheckouts"
    ADD CONSTRAINT "fileCheckouts_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fileVersions"
    ADD CONSTRAINT "file_versions_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fileVersions"
    ADD CONSTRAINT "file_versions_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_assignedto_fkey" FOREIGN KEY ("assignedTo") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_checkedoutby_fkey" FOREIGN KEY ("checkedOutBy") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."globalSettings"
    ADD CONSTRAINT "global_settings_updated_by_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_projectid_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdfGenerationHistory"
    ADD CONSTRAINT "pdfGenerationHistory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdfGenerationHistory"
    ADD CONSTRAINT "pdfGenerationHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."pdfGenerationJobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdfGenerationHistory"
    ADD CONSTRAINT "pdfGenerationHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdfGenerationHistory"
    ADD CONSTRAINT "pdfGenerationHistory_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."pdfTemplates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdfGenerationJobs"
    ADD CONSTRAINT "pdfGenerationJobs_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdfGenerationJobs"
    ADD CONSTRAINT "pdfGenerationJobs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdfGenerationJobs"
    ADD CONSTRAINT "pdfGenerationJobs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."pdfTemplates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdfTemplateFields"
    ADD CONSTRAINT "pdfTemplateFields_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."pdfTemplates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdfTemplates"
    ADD CONSTRAINT "pdfTemplates_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdfTemplates"
    ADD CONSTRAINT "pdfTemplates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."punchlist"
    ADD CONSTRAINT "punchlist_author_id_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin/Staff can delete invoices" ON "public"."invoices" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Admins and Staff can create checkouts" ON "public"."fileCheckouts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Admins and Staff can manage all punchlist items" ON "public"."punchlist" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Admins and Staff can update checkouts" ON "public"."fileCheckouts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Admins can access all magic link tokens" ON "public"."magicLinkTokens" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can create banner alerts" ON "public"."bannerAlerts" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can delete all tutorial configs" ON "public"."tutorialConfigs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can delete any chat message" ON "public"."chatMessages" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can delete banner alerts" ON "public"."bannerAlerts" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can delete contact submissions" ON "public"."contactSubmissions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Admins can delete feedback" ON "public"."feedback" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can delete notifications" ON "public"."notifications" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Admins can delete projects" ON "public"."projects" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can insert contact submissions" ON "public"."contactSubmissions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Admins can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Admins can manage all knowledge" ON "public"."ai_agent_knowledge" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can manage all project memory" ON "public"."ai_agent_project_memory" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can manage catalog items" ON "public"."lineItemsCatalog" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Admins can manage document templates" ON "public"."documentTemplates" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can update all feedback" ON "public"."feedback" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can update all tutorial configs" ON "public"."tutorialConfigs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can update banner alerts" ON "public"."bannerAlerts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can update contact submissions" ON "public"."contactSubmissions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Admins can view all banner alerts" ON "public"."bannerAlerts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can view all chat messages" ON "public"."chatMessages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can view all checkouts" ON "public"."fileCheckouts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can view all contact submissions" ON "public"."contactSubmissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Admins can view all feedback" ON "public"."feedback" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can view all file versions" ON "public"."fileVersions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins can view all tutorial configs" ON "public"."tutorialConfigs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins full access to files" ON "public"."files" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))));



CREATE POLICY "Allow admins to manage subjects" ON "public"."subjects" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Allow authenticated users to read project statuses" ON "public"."projectStatuses" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to read subjects" ON "public"."subjects" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anonymous users can insert contact submissions" ON "public"."contactSubmissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can read active CMS pages" ON "public"."cmsPages" FOR SELECT USING (("isActive" = true));



CREATE POLICY "Anyone can view active banner alerts" ON "public"."bannerAlerts" FOR SELECT TO "authenticated" USING (("isActive" = true));



CREATE POLICY "Clients can create punchlist items for their projects" ON "public"."punchlist" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "punchlist"."projectId") AND ("projects"."authorId" = "auth"."uid"())))) AND ("authorId" = "auth"."uid"())));



CREATE POLICY "Clients can update their own punchlist items" ON "public"."punchlist" FOR UPDATE TO "authenticated" USING (("authorId" = "auth"."uid"())) WITH CHECK (("authorId" = "auth"."uid"()));



CREATE POLICY "Clients can view file versions for their own projects" ON "public"."fileVersions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."files" "f"
     JOIN "public"."projects" "p" ON (("f"."projectId" = "p"."id")))
  WHERE (("f"."id" = "fileVersions"."fileId") AND ("p"."authorId" = "auth"."uid"())))));



CREATE POLICY "Clients can view own files" ON "public"."files" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Client'::"text")))) AND (EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "files"."projectId") AND ("projects"."authorId" = "auth"."uid"()))))));



CREATE POLICY "Clients can view punchlist items for their projects" ON "public"."punchlist" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "punchlist"."projectId") AND ("projects"."authorId" = "auth"."uid"())))) AND (("internal" = false) OR ("authorId" = "auth"."uid"()))));



CREATE POLICY "Only admins can delete file versions" ON "public"."fileVersions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Only admins can insert file versions" ON "public"."fileVersions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Only admins can update file versions" ON "public"."fileVersions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))));



CREATE POLICY "Service role can insert profiles" ON "public"."profiles" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Staff can view file versions for their projects" ON "public"."fileVersions" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Staff'::"text")))) OR (EXISTS ( SELECT 1
   FROM ("public"."files" "f"
     JOIN "public"."projects" "p" ON (("f"."projectId" = "p"."id")))
  WHERE (("f"."id" = "fileVersions"."fileId") AND ("p"."authorId" = "auth"."uid"()))))));



CREATE POLICY "Staff can view project checkouts" ON "public"."fileCheckouts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."files" "f"
     JOIN "public"."projects" "p" ON (("f"."projectId" = "p"."id")))
  WHERE (("f"."id" = "fileCheckouts"."fileId") AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])))))))));



CREATE POLICY "System can create default punchlist items" ON "public"."punchlist" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "punchlist"."projectId") AND ("projects"."authorId" = "auth"."uid"()) AND ("punchlist"."authorId" = "auth"."uid"()))))));



CREATE POLICY "System can create usage records" ON "public"."ai_agent_usage" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can create catalog items" ON "public"."lineItemsCatalog" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can create documents for own projects" ON "public"."ai_generated_documents" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "ai_generated_documents"."projectId") AND (("projects"."authorId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))))))));



CREATE POLICY "Users can create invoices for their projects" ON "public"."invoices" FOR INSERT WITH CHECK ((("projectId" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."authorId" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])))))));



CREATE POLICY "Users can create knowledge" ON "public"."ai_agent_knowledge" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "authorId"));



CREATE POLICY "Users can create messages in own conversations" ON "public"."ai_agent_messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."ai_agent_conversations"
  WHERE (("ai_agent_conversations"."id" = "ai_agent_messages"."conversationId") AND ("ai_agent_conversations"."userId" = "auth"."uid"())))));



CREATE POLICY "Users can create own conversations" ON "public"."ai_agent_conversations" FOR INSERT TO "authenticated" WITH CHECK (("userId" = "auth"."uid"()));



CREATE POLICY "Users can create own projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("authorId" = "auth"."uid"()));



CREATE POLICY "Users can delete own conversations" ON "public"."ai_agent_conversations" FOR DELETE TO "authenticated" USING ((("userId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text"))))));



CREATE POLICY "Users can delete own knowledge" ON "public"."ai_agent_knowledge" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "authorId"));



CREATE POLICY "Users can delete their own files" ON "public"."files" FOR DELETE USING (((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])) OR (("authorId" = "auth"."uid"()) AND (( SELECT "projects"."status"
   FROM "public"."projects"
  WHERE ("projects"."id" = "files"."projectId")) <= 10))));



CREATE POLICY "Users can delete their own templates" ON "public"."pdfTemplates" FOR DELETE USING (("auth"."uid"() = "authorId"));



CREATE POLICY "Users can delete their own tutorial configs" ON "public"."tutorialConfigs" FOR DELETE USING (("auth"."uid"() = "userId"));



CREATE POLICY "Users can insert files for their projects" ON "public"."files" FOR INSERT WITH CHECK (((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])) OR ("projectId" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."authorId" = "auth"."uid"()) OR ("projects"."assignedToId" = "auth"."uid"()))))));



CREATE POLICY "Users can insert own feedback" ON "public"."feedback" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("anonymous" = true)));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own generation history" ON "public"."pdfGenerationHistory" FOR INSERT WITH CHECK (("auth"."uid"() = "authorId"));



CREATE POLICY "Users can insert their own generation jobs" ON "public"."pdfGenerationJobs" FOR INSERT WITH CHECK (("auth"."uid"() = "authorId"));



CREATE POLICY "Users can insert their own messages" ON "public"."chatMessages" FOR INSERT WITH CHECK (("auth"."uid"() = "userId"));



CREATE POLICY "Users can insert their own templates" ON "public"."pdfTemplates" FOR INSERT WITH CHECK (("auth"."uid"() = "authorId"));



CREATE POLICY "Users can insert their own tutorial configs" ON "public"."tutorialConfigs" FOR INSERT WITH CHECK (("auth"."uid"() = "userId"));



CREATE POLICY "Users can manage own project memory" ON "public"."ai_agent_project_memory" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "ai_agent_project_memory"."projectId") AND ("projects"."authorId" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "ai_agent_project_memory"."projectId") AND ("projects"."authorId" = "auth"."uid"())))));



CREATE POLICY "Users can manage template fields" ON "public"."pdfTemplateFields" USING ((EXISTS ( SELECT 1
   FROM "public"."pdfTemplates"
  WHERE (("pdfTemplates"."id" = "pdfTemplateFields"."templateId") AND ("pdfTemplates"."authorId" = "auth"."uid"())))));



CREATE POLICY "Users can send messages" ON "public"."directMessages" FOR INSERT TO "authenticated" WITH CHECK (("fromUser" = "auth"."uid"()));



CREATE POLICY "Users can submit feedback" ON "public"."feedback" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can update own conversations" ON "public"."ai_agent_conversations" FOR UPDATE TO "authenticated" USING ((("userId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text"))))));



CREATE POLICY "Users can update own feedback" ON "public"."feedback" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND (("status")::"text" <> 'resolved'::"text") AND (("status")::"text" <> 'closed'::"text")));



CREATE POLICY "Users can update own knowledge" ON "public"."ai_agent_knowledge" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "authorId")) WITH CHECK (("auth"."uid"() = "authorId"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "userId"));



CREATE POLICY "Users can update own project documents" ON "public"."ai_generated_documents" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "ai_generated_documents"."projectId") AND (("projects"."authorId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))))))));



CREATE POLICY "Users can update own projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING ((("authorId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])))))));



CREATE POLICY "Users can update their own files" ON "public"."files" FOR UPDATE USING (((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])) OR ("authorId" = "auth"."uid"())));



CREATE POLICY "Users can update their own generation jobs" ON "public"."pdfGenerationJobs" FOR UPDATE USING (("auth"."uid"() = "authorId"));



CREATE POLICY "Users can update their own invoices" ON "public"."invoices" FOR UPDATE USING ((("createdBy" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])))))));



CREATE POLICY "Users can update their own templates" ON "public"."pdfTemplates" FOR UPDATE USING (("auth"."uid"() = "authorId"));



CREATE POLICY "Users can update their own tutorial configs" ON "public"."tutorialConfigs" FOR UPDATE USING (("auth"."uid"() = "userId"));



CREATE POLICY "Users can upload files to own projects" ON "public"."files" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "files"."projectId") AND (("projects"."authorId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))))))));



CREATE POLICY "Users can view active catalog items" ON "public"."lineItemsCatalog" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("isActive" = true)));



CREATE POLICY "Users can view active document templates" ON "public"."documentTemplates" FOR SELECT TO "authenticated" USING (("isActive" = true));



CREATE POLICY "Users can view active knowledge" ON "public"."ai_agent_knowledge" FOR SELECT TO "authenticated" USING (("isActive" = true));



CREATE POLICY "Users can view all chat messages" ON "public"."chatMessages" FOR SELECT USING (true);



CREATE POLICY "Users can view all templates" ON "public"."pdfTemplates" FOR SELECT USING (true);



CREATE POLICY "Users can view files for their projects" ON "public"."files" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "files"."projectId") AND (("p"."authorId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "pr"
          WHERE (("pr"."id" = "auth"."uid"()) AND ("pr"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))))))));



CREATE POLICY "Users can view files they have access to" ON "public"."files" FOR SELECT USING (((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])) OR ("projectId" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."authorId" = "auth"."uid"()) OR ("projects"."assignedToId" = "auth"."uid"()))))));



CREATE POLICY "Users can view own checkouts" ON "public"."fileCheckouts" FOR SELECT USING (("checkedOutBy" = "auth"."uid"()));



CREATE POLICY "Users can view own conversation messages" ON "public"."ai_agent_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."ai_agent_conversations"
  WHERE (("ai_agent_conversations"."id" = "ai_agent_messages"."conversationId") AND (("ai_agent_conversations"."userId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))))))));



CREATE POLICY "Users can view own conversations" ON "public"."ai_agent_conversations" FOR SELECT TO "authenticated" USING ((("userId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text"))))));



CREATE POLICY "Users can view own document generations" ON "public"."ai_generations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."ai_generated_documents"
     JOIN "public"."projects" ON (("projects"."id" = "ai_generated_documents"."projectId")))
  WHERE (("ai_generated_documents"."id" = "ai_generations"."documentId") AND (("projects"."authorId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))))))));



CREATE POLICY "Users can view own feedback" ON "public"."feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own messages" ON "public"."directMessages" FOR SELECT TO "authenticated" USING ((("fromUser" = "auth"."uid"()) OR ("toUser" = "auth"."uid"())));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "userId"));



CREATE POLICY "Users can view own project documents" ON "public"."ai_generated_documents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "ai_generated_documents"."projectId") AND (("projects"."authorId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))))))));



CREATE POLICY "Users can view own projects" ON "public"."projects" FOR SELECT TO "authenticated" USING ((("authorId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])))))));



CREATE POLICY "Users can view own usage" ON "public"."ai_agent_usage" FOR SELECT TO "authenticated" USING ((("userId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text"))))));



CREATE POLICY "Users can view project files" ON "public"."files" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "files"."projectId") AND (("projects"."authorId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))))))));



CREATE POLICY "Users can view project memory" ON "public"."ai_agent_project_memory" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "ai_agent_project_memory"."projectId") AND (("projects"."authorId" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'Admin'::"text")))))))));



CREATE POLICY "Users can view template fields" ON "public"."pdfTemplateFields" FOR SELECT USING (true);



CREATE POLICY "Users can view their own generation history" ON "public"."pdfGenerationHistory" FOR SELECT USING (("auth"."uid"() = "authorId"));



CREATE POLICY "Users can view their own generation jobs" ON "public"."pdfGenerationJobs" FOR SELECT USING (("auth"."uid"() = "authorId"));



CREATE POLICY "Users can view their own invoices" ON "public"."invoices" FOR SELECT USING ((("createdBy" = "auth"."uid"()) OR ("projectId" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."authorId" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])))))));



CREATE POLICY "Users can view their own schedules" ON "public"."schedules" USING ((("user_id")::"text" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can view their own tutorial configs" ON "public"."tutorialConfigs" FOR SELECT USING (("auth"."uid"() = "userId"));



CREATE POLICY "Users can view their own webhooks" ON "public"."webhooks" USING ((("user_id")::"text" = ("auth"."uid"())::"text"));



ALTER TABLE "public"."ai_agent_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agent_knowledge" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agent_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agent_project_memory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agent_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_generated_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_generations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bannerAlerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chatMessages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cmsPages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contactSubmissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."demo_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."directMessages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discussion" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discussion_delete_own_or_admin" ON "public"."discussion" FOR DELETE USING ((("auth"."uid"() = "authorId") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])))))));



CREATE POLICY "discussion_insert_own" ON "public"."discussion" FOR INSERT WITH CHECK ((("auth"."uid"() = "authorId") AND ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "discussion"."projectId") AND ("projects"."authorId" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))))));



CREATE POLICY "discussion_select_own_or_admin" ON "public"."discussion" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "discussion"."projectId") AND ("projects"."authorId" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])))))));



CREATE POLICY "discussion_update_own" ON "public"."discussion" FOR UPDATE USING (("auth"."uid"() = "authorId"));



ALTER TABLE "public"."documentTemplates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fileCheckouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fileVersions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generatedDocuments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "generated_documents_delete_own_or_admin" ON "public"."generatedDocuments" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "generatedDocuments"."projectId") AND ("projects"."authorId" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))))));



CREATE POLICY "generated_documents_insert_own_or_admin" ON "public"."generatedDocuments" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "generatedDocuments"."projectId") AND ("projects"."authorId" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))))));



CREATE POLICY "generated_documents_select_own_or_admin" ON "public"."generatedDocuments" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "generatedDocuments"."projectId") AND ("projects"."authorId" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))))));



CREATE POLICY "generated_documents_update_own_or_admin" ON "public"."generatedDocuments" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "generatedDocuments"."projectId") AND ("projects"."authorId" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"]))))))));



ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lineItemsCatalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."magicLinkTokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pdfGenerationHistory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pdfGenerationJobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pdfTemplateFields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pdfTemplates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select_admin" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."is_admin_or_staff"());



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update_admin" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ("public"."is_admin_or_staff"());



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "projects_delete_own_or_admin" ON "public"."projects" FOR DELETE USING ((("auth"."uid"() = "authorId") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])))))));



CREATE POLICY "projects_insert_own" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "authorId"));



CREATE POLICY "projects_select_own_or_admin" ON "public"."projects" FOR SELECT USING ((("auth"."uid"() = "authorId") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])))))));



CREATE POLICY "projects_update_own_or_admin" ON "public"."projects" FOR UPDATE USING ((("auth"."uid"() = "authorId") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['Admin'::"text", 'Staff'::"text"])))))));



ALTER TABLE "public"."punchlist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tutorialConfigs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhooks" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."assign_default_discussion_to_project"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_default_discussion_to_project"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_default_discussion_to_project"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_file"("file_id_param" integer, "assigned_to_param" "uuid", "assigned_by_param" "uuid", "notes_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_file"("file_id_param" integer, "assigned_to_param" "uuid", "assigned_by_param" "uuid", "notes_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_file"("file_id_param" integer, "assigned_to_param" "uuid", "assigned_by_param" "uuid", "notes_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_create_punchlist_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_create_punchlist_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_create_punchlist_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_ai_cost"("p_model" "text", "p_input_tokens" integer, "p_output_tokens" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_ai_cost"("p_model" "text", "p_input_tokens" integer, "p_output_tokens" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_ai_cost"("p_model" "text", "p_input_tokens" integer, "p_output_tokens" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_outstanding_balance"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_outstanding_balance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_outstanding_balance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."checkin_file"("file_id_param" integer, "user_id_param" "uuid", "notes_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."checkin_file"("file_id_param" integer, "user_id_param" "uuid", "notes_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkin_file"("file_id_param" integer, "user_id_param" "uuid", "notes_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."checkout_file"("file_id_param" integer, "user_id_param" "uuid", "notes_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."checkout_file"("file_id_param" integer, "user_id_param" "uuid", "notes_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkout_file"("file_id_param" integer, "user_id_param" "uuid", "notes_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_punchlist_items"("project_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_punchlist_items"("project_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_punchlist_items"("project_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."extend_project_due_date"("project_id_param" integer, "hours_to_add" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."extend_project_due_date"("project_id_param" integer, "hours_to_add" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."extend_project_due_date"("project_id_param" integer, "hours_to_add" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_agent_knowledge"("p_category" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_agent_knowledge"("p_category" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_agent_knowledge"("p_category" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_file_checkout_status"("file_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_file_checkout_status"("file_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_file_checkout_status"("file_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_staff"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_staff"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_staff"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_project_due_date"("project_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reset_project_due_date"("project_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_project_due_date"("project_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_project_due_date_on_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_project_due_date_on_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_project_due_date_on_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_project_due_date_on_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_project_due_date_on_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_project_due_date_on_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."to_camel_case"("snake_case" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."to_camel_case"("snake_case" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."to_camel_case"("snake_case" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ai_knowledge_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ai_knowledge_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ai_knowledge_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_cms_pages_updatedAt"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_cms_pages_updatedAt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cms_pages_updatedAt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_contact_submissions_updatedat"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_contact_submissions_updatedat"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_contact_submissions_updatedat"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_filecheckouts_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_filecheckouts_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_filecheckouts_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_missing_due_dates"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_missing_due_dates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_missing_due_dates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_punchlist_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_punchlist_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_punchlist_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_punchlist_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_punchlist_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_punchlist_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_single_project_due_date"("project_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_single_project_due_date"("project_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_single_project_due_date"("project_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."ai_agent_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_agent_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agent_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_agent_knowledge" TO "anon";
GRANT ALL ON TABLE "public"."ai_agent_knowledge" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agent_knowledge" TO "service_role";



GRANT ALL ON TABLE "public"."ai_agent_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_agent_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agent_messages" TO "service_role";



GRANT ALL ON TABLE "public"."ai_agent_project_memory" TO "anon";
GRANT ALL ON TABLE "public"."ai_agent_project_memory" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agent_project_memory" TO "service_role";



GRANT ALL ON TABLE "public"."ai_agent_usage" TO "anon";
GRANT ALL ON TABLE "public"."ai_agent_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agent_usage" TO "service_role";



GRANT ALL ON TABLE "public"."ai_generated_documents" TO "anon";
GRANT ALL ON TABLE "public"."ai_generated_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_generated_documents" TO "service_role";



GRANT ALL ON TABLE "public"."ai_generations" TO "anon";
GRANT ALL ON TABLE "public"."ai_generations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_generations" TO "service_role";



GRANT ALL ON TABLE "public"."bannerAlerts" TO "anon";
GRANT ALL ON TABLE "public"."bannerAlerts" TO "authenticated";
GRANT ALL ON TABLE "public"."bannerAlerts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bannerAlerts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bannerAlerts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bannerAlerts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chatMessages" TO "anon";
GRANT ALL ON TABLE "public"."chatMessages" TO "authenticated";
GRANT ALL ON TABLE "public"."chatMessages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cmsPages" TO "anon";
GRANT ALL ON TABLE "public"."cmsPages" TO "authenticated";
GRANT ALL ON TABLE "public"."cmsPages" TO "service_role";



GRANT ALL ON TABLE "public"."contactSubmissions" TO "anon";
GRANT ALL ON TABLE "public"."contactSubmissions" TO "authenticated";
GRANT ALL ON TABLE "public"."contactSubmissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."contactsubmissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."contactsubmissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."contactsubmissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."demo_bookings" TO "anon";
GRANT ALL ON TABLE "public"."demo_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."demo_bookings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."demo_bookings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."demo_bookings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."demo_bookings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."directMessages" TO "anon";
GRANT ALL ON TABLE "public"."directMessages" TO "authenticated";
GRANT ALL ON TABLE "public"."directMessages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."direct_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."direct_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."direct_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."discussion" TO "anon";
GRANT ALL ON TABLE "public"."discussion" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion" TO "service_role";



GRANT ALL ON SEQUENCE "public"."discussion_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."discussion_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."discussion_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."documentComponents" TO "anon";
GRANT ALL ON TABLE "public"."documentComponents" TO "authenticated";
GRANT ALL ON TABLE "public"."documentComponents" TO "service_role";



GRANT ALL ON TABLE "public"."documentTemplates" TO "anon";
GRANT ALL ON TABLE "public"."documentTemplates" TO "authenticated";
GRANT ALL ON TABLE "public"."documentTemplates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_components_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_components_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_components_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON SEQUENCE "public"."feedback_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."feedback_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."feedback_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fileCheckoutHistory" TO "anon";
GRANT ALL ON TABLE "public"."fileCheckoutHistory" TO "authenticated";
GRANT ALL ON TABLE "public"."fileCheckoutHistory" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fileCheckoutHistory_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fileCheckoutHistory_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fileCheckoutHistory_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fileCheckouts" TO "anon";
GRANT ALL ON TABLE "public"."fileCheckouts" TO "authenticated";
GRANT ALL ON TABLE "public"."fileCheckouts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fileCheckouts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fileCheckouts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fileCheckouts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fileVersions" TO "anon";
GRANT ALL ON TABLE "public"."fileVersions" TO "authenticated";
GRANT ALL ON TABLE "public"."fileVersions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."file_versions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."file_versions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."file_versions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."files" TO "anon";
GRANT ALL ON TABLE "public"."files" TO "authenticated";
GRANT ALL ON TABLE "public"."files" TO "service_role";



GRANT ALL ON TABLE "public"."filesGlobal" TO "anon";
GRANT ALL ON TABLE "public"."filesGlobal" TO "authenticated";
GRANT ALL ON TABLE "public"."filesGlobal" TO "service_role";



GRANT ALL ON SEQUENCE "public"."files_global_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."files_global_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."files_global_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."files_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."files_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."files_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."generatedDocuments" TO "anon";
GRANT ALL ON TABLE "public"."generatedDocuments" TO "authenticated";
GRANT ALL ON TABLE "public"."generatedDocuments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."generated_documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."generated_documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."generated_documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."globalSettings" TO "anon";
GRANT ALL ON TABLE "public"."globalSettings" TO "authenticated";
GRANT ALL ON TABLE "public"."globalSettings" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lineItemsCatalog" TO "anon";
GRANT ALL ON TABLE "public"."lineItemsCatalog" TO "authenticated";
GRANT ALL ON TABLE "public"."lineItemsCatalog" TO "service_role";



GRANT ALL ON SEQUENCE "public"."line_items_catalog_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."line_items_catalog_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."line_items_catalog_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."magicLinkTokens" TO "anon";
GRANT ALL ON TABLE "public"."magicLinkTokens" TO "authenticated";
GRANT ALL ON TABLE "public"."magicLinkTokens" TO "service_role";



GRANT ALL ON SEQUENCE "public"."magic_link_tokens_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."magic_link_tokens_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."magic_link_tokens_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pdfGenerationHistory" TO "anon";
GRANT ALL ON TABLE "public"."pdfGenerationHistory" TO "authenticated";
GRANT ALL ON TABLE "public"."pdfGenerationHistory" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pdfGenerationHistory_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pdfGenerationHistory_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pdfGenerationHistory_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pdfGenerationJobs" TO "anon";
GRANT ALL ON TABLE "public"."pdfGenerationJobs" TO "authenticated";
GRANT ALL ON TABLE "public"."pdfGenerationJobs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pdfGenerationJobs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pdfGenerationJobs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pdfGenerationJobs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pdfTemplateFields" TO "anon";
GRANT ALL ON TABLE "public"."pdfTemplateFields" TO "authenticated";
GRANT ALL ON TABLE "public"."pdfTemplateFields" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pdfTemplateFields_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pdfTemplateFields_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pdfTemplateFields_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pdfTemplates" TO "anon";
GRANT ALL ON TABLE "public"."pdfTemplates" TO "authenticated";
GRANT ALL ON TABLE "public"."pdfTemplates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pdfTemplates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pdfTemplates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pdfTemplates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projectStatuses" TO "anon";
GRANT ALL ON TABLE "public"."projectStatuses" TO "authenticated";
GRANT ALL ON TABLE "public"."projectStatuses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_statuses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_statuses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_statuses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."punchlist" TO "anon";
GRANT ALL ON TABLE "public"."punchlist" TO "authenticated";
GRANT ALL ON TABLE "public"."punchlist" TO "service_role";



GRANT ALL ON SEQUENCE "public"."punchlist_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."punchlist_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."punchlist_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";



GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subjects" TO "anon";
GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subjects_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subjects_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subjects_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."template_component_mapping" TO "anon";
GRANT ALL ON TABLE "public"."template_component_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."template_component_mapping" TO "service_role";



GRANT ALL ON SEQUENCE "public"."template_component_mapping_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."template_component_mapping_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."template_component_mapping_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tutorialConfigs" TO "anon";
GRANT ALL ON TABLE "public"."tutorialConfigs" TO "authenticated";
GRANT ALL ON TABLE "public"."tutorialConfigs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tutorial_configs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tutorial_configs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tutorial_configs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."webhooks" TO "anon";
GRANT ALL ON TABLE "public"."webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."webhooks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."webhooks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."webhooks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."webhooks_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
