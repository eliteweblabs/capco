# ConfigurableInput – Unified Input System

Single source for rendering inputs from JSON config. Shared by Forms, Tables, and MultiStepForm.

## Location

- **Config**: `src/lib/input-field-config.ts`
- **Component**: `src/components/common/ConfigurableInput.astro`
- **Label wrapper**: `src/components/common/InputLabelWrap.astro` (used internally)

## Input Types

### Generic

| Type             | Component                      | Config props                                                     |
| ---------------- | ------------------------------ | ---------------------------------------------------------------- |
| `input`          | `<input>`                      | `inputType`, `min`, `max`, `step`, `minlength`, `autocomplete`   |
| `telephone`      | PhoneAndSMS                    | `showSMS`, `smsChecked`, `selectedCarrier`                       |
| `googleAddress`  | SlotMachineModal               | `fetchApiEndpoint`, `apiParams`, `valueField`, `currentLocation` |
| `textarea`       | `<textarea>`                   | `rows`                                                           |
| `slider`         | UnitSlider                     | `min`, `max`, `step`, `preset`                                   |
| `toggle`         | SlideToggle                    | `checked`, `icon`, `color`, `size`                               |
| `stepper`        | NumberStepper or Stepper       | `min`, `max`, `step`, `variant` ("number" \| "date")             |
| `dateTime`       | `<input type="date">`          | `inputType` ("date" \| "datetime-local" \| "time")               |
| `buttonGroup`    | ToggleButton                   | `options`, `groupType` ("radio" \| "multi-select"), `cssClass`   |
| `dropdownSelect` | `<select>` or SlotMachineModal | `options`, `searchable`                                          |

### Custom

| Type          | Component          | Config props                                                                                       |
| ------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| `staffSelect` | StaffSelectTooltip | `title`, `fetchApiEndpoint`, `saveApiEndpoint`, `project`, `currentUser`, `icon`, `updateCallback` |

## Usage

```astro
<ConfigurableInput
  config={{
    id: "sqFt",
    name: "sqFt",
    type: "slider",
    label: "Square Footage",
    min: 0,
    max: 50000,
    step: 5,
  }}
  context="form"
  value={project?.sqFt ?? 0}
  globalInputClasses={globalInputClasses}
/>

<!-- Table cell (stepper with min/max hours) -->
<ConfigurableInput
  config={{
    id: "dueDate",
    name: "dueDate",
    type: "stepper",
    field: "dueDate",
    meta: "dueDate",
    variant: "date",
    min: 12,
    max: 112,
    step: 1,
  }}
  context="table"
  value={project?.dueDate}
  entityId={project.id}
  onIncrement={`adjustDueDate(${project.id}, 1)`}
  onDecrement={`adjustDueDate(${project.id}, -1)`}
/>
```

## Context

- **form**: Full label, wrapper div, for Form/ProjectForm
- **table**: Compact, no label (optional), for ProjectItem cells. When `entityId` and `config.meta` or `config.field` are set, adds refresh/polling support:
  - `data-refresh`, `data-meta`, `data-meta-value`, `data-project-id` for RefreshManager
  - `onchange` / `onchangeInline` calls `updateProjectField` for debounced save to `/api/projects/upsert`
- **multistep**: Same as form, for MultiStepForm steps

## Adapters

Use adapters to convert existing configs without rewriting JSON:

- `formElementToInputConfig(el)` – FormElementConfig → unified
- `tableColumnToInputConfig(col)` – projectListColumns item → unified
- `multiStepFieldToInputConfig(field)` – MultiStepForm step.fields item → unified

## Adding New Types

1. Add type to `InputType` in `input-field-config.ts`
2. Add interface (e.g. `MyCustomFieldConfig`) if needed
3. Add to `KNOWN_INPUT_TYPES`
4. Add render branch in `ConfigurableInput.astro`
5. Import and use the component
