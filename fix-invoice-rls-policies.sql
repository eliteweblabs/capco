-- Fix RLS policies for invoice-related tables
-- This script adds missing RLS policies for invoices and invoice_line_items tables

-- Enable RLS on invoice tables (if not already enabled)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean slate)
DROP POLICY IF EXISTS "Users can manage invoices for their projects" ON invoices;
DROP POLICY IF EXISTS "Users can view invoices for their projects" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices for their projects" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices for their projects" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices for their projects" ON invoices;

DROP POLICY IF EXISTS "Users can manage line items for their invoices" ON invoice_line_items;
DROP POLICY IF EXISTS "Users can view line items for their invoices" ON invoice_line_items;
DROP POLICY IF EXISTS "Users can insert line items for their invoices" ON invoice_line_items;
DROP POLICY IF EXISTS "Users can update line items for their invoices" ON invoice_line_items;
DROP POLICY IF EXISTS "Users can delete line items for their invoices" ON invoice_line_items;

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

-- Also add Admin/Staff overrides if needed
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
