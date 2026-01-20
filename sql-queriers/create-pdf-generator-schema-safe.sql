-- PDF Generator Database Schema (Safe Version)
-- This creates the necessary tables for the PDF generation system
-- Handles existing tables and policies gracefully

-- PDF Templates table - stores base HTML templates
CREATE TABLE IF NOT EXISTS pdf_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- PDF Components table - stores reusable HTML snippets/components
CREATE TABLE IF NOT EXISTS pdf_components (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    component_type VARCHAR(100) NOT NULL, -- 'header', 'footer', 'section', 'table', 'image', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Template-Component mapping table - defines which components can be used with which templates
CREATE TABLE IF NOT EXISTS templateComponentMapping (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES pdf_templates(id) ON DELETE CASCADE,
    component_id INTEGER REFERENCES pdf_components(id) ON DELETE CASCADE,
    insertion_point VARCHAR(100) NOT NULL, -- 'header', 'footer', 'content', 'sidebar', etc.
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, component_id, insertion_point)
);

-- Generated Documents table - tracks generated PDFs
CREATE TABLE IF NOT EXISTS generated_documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES pdf_templates(id),
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    generation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
    error_message TEXT,
    generation_started_at TIMESTAMP WITH TIME ZONE,
    generation_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Document Components table - tracks which components were used in each generated document
CREATE TABLE IF NOT EXISTS documentComponents (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES generated_documents(id) ON DELETE CASCADE,
    component_id INTEGER REFERENCES pdf_components(id),
    insertion_point VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    component_data JSONB, -- stores any component-specific data/configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_pdf_templates_active ON pdf_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_pdf_components_active ON pdf_components(is_active);
CREATE INDEX IF NOT EXISTS idx_pdf_components_type ON pdf_components(component_type);
CREATE INDEX IF NOT EXISTS idx_generated_documents_project ON generated_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_status ON generated_documents(generation_status);
CREATE INDEX IF NOT EXISTS idx_documentComponents_document ON documentComponents(document_id);

-- Enable RLS on all tables (only if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'pdf_templates' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'pdf_components' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE pdf_components ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'templateComponentMapping' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE templateComponentMapping ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'generated_documents' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'documentComponents' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE documentComponents ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "pdf_templates_select_all" ON pdf_templates;
DROP POLICY IF EXISTS "pdf_templates_insert_admin" ON pdf_templates;
DROP POLICY IF EXISTS "pdf_templates_update_admin" ON pdf_templates;
DROP POLICY IF EXISTS "pdf_templates_delete_admin" ON pdf_templates;

-- RLS Policies for pdf_templates
CREATE POLICY "pdf_templates_select_all" ON pdf_templates
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "pdf_templates_insert_admin" ON pdf_templates
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "pdf_templates_update_admin" ON pdf_templates
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "pdf_templates_delete_admin" ON pdf_templates
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

-- Drop and recreate pdf_components policies
DROP POLICY IF EXISTS "pdf_components_select_all" ON pdf_components;
DROP POLICY IF EXISTS "pdf_components_insert_admin" ON pdf_components;
DROP POLICY IF EXISTS "pdf_components_update_admin" ON pdf_components;
DROP POLICY IF EXISTS "pdf_components_delete_admin" ON pdf_components;

-- RLS Policies for pdf_components
CREATE POLICY "pdf_components_select_all" ON pdf_components
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "pdf_components_insert_admin" ON pdf_components
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "pdf_components_update_admin" ON pdf_components
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "pdf_components_delete_admin" ON pdf_components
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

-- Drop and recreate templateComponentMapping policies
DROP POLICY IF EXISTS "templateComponentMapping_select_all" ON templateComponentMapping;
DROP POLICY IF EXISTS "templateComponentMapping_insert_admin" ON templateComponentMapping;
DROP POLICY IF EXISTS "templateComponentMapping_update_admin" ON templateComponentMapping;
DROP POLICY IF EXISTS "templateComponentMapping_delete_admin" ON templateComponentMapping;

-- RLS Policies for templateComponentMapping
CREATE POLICY "templateComponentMapping_select_all" ON templateComponentMapping
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "templateComponentMapping_insert_admin" ON templateComponentMapping
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "templateComponentMapping_update_admin" ON templateComponentMapping
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "templateComponentMapping_delete_admin" ON templateComponentMapping
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

-- Drop and recreate generated_documents policies
DROP POLICY IF EXISTS "generated_documents_select_own_or_admin" ON generated_documents;
DROP POLICY IF EXISTS "generated_documents_insert_own_or_admin" ON generated_documents;
DROP POLICY IF EXISTS "generated_documents_update_own_or_admin" ON generated_documents;
DROP POLICY IF EXISTS "generated_documents_delete_own_or_admin" ON generated_documents;

-- RLS Policies for generated_documents
CREATE POLICY "generated_documents_select_own_or_admin" ON generated_documents
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            -- Users can see documents for their own projects
            EXISTS (
                SELECT 1 FROM projects 
                WHERE projects.id = generated_documents.project_id 
                AND projects.author_id = auth.uid()
            )
            OR
            -- Admins/Staff can see all documents
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "generated_documents_insert_own_or_admin" ON generated_documents
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            -- Users can create documents for their own projects
            EXISTS (
                SELECT 1 FROM projects 
                WHERE projects.id = generated_documents.project_id 
                AND projects.author_id = auth.uid()
            )
            OR
            -- Admins/Staff can create documents for any project
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "generated_documents_update_own_or_admin" ON generated_documents
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            -- Users can update documents for their own projects
            EXISTS (
                SELECT 1 FROM projects 
                WHERE projects.id = generated_documents.project_id 
                AND projects.author_id = auth.uid()
            )
            OR
            -- Admins/Staff can update all documents
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "generated_documents_delete_own_or_admin" ON generated_documents
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND (
            -- Users can delete documents for their own projects
            EXISTS (
                SELECT 1 FROM projects 
                WHERE projects.id = generated_documents.project_id 
                AND projects.author_id = auth.uid()
            )
            OR
            -- Admins/Staff can delete all documents
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

-- Drop and recreate documentComponents policies
DROP POLICY IF EXISTS "documentComponents_select_own_or_admin" ON documentComponents;
DROP POLICY IF EXISTS "documentComponents_insert_own_or_admin" ON documentComponents;
DROP POLICY IF EXISTS "documentComponents_update_own_or_admin" ON documentComponents;
DROP POLICY IF EXISTS "documentComponents_delete_own_or_admin" ON documentComponents;

-- RLS Policies for documentComponents
CREATE POLICY "documentComponents_select_own_or_admin" ON documentComponents
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            -- Users can see components for their own project documents
            EXISTS (
                SELECT 1 FROM generated_documents gd
                JOIN projects p ON p.id = gd.project_id
                WHERE gd.id = documentComponents.document_id 
                AND p.author_id = auth.uid()
            )
            OR
            -- Admins/Staff can see all document components
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "documentComponents_insert_own_or_admin" ON documentComponents
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            -- Users can create components for their own project documents
            EXISTS (
                SELECT 1 FROM generated_documents gd
                JOIN projects p ON p.id = gd.project_id
                WHERE gd.id = documentComponents.document_id 
                AND p.author_id = auth.uid()
            )
            OR
            -- Admins/Staff can create components for any document
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "documentComponents_update_own_or_admin" ON documentComponents
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            -- Users can update components for their own project documents
            EXISTS (
                SELECT 1 FROM generated_documents gd
                JOIN projects p ON p.id = gd.project_id
                WHERE gd.id = documentComponents.document_id 
                AND p.author_id = auth.uid()
            )
            OR
            -- Admins/Staff can update all document components
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

CREATE POLICY "documentComponents_delete_own_or_admin" ON documentComponents
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND (
            -- Users can delete components for their own project documents
            EXISTS (
                SELECT 1 FROM generated_documents gd
                JOIN projects p ON p.id = gd.project_id
                WHERE gd.id = documentComponents.document_id 
                AND p.author_id = auth.uid()
            )
            OR
            -- Admins/Staff can delete all document components
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Admin', 'Staff')
            )
        )
    );

-- Insert default template (based on existing capco-default-plan.html) - only if it doesn't exist
INSERT INTO pdf_templates (name, description, html_content, created_by) 
SELECT 
    'CAPCo Default Plan',
    'Default fire protection system plan template',
    '<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fire Alarm Layout - {{PROJECT_ADDRESS}}</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: Arial, sans-serif;
        background: white;
        color: black;
        width: 594mm;
        height: 420mm;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
      }

      .main-container {
        display: flex;
        flex: 1;
        height: 100%;
      }

      .main-content {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .floor-plans {
        display: flex;
        gap: 20px;
        flex: 1;
      }

      .floor-plan {
        flex: 1;
        border: 2px solid #333;
        padding: 15px;
        background: #f9f9f9;
      }

      .floor-plan h3 {
        text-align: center;
        margin-bottom: 10px;
        font-size: 16px;
        font-weight: bold;
      }

      .title-block {
        width: 200px;
        padding: 15px;
        background: #f0f0f0;
        border-left: 2px solid #333;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .project-info {
        margin-bottom: 20px;
      }

      .project-info h2 {
        font-size: 18px;
        margin-bottom: 10px;
        text-align: center;
        border-bottom: 2px solid #333;
        padding-bottom: 5px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        font-size: 12px;
      }

      .info-label {
        font-weight: bold;
        min-width: 80px;
      }

      .revisions-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }

      .revisions-table th,
      .revisions-table td {
        border: 1px solid #333;
        padding: 5px;
        text-align: center;
        font-size: 10px;
      }

      .revisions-table th {
        background: #e0e0e0;
        font-weight: bold;
      }

      .drawing-title {
        text-align: center;
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 10px;
        border-bottom: 2px solid #333;
        padding-bottom: 5px;
      }

      .drawing-number {
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .address {
        text-align: center;
        font-size: 12px;
        margin-bottom: 20px;
      }

      .component-placeholder {
        border: 2px dashed #ccc;
        padding: 10px;
        margin: 10px 0;
        text-align: center;
        color: #666;
        background: #f9f9f9;
      }

      .header-placeholder {
        background: #e3f2fd;
        border-color: #2196f3;
      }

      .footer-placeholder {
        background: #f3e5f5;
        border-color: #9c27b0;
      }

      .content-placeholder {
        background: #e8f5e8;
        border-color: #4caf50;
      }
    </style>
  </head>
  <body>
    <div class="main-container">
      <div class="main-content">
        <!-- Header Component Placeholder -->
        <div class="component-placeholder header-placeholder">
          [HEADER COMPONENTS]
        </div>

        <!-- Main Content Area -->
        <div class="floor-plans">
          <div class="floor-plan">
            <h3>Floor Plan 1</h3>
            <div class="component-placeholder content-placeholder">
              [CONTENT COMPONENTS - FLOOR PLAN 1]
            </div>
          </div>
          <div class="floor-plan">
            <h3>Floor Plan 2</h3>
            <div class="component-placeholder content-placeholder">
              [CONTENT COMPONENTS - FLOOR PLAN 2]
            </div>
          </div>
        </div>

        <!-- Footer Component Placeholder -->
        <div class="component-placeholder footer-placeholder">
          [FOOTER COMPONENTS]
        </div>
      </div>

      <div class="title-block">
        <div class="project-info">
          <h2>PROJECT INFO</h2>
          <div class="info-row">
            <span class="info-label">Project:</span>
            <span>{{PROJECT_TITLE}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span>{{PROJECT_ADDRESS}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Client:</span>
            <span>{{COMPANY_NAME}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span>{{CLIENT_EMAIL}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span>{{STATUS_NAME}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Est. Time:</span>
            <span>{{EST_TIME}}</span>
          </div>
        </div>

        <table class="revisions-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Description</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Initial</td>
              <td>{{CURRENT_DATE}}</td>
            </tr>
          </tbody>
        </table>

        <div class="drawing-title">FIRE ALARM LAYOUT</div>
        <div class="drawing-number">FA-001</div>
        <div class="address">{{PROJECT_ADDRESS}}</div>
      </div>
    </div>
  </body>
</html>',
    (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM pdf_templates WHERE name = 'CAPCo Default Plan'
);

-- Insert some default components - only if they don't exist
INSERT INTO pdf_components (name, description, html_content, component_type, created_by) 
SELECT * FROM (VALUES 
    (
        'Project Header',
        'Standard project header with title and basic info',
        '<div class="project-header" style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #333; padding-bottom: 15px;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">{{PROJECT_TITLE}}</h1>
            <h2 style="font-size: 18px; color: #666; margin-bottom: 5px;">{{PROJECT_ADDRESS}}</h2>
            <p style="font-size: 14px; color: #888;">Fire Protection System Plan</p>
        </div>',
        'header',
        (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1)
    ),
    (
        'Client Information',
        'Client contact information section',
        '<div class="client-info" style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <h3 style="font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Client Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                <div><strong>Name:</strong> {{COMPANY_NAME}}</div>
                <div><strong>Email:</strong> {{CLIENT_EMAIL}}</div>
                <div><strong>Phone:</strong> {{PHONE}}</div>
                <div><strong>Company:</strong> {{CLIENT_COMPANY}}</div>
            </div>
        </div>',
        'section',
        (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1)
    ),
    (
        'Project Status',
        'Current project status information',
        '<div class="project-status" style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #2196f3;">
            <h3 style="font-size: 16px; margin-bottom: 10px;">Project Status</h3>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 14px;"><strong>Current Status:</strong> {{STATUS_NAME}}</div>
                    <div style="font-size: 12px; color: #666;">Estimated Completion: {{EST_TIME}}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; color: #666;">Generated: {{CURRENT_DATE}}</div>
                </div>
            </div>
        </div>',
        'section',
        (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1)
    ),
    (
        'Document Footer',
        'Standard document footer with company info',
        '<div class="document-footer" style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #333; text-align: center; font-size: 10px; color: #666;">
            <div style="margin-bottom: 5px;">
                <strong>CAPCO Design Group Systems</strong>
            </div>
            <div>
                This document was generated on {{CURRENT_DATE}} for project {{PROJECT_TITLE}}
            </div>
            <div style="margin-top: 5px; font-size: 9px;">
                Document ID: {{DOCUMENT_ID}} | Version: 1.0
            </div>
        </div>',
        'footer',
        (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1)
    )
) AS new_components(name, description, html_content, component_type, created_by)
WHERE NOT EXISTS (
    SELECT 1 FROM pdf_components WHERE name = new_components.name
);

-- Create mapping between default template and components - only if mapping doesn't exist
INSERT INTO templateComponentMapping (template_id, component_id, insertion_point, display_order, is_required) 
SELECT 
    t.id as template_id,
    c.id as component_id,
    CASE 
        WHEN c.component_type = 'header' THEN 'header'
        WHEN c.component_type = 'footer' THEN 'footer'
        ELSE 'content'
    END as insertion_point,
    CASE 
        WHEN c.component_type = 'header' THEN 1
        WHEN c.component_type = 'section' THEN 2
        WHEN c.component_type = 'footer' THEN 3
        ELSE 0
    END as display_order,
    CASE 
        WHEN c.component_type = 'header' THEN true
        WHEN c.component_type = 'footer' THEN true
        ELSE false
    END as is_required
FROM pdf_templates t, pdf_components c
WHERE t.name = 'CAPCo Default Plan'
AND NOT EXISTS (
    SELECT 1 FROM templateComponentMapping tcm 
    WHERE tcm.template_id = t.id AND tcm.component_id = c.id
);
