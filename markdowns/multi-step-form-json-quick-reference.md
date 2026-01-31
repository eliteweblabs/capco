# Multi-Step Form JSON System - Quick Reference

## Create a New Form in 3 Steps

### 1. Create Config (`src/lib/forms/my-form-config.ts`)

```typescript
import type { MultiStepFormConfig } from "../multi-step-form-config";

export const myFormConfig: MultiStepFormConfig = {
  formId: "my-form",
  formAction: "/api/my-endpoint",
  totalSteps: 3,
  progressBar: true,
  
  steps: [
    {
      stepNumber: 1,
      title: "Step 1 Title",
      fields: [
        {
          id: "email",
          name: "email",
          type: "email",
          placeholder: "Email...",
          required: true,
        },
      ],
      buttons: [
        { type: "next", label: "next", dataNext: 2 },
      ],
    },
    // More steps...
  ],
};
```

### 2. Create Page (`src/pages/my-form.astro`)

```astro
---
import Layout from "../layouts/Layout.astro";
import MultiStepForm from "../components/form/MultiStepForm.astro";
import { myFormConfig } from "../lib/forms/my-form-config";
---

<Layout title="My Form">
  <div class="min-h-screen flex items-center justify-center py-12">
    <MultiStepForm config={myFormConfig} />
  </div>
</Layout>
```

### 3. Test at `/my-form`

## Common Field Patterns

### Text Input
```typescript
{
  id: "first-name",
  name: "firstName",
  type: "text",
  placeholder: "John",
  required: true,
  autocomplete: "given-name",
  errorMessage: "Please enter your first name",
}
```

### Email
```typescript
{
  id: "email",
  name: "email",
  type: "email",
  placeholder: "you@example.com",
  required: true,
  autocomplete: "email",
}
```

### Phone (auto-formats)
```typescript
{
  id: "phone",
  name: "phone",
  type: "tel",
  placeholder: "(555) 123-4567",
  autocomplete: "tel",
}
```

### Textarea
```typescript
{
  id: "message",
  name: "message",
  type: "textarea",
  placeholder: "Your message...",
  required: true,
  rows: 6,
}
```

### Password
```typescript
{
  id: "password",
  name: "password",
  type: "password",
  placeholder: "Password",
  required: true,
  minlength: 6,
  autocomplete: "new-password",
}
```

### Hidden
```typescript
{
  id: "role",
  name: "role",
  type: "hidden",
}
```

### Dropdown (Component)
```typescript
{
  id: "carrier",
  name: "mobileCarrier",
  type: "component",
  component: "SlotMachineModalStaff",
  componentProps: {
    title: "Select carrier",
    placeholder: "Select...",
    buttonVariant: "outline",
  },
}
```

### Address Search (Component)
```typescript
{
  id: "address",
  name: "address",
  type: "component",
  component: "InlineAddressSearch",
  componentProps: {
    placeholder: "Start typing address...",
    fetchApiEndpoint: "/api/google/places-autocomplete",
  },
}
```

## Common Button Patterns

### Next Button
```typescript
{ type: "next", label: "next", dataNext: 2 }
```

### Previous Button
```typescript
{ type: "prev", label: "back", dataPrev: 1 }
```

### Submit Button
```typescript
{ type: "submit", label: "submit" }
```

### Yes/No Choice Buttons
```typescript
[
  {
    type: "choice",
    label: "no",
    variant: "primary",
    dataNext: 5,
    dataValue: "false",
  },
  {
    type: "choice",
    label: "yes",
    variant: "secondary",
    dataNext: 3,
    dataValue: "true",
  },
]
```

### Skip Button
```typescript
{ type: "skip", label: "skip", dataNext: 4 }
```

### Link Button
```typescript
{ type: "prev", label: "Login", href: "/auth/login" }
```

## Common Step Patterns

### Single Field Step
```typescript
{
  stepNumber: 1,
  title: "Your email?",
  fields: [
    { id: "email", name: "email", type: "email", required: true },
  ],
  buttons: [
    { type: "next", label: "next", dataNext: 2 },
  ],
}
```

### Two-Column Grid
```typescript
{
  stepNumber: 2,
  title: "Your name?",
  fieldLayout: "grid",
  fields: [
    { id: "first-name", name: "firstName", type: "text", required: true, columns: 2 },
    { id: "last-name", name: "lastName", type: "text", required: true, columns: 2 },
  ],
  buttons: [
    { type: "prev", label: "back", dataPrev: 1 },
    { type: "next", label: "next", dataNext: 3 },
  ],
}
```

### Yes/No Choice Step
```typescript
{
  stepNumber: 4,
  title: "Opt-in to SMS?",
  subtitle: "Not for marketing",
  fields: [
    { id: "sms-alerts", name: "smsAlerts", type: "hidden" },
  ],
  buttons: [
    { type: "prev", label: "back", dataPrev: 3 },
    { type: "choice", label: "no", dataNext: 6, dataValue: "false" },
    { type: "choice", label: "yes", dataNext: 5, dataValue: "true" },
  ],
}
```

### Review Step
```typescript
{
  stepNumber: 7,
  title: "Review your info",
  isReview: true,
  reviewFields: ["email", "firstName", "lastName", "company"],
  fields: [],
  buttons: [
    { type: "prev", label: "back", dataPrev: 6 },
    { type: "submit", label: "submit" },
  ],
}
```

## Step Features

### With Subtitle
```typescript
{
  stepNumber: 1,
  title: "Main Title",
  subtitle: "Additional context text",
  fields: [...],
  buttons: [...],
}
```

### With Icon
```typescript
{
  stepNumber: 1,
  title: "Your email?",
  icon: "envelope",
  showIcon: true,
  fields: [...],
  buttons: [...],
}
```

### With Custom Validation
```typescript
{
  stepNumber: 3,
  title: "Your phone?",
  fields: [...],
  buttons: [...],
  customValidation: "validatePhone",
}
```

### With Google OAuth
```typescript
{
  stepNumber: 1,
  title: "Your email?",
  fields: [...],
  buttons: [...],
  additionalContent: "google-oauth",
}
```

## Button Customization

### Default Button Styles
```typescript
buttonDefaults: {
  next: {
    variant: "secondary",
    size: "lg",
    icon: "arrow-right",
    iconPosition: "right",
  },
  prev: {
    variant: "anchor",
    size: "lg",
    icon: "arrow-left",
    iconPosition: "left",
  },
  submit: {
    variant: "primary",
    size: "lg",
    icon: "send",
    iconPosition: "right",
  },
}
```

### Button Variants
- `primary` - Blue solid
- `secondary` - Green solid
- `anchor` - Text link style
- `outline` - Outlined button

### Button Sizes
- `sm` - Small
- `md` - Medium
- `lg` - Large

## Hidden Fields

Add at root level:
```typescript
{
  formId: "my-form",
  formAction: "/api/submit",
  // ...
  hiddenFields: [
    { name: "role", value: "Client" },
    { name: "source", value: "website" },
  ],
  steps: [...],
}
```

## Files Reference

### Create New Form
1. Config: `src/lib/forms/your-form-config.ts`
2. Page: `src/pages/your-form.astro`

### Interfaces
- `src/lib/multi-step-form-config.ts` - TypeScript types

### Handler
- `src/lib/multi-step-form-handler.ts` - Form logic

### Component
- `src/components/form/MultiStepForm.astro` - Renderer

### Examples
- `src/lib/forms/register-form-config.ts` - Registration
- `src/lib/forms/contact-form-config.ts` - Contact
- `src/pages/auth/register-json.astro` - Registration page
- `src/pages/contact-json.astro` - Contact page

## Test URLs
- `/auth/register-json` - Registration form
- `/contact-json` - Contact form

## Common Issues

### Form not showing
- Check formId matches between config and page
- Verify all step numbers are sequential (1, 2, 3...)
- Check browser console for errors

### Validation not working
- Set `required: true` on fields
- Add `errorMessage` to fields
- Check custom validation function exists

### Navigation broken
- Verify `dataNext` and `dataPrev` values
- Ensure step numbers exist
- Check button `type` is correct

### Component not rendering
- Verify component name in `componentProps`
- Check component is imported in MultiStepForm.astro
- Ensure props match component requirements

## Tips

✅ **Start simple** - Copy an example config and modify it
✅ **Test each step** - Build one step at a time
✅ **Use TypeScript** - Get autocomplete and error checking
✅ **Check examples** - Look at register and contact configs
✅ **Progressive enhancement** - Add features incrementally

---

For full documentation, see `markdowns/multi-step-form-json-system.md`
