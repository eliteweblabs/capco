# Manifest.json Build Processing

This system processes the `manifest.json` file at build time using global environment variables, similar to the VAPI assistant configuration system.

## Files

- `public/manifest.json.template` - Template file with placeholders
- `scripts/process-manifest.js` - Build script that processes the template
- `public/manifest.json` - Generated output file (do not edit directly)

## Template Variables

The following placeholders are available in `manifest.json.template`:

- `{{GLOBAL_COMPANY_NAME}}` - Company name from environment
- `{{GLOBAL_COMPANY_SLOGAN}}` - Company slogan from environment
- `{{YEAR}}` - Current year from environment
- `{{GLOBAL_COLOR_PRIMARY}}` - Primary brand color
- `{{GLOBAL_COLOR_SECONDARY}}` - Secondary brand color

## Usage

### Automatic Processing

The manifest is automatically processed during:

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run build:railway` - Railway deployment build

### Manual Processing

To process the manifest manually:

```bash
npm run process-manifest
```

Or directly:

```bash
node scripts/process-manifest.js
```

## Environment Variables

Set these in your `.env` file:

```env
GLOBAL_COMPANY_NAME="Your Company Name"
GLOBAL_COMPANY_SLOGAN="Your company slogan"
YEAR="2025"
GLOBAL_COLOR_PRIMARY="#3b82f6"
GLOBAL_COLOR_SECONDARY="#0ea5e9"
```

## Template Example

```json
{
  "name": "{{GLOBAL_COMPANY_NAME}}",
  "description": "{{GLOBAL_COMPANY_SLOGAN}}",
  "theme_color": "{{GLOBAL_COLOR_PRIMARY}}",
  "shortcuts": [
    {
      "name": "New Project",
      "url": "/dashboard#new-project"
    }
  ]
}
```

## Output Example

```json
{
  "name": "CAPCO Design Group",
  "description": "Professional Fire Protection Plan Review & Approval",
  "theme_color": "#825BDD",
  "shortcuts": [
    {
      "name": "New Project",
      "url": "/dashboard#new-project"
    }
  ]
}
```

## Notes

- The script automatically creates a template from the current manifest.json if none exists
- All placeholders are replaced with actual values from environment variables
- The output is validated as proper JSON before writing
- The processed manifest.json is used by the PWA system for app installation
