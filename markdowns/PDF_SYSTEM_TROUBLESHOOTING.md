# PDF Generation System Troubleshooting

## Issue: Buttons Redirect to Dashboard

The PDF generation buttons in `TabGeneratePdf.astro` are redirecting to the dashboard because the required database tables don't exist yet.

## Root Cause

The PDF generation system requires several database tables that haven't been created:

- `pdf_templates` - stores HTML templates
- `pdf_components` - stores reusable HTML components
- `templateComponentMapping` - links templates to components
- `generated_documents` - tracks generated PDFs
- `documentComponents` - tracks components used in each document

## Solution

### Step 1: Run Database Migration

1. **Run the migration script:**

   ```bash
   ./run-pdf-migration.sh
   ```

2. **Or manually run the SQL:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `sql-queriers/create-pdf-generator-schema.sql`
   - Execute the SQL script

### Step 2: Verify the System

1. **Test the API endpoints:**

   ```bash
   node test-pdf-system.js
   ```

2. **Check if templates are loaded:**
   - Visit `/project/[id]/generate-pdf`
   - The template dropdown should populate with available templates

## What the Migration Creates

### Database Tables

- ✅ **pdf_templates** - Base HTML templates for PDFs
- ✅ **pdf_components** - Reusable HTML components
- ✅ **templateComponentMapping** - Links templates to components
- ✅ **generated_documents** - Tracks generated PDFs
- ✅ **documentComponents** - Tracks components used in documents

### Default Data

- ✅ **CAPCo Default Plan** template
- ✅ **Project Header** component
- ✅ **Client Information** component
- ✅ **Project Status** component
- ✅ **Document Footer** component

### Security

- ✅ **Row Level Security (RLS)** policies
- ✅ **Admin/Staff** access to templates and components
- ✅ **User** access to their own project documents

## API Endpoints

The system uses these API endpoints:

- `GET /api/pdf/templates` - Fetch available templates
- `GET /api/pdf/components?templateId=X` - Fetch components for a template
- `POST /api/pdf/generate` - Generate a PDF document
- `POST /api/pdf/download` - Download generated PDF

## Template System

### Templates

Templates are base HTML documents with placeholders for:

- `{{PROJECT_TITLE}}`
- `{{PROJECT_ADDRESS}}`
- `{{COMPANY_NAME}}`
- `{{CLIENT_EMAIL}}`
- `{{STATUS_NAME}}`
- `{{EST_TIME}}`
- `{{CURRENT_DATE}}`

### Components

Components are reusable HTML snippets that can be inserted into templates:

- **Header components** - Project titles, client info
- **Section components** - Status info, contact details
- **Footer components** - Company info, document metadata

### Workflow

1. User selects a template
2. System loads available components for that template
3. User selects which components to include
4. System generates HTML with template + selected components
5. HTML is converted to PDF and downloaded

## Troubleshooting

### If buttons still redirect to dashboard:

1. Check browser console for errors
2. Verify database migration completed successfully
3. Check if user has proper role (Admin/Staff)
4. Verify API endpoints are accessible

### If templates don't load:

1. Check if `pdf_templates` table exists
2. Verify RLS policies are correct
3. Check user authentication
4. Look for JavaScript errors in browser console

### If PDF generation fails:

1. Check if all required components are selected
2. Verify template HTML is valid
3. Check for missing placeholders
4. Look for server-side errors in logs

## Files Involved

- `src/components/project/TabGeneratePdf.astro` - Main PDF generation interface
- `src/pages/project/[id]/generate-pdf.astro` - PDF generation page
- `src/pages/api/pdf/templates.ts` - Templates API
- `src/pages/api/pdf/components.ts` - Components API
- `src/pages/api/pdf/generate.ts` - PDF generation API
- `src/pages/api/pdf/download.ts` - PDF download API
- `sql-queriers/create-pdf-generator-schema.sql` - Database migration
- `src/templates-html/narrative.html` - New narrative template

## Next Steps

After running the migration:

1. Test the PDF generation system
2. Create additional templates if needed
3. Add more components for customization
4. Test with different project types
