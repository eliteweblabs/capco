# PDF System Plugin

A self-contained PDF template management system with accordion-based editing and CRUD operations.

## Structure

```
pdf-system/
├── PDFSystem.astro          # Main component (import this)
├── api/                      # API route handlers (referenced, not moved)
│   └── templates/
│       ├── get.ts           # GET /api/pdf/templates
│       ├── upsert.ts        # POST /api/pdf/templates/upsert
│       └── [id].ts          # DELETE /api/pdf/templates/[id]
└── README.md                # This file
```

## Usage

Import and use the component in any page:

```astro
---
import PDFSystem from '../components/pdf-system/PDFSystem.astro';
---

<PDFSystem 
  {currentUser} 
  {globalInputClasses}
  {secondaryTextClasses}
  {primaryTextClasses}
/>
```

## API Endpoints

The API endpoints remain in `src/pages/api/pdf/templates/` because Astro requires API routes to be in `pages/api/`. They are:

- `GET /api/pdf/templates` - List all templates
- `POST /api/pdf/templates/upsert` - Create/update template
- `DELETE /api/pdf/templates/[id]` - Delete template

## Features

- ✅ Accordion-based template list (following FileManager pattern)
- ✅ Quill WYSIWYG editor for each template
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Template name and description editing
- ✅ "Create New Template" button

## Notes

- Each template has its own Quill editor instance
- Editors are initialized when accordions are opened
- Changes are saved via the upsert endpoint
- Delete requires confirmation

