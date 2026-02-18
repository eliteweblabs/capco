# Unified Form JSON Structure

All forms in `config.json` now use the same **MultiStepFormConfig** structure.

## Structure (same for login, register, contact, MEP, projectForm)

```json
{
  "formId": "string",
  "formAction": "string",
  "formMethod": "post",
  "layout": "standard" | "multi-step",
  "totalSteps": 1,
  "progressBar": false,
  "buttonDefaults": {
    "next": { "type": "next", "variant": "secondary", "icon": "arrow-right", ... },
    "prev": { ... },
    "submit": { ... },
    "skip": { ... }
  },
  "steps": [
    {
      "title": "string",
      "fields": [
        {
          "id": "string",
          "name": "string",
          "type": "text|email|tel|textarea|component|button-group|range|number",
          "label": "string",
          "placeholder": "string",
          "required": false,
          "columns": 1,
          "allow": ["Admin","Staff","Client"],
          "hideAtStatus": [60, 65, ...],
          "readOnlyAtStatus": [...],
          "dataField": "string",
          "dataScrap": true,
          "component": "UnitSlider|GoogleAddressAutocomplete|SlideToggle",
          "options": [{ "value": "...", "label": "..." }],
          "toggleType": "radio|multi-select"
        }
      ],
      "buttons": [
        { "type": "submit", "id": "save-project", "label": "Save Project", "icon": "save", ... },
        { "type": "action", "id": "delete-project", "action": "deleteProject", ... }
      ]
    }
  ]
}
```

## Forms using this structure

| Key | Layout | Notes |
|-----|--------|-------|
| `loginForm` | standard | Auth form |
| `registerForm` | multi-step | Registration wizard |
| `contactForm` | multi-step | Contact wizard |
| `mepForm` | multi-step | MEP wizard |
| `projectForm` | standard | Project details; has `allow`, `hideAtStatus`, `readOnlyAtStatus` for role/status filtering |

## Global vs form defaults

- **formButtonDefaults** (root of config) – applies to all forms
- **Form-specific buttonDefaults** (e.g. `registerForm.buttonDefaults`) – overrides global for that form
- Merge order: global → form → individual button

## projectForm specifics

- `projectForm` is rendered by `ProjectForm.astro`
- Fields can have `allow`, `hideAtStatus`, `readOnlyAtStatus` for role and status-based visibility/read-only
- Same fields can appear multiple times with different `allow` arrays (e.g. architect for Admin/Staff vs Client)
- Uses adapter in `project-form-config.ts` to convert unified structure → `FormElementConfig[]` for `ProjectForm.astro`

## Conversion

To convert legacy `projectForm` array to unified structure:

```bash
npx tsx scripts/convert-project-form-to-unified.ts
```

## New FormFieldConfig fields (for project/context-aware forms)

- `allow?: string[]` – role-based visibility
- `hideAtStatus?: number[]` – hide when project status is in list
- `readOnlyAtStatus?: number[]` – read-only when project status is in list
- `dataField?: string`, `dataScrap?: boolean` – for PDF scraper integration
