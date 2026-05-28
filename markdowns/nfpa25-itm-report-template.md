# NFPA 25 ITM Report Template

HTML template matching the Inspect Point **Report of Inspection / Test** (Annual NFPA 25) layout, based on the TLE 2026 ITM sample PDF.

## Files

| File | Purpose |
|------|---------|
| `src/templates/pdf/nfpa25-itm-report.html` | Main template shell (styles, layout) |
| `src/templates/pdf/components/itm-report-page-header.html` | Property + contractor header |
| `src/templates/pdf/components/itm-report-content.html` | All sections, questions, tables, deficiencies |
| `scripts/generate-itm-report-template.mjs` | Regenerates content HTML from question definitions |

## Usage

1. In PDF generation, select template **NFPA 25 ITM Report** (`nfpa25-itm-report`).
2. Preview via `/api/pdf/assemble?templateId=nfpa25-itm-report&projectId=<id>`.
3. Header fields auto-fill from project + company placeholders.

## Placeholders

### Header (auto-filled)

- `{{ITM_PROPERTY_NAME}}` → project title
- `{{ITM_PROPERTY_ADDRESS}}` → project address
- `{{ITM_INSPECTION_DATE}}`, `{{ITM_PRINT_DATE}}` → current date
- `{{ITM_CONDUCTED_BY}}` → assigned staff
- `{{ITM_INSPECTION_TYPE}}` → "Annual NFPA 25"
- `{{GLOBAL_COMPANY_NAME}}`, `{{GLOBAL_COMPANY_ADDRESS}}`, etc.

### Yes / No / N/A questions

Each question uses three placeholders; set the selected answer to `checked`:

```html
<span class="box {{ITM_Q_OWNER_BUILDING_OCCUPIED_YES}}"></span> Yes
<span class="box {{ITM_Q_OWNER_BUILDING_OCCUPIED_NO}}"></span> No
<span class="box {{ITM_Q_OWNER_BUILDING_OCCUPIED_NA}}"></span> NA
```

Example: if answer is **Yes**, replace `{{ITM_Q_OWNER_BUILDING_OCCUPIED_YES}}` with `checked`.

### Tables & deficiencies

Block placeholders for dynamic rows/HTML:

- `{{ITM_DRY_VALVE_TRIP_ROWS}}`
- `{{ITM_MAIN_DRAIN_ROWS}}`
- `{{ITM_INSPECTORS_TEST_ROWS}}`
- `{{ITM_VALVE_ROWS}}`
- `{{ITM_DEFICIENCIES_*_HTML}}`

Sample rows from the TLE PDF are embedded as defaults in the generated content file.

## Regenerating content

After editing question definitions in the generator script:

```bash
node scripts/generate-itm-report-template.mjs
```

## Next steps (optional)

- Wire ITM form submission (`/api/nfpa25/wet-pipe-itm`) to populate `ITM_Q_*` placeholders from stored JSON on the project.
- Add per-page repeating headers for exact Inspect Point pagination.
