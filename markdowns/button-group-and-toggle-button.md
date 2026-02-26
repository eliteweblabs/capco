# button-group vs ToggleButton.astro

## Summary

- **`button-group`** is a **form field type** in config (e.g. `type: "button-group"` in project-form-config, multi-step-form-config, config.json). It means “one choice from a set” (radio) or “multiple choices” (multi-select).
- **ToggleButton.astro** is the **shared UI component** that implements that behavior: one button with `data-value`, `data-group`, `data-type` (radio | multi-select), its own click handler, and updates to a hidden input.

There is no separate “button-group component.” All `button-group` fields are rendered using **ToggleButton.astro** (after the unification below).

## Where button-group is used

| Context | Config | Renders |
|--------|--------|--------|
| **ProjectForm** | `element.type === "button-group"` | `<ToggleButton>` per option (always did) |
| **FormFieldContent (multi-step)** | `field.type === "button-group"` | Now `<ToggleButton>` per option (was raw `<Button>` + handler) |
| **FormFieldContent (multi-step)** | `field.component === "ToggleButton"` | `<ToggleButton>` per `field.options` (unchanged) |

So:

- **ProjectForm** and **MultiStepForm** both use the same component (**ToggleButton.astro**) for `button-group`.
- The multi-step “choice button” handler in `multi-step-form-handler.ts` no longer updates value/visuals for these; it only runs for legacy non-ToggleButton choice buttons. For ToggleButton it only enables the Next button and runs `updateConditionalFields()`.

## Config shape

- **button-group** (multi-step): `type: "button-group"`, `buttons: FormButtonConfig[]` (each with `dataValue`, `label`, etc.), optional `toggleType: "radio" | "multi-select"`.
- **component ToggleButton** (multi-step): `component: "ToggleButton"`, `options: { value, label }[]`, `toggleType`.
- **ProjectForm**: `type: "button-group"`, `options`, `groupType: "radio" | "multi-select"`.

## ToggleButton.astro behavior

- Finds/creates hidden input `name={group}` (e.g. on `form[data-project-id]`).
- Stores value as JSON array (radio: one item; multi-select: multiple).
- Dispatches `toggleButtonChange`; exposes `getToggleButtonValues(group)` / `setToggleButtonValues(group, values)` on `window`.

Multi-step forms use the same form element with `data-project-id={config.formId}`, so ToggleButton’s script works there too. The step’s hidden field (same `name` as the button-group) is the one ToggleButton updates.
