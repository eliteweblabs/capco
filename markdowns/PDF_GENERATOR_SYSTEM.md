# PDF Generator System

A comprehensive PDF generation system for the CAPCO Design Group Systems application that allows users to create custom documents using templates and components.

## Overview

The PDF generator system provides:

- **Template Management**: Create and manage HTML templates for different document types
- **Component System**: Reusable HTML components that can be inserted into templates
- **Placeholder Replacement**: Dynamic content population using project data
- **Preview Functionality**: Real-time preview of generated documents
- **Document Tracking**: Track generated documents and their components

## Database Schema

### Tables Created

1. **`pdf_templates`** - Stores base HTML templates
2. **`pdf_components`** - Stores reusable HTML snippets/components
3. **`templateComponentMapping`** - Maps components to templates
4. **`generated_documents`** - Tracks generated PDFs
5. **`documentComponents`** - Tracks components used in each document

### Setup

Run the SQL script to create the database schema:

```sql
-- Execute the schema creation script
\i sql-queriers/create-pdf-generator-schema.sql
```

## API Endpoints

### `/api/pdf/data`

- **GET**: Fetch project data and placeholders for PDF generation
- **Parameters**: `projectId` (required)
- **Returns**: Project data, status, files, and placeholder values

### `/api/pdf/templates`

- **GET**: Fetch available PDF templates
- **POST**: Create a new PDF template
- **Returns**: Template list or created template

### `/api/pdf/components`

- **GET**: Fetch available PDF components
- **Parameters**: `templateId` (optional), `type` (optional)
- **POST**: Create a new PDF component
- **Returns**: Component list or created component

### `/api/pdf/generate`

- **POST**: Generate a PDF document
- **Body**: `{ projectId, templateId, documentName, selectedComponents, customPlaceholders }`
- **Returns**: Generated document with HTML content

## Placeholders

The system supports all existing placeholders from `SCOPE.markdown`:

### Project Placeholders

- `{{PROJECT_TITLE}}` - Project title
- `{{PROJECT_ADDRESS}}` - Project address
- `{{ADDRESS}}` - Alias for project address
- `{{PROJECT_DESCRIPTION}}` - Project description
- `{{PROJECT_SQ_FT}}` - Square footage
- `{{PROJECT_NEW_CONSTRUCTION}}` - New construction flag

### Client Placeholders

- `{{COMPANY_NAME}}` - Client name (company or full name)
- `{{CLIENT_EMAIL}}` - Client email
- `{{PHONE}}` - Client phone
- `{{CLIENT_COMPANY}}` - Client company name

### Status Placeholders

- `{{STATUS_NAME}}` - Current status name
- `{{EST_TIME}}` - Estimated completion time
- `{{PROJECT_STATUS_CODE}}` - Status code number

### Staff Placeholders

- `{{ASSIGNED_STAFF_NAME}}` - Assigned staff member name
- `{{ASSIGNED_STAFF_EMAIL}}` - Assigned staff email
- `{{ASSIGNED_STAFF_PHONE}}` - Assigned staff phone

### System Placeholders

- `{{BASE_URL}}` - Application base URL
- `{{CONTRACT_URL}}` - Project contract URL
- `{{BUTTON_LINK}}` - Button link URL
- `{{BUTTON_TEXT}}` - Button text

### Date Placeholders

- `{{CURRENT_DATE}}` - Current date
- `{{CURRENT_DATETIME}}` - Current date and time
- `{{PROJECT_CREATED_DATE}}` - Project creation date

### Document Placeholders

- `{{DOCUMENT_ID}}` - Unique document ID
- `{{DOCUMENT_VERSION}}` - Document version
- `{{FILE_COUNT}}` - Number of project files
- `{{LATEST_FILE}}` - Most recent file name

## Usage

### 1. Access PDF Generation

Navigate to any project page and click the "Generate PDF" tab.

### 2. Select Template

Choose from available templates or create custom ones.

### 3. Add Components

Select components to include in your document:

- **Header Components**: Project headers, titles
- **Content Components**: Sections, tables, information blocks
- **Footer Components**: Document footers, company info

### 4. Generate Document

Click "Generate PDF" to create your document with populated placeholders.

### 5. Preview and Download

Preview the generated document and download as HTML (PDF conversion can be added later).

## File Structure

```
src/
├── pages/
│   ├── api/pdf/
│   │   ├── data.ts              # Project data API
│   │   ├── templates.ts         # Template management API
│   │   ├── components.ts        # Component management API
│   │   └── generate.ts          # PDF generation API
│   └── project/[id]/
│       └── generate-pdf.astro   # PDF generation page
├── components/project/
│   └── TabGeneratePdf.astro     # PDF generation tab
├── templates-pdf/
│   └── capco-default-plan.html  # Default template
└── sql-queriers/
    └── create-pdf-generator-schema.sql
```

## Component Types

### Header Components

- Project headers
- Title blocks
- Company information

### Content Components

- Information sections
- Data tables
- Status displays
- Client information blocks

### Footer Components

- Document footers
- Company details
- Generation metadata

## Template Structure

Templates use placeholder markers for component insertion:

```html
<!-- Header Component Placeholder -->
<div class="component-placeholder header-placeholder">[HEADER COMPONENTS]</div>

<!-- Content Component Placeholder -->
<div class="component-placeholder content-placeholder">[CONTENT COMPONENTS]</div>

<!-- Footer Component Placeholder -->
<div class="component-placeholder footer-placeholder">[FOOTER COMPONENTS]</div>
```

## Security

- **RLS Policies**: All tables have Row Level Security enabled
- **Role-Based Access**: Admins/Staff can manage templates and components
- **Project Access**: Users can only generate documents for their own projects
- **Authentication Required**: All endpoints require valid authentication

## Testing

Run the test script to verify the system:

```bash
node test-pdf-generation.js
```

## Future Enhancements

1. **PDF Conversion**: Integrate Puppeteer or similar for actual PDF generation
2. **File Storage**: Store generated PDFs in Supabase Storage
3. **Template Editor**: Visual template editor interface
4. **Component Library**: Expand component library with more types
5. **Batch Generation**: Generate multiple documents at once
6. **Email Integration**: Send generated documents via email
7. **Version Control**: Track template and component versions
8. **Custom Fields**: Allow custom placeholder definitions

## Troubleshooting

### Common Issues

1. **No Templates Available**: Run the SQL schema script to create default templates
2. **Permission Denied**: Ensure user has proper role (Admin/Staff for template management)
3. **Placeholder Not Replaced**: Check placeholder syntax matches exactly (case-sensitive)
4. **Component Not Showing**: Verify component is active and mapped to template

### Debug Mode

Enable console logging by checking browser developer tools for detailed error messages.

## Support

For issues or questions about the PDF generation system, check:

1. Browser console for JavaScript errors
2. Server logs for API errors
3. Database for RLS policy issues
4. Network tab for failed requests
