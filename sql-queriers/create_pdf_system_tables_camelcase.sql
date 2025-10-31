-- PDF System Database Tables (CamelCase Version)
-- Creates tables for PDF templates and generation system with consistent camelCase naming

BEGIN;

-- Drop existing tables if they exist (to recreate with correct naming)
DROP TABLE IF EXISTS pdfGenerationHistory CASCADE;
DROP TABLE IF EXISTS pdfTemplateFields CASCADE;
DROP TABLE IF EXISTS pdfGenerationJobs CASCADE;
DROP TABLE IF EXISTS pdfTemplates CASCADE;

-- PDF Templates table
CREATE TABLE "pdfTemplates" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL, -- HTML/JS content for the template
  "templateType" VARCHAR(50) DEFAULT 'body', -- 'body', 'header', 'footer'
  "pageSize" VARCHAR(20) DEFAULT '8.5x11', -- '8.5x11', 'A4', 'A3', etc.
  margins JSONB DEFAULT '{"top": "1in", "right": "1in", "bottom": "1in", "left": "1in"}',
  "isDefault" BOOLEAN DEFAULT FALSE,
  "isActive" BOOLEAN DEFAULT TRUE,
  "authorId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "projectId" INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF Generation Jobs table
CREATE TABLE "pdfGenerationJobs" (
  id SERIAL PRIMARY KEY,
  "templateId" INTEGER REFERENCES "pdfTemplates"(id) ON DELETE CASCADE,
  "projectId" INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  "authorId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  "fileName" VARCHAR(255),
  "filePath" TEXT,
  "fileSize" INTEGER,
  "generationData" JSONB, -- Store any data used for generation
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "completedAt" TIMESTAMP WITH TIME ZONE
);

-- PDF Template Fields table (for dynamic field extraction)
CREATE TABLE "pdfTemplateFields" (
  id SERIAL PRIMARY KEY,
  "templateId" INTEGER REFERENCES "pdfTemplates"(id) ON DELETE CASCADE,
  "fieldName" VARCHAR(100) NOT NULL,
  "fieldType" VARCHAR(50) NOT NULL, -- 'text', 'phone', 'address', 'date', 'name', 'email'
  "fieldValue" TEXT,
  "isRequired" BOOLEAN DEFAULT FALSE,
  "regexPattern" TEXT, -- Custom regex for validation
  placeholder TEXT,
  "orderIndex" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF Generation History table
CREATE TABLE "pdfGenerationHistory" (
  id SERIAL PRIMARY KEY,
  "jobId" INTEGER REFERENCES "pdfGenerationJobs"(id) ON DELETE CASCADE,
  "templateId" INTEGER REFERENCES "pdfTemplates"(id) ON DELETE CASCADE,
  "projectId" INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  "authorId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "recipientEmail" VARCHAR(255),
  "sentAt" TIMESTAMP WITH TIME ZONE,
  "downloadCount" INTEGER DEFAULT 0,
  "lastDownloadedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_pdf_templates_author ON "pdfTemplates"("authorId");
CREATE INDEX idx_pdf_templates_project ON "pdfTemplates"("projectId");
CREATE INDEX idx_pdf_templates_type ON "pdfTemplates"("templateType");
CREATE INDEX idx_pdf_templates_active ON "pdfTemplates"("isActive");
CREATE INDEX idx_pdf_generation_jobs_status ON "pdfGenerationJobs"(status);
CREATE INDEX idx_pdf_generation_jobs_project ON "pdfGenerationJobs"("projectId");
CREATE INDEX idx_pdf_template_fields_template ON "pdfTemplateFields"("templateId");

-- Enable RLS
ALTER TABLE "pdfTemplates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pdfGenerationJobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pdfTemplateFields" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pdfGenerationHistory" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdfTemplates
CREATE POLICY "Users can view all templates" ON "pdfTemplates"
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own templates" ON "pdfTemplates"
  FOR INSERT WITH CHECK (auth.uid() = "authorId");

CREATE POLICY "Users can update their own templates" ON "pdfTemplates"
  FOR UPDATE USING (auth.uid() = "authorId");

CREATE POLICY "Users can delete their own templates" ON "pdfTemplates"
  FOR DELETE USING (auth.uid() = "authorId");

-- RLS Policies for pdfGenerationJobs
CREATE POLICY "Users can view their own generation jobs" ON "pdfGenerationJobs"
  FOR SELECT USING (auth.uid() = "authorId");

CREATE POLICY "Users can insert their own generation jobs" ON "pdfGenerationJobs"
  FOR INSERT WITH CHECK (auth.uid() = "authorId");

CREATE POLICY "Users can update their own generation jobs" ON "pdfGenerationJobs"
  FOR UPDATE USING (auth.uid() = "authorId");

-- RLS Policies for pdfTemplateFields
CREATE POLICY "Users can view template fields" ON "pdfTemplateFields"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage template fields" ON "pdfTemplateFields"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "pdfTemplates" 
      WHERE "pdfTemplates".id = "pdfTemplateFields"."templateId" 
      AND "pdfTemplates"."authorId" = auth.uid()
    )
  );

-- RLS Policies for pdfGenerationHistory
CREATE POLICY "Users can view their own generation history" ON "pdfGenerationHistory"
  FOR SELECT USING (auth.uid() = "authorId");

CREATE POLICY "Users can insert their own generation history" ON "pdfGenerationHistory"
  FOR INSERT WITH CHECK (auth.uid() = "authorId");

-- Create default header and footer templates
INSERT INTO "pdfTemplates" (name, description, content, "templateType", "isDefault", "authorId") VALUES
('Default Header', 'Standard header template for all PDFs', 
 '<div style="text-align: center; padding: 20px; border-bottom: 2px solid #333;">
   <h1 style="margin: 0; color: #0056b3;">CAPCO Design Group</h1>
   <p style="margin: 5px 0; color: #666;">Professional Fire Protection Services</p>
 </div>', 
 'header', true, (SELECT id FROM auth.users WHERE email = 'admin@capcofire.com' LIMIT 1)),

('Default Footer', 'Standard footer template for all PDFs', 
 '<div style="text-align: center; padding: 20px; border-top: 1px solid #ccc; margin-top: 50px;">
   <p style="margin: 0; font-size: 12px; color: #666;">
     &copy; ' || EXTRACT(YEAR FROM NOW()) || ' CAPCO Design Group. All rights reserved.<br>
     Phone: (555) 123-4567 | Email: info@capcofire.com
   </p>
 </div>', 
 'footer', true, (SELECT id FROM auth.users WHERE email = 'admin@capcofire.com' LIMIT 1));

COMMIT;
