# PDF System Plugin - Setup Guide

This plugin can be easily repurposed and extracted into its own repository for use across multiple projects.

## 📦 Plugin Structure

```
pdf-system/
├── PDFSystem.astro          # Main component
├── pdf-system.config.ts     # Configuration module
├── pdf-system.env.example   # Environment variable template
├── templates/               # HTML template storage (auto-created)
├── README.md                # Plugin documentation
└── PLUGIN_SETUP.md          # This file

# Required API Routes (must be in pages/api due to Astro structure)
pages/api/pdf/
├── generate.ts              # Generate PDF from template
├── upsert.ts                # Save PDF document
└── templates/
    ├── get.ts               # List templates
    ├── upsert.ts            # Create/update template
    └── [id].ts              # Delete template
```

## 🚀 Quick Installation

### 1. Copy Plugin Files

Copy the entire `pdf-system` directory to your project:

```bash
# From your project root
cp -r src/features/pdf-system ./src/features/pdf-system
```

### 2. Copy API Routes

Copy the PDF API routes:

```bash
# Ensure the directory exists
mkdir -p src/pages/api/pdf/templates

# Copy all API files
cp -r src/pages/api/pdf/* ./src/pages/api/pdf/
```

### 3. Environment Configuration

**Option A: Using .env file (Recommended)**

Copy the example env file to your project root:

```bash
cp src/features/pdf-system/pdf-system.env.example .env.local
```

Then edit `.env.local` and customize the values.

**Option B: Using Config File**

Import and customize `pdf-system.config.ts`:

```typescript
import { loadConfig } from './features/pdf-system/pdf-system.config';

const pdfConfig = loadConfig({
  saveHtmlTemplates: true,
  templatesDirectory: 'custom/path/templates',
  // ... other overrides
});
```

### 4. Database Setup

Ensure your Supabase database has the required tables:

- `pdfTemplates` - Stores PDF templates
- `pdfGenerationJobs` - Tracks PDF generation jobs

See `SETUP_DATABASE.md` for SQL schema (if created).

### 5. Storage Setup

Ensure your Supabase storage has the bucket:
- `project-media` (or configure via `PDF_STORAGE_BUCKET`)

### 6. Use the Component

Import and use in any page:

```astro
---
import PDFSystem from '../../features/pdf-system/PDFSystem.astro';
---

<PDFSystem 
  {currentUser} 
  {globalInputClasses}
  {secondaryTextClasses}
  {primaryTextClasses}
/>
```

## 🔧 Configuration Options

### Environment Variables

All settings can be configured via environment variables (see `pdf-system.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `SAVE_HTML_TEMPLATES` | `false` | Save HTML versions for preview |
| `PDF_TEMPLATES_DIR` | `src/features/pdf-system/templates` | HTML templates directory |
| `PDF_STORAGE_BUCKET` | `project-media` | Supabase storage bucket |
| `PDF_DEFAULT_PAGE_SIZE` | `8.5x11` | Default PDF page size |
| `PDF_DEFAULT_ORIENTATION` | `portrait` | Default orientation |
| `PDF_ENABLE_ENCRYPTION` | `true` | Enable PDF encryption |
| `PDF_ENABLE_HTML_PREVIEW` | `true` | Enable HTML previews |
| `PDF_ENABLE_GOOGLE_CONTACTS` | `true` | Enable Google Contacts |

### Programmatic Configuration

```typescript
import { loadConfig } from './components/pdf-system/pdf-system.config';

const config = loadConfig({
  saveHtmlTemplates: true,
  api: {
    templates: {
      list: '/custom/api/path',
    },
  },
});
```

## 📦 Standalone Repository

To extract this into its own repository:

### 1. Create New Repository

```bash
mkdir astro-pdf-system-plugin
cd astro-pdf-system-plugin
git init
```

### 2. Copy Files

```bash
# Component files
cp -r src/features/pdf-system ./

# API routes (with note about Astro requirement)
cp -r src/pages/api/pdf ./
```

### 3. Create Package Structure

```
astro-pdf-system-plugin/
├── src/
│   ├── components/
│   │   └── pdf-system/    # Plugin component
│   └── api/
│       └── pdf/           # API routes
├── package.json
├── README.md
└── LICENSE
```

### 4. Add Installation Script

Create `install.sh`:

```bash
#!/bin/bash
# Install PDF System Plugin

echo "Installing PDF System Plugin..."

# Copy component
cp -r src/features/pdf-system $TARGET_PROJECT/src/features/

# Copy API routes
cp -r src/api/pdf $TARGET_PROJECT/src/pages/api/

# Copy config example
cp pdf-system.env.example $TARGET_PROJECT/

echo "✅ Installation complete!"
echo "📝 Don't forget to:"
echo "   1. Configure environment variables"
echo "   2. Set up database tables"
echo "   3. Configure Supabase storage"
```

## 🔌 Plugin Dependencies

The plugin requires:

- **Astro** framework
- **Supabase** (database + storage)
- **Puppeteer** (for PDF generation)
- **Quill** (WYSIWYG editor - already included)
- **PDF.js** (for OCR - already included)

## 📝 Integration Checklist

- [ ] Copy `pdf-system` component directory
- [ ] Copy API routes to `pages/api/pdf/`
- [ ] Configure environment variables
- [ ] Set up database tables (`pdfTemplates`, `pdfGenerationJobs`)
- [ ] Configure Supabase storage bucket
- [ ] Install dependencies (if not already installed)
- [ ] Import component in your page
- [ ] Test PDF generation

## 🐛 Troubleshooting

### HTML Templates Not Saving

Check:
- `SAVE_HTML_TEMPLATES=true` in environment
- Directory permissions for templates folder
- File system access (not available in some serverless environments)

### API Routes Not Working

Ensure routes are in `pages/api/pdf/` (Astro requirement)

### PDF Generation Fails

Check:
- Puppeteer is installed
- Storage bucket exists and has correct permissions
- Database tables are set up correctly

## 📚 Additional Resources

- [Plugin README](./README.md)
- [Configuration Reference](./pdf-system.config.ts)
- [Environment Variables](./pdf-system.env.example)

