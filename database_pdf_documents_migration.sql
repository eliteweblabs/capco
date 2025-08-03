-- Create PDF documents table for tracking generated PDFs
CREATE TABLE IF NOT EXISTS pdf_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'project_agreement', 'proposal', 'invoice', etc.
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    content_type VARCHAR(100) DEFAULT 'application/pdf',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Indexes for performance
    CONSTRAINT unique_project_document_type UNIQUE(project_id, document_type, created_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pdf_documents_project_id ON pdf_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_pdf_documents_type ON pdf_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_pdf_documents_created_at ON pdf_documents(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own project PDFs" ON pdf_documents
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE author_id = auth.uid()
        )
        OR 
        created_by = auth.uid()
    );

CREATE POLICY "Users can create PDFs for their projects" ON pdf_documents
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE author_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their own PDF records" ON pdf_documents
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE author_id = auth.uid()
        )
        OR 
        created_by = auth.uid()
    );

CREATE POLICY "Users can delete their own PDF records" ON pdf_documents
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE author_id = auth.uid()
        )
        OR 
        created_by = auth.uid()
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_pdf_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pdf_documents_updated_at
    BEFORE UPDATE ON pdf_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_pdf_documents_updated_at();

-- Create storage bucket for PDF documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for PDF documents
CREATE POLICY "Authenticated users can upload PDFs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' 
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = 'pdfs'
    );

CREATE POLICY "Users can view their own PDF documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' 
        AND auth.uid() IS NOT NULL
        AND (
            -- Allow if user created the file
            owner = auth.uid()
            OR
            -- Allow if user owns the related project
            EXISTS (
                SELECT 1 FROM pdf_documents pd
                JOIN projects p ON pd.project_id = p.id
                WHERE pd.file_path = name
                AND p.author_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete their own PDF documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' 
        AND auth.uid() IS NOT NULL
        AND (
            owner = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM pdf_documents pd
                JOIN projects p ON pd.project_id = p.id
                WHERE pd.file_path = name
                AND p.author_id = auth.uid()
            )
        )
    );

-- Function to get PDF documents for a user's projects
CREATE OR REPLACE FUNCTION get_user_pdf_documents(project_ids UUID[] DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    project_id UUID,
    document_type VARCHAR,
    file_name VARCHAR,
    file_path VARCHAR,
    file_size INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    project_title VARCHAR,
    project_address VARCHAR
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.id,
        pd.project_id,
        pd.document_type,
        pd.file_name,
        pd.file_path,
        pd.file_size,
        pd.metadata,
        pd.created_at,
        p.title as project_title,
        p.address as project_address
    FROM pdf_documents pd
    JOIN projects p ON pd.project_id = p.id
    WHERE 
        p.author_id = auth.uid()
        AND (
            project_ids IS NULL 
            OR pd.project_id = ANY(project_ids)
        )
    ORDER BY pd.created_at DESC;
END;
$$;