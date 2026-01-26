# JSON-Driven Multi-Step Form Generator

A flexible, configurable multi-step form system that generates beautiful forms from JSON configuration files. No code required!

## Table of Contents

- [Quick Start](#quick-start)
- [Form Configuration](#form-configuration)
- [Field Types](#field-types)
- [Advanced Features](#advanced-features)
- [Examples](#examples)
- [API Reference](#api-reference)

## Quick Start

### 1. Create a JSON Configuration

Create a JSON file in `/config/` directory:

```json
{
  "id": "my-contact-form",
  "title": "Contact Us",
  "action": "/api/contact/submit",
  "steps": [
    {
      "step": 1,
      "title": "What's your name?",
      "fields": [
        {
          "name": "firstName",
          "type": "text",
          "placeholder": "John",
          "required": true
        }
      ]
    }
  ]
}
```

### 2. Use in Your Astro Page

```astro
---
import JSONMultiStepForm from '@components/form/JSONMultiStepForm.astro';
import formConfig from '../config/my-contact-form.json';
---

<JSONMultiStepForm config={formConfig} />
```

That's it! You now have a fully functional multi-step form.

## Form Configuration

### Root Level Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the form |
| `action` | string | Yes | Form submission URL |
| `method` | string | No | HTTP method (default: POST) |
| `title` | string | No | Form title shown above progress bar |
| `description` | string | No | Form description/subtitle |
| `steps` | Step[] | Yes | Array of form steps |
| `progressBar` | object | No | Progress bar configuration |
| `defaultButtons` | object | No | Default button styles for all steps |
| `successRedirect` | string | No | URL to redirect after success |
| `successMessage` | object | No | Success modal configuration |
| `enableEnterKey` | boolean | No | Enable Enter key navigation (default: true) |
| `hideSidebarToggle` | boolean | No | Hide sidebar toggle button |
| `containerClass` | string | No | Custom container CSS classes |
| `customSubmitHandler` | string | No | Custom submit function name |

### Progress Bar Configuration

```json
{
  "progressBar": {
    "show": true,
    "showStepNumbers": true,
    "class": "mb-8"
  }
}
```

### Success Message Configuration

```json
{
  "successMessage": {
    "title": "Success!",
    "message": "Your form has been submitted.",
    "duration": 5000
  }
}
```

### Default Buttons Configuration

```json
{
  "defaultButtons": {
    "next": {
      "text": "Next",
      "variant": "secondary",
      "size": "xl",
      "icon": "arrow-right",
      "iconPosition": "right"
    },
    "prev": {
      "text": "Back",
      "variant": "anchor",
      "size": "xl"
    },
    "submit": {
      "text": "Submit",
      "variant": "primary",
      "size": "xl"
    }
  }
}
```

## Step Configuration

Each step in the `steps` array has the following properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `step` | number | Yes | Step number (1-based) |
| `title` | string | Yes | Step heading/question |
| `subtitle` | string | No | Optional description under title |
| `icon` | string | No | BoxIcon name to display |
| `fields` | Field[] | Yes | Array of form fields |
| `buttons` | object | No | Custom button configuration |
| `layout` | string | No | Layout type: 'single', 'grid-2', 'grid-3' |
| `conditional` | object | No | Conditional logic for showing step |
| `class` | string | No | Additional CSS classes |

### Step Button Configuration

Override default buttons for specific steps:

```json
{
  "buttons": {
    "next": {
      "text": "Continue",
      "variant": "primary"
    },
    "prev": {
      "text": "Go Back",
      "href": "/previous-page"
    },
    "skip": {
      "text": "Skip This Step",
      "variant": "outline"
    },
    "custom": [
      {
        "text": "Save Draft",
        "variant": "ghost",
        "onclick": "saveDraft()"
      }
    ]
  }
}
```

## Field Types

### Standard HTML Input Types

#### Text Input
```json
{
  "name": "firstName",
  "type": "text",
  "placeholder": "John",
  "required": true,
  "minLength": 2,
  "maxLength": 50
}
```

#### Email Input
```json
{
  "name": "email",
  "type": "email",
  "placeholder": "your.email@example.com",
  "required": true,
  "autocomplete": "email"
}
```

#### Phone Input
```json
{
  "name": "phone",
  "type": "tel",
  "placeholder": "(555) 123-4567",
  "required": false,
  "autocomplete": "tel"
}
```

#### Password Input
```json
{
  "name": "password",
  "type": "password",
  "placeholder": "Enter password",
  "required": true,
  "minLength": 6
}
```

#### Number Input
```json
{
  "name": "age",
  "type": "number",
  "placeholder": "25",
  "min": 18,
  "max": 120,
  "required": true
}
```

#### Date Input
```json
{
  "name": "startDate",
  "type": "date",
  "required": true
}
```

#### URL Input
```json
{
  "name": "website",
  "type": "url",
  "placeholder": "https://example.com"
}
```

#### Textarea
```json
{
  "name": "message",
  "type": "textarea",
  "placeholder": "Your message here...",
  "rows": 6,
  "required": true
}
```

#### Select Dropdown
```json
{
  "name": "country",
  "type": "select",
  "placeholder": "Select a country...",
  "required": true,
  "options": [
    { "value": "us", "label": "United States" },
    { "value": "ca", "label": "Canada" },
    { "value": "mx", "label": "Mexico" }
  ]
}
```

#### Hidden Input
```json
{
  "name": "source",
  "type": "hidden",
  "defaultValue": "website"
}
```

### Special Component Types

#### Phone & SMS Component
Uses the `PhoneAndSMS.astro` component for phone input with SMS consent.

```json
{
  "name": "phone",
  "type": "phone-sms",
  "placeholder": "(555) 123-4567",
  "required": false,
  "componentProps": {
    "showSMS": true
  }
}
```

#### Address Search Component
Uses Google Places autocomplete for address selection.

```json
{
  "name": "address",
  "type": "address-search",
  "placeholder": "Start typing your address...",
  "required": true,
  "componentProps": {
    "fetchApiEndpoint": "/api/google/places-autocomplete",
    "apiParams": {
      "types": "address",
      "components": "country:us"
    },
    "valueField": "description",
    "labelField": "description"
  }
}
```

#### Slot Machine Modal Component
Beautiful modal selector with smooth animations.

```json
{
  "name": "carrier",
  "type": "slot-machine",
  "placeholder": "Select your carrier...",
  "required": true,
  "options": [
    { "value": "verizon", "label": "Verizon" },
    { "value": "att", "label": "AT&T" },
    { "value": "tmobile", "label": "T-Mobile" }
  ],
  "componentProps": {
    "title": "Select Your Carrier",
    "icon": "wifi",
    "buttonVariant": "outline",
    "buttonClass": "w-full"
  }
}
```

#### Button Choice Component
Display options as buttons (great for Yes/No, multiple choice).

```json
{
  "name": "smsConsent",
  "type": "button-choice",
  "required": true,
  "options": [
    { "value": "yes", "label": "Yes, please" },
    { "value": "no", "label": "No, thanks" }
  ],
  "dataAttributes": {
    "data-next": "5"
  }
}
```

## Field Properties

Common properties available for all field types:

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Field name (used in form data) |
| `type` | string | Field type (see Field Types) |
| `id` | string | Custom field ID (auto-generated if not provided) |
| `label` | string | Label text above field |
| `placeholder` | string | Placeholder text |
| `required` | boolean | Is field required? |
| `defaultValue` | string | Default/initial value |
| `autocomplete` | string | HTML autocomplete attribute |
| `class` | string | Additional CSS classes |
| `colSpan` | number | Grid column span (for multi-column layouts) |
| `autofocus` | boolean | Auto-focus this field? |
| `errorMessage` | string | Custom validation error message |
| `dataAttributes` | object | Custom data-* attributes |
| `componentProps` | object | Props for special components |

### Validation Properties

| Property | Type | Description |
|----------|------|-------------|
| `minLength` | number | Minimum text length |
| `maxLength` | number | Maximum text length |
| `min` | number | Minimum value (for numbers) |
| `max` | number | Maximum value (for numbers) |
| `pattern` | string | Regex pattern for validation |

## Advanced Features

### Conditional Logic

Show/hide fields or steps based on other field values:

```json
{
  "name": "carrier",
  "type": "slot-machine",
  "conditional": {
    "dependsOn": "smsConsent",
    "showWhen": "yes"
  }
}
```

### Multi-Column Layouts

Use `layout` property for grid layouts:

```json
{
  "step": 2,
  "title": "Your details",
  "layout": "grid-2",
  "fields": [
    {
      "name": "firstName",
      "type": "text",
      "placeholder": "John"
    },
    {
      "name": "lastName",
      "type": "text",
      "placeholder": "Doe"
    },
    {
      "name": "email",
      "type": "email",
      "placeholder": "email@example.com",
      "colSpan": 2
    }
  ]
}
```

### Custom Submit Handler

Instead of default form submission, use a custom JavaScript function:

```json
{
  "customSubmitHandler": "myCustomSubmit"
}
```

Then define the function globally:

```javascript
window.myCustomSubmit = async (form, formData) => {
  // Your custom logic here
  console.log('Custom submit!', formData);
  
  // Throw error to show error modal
  // throw new Error('Something went wrong');
  
  // Or handle success
  window.showModal('success', 'Done!', 'Form submitted successfully');
};
```

### Button Variants

Available button variants:
- `primary` - Primary color button
- `secondary` - Secondary color button
- `outline` - Outlined button
- `ghost` - Transparent button with hover effect
- `anchor` - Link-style button

### Button Sizes

Available sizes:
- `sm` - Small
- `md` - Medium
- `lg` - Large
- `xl` - Extra large

### Icons

Use any [BoxIcon](https://boxicons.com/) name for icons:
- `arrow-right`
- `arrow-left`
- `send`
- `check`
- `user`
- `envelope`
- `phone`
- etc.

## Examples

### Example 1: Simple Contact Form

See: `/config/form-contact-example.json`

A basic 6-step contact form with name, email, phone, company, address, and message fields.

### Example 2: Registration Form

See: `/config/form-register-example.json`

User registration with email, name, company, password, and phone fields. Includes password validation and optional phone/SMS.

### Example 3: Advanced Survey

See: `/config/form-survey-example.json`

Complex survey with button choices, conditionals, select dropdowns, and multi-column layouts.

## Styling

The form generator uses:
- **Tailwind CSS** for styling
- **Flowbite** components
- **BoxIcons** for icons
- **Global input classes** from `globalClasses()`

### Custom Styling

You can customize styles using:

1. **Container classes**: `containerClass` property
2. **Form classes**: `class` property on form config
3. **Step classes**: `class` property on step config
4. **Field classes**: `class` property on field config

```json
{
  "containerClass": "max-w-2xl mx-auto",
  "class": "bg-white dark:bg-gray-800 p-6 rounded-lg",
  "steps": [
    {
      "class": "custom-step-class",
      "fields": [
        {
          "name": "email",
          "type": "email",
          "class": "border-2 border-blue-500"
        }
      ]
    }
  ]
}
```

## Best Practices

### 1. Progressive Disclosure
Break complex forms into logical steps. Each step should focus on one topic.

✅ Good:
- Step 1: Name
- Step 2: Contact Info
- Step 3: Details

❌ Bad:
- Step 1: Everything at once

### 2. Clear Titles
Use conversational, question-style titles.

✅ Good: "What's your name?"
❌ Bad: "Name Input Section"

### 3. Helpful Placeholders
Use examples in placeholders.

✅ Good: `"(555) 123-4567"`
❌ Bad: `"Phone number"`

### 4. Smart Defaults
Set sensible default values where possible.

### 5. Skip Optional Steps
For optional fields, provide a skip button.

```json
{
  "buttons": {
    "next": {
      "text": "Next / Skip"
    }
  }
}
```

### 6. Validate Early
Use `required`, `minLength`, `pattern` etc. for client-side validation.

### 7. Clear Error Messages
Provide specific error messages.

✅ Good: `"Please enter a valid US phone number"`
❌ Bad: `"Invalid input"`

## Troubleshooting

### Form not submitting
- Check that `action` URL is correct
- Verify API endpoint exists and accepts POST
- Check browser console for errors

### Fields not showing
- Verify `type` is spelled correctly
- Check conditional logic if using `conditional`
- Ensure field `name` is unique

### Validation not working
- Check `required` is set to `true` (not string "true")
- For custom validation, ensure `errorMessage` is set
- Test with browser dev tools

### Styling issues
- Verify Tailwind classes are correct
- Check for conflicting CSS
- Use browser inspector to debug

## TypeScript Support

Full TypeScript type definitions available in:
`src/types/form-config.ts`

Use for IDE autocomplete and type checking:

```typescript
import type { FormConfig } from '@/types/form-config';

const config: FormConfig = {
  // Your config with full type safety
};
```

## File Locations

- **Component**: `/src/components/form/JSONMultiStepForm.astro`
- **Types**: `/src/types/form-config.ts`
- **Examples**: `/config/form-*-example.json`
- **Documentation**: `/markdowns/json-multi-step-form.md`

## Support

For issues or questions:
1. Check this documentation
2. Review example configurations
3. Check TypeScript types for available options
4. Inspect browser console for errors

---

**Built with ❤️ using Astro, Tailwind CSS, and Flowbite**
