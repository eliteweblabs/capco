# PDF System Plugin

A self-contained PDF template management system with accordion-based editing and CRUD operations, organized like a WordPress plugin.

## 📁 Structure

```
pdf-system/
├── PDFSystem.astro          # Main component (import this)
└── README.md                # Documentation

# API Routes (must stay in pages/api due to Astro requirements)
pages/api/pdf/templates/
├── get.ts                   # GET /api/pdf/templates
├── upsert.ts               # POST /api/pdf/templates/upsert
└── [id].ts                 # DELETE /api/pdf/templates/[id]
```

## 🚀 Usage

Import and use the component in any page:

```astro
---
import PDFSystem from '../../components/pdf-system/PDFSystem.astro';
---

<PDFSystem 
  {currentUser} 
  {globalInputClasses}
  {secondaryTextClasses}
  {primaryTextClasses}
/>
```

## 🔌 Plugin Installation

This system is designed to be self-contained. To use it:

1. **Component**: Located in `src/components/pdf-system/PDFSystem.astro`
2. **API Routes**: Located in `src/pages/api/pdf/templates/` (Astro requirement - cannot be moved)
3. **Page**: Import the component in your page file

Example page (`src/pages/admin/pdf-system.astro`):
```astro
---
import PDFSystem from "../../components/pdf-system/PDFSystem.astro";
---

<PDFSystem 
  {globalInputClasses}
  {secondaryTextClasses}
  {primaryTextClasses}
/>
```

## 📡 API Endpoints

**Note**: Astro requires API routes to be in `pages/api/`, so these remain there but are part of this plugin:

- `GET /api/pdf/templates` - List all templates
- `POST /api/pdf/templates/upsert` - Create/update template  
- `DELETE /api/pdf/templates/[id]` - Delete template

## ✨ Features

- ✅ Accordion-based template list (following FileManager pattern)
- ✅ Quill WYSIWYG editor for each template
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Template name and description editing
- ✅ "Create New Template" button
- ✅ Self-contained component structure

## 🔧 Implementation Details

- Each template has its own Quill editor instance (stored in `this.templateEditors`)
- Editors are initialized when accordions are opened
- Changes are saved via the upsert endpoint
- Delete requires confirmation dialog
- First template accordion opens by default
- Fixed delete endpoint: Uses `DELETE /api/pdf/templates/[id]` (not `/api/pdf/templates/delete`)

## 📝 Notes

- The component is fully self-contained except for API routes (Astro limitation)
- API routes must remain in `pages/api/` but are documented here as part of the plugin
- All functionality is in the single `PDFSystem.astro` component file
- The delete endpoint has been fixed to use the correct route format
