# JSON Multi-Step Form - Quick Reference

## Minimal Form

```json
{
  "id": "my-form",
  "action": "/api/submit",
  "steps": [
    {
      "step": 1,
      "title": "Your Question?",
      "fields": [
        {
          "name": "fieldName",
          "type": "text",
          "required": true
        }
      ]
    }
  ]
}
```

## All Field Types

```json
"type": "text"           // Text input
"type": "email"          // Email input
"type": "tel"            // Phone input
"type": "password"       // Password input
"type": "number"         // Number input
"type": "url"            // URL input
"type": "date"           // Date picker
"type": "textarea"       // Multi-line text
"type": "select"         // Dropdown (requires options)
"type": "hidden"         // Hidden field
"type": "phone-sms"      // Phone + SMS consent component
"type": "address-search" // Google Places autocomplete
"type": "slot-machine"   // Modal selector (requires options)
"type": "button-choice"  // Button options (requires options)
```

## Common Field Properties

```json
{
  "name": "fieldName",           // Required
  "type": "text",                // Required
  "placeholder": "Example...",
  "required": true,
  "defaultValue": "initial",
  "label": "Field Label",
  "errorMessage": "Custom error",
  "autocomplete": "email",
  "class": "custom-class",
  "autofocus": true
}
```

## Text Validation

```json
{
  "minLength": 2,
  "maxLength": 100,
  "pattern": "[A-Za-z]+"
}
```

## Number Validation

```json
{
  "min": 0,
  "max": 100
}
```

## Options (for select, slot-machine, button-choice)

```json
{
  "options": [
    { "value": "val1", "label": "Option 1" },
    { "value": "val2", "label": "Option 2" }
  ]
}
```

## Step Layouts

```json
"layout": "single"    // Default: one column
"layout": "grid-2"    // Two columns
"layout": "grid-3"    // Three columns
```

## Button Variants

```json
"variant": "primary"     // Primary color
"variant": "secondary"   // Secondary color
"variant": "outline"     // Outlined
"variant": "ghost"       // Transparent
"variant": "anchor"      // Link style
```

## Button Sizes

```json
"size": "sm"    // Small
"size": "md"    // Medium
"size": "lg"    // Large
"size": "xl"    // Extra large
```

## Custom Button Example

```json
{
  "buttons": {
    "next": {
      "text": "Continue",
      "variant": "primary",
      "size": "xl",
      "icon": "arrow-right",
      "iconPosition": "right"
    },
    "prev": {
      "text": "Back",
      "variant": "anchor"
    },
    "skip": {
      "text": "Skip This",
      "variant": "outline"
    }
  }
}
```

## Conditional Logic

```json
{
  "conditional": {
    "dependsOn": "otherField",
    "showWhen": "expectedValue"
  }
}
```

## Multi-Column Layout with colSpan

```json
{
  "layout": "grid-2",
  "fields": [
    {
      "name": "firstName",
      "type": "text"
    },
    {
      "name": "lastName",
      "type": "text"
    },
    {
      "name": "email",
      "type": "email",
      "colSpan": 2        // Spans both columns
    }
  ]
}
```

## Address Search Component

```json
{
  "name": "address",
  "type": "address-search",
  "componentProps": {
    "fetchApiEndpoint": "/api/google/places-autocomplete",
    "apiParams": {
      "types": "address",
      "components": "country:us"
    }
  }
}
```

## Phone & SMS Component

```json
{
  "name": "phone",
  "type": "phone-sms",
  "componentProps": {
    "showSMS": true
  }
}
```

## Slot Machine Component

```json
{
  "name": "selection",
  "type": "slot-machine",
  "options": [
    { "value": "1", "label": "Option 1" }
  ],
  "componentProps": {
    "title": "Select an Option",
    "icon": "menu",
    "buttonVariant": "outline"
  }
}
```

## Button Choice Component

```json
{
  "name": "choice",
  "type": "button-choice",
  "options": [
    { "value": "yes", "label": "Yes" },
    { "value": "no", "label": "No" }
  ]
}
```

## Progress Bar Config

```json
{
  "progressBar": {
    "show": true,
    "showStepNumbers": true,
    "class": "mb-8"
  }
}
```

## Success Configuration

```json
{
  "successRedirect": "/thank-you",
  "successMessage": {
    "title": "Success!",
    "message": "Your form has been submitted.",
    "duration": 5000
  }
}
```

## Custom Submit Handler

```json
{
  "customSubmitHandler": "mySubmitFunction"
}
```

```javascript
// Then in your page:
window.mySubmitFunction = async (form, formData) => {
  // Your custom logic
  console.log('Submitting:', formData);
};
```

## Icons

Use any [BoxIcon](https://boxicons.com/) name:
- `arrow-right`
- `arrow-left`
- `send`
- `envelope`
- `user`
- `phone`
- `building-2`
- `lock`
- `check-circle`
- `error-circle`

## Usage in Astro

```astro
---
import JSONMultiStepForm from '@components/form/JSONMultiStepForm.astro';
import config from '@config/my-form.json';
---

<JSONMultiStepForm config={config} />
```

## File Locations

- Component: `/src/components/form/JSONMultiStepForm.astro`
- Types: `/src/types/form-config.ts`
- Examples: `/config/form-*-example.json`
- Docs: `/markdowns/json-multi-step-form.md`
- Demo: `/tests/form-demo?type=contact`

## Tips

✅ Use conversational titles: "What's your name?"
✅ Provide helpful placeholders: "(555) 123-4567"
✅ Break into logical steps (one topic per step)
✅ Use skip buttons for optional steps
✅ Set autofocus on first field
✅ Use appropriate input types for validation
✅ Add clear error messages
✅ Test on mobile devices

❌ Don't create overly long forms
❌ Don't skip validation
❌ Don't use generic error messages
❌ Don't forget required fields
