# Forms Managed in Config JSON

All form configs are managed in config JSON. The app loads **config-${RAILWAY_PROJECT_NAME}.json** first (e.g. `config-rothco-built.json`), then **config.json**. See `markdowns/config-filename-and-client-config.md` for full resolution order.

## Where forms live

- **`config.forms`** – Preferred. Add any form here keyed by id, e.g. `forms["nfpa25-wet-pipe-itm"]`.
- **Legacy top-level keys** – Still supported: `registerForm`, `loginForm`, `contactForm`, `reviewForm`, `mepForm`, `projectForm`. These are used when no entry exists in `config.forms` for the corresponding form id.

## Loading a form in a page

```ts
import { getFormConfig } from "@/lib/forms/form-config-from-site";

const formConfig = await getFormConfig("nfpa25-wet-pipe-itm");
if (!formConfig) throw new Error("Form not found in config.json");
// Use with <MultiStepForm config={formConfig} /> or ConfigForm
```

## Form IDs and legacy keys

| Form ID (for `getFormConfig(id)`) | Legacy key (if not in `forms`) |
|----------------------------------|---------------------------------|
| `nfpa25-wet-pipe-itm`            | (only in `forms`)               |
| `register-form`                  | `registerForm`                 |
| `login-form`                     | `loginForm`                    |
| `contact-form`                   | `contactForm`                  |
| `review-form`                    | `reviewForm`                   |
| `mep-form`                       | `mepForm`                      |

## Adding a new form

1. Add a new key under `forms` in **public/data/config.json**, e.g. `forms["my-form-id"]` with a full `MultiStepFormConfig` (formId, formAction, steps, etc.).
2. In your page, call `const config = await getFormConfig("my-form-id")` and pass it to `MultiStepForm` or `ConfigForm`.

Existing getters (`getRegisterFormConfig`, `getLoginFormConfig`, `getContactFormConfig`, etc.) first check `config.forms[formId]`; if missing, they use the legacy top-level key. You can move register/login/contact into `forms` anytime and the app will use them from there.
