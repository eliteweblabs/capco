# NFPA 25 Wet Pipe ITM — Multi-Step Form (Template)

Single form template from **2520FMPDF.pdf**, using the proper components. Get this one correct, then apply the same pattern to the other ~19 forms in the PDF.

## Components used

| Use case | Component | Config |
|----------|-----------|--------|
| **Address** | `InlineAddressSearch` | `type: "component", component: "InlineAddressSearch", componentProps: { fetchApiEndpoint, apiParams }` |
| **Inspection frequency** (multi-select) | `ToggleButton` | `type: "component", component: "ToggleButton", toggleType: "multi-select", options: [{ value, label }]` |
| **Yes/No/N/A** | `button-group` | One step per item: `fields: [hidden, button-group]` with `YNA_BUTTONS` |
| **Psi / numeric range** | `range` (UnitSlider) | `type: "range", min, max, step, value` or `type: "number"` for exact psi |
| **Stepper** | Built-in | `progressBar: true` on config |

## Form structure (10 steps)

1. **Property & Inspector** — text + **address** (Property Address via InlineAddressSearch), tel, date.
2. **Inspection Frequency** — **ToggleButton** multi-select: Daily, Weekly, Monthly, Quarterly, Annually, Five Years.
3. **Daily** — Valve cold weather (YNA **button-group**).
4. **Weekly** — Backflow isolation (YNA).
5. **Weekly** — Master pressure **range** (psi 0–300).
6. **Weekly** — Control valves position (YNA).
7. **Monthly** — Gauges (YNA).
8. **Quarterly** — Main drain test **number** fields (static / residual psi).
9. **Annual** — Sprinklers (YNA).
10. **Comments & Signature** — textarea, text, **address** (Contractor Address), license.

## Files

- **Config**: `src/lib/forms/nfpa25-wet-pipe-itm-form-config.ts`
- **Page**: `src/pages/nfpa25/wet-pipe-itm.astro` → `/nfpa25/wet-pipe-itm`
- **API**: `src/pages/api/nfpa25/wet-pipe-itm.ts`

## ToggleButton in MultiStepForm

The form needs to be findable by ToggleButton’s script (it looks for `form[data-project-id]`). **MultiStepForm.astro** sets `data-project-id={config.formId}` on the form so ToggleButton creates/updates the hidden input for multi-select values.

## Replicating for other PDF forms

The PDF (2520FMPDF) contains ~20 forms, e.g.:

- Wet Pipe (this template)
- Dry Pipe, Preaction/Deluge, Standpipe, Water Spray, Water Mist, Foam-Water
- Private Fire Service Mains, Hydrant Flow Test, Water Storage Tanks
- Fire Sprinkler Hazard Evaluation, Contractor Certificates (Aboveground/Underground)
- Fire Pump (Weekly, Monthly, Quarterly, Semiannual, Annual, Performance Test), Possible Causes of Pump Troubles

For each new form:

1. Copy `nfpa25-wet-pipe-itm-form-config.ts` to e.g. `nfpa25-dry-pipe-itm-form-config.ts`.
2. Change `formId`, `formAction`, step titles/subtitles, and field names to match that form’s sections.
3. Reuse: `addressField()`, `ynaStep()`, same **InlineAddressSearch** / **ToggleButton** / **button-group** / **range** / **number** patterns.
4. Add a page (e.g. `src/pages/nfpa25/dry-pipe-itm.astro`) and an API route for submit.
5. Optionally share a single API that branches on form type or use separate endpoints per form.
