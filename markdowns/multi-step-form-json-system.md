# Multi-Step Form JSON Configuration System

## Overview

This system allows you to create multi-step forms using JSON configuration instead of writing repetitive HTML and JavaScript. This makes forms easier to maintain, test, and create.

## Architecture

### Components

1. **`multi-step-form-config.ts`** - TypeScript interfaces and helper functions
2. **`multi-step-form-handler.ts`** - Generic form logic (validation, navigation, submission)
3. **`MultiStepForm.astro`** - Reusable component that renders from JSON
4. **Form configs** (in `src/lib/forms/`) - JSON configurations for specific forms

### File Structure

```
src/
├── lib/
│   ├── multi-step-form-config.ts        # Interfaces
│   ├── multi-step-form-handler.ts       # Generic form logic
│   └── forms/
│       ├── register-form-config.ts      # Registration form config
│       ├── contact-form-config.ts       # Contact form config
│       └── your-new-form-config.ts      # Your new form config
├── components/
│   └── form/
│       └── MultiStepForm.astro          # Reusable renderer component
└── pages/
    ├── auth/
    │   └── register-json.astro          # Registration page
    └── contact-json.astro               # Contact page
```

## Creating a New Form

### Step 1: Create Configuration File

Create a new file in `src/lib/forms/your-form-config.ts`:

```typescript
import type { MultiStepFormConfig } from "../multi-step-form-config";

export const yourFormConfig: MultiStepFormConfig = {
  formId: "multi-step-your-form",
  formAction: "/api/your-endpoint",
  formMethod: "post",
  totalSteps: 5,
  progressBar: true,

  buttonDefaults: {
    next: {
      type: "next",
      variant: "secondary",
      size: "lg",
      icon: "arrow-right",
      iconPosition: "right",
      label: "next",
    },
    prev: {
      type: "prev",
      variant: "anchor",
      size: "lg",
      icon: "arrow-left",
      iconPosition: "left",
      label: "back",
    },
    submit: {
      type: "submit",
      variant: "primary",
      size: "lg",
      icon: "send",
      iconPosition: "right",
      label: "submit",
    },
  },

  steps: [
    {
      stepNumber: 1,
      title: "What's your name?",
      subtitle: "We'd like to know who we're talking to",
      fieldLayout: "grid", // or "single"
      fields: [
        {
          id: "first-name",
          name: "firstName",
          type: "text",
          placeholder: "John",
          required: true,
          autocomplete: "given-name",
          errorMessage: "Please enter your first name",
          columns: 2, // Half width in grid
        },
        {
          id: "last-name",
          name: "lastName",
          type: "text",
          placeholder: "Doe",
          required: true,
          autocomplete: "family-name",
          errorMessage: "Please enter your last name",
          columns: 2,
        },
      ],
      buttons: [
        {
          type: "next",
          label: "next",
          dataNext: 2,
        },
      ],
    },
    // Add more steps...
  ],
};
```

### Step 2: Create Page

Create a page in `src/pages/your-form.astro`:

```astro
---
import Layout from "../layouts/Layout.astro";
import MultiStepForm from "../components/form/MultiStepForm.astro";
import { yourFormConfig } from "../lib/forms/your-form-config";
---

<Layout title="Your Form" description="Description">
  <div class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-4xl">
      <MultiStepForm config={yourFormConfig} />
    </div>
  </div>
</Layout>
```

### Step 3: Test Your Form

Visit `/your-form` in your browser and test the form flow.

## Field Types

### Standard Input Types

```typescript
{
  id: "field-id",
  name: "fieldName",
  type: "text" | "email" | "tel" | "password" | "hidden",
  placeholder: "Enter value...",
  required: true,
  autocomplete: "given-name",
  errorMessage: "Custom error message",
  columns: 1 | 2, // Grid layout (1 = full width, 2 = half width)
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
  errorMessage: "Please enter a message",
}
```

### Custom Components

```typescript
{
  id: "carrier",
  name: "mobileCarrier",
  type: "component",
  component: "SlotMachineModalStaff",
  componentProps: {
    title: "Select your carrier",
    buttonVariant: "outline",
    placeholder: "Select...",
    icon: "wifi",
  },
}
```

Supported components:
- `SlotMachineModalStaff` - Dropdown selection modal
- `InlineAddressSearch` - Google Places autocomplete

## Button Types

### Next Button

```typescript
{
  type: "next",
  label: "next",
  dataNext: 2, // Go to step 2
}
```

### Previous Button

```typescript
{
  type: "prev",
  label: "back",
  dataPrev: 1, // Go to step 1
}
```

### Submit Button

```typescript
{
  type: "submit",
  label: "create account",
  classes: "submit-registration",
}
```

### Choice Buttons (e.g., Yes/No)

```typescript
{
  type: "choice",
  label: "yes",
  variant: "secondary",
  dataNext: 5, // Go to step 5
  dataValue: "true", // Set hidden field value
}
```

### Skip Button

```typescript
{
  type: "skip",
  label: "skip",
  dataNext: 5, // Jump to step 5
}
```

## Step Configuration

### Basic Step

```typescript
{
  stepNumber: 1,
  title: "Your email?",
  subtitle: "We'll never share it",
  fields: [...],
  buttons: [...],
}
```

### Grid Layout

For multiple fields side-by-side:

```typescript
{
  stepNumber: 2,
  title: "Your name?",
  fieldLayout: "grid", // Enable grid layout
  fields: [
    { name: "firstName", columns: 2 }, // Half width
    { name: "lastName", columns: 2 },  // Half width
  ],
  buttons: [...],
}
```

### Review Step

```typescript
{
  stepNumber: 8,
  title: "Review your information",
  isReview: true,
  reviewFields: [
    "email",
    "firstName",
    "lastName",
    "company",
  ],
  fields: [],
  buttons: [...],
}
```

### Custom Validation

```typescript
{
  stepNumber: 5,
  title: "Your phone?",
  fields: [...],
  buttons: [...],
  customValidation: "validatePhone", // Function name
}
```

### Additional Content

For special content like OAuth buttons:

```typescript
{
  stepNumber: 1,
  title: "Your email?",
  fields: [...],
  buttons: [...],
  additionalContent: "google-oauth", // Adds Google sign-in button
}
```

## Features

### Automatic Features

✅ **Progress Bar** - Shows current step out of total
✅ **Validation** - Per-step validation with error messages
✅ **Phone Formatting** - Auto-formats US phone numbers
✅ **Email Uniqueness** - Checks if email is already registered (for registration forms)
✅ **Skip Logic** - Automatically skips steps based on user input
✅ **Review Step** - Shows summary of all filled data
✅ **Enter Key** - Press Enter to advance to next step
✅ **Auto-focus** - Automatically focuses first input on each step
✅ **Touch Validation** - Shows errors only after user interacts with field

### Skip Logic Example

The system automatically handles conditional steps:

```typescript
// If user doesn't enter phone, skip SMS steps
if (!phoneValue) {
  nextStep = nextStep + 2; // Skip SMS consent and carrier selection
}
```

## Testing

### Test Pages

Two test pages are included:

1. **Registration Form**: `/auth/register-json`
2. **Contact Form**: `/contact-json`

Visit these pages to see the JSON-based forms in action.

### Comparison

Compare the JSON-based forms with the original hardcoded versions:

| Original | JSON-based |
|----------|-----------|
| `/auth/register` | `/auth/register-json` |
| `/contact` | `/contact-json` |

## Migration Guide

### Converting Existing Forms

To convert an existing multi-step form to JSON:

1. **Extract step structure** - Identify all steps, fields, and buttons
2. **Create config file** - Define the form structure in `src/lib/forms/`
3. **Update page** - Replace hardcoded form with `<MultiStepForm config={...} />`
4. **Test thoroughly** - Verify all validation and navigation works
5. **Update links** - Point to new page URLs

### Benefits of Migration

- **Maintainability**: Change form structure in one place
- **Consistency**: All forms use the same validation and navigation logic
- **Testability**: Easy to test form configurations
- **Scalability**: Create new forms quickly by copying configs
- **Type Safety**: TypeScript ensures valid configurations

## Examples

### Simple 3-Step Form

```typescript
export const simpleFormConfig: MultiStepFormConfig = {
  formId: "simple-form",
  formAction: "/api/submit",
  totalSteps: 3,
  progressBar: true,

  steps: [
    {
      stepNumber: 1,
      title: "Your email?",
      fields: [
        {
          id: "email",
          name: "email",
          type: "email",
          placeholder: "you@example.com",
          required: true,
        },
      ],
      buttons: [
        { type: "next", label: "next", dataNext: 2 },
      ],
    },
    {
      stepNumber: 2,
      title: "Your name?",
      fieldLayout: "grid",
      fields: [
        {
          id: "first-name",
          name: "firstName",
          type: "text",
          placeholder: "John",
          required: true,
          columns: 2,
        },
        {
          id: "last-name",
          name: "lastName",
          type: "text",
          placeholder: "Doe",
          required: true,
          columns: 2,
        },
      ],
      buttons: [
        { type: "prev", label: "back", dataPrev: 1 },
        { type: "next", label: "next", dataNext: 3 },
      ],
    },
    {
      stepNumber: 3,
      title: "Your message?",
      fields: [
        {
          id: "message",
          name: "message",
          type: "textarea",
          placeholder: "Tell us more...",
          required: true,
          rows: 6,
        },
      ],
      buttons: [
        { type: "prev", label: "back", dataPrev: 2 },
        { type: "submit", label: "send" },
      ],
    },
  ],
};
```

## Advanced Features

### Custom Submission Handler

```typescript
const handler = createMultiStepFormHandler(formId, totalSteps, {
  onSubmit: async (formData) => {
    // Custom submission logic
    const response = await fetch("/api/custom-endpoint", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error("Submission failed");
    }
    
    // Redirect after success
    window.location.href = "/success";
  },
});
```

### Custom Validators

```typescript
const handler = createMultiStepFormHandler(formId, totalSteps, {
  customValidators: {
    validatePhone: async (stepNumber) => {
      const phoneInput = document.getElementById("phone") as HTMLInputElement;
      const isValid = validatePhone(phoneInput.value);
      
      if (!isValid) {
        window.showNotice("error", "Invalid phone number");
        return false;
      }
      
      return true;
    },
  },
});
```

## Troubleshooting

### Form Not Initializing

Check browser console for errors. Common issues:
- Form ID doesn't match config
- Missing required fields in config
- Component not imported correctly

### Validation Not Working

- Ensure `required` is set to `true` for required fields
- Check `errorMessage` is defined
- Verify custom validation function exists

### Navigation Not Working

- Check `dataNext` and `dataPrev` values
- Ensure step numbers are sequential
- Verify button types are correct

### Components Not Rendering

- Ensure component is imported in `MultiStepForm.astro`
- Check `componentProps` are correct for the component
- Verify component name matches exactly

## Future Enhancements

Potential improvements to the system:

- [ ] Conditional field visibility within steps
- [ ] Field dependencies (show field X if field Y has value Z)
- [ ] Multi-select component support
- [ ] Date picker component
- [ ] File upload component
- [ ] Real-time field validation
- [ ] Save progress (resume later)
- [ ] A/B testing different form flows
- [ ] Analytics integration
- [ ] Form builder UI

## Summary

This JSON configuration system makes multi-step forms:

✅ **Faster to create** - Define structure in JSON
✅ **Easier to maintain** - Change one config file
✅ **More consistent** - Shared validation and navigation logic
✅ **Type-safe** - TypeScript interfaces prevent errors
✅ **Testable** - Easy to unit test configs
✅ **Scalable** - Create unlimited forms from configs

---

**Questions?** Check the example configs in `src/lib/forms/` or the test pages at `/auth/register-json` and `/contact-json`.
