-- Enable RLS on tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Projects table policies
-- Allow users to insert their own projects
CREATE POLICY "Users can insert their own projects" ON projects
FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Allow users to view their own projects
CREATE POLICY "Users can view their own projects" ON projects
FOR SELECT USING (auth.uid() = author_id);

-- Allow users to update their own projects
CREATE POLICY "Users can update their own projects" ON projects
FOR UPDATE USING (auth.uid() = author_id);

-- Allow users to delete their own projects
CREATE POLICY "Users can delete their own projects" ON projects
FOR DELETE USING (auth.uid() = author_id);

-- Admin/Staff overrides for projects
-- Allow Admins to view all projects
CREATE POLICY "Admins can view all projects" ON projects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow Admins to insert projects for any user
CREATE POLICY "Admins can insert any projects" ON projects
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow Admins to update any projects
CREATE POLICY "Admins can update any projects" ON projects
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow Admins to delete any projects
CREATE POLICY "Admins can delete any projects" ON projects
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Files table policies
-- Allow users to insert files for their own projects
CREATE POLICY "Users can insert files for their own projects" ON files
FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  )
);

-- Allow users to view files for their own projects
CREATE POLICY "Users can view files for their own projects" ON files
FOR SELECT USING (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  )
);

-- Allow users to update files for their own projects
CREATE POLICY "Users can update files for their own projects" ON files
FOR UPDATE USING (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  )
);

-- Allow users to delete files for their own projects
CREATE POLICY "Users can delete files for their own projects" ON files
FOR DELETE USING (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  )
);

-- Admin/Staff overrides for files
-- Allow Admins to manage all files
CREATE POLICY "Admins can manage all files" ON files
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Invoices table policies
-- Allow users to insert invoices for their own projects
CREATE POLICY "Users can insert invoices for their projects" ON invoices
FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = invoices.project_id AND author_id = auth.uid()
  )
);

-- Allow users to view invoices for their own projects
CREATE POLICY "Users can view invoices for their projects" ON invoices
FOR SELECT USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = invoices.project_id AND author_id = auth.uid()
  )
);

-- Allow users to update invoices for their own projects
CREATE POLICY "Users can update invoices for their projects" ON invoices
FOR UPDATE USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = invoices.project_id AND author_id = auth.uid()
  )
);

-- Allow users to delete invoices for their own projects
CREATE POLICY "Users can delete invoices for their projects" ON invoices
FOR DELETE USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = invoices.project_id AND author_id = auth.uid()
  )
);

-- Invoice line items table policies
-- Allow users to insert line items for invoices they own
CREATE POLICY "Users can insert line items for their invoices" ON invoice_line_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE id = invoice_line_items.invoice_id AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM projects 
        WHERE id = invoices.project_id AND author_id = auth.uid()
      )
    )
  )
);

-- Allow users to view line items for invoices they own
CREATE POLICY "Users can view line items for their invoices" ON invoice_line_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE id = invoice_line_items.invoice_id AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM projects 
        WHERE id = invoices.project_id AND author_id = auth.uid()
      )
    )
  )
);

-- Allow users to update line items for invoices they own
CREATE POLICY "Users can update line items for their invoices" ON invoice_line_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE id = invoice_line_items.invoice_id AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM projects 
        WHERE id = invoices.project_id AND author_id = auth.uid()
      )
    )
  )
);

-- Allow users to delete line items for invoices they own
CREATE POLICY "Users can delete line items for their invoices" ON invoice_line_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE id = invoice_line_items.invoice_id AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM projects 
        WHERE id = invoices.project_id AND author_id = auth.uid()
      )
    )
  )
);

-- Admin/Staff overrides
-- Allow Admins to manage all invoices
CREATE POLICY "Admins can manage all invoices" ON invoices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow Admins to manage all invoice line items
CREATE POLICY "Admins can manage all invoice line items" ON invoice_line_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);