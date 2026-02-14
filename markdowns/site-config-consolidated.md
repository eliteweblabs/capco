# Site Config – Consolidated Form Configs

All company-specific form and table configs now live in `site-config-{company-slug}.json`. One JSON file per company.

## Top-Level Keys

| Key                  | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `asideNav`           | Sidebar navigation (see aside-nav-config.md)                    |
| `projectListColumns` | Project dashboard table columns                                 |
| `projectForm`        | Project form unified elements (address, architect, sq_ft, etc.) |
| `registerForm`       | Registration multi-step form config                             |
| `loginForm`          | Login multi-step form config                                    |
| `contactForm`        | Contact form config                                             |
| `mepForm`            | MEP intake form config                                          |

## Placeholders (contactForm, mepForm)

Use in strings; replaced at runtime:

- `{{globalCompanyName}}`
- `{{virtualAssistantName}}` or `{{assistantName}}`

## Merge Behavior

When loading `site-config-capco-design-group.json`, missing keys are filled from `site-config.json`. So you can omit `registerForm`, `loginForm`, etc. in company files and inherit the default.

## Removed Files

- `src/lib/forms/register-form-config.ts`
- `src/lib/forms/login-form-config.ts`
- `src/lib/forms/contact-form-config.ts`
- `src/lib/forms/mep-form-config.ts`
- `src/lib/project-form-config-capco-design-group.ts`
- `src/lib/project-form-config-rothco-built.ts`

## Loaders

- `src/lib/forms/form-config-from-site.ts` – register, login, contact, mep
- `src/lib/project-form-config.ts` – project form (reads `projectForm` from site-config)
