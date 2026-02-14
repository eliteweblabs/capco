# Form Type="project" | Type="user" - JSON-Driven Config

## Summary

Unified the ProjectForm pattern and added user/profile form support via JSON config. Created `Form.astro` with `type="project"` and `type="user"`, driven by config files.

## New Files

- **`src/lib/user-form-config.ts`** – User profile form fields (avatar, role, company, name, title, email, phone-sms, bio, actions)
- **`src/lib/form-config.ts`** – Unified loader: `getFormElements(type, options)`
- **`src/components/form/Form.astro`** – Form component with `type="project"` | `type="user"`

## New Field Types (FormElementConfig)

Added to `project-form-config-capco-design-group.ts`:

- `avatar` – Profile picture upload with fallback icon
- `email` – With `readOnly` and optional `lockTooltip`
- `phone-sms` – PhoneAndSMS component (phone + SMS alerts + carrier)

Also added optional props: `readOnly`, `lockTooltip`, `iconPosition`.

## Usage

### Project form (unchanged)

```astro
import ProjectForm from "../components/project/ProjectForm.astro";
<ProjectForm project={project} currentUser={currentUser} ... />
```

Or via Form:

```astro
import Form from "../components/form/Form.astro";
<Form type="project" project={project} currentUser={currentUser} ... />
```

### User form (config-driven)

```astro
import Form from "../components/form/Form.astro";
<Form
  type="user"
  userProfile={userProfile}
  currentUser={currentUser}
  formIdPrefix=""
  isAdminEdit={false}
  globalInputClasses={globalInputClasses}
  globalCompanyPhone={globalCompanyPhone}
/>
```

## ProfileTabForm

General tab content now uses `<Form type="user" ... />`. Settings, Social, and Team tabs are unchanged.

## Config Structure (user-form-config.ts)

```ts
{
  id: "company-name",
  name: "company-name",
  type: "field",
  elementType: "text" | "select" | "avatar" | "email" | "phone-sms" | "textarea",
  label: "...",
  required?: true,
  allow: ["Admin", "Staff", "Client"],  // role filter
  columns?: 1 | 2,  // 2 = side-by-side on lg
  componentProps?: { showSMS: true },  // for phone-sms
}
```

Role select shows only when `isAdminEdit` is true (Admin editing another user).
