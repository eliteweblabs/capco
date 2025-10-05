# PDF Templates System

This directory contains HTML templates and components for PDF generation. Templates are stored as HTML files instead of in the database for easier editing and version control.

## Directory Structure

```
src/templates/pdf/
├── README.md                    # This file
├── templates.json              # Template and component configuration
├── fire-protection-plan.html   # Main template file
└── components/                 # Reusable components
    ├── header-company-logo.html
    ├── content-project-summary.html
    └── footer-contact-info.html
```

## How It Works

### 1. Templates

- **Location**: Root of `src/templates/pdf/`
- **Format**: Complete HTML documents with inline CSS
- **Placeholders**: Use `{{PLACEHOLDER_NAME}}` syntax for dynamic content
- **Component Insertion**: Use `[HEADER COMPONENTS]`, `[CONTENT COMPONENTS]`, `[FOOTER COMPONENTS]` markers

### 2. Components

- **Location**: `src/templates/pdf/components/`
- **Format**: HTML snippets (no full document structure)
- **Types**: `header`, `content`, `footer`
- **Reusable**: Can be used across multiple templates

### 3. Configuration

- **File**: `templates.json`
- **Purpose**: Defines which components can be used with which templates
- **Structure**: Maps template IDs to component IDs by type

## Adding New Templates

1. **Create HTML file** in `src/templates/pdf/`
2. **Add to `templates.json`**:
   ```json
   {
     "templates": [
       {
         "id": "your-template-id",
         "name": "Your Template Name",
         "description": "Template description",
         "file": "your-template.html",
         "components": {
           "header": ["component-id-1"],
           "content": ["component-id-2"],
           "footer": ["component-id-3"]
         }
       }
     ]
   }
   ```

## Adding New Components

1. **Create HTML file** in `src/templates/pdf/components/`
2. **Add to `templates.json`**:
   ```json
   {
     "components": [
       {
         "id": "your-component-id",
         "name": "Your Component Name",
         "description": "Component description",
         "type": "header|content|footer",
         "file": "components/your-component.html"
       }
     ]
   }
   ```

## Available Placeholders

### Project Data

- `{{PROJECT_TITLE}}` - Project title
- `{{PROJECT_ADDRESS}}` - Project address
- `{{PROJECT_DESCRIPTION}}` - Project description
- `{{PROJECT_SQ_FT}}` - Square footage
- `{{PROJECT_NEW_CONSTRUCTION}}` - New construction flag

### Client Data

- `{{COMPANY_NAME}}` - Client name
- `{{CLIENT_EMAIL}}` - Client email
- `{{PHONE}}` - Client phone
- `{{COMPANY_NAME}}` - Client company

### Status & Staff

- `{{STATUS_NAME}}` - Current status name
- `{{PROJECT_EST_TIME}}` - Estimated completion time
- `{{ASSIGNED_STAFF_NAME}}` - Assigned staff name
- `{{ASSIGNED_STAFF_EMAIL}}` - Assigned staff email
- `{{ASSIGNED_STAFF_PHONE}}` - Assigned staff phone

### System Data

- `{{CURRENT_DATE}}` - Current date
- `{{BASE_URL}}` - Application base URL
- `{{DOCUMENT_ID}}` - Unique document ID
- `{{DOCUMENT_VERSION}}` - Document version

## Template Development Tips

1. **Use inline CSS** - External stylesheets won't work in PDF generation
2. **Test with real data** - Use actual project data for realistic previews
3. **Keep components focused** - Each component should have a single purpose
4. **Use semantic HTML** - Helps with accessibility and PDF structure
5. **Test print styles** - PDF generation uses print media queries

## Editing Workflow

1. **Edit HTML files** directly in your editor
2. **Test changes** by accessing the PDF generation page
3. **Preview in browser** using the preview functionality
4. **Generate PDF** to test final output
5. **Commit changes** to version control

## Example Template Structure

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      /* Inline CSS here */
    </style>
  </head>
  <body>
    <!-- Header Component Placeholder -->
    <div class="component-placeholder header-placeholder">[HEADER COMPONENTS]</div>

    <!-- Main content with placeholders -->
    <div class="content">
      <h1>{{PROJECT_TITLE}}</h1>
      <p>{{PROJECT_DESCRIPTION}}</p>
    </div>

    <!-- Content Component Placeholder -->
    <div class="component-placeholder content-placeholder">[CONTENT COMPONENTS]</div>

    <!-- Footer Component Placeholder -->
    <div class="component-placeholder footer-placeholder">[FOOTER COMPONENTS]</div>
  </body>
</html>
```

## Testing

1. Start your development server
2. Navigate to a project page
3. Click "Generate PDF" tab
4. Select your template
5. Choose components
6. Preview and generate PDF

The system will automatically reload templates and components from files when you make changes.
