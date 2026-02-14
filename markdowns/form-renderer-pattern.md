# Form Renderer Pattern

Config-driven forms use the same `MultiStepFormConfig` across interchangeable renderers.

## Flow

1. **Feature forms** (`LoginForm`, `ContactForm`) handle business logic: auth check, redirect, config loading from site-config
2. **ConfigForm** routes `_____FormConfig` to the right renderer based on `config.layout`
3. **Renderers** accept the same config:
   - **StandardForm** – single-page form
   - **MultiStepForm** – step-by-step wizard
   - Add more in the future in `ConfigForm.astro`

## Usage

```astro
<!-- LoginForm: gets config, passes to ConfigForm -->
<ConfigForm config={loginFormConfig} initialData={{ redirect: redirectUrl }} />
```

## Choosing layout

### Via site-config

Add `"layout": "standard"` or `"layout": "multi-step"` to the form config in site-config JSON:

```json
{
  "loginForm": {
    "layout": "standard",
    "formId": "multi-step-login-form",
    ...
  }
}
```

- `"standard"` – single-page form
- `"multi-step"` – step-by-step (default when omitted)

### Direct use

Use a specific renderer when needed:

```astro
<StandardForm config={loginFormConfig} initialData={{ redirect }} />
<MultiStepForm config={contactFormConfig} />
```

## Extending

1. Add a new layout type to `FormLayout` in `src/lib/multi-step-form-config.ts`
2. Add the renderer component (e.g. `WizardForm.astro`)
3. Update the switch in `ConfigForm.astro`
