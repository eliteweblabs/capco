# PDF System Templates

This directory contains HTML versions of generated PDF documents for preview purposes.

## Purpose

When `SAVE_HTML_TEMPLATES` environment variable is set to `true` or `1`, HTML versions of generated PDF documents are automatically saved here. This allows you to:

- Preview documents online without needing to download PDFs
- Share document previews via URL
- Debug template rendering issues
- Build document preview features in the future

## File Naming Convention

Files are named using the following pattern:

```
project-{projectId}_template-{templateId}_{documentName}_{timestamp}.html
```

Example:

- `project-303_template-5_Proposal_1234567890.html`

## Enabling HTML Saving

Add to your `.env` file:

```bash
SAVE_HTML_TEMPLATES=true
```

Or set as an environment variable:

```bash
export SAVE_HTML_TEMPLATES=1
```

## Notes

- HTML saving is **optional** and **non-blocking** - if it fails, PDF generation continues normally
- Files are saved with the complete rendered HTML (including header, footer, and all placeholder replacements)
- This directory is created automatically if it doesn't exist
- Consider adding this directory to `.gitignore` if you don't want to commit generated templates

## Future Enhancements

These HTML files can be used to:

- Create a document preview API endpoint
- Build an online document viewer
- Generate shareable preview links
- Enable client-side document previews
