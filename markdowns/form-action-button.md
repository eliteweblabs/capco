# FormActionButton – Action-Based Form Buttons

**Use FormActionButton for ALL form submit/cancel/next/prev buttons.** Do not use raw `<button>` or `Button.astro` for form actions. See `.cursor/rules/form-action-button.mdc` for the project rule.

All submit buttons same style, all cancel same style. Uses `GLOBAL_BUTTON_DEFAULTS` from `multi-step-form-config.ts`.

## Usage

```astro
import FormActionButton from "../components/form/FormActionButton.astro";

<!-- Submit (primary, check icon by default) -->
<FormActionButton action="submit" />

<!-- Submit with custom label -->
<FormActionButton action="submit" label="Save" />

<!-- Submit for comments (send icon) -->
<FormActionButton action="submit" label="Post Comment" icon="send" size="sm" type="button" />

<!-- Cancel (outline, x icon) -->
<FormActionButton action="cancel" />

<!-- Cancel with id for script handlers -->
<FormActionButton action="cancel" id="cancel-btn" />

<!-- Slot for custom content (e.g. loading state span) -->
<FormActionButton action="submit" id="submit-btn">
  <span id="submit-btn-text">Certify PDF</span>
</FormActionButton>
```

## Actions & Defaults

| Action  | Variant | Size | Icon | Label   |
|---------|---------|------|------|---------|
| submit  | primary | lg   | check| Submit  |
| cancel  | outline | md   | x    | Cancel  |
| new     | primary | md   | plus | New     |
| next    | secondary | md | arrow-right | Next  |
| prev    | anchor  | md   | arrow-left | Back  |
| skip    | outline | md   | —    | Skip    |

Override any with props: `variant`, `size`, `icon`, `iconPosition`, `label`.

## Overlays and fixed positioning

**Buttons fixed on screen or above an image** (hero CTAs, FABs, image overlays) should use `variant="outline"` so the background shows through. Solid primary blocks the view; outline keeps text legible while letting the background remain visible.

## Overrides

- **label** – Override default label
- **icon** – Override default icon (e.g. `"send"` for comment submit)
- **size** – Override default size (e.g. `"sm"` for inline forms)
- **type** – Submit defaults to `type="submit"`, others to `type="button"`. Override when submit is handled by script (`type="button"`).

## Config

Defaults live in `src/lib/multi-step-form-config.ts`:

```ts
export const GLOBAL_BUTTON_DEFAULTS = {
  submit: { variant: "primary", size: "lg", icon: "check", ... },
  cancel: { variant: "outline", size: "md", icon: "x", label: "Cancel", ... },
  // next, prev, skip, choice, action...
};
```

Change these to update all form buttons across the app.
