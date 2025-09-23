-- Add file versioning system
-- This migration adds versioning support to the files table

-- Add versioning columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE files ADD COLUMN IF NOT EXISTS previous_version_id INTEGER;
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_current_version BOOLEAN DEFAULT true;

-- Create file_versions table to track version history
CREATE TABLE IF NOT EXISTS file_versions (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_version ON file_versions(file_id, version_number);
CREATE INDEX IF NOT EXISTS idx_file_versions_uploaded_by ON file_versions(uploaded_by);

-- Create function to handle file versioning
CREATE OR REPLACE FUNCTION handle_file_versioning()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new file, set as current version
    IF TG_OP = 'INSERT' THEN
        NEW.is_current_version = true;
        NEW.version_number = 1;
        RETURN NEW;
    END IF;
    
    -- If this is an update, we need to handle versioning
    IF TG_OP = 'UPDATE' THEN
        -- If the file path changed (new upload), create a new version
        IF OLD.file_path != NEW.file_path THEN
            -- Mark old version as not current
            UPDATE files 
            SET is_current_version = false 
            WHERE id = OLD.id;
            
            -- Set new version as current
            NEW.is_current_version = true;
            NEW.version_number = OLD.version_number + 1;
            NEW.previous_version_id = OLD.id;
            
            -- Insert into file_versions table
            INSERT INTO file_versions (
                file_id, version_number, file_path, file_size, file_type, 
                uploaded_by, notes
            ) VALUES (
                OLD.id, OLD.version_number, OLD.file_path, OLD.file_size, 
                OLD.file_type, OLD.author_id, OLD.checkout_notes
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for file versioning
DROP TRIGGER IF EXISTS trigger_file_versioning ON files;
CREATE TRIGGER trigger_file_versioning
    BEFORE INSERT OR UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION handle_file_versioning();

-- RLS policies for file_versions table
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

-- Admins can view all file versions
CREATE POLICY "Admins can view all file versions" ON file_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Staff can view file versions for their projects
CREATE POLICY "Staff can view file versions for their projects" ON file_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'Staff'
        ) OR
        EXISTS (
            SELECT 1 FROM files f
            JOIN projects p ON f.project_id = p.id
            WHERE f.id = file_versions.file_id 
            AND p.author_id = auth.uid()
        )
    );

-- Clients can view file versions for their own projects
CREATE POLICY "Clients can view file versions for their own projects" ON file_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM files f
            JOIN projects p ON f.project_id = p.id
            WHERE f.id = file_versions.file_id 
            AND p.author_id = auth.uid()
        )
    );

-- Only admins can insert file versions (handled by trigger)
CREATE POLICY "Only admins can insert file versions" ON file_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Only admins can update file versions
CREATE POLICY "Only admins can update file versions" ON file_versions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Only admins can delete file versions
CREATE POLICY "Only admins can delete file versions" ON file_versions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );
