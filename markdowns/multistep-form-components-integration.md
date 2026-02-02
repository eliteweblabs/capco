# Multi-Step Form Components Integration

## Overview
The MultiStepForm component now supports additional form field types beyond basic inputs, making it more versatile for complex forms.

## Newly Integrated Components

### 1. UnitSlider
A range slider with optional custom unit values (e.g., logarithmic scales for units).

#### Usage - As Component
```typescript
{
  stepNumber: 3,
  title: "How many units?",
  fields: [
    {
      id: "units",
      name: "units",
      type: "component",
      component: "UnitSlider",
      label: "Number of Units",
      value: 5,
      required: true,
      // Optional: use custom min/max/step for regular slider
      componentProps: {
        min: 0,
        max: 50,
        step: 1
      }
    }
  ],
  buttons: [{ type: "next", dataNext: 4 }]
}
```

#### Usage - As Range Type
```typescript
{
  id: "sqft",
  name: "sqft",
  type: "range",
  label: "Square Footage",
  value: 1000,
  min: 0,
  max: 10000,
  step: 100,
  required: true
}
```

**Features:**
- Custom unit scales (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50)
- Visual tick marks and labels
- Real-time value display
- Dark mode support
- Accessible keyboard navigation

---

### 2. ToggleButton
Radio or multi-select button groups with visual selection states.

#### Usage - Radio (Single Selection)
```typescript
{
  stepNumber: 4,
  title: "Select your plan",
  fields: [
    {
      id: "plan",
      name: "plan",
      type: "component",
      component: "ToggleButton",
      toggleType: "radio",
      options: [
        { value: "basic", label: "Basic Plan" },
        { value: "pro", label: "Pro Plan" },
        { value: "enterprise", label: "Enterprise Plan" }
      ],
      required: true
    }
  ],
  buttons: [{ type: "next", dataNext: 5 }]
}
```

#### Usage - Multi-Select
```typescript
{
  id: "features",
  name: "features",
  type: "component",
  component: "ToggleButton",
  toggleType: "multi-select",
  options: [
    { value: "hvac", label: "HVAC" },
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "fire", label: "Fire Protection" }
  ]
}
```

**Features:**
- Radio (single selection) or multi-select modes
- Visual selection feedback (primary color background)
- Toggle on/off by clicking selected button
- Form data stored as JSON array
- Custom event dispatching (`toggleButtonChange`)
- Global helper functions: `getToggleButtonValues(group)`, `setToggleButtonValues(group, values)`

**Data Format:**
- Radio: `["selected-value"]`
- Multi-select: `["value1", "value2", "value3"]`

---

### 3. FileUpload
Drag-and-drop file upload with preview and validation.

#### Usage
```typescript
{
  stepNumber: 5,
  title: "Upload your documents",
  fields: [
    {
      id: "documents",
      name: "documents",
      type: "component",
      component: "FileUpload",
      label: "Project Documents",
      required: true,
      multiple: true,
      maxFiles: 5,
      maxSize: 10485760, // 10MB in bytes
      accept: ".pdf,.doc,.docx,.dwg",
      componentProps: {
        // Any additional props
      }
    }
  ],
  buttons: [{ type: "next", dataNext: 6 }]
}
```

**Features:**
- Drag and drop interface
- Click to browse files
- Multiple file support
- File size validation
- File type restrictions
- Visual file list with remove buttons
- Real-time file preview
- Accessible keyboard controls

**Properties:**
- `accept`: File type restrictions (e.g., `".pdf,.doc,.docx"` or `"image/*"`)
- `multiple`: Allow multiple files (default: `false`)
- `maxFiles`: Maximum number of files (default: `10`)
- `maxSize`: Maximum file size in bytes (default: `10485760` = 10MB)

---

## Existing Components

### 4. SlideToggle
Boolean toggle switch (already integrated).

```typescript
{
  id: "notifications",
  name: "notifications",
  type: "component",
  component: "SlideToggle",
  componentProps: {
    label: "Enable Notifications"
  }
}
```

### 5. InlineAddressSearch
Google Places API address autocomplete (already integrated).

```typescript
{
  id: "address",
  name: "address",
  type: "component",
  component: "InlineAddressSearch"
}
```

### 6. SlotMachineModalStaff
Animated dropdown selector (already integrated).

```typescript
{
  id: "carrier",
  name: "mobileCarrier",
  type: "component",
  component: "SlotMachineModalStaff",
  label: "Select your carrier"
}
```

---

## Complete Example Form Config

Here's a comprehensive example using multiple component types:

```typescript
import type { MultiStepFormConfig } from "../lib/multi-step-form-config";

export const projectFormConfig: MultiStepFormConfig = {
  formId: "multi-step-project-form",
  formAction: "/api/project/submit",
  formMethod: "post",
  totalSteps: 6,
  progressBar: true,
  
  buttonDefaults: {
    next: {
      variant: "secondary",
      size: "md",
      icon: "arrow-right",
      iconPosition: "right",
      label: "next",
    },
  },
  
  steps: [
    // Step 1: Basic Info
    {
      stepNumber: 1,
      title: "Let's start with your project details",
      fields: [
        {
          id: "project-name",
          name: "projectName",
          type: "text",
          placeholder: "Project Name",
          required: true,
          icon: "folder",
          iconPosition: "left",
        }
      ],
      buttons: [{ type: "next", dataNext: 2 }]
    },
    
    // Step 2: Project Size (UnitSlider)
    {
      stepNumber: 2,
      title: "How many units?",
      fields: [
        {
          id: "units",
          name: "units",
          type: "component",
          component: "UnitSlider",
          label: "Number of Units",
          value: 5,
          required: true,
        }
      ],
      buttons: [
        { type: "prev", dataPrev: 1 },
        { type: "next", dataNext: 3 }
      ]
    },
    
    // Step 3: Square Footage (Range)
    {
      stepNumber: 3,
      title: "What's the square footage?",
      fields: [
        {
          id: "sqft",
          name: "sqft",
          type: "range",
          label: "Square Feet",
          value: 5000,
          min: 0,
          max: 50000,
          step: 500,
          required: true,
        }
      ],
      buttons: [
        { type: "prev", dataPrev: 2 },
        { type: "next", dataNext: 4 }
      ]
    },
    
    // Step 4: Project Type (ToggleButton)
    {
      stepNumber: 4,
      title: "Select project type",
      fields: [
        {
          id: "type",
          name: "projectType",
          type: "component",
          component: "ToggleButton",
          toggleType: "radio",
          options: [
            { value: "new", label: "New Construction" },
            { value: "renovation", label: "Renovation" },
            { value: "addition", label: "Addition" }
          ],
          required: true
        }
      ],
      buttons: [
        { type: "prev", dataPrev: 3 },
        { type: "next", dataNext: 5 }
      ]
    },
    
    // Step 5: Systems (Multi-select ToggleButton)
    {
      stepNumber: 5,
      title: "Which systems are needed?",
      fields: [
        {
          id: "systems",
          name: "systems",
          type: "component",
          component: "ToggleButton",
          toggleType: "multi-select",
          options: [
            { value: "hvac", label: "HVAC" },
            { value: "plumbing", label: "Plumbing" },
            { value: "electrical", label: "Electrical" },
            { value: "fire", label: "Fire Protection" }
          ]
        }
      ],
      buttons: [
        { type: "prev", dataPrev: 4 },
        { type: "next", dataNext: 6 }
      ]
    },
    
    // Step 6: Documents (FileUpload)
    {
      stepNumber: 6,
      title: "Upload project documents",
      fields: [
        {
          id: "docs",
          name: "documents",
          type: "component",
          component: "FileUpload",
          label: "Plans & Specifications",
          multiple: true,
          maxFiles: 10,
          maxSize: 10485760, // 10MB
          accept: ".pdf,.dwg,.dxf",
        }
      ],
      buttons: [
        { type: "prev", dataPrev: 5 },
        { type: "submit", label: "Submit Project" }
      ]
    }
  ]
};
```

---

## Validation Integration

All components automatically integrate with the multi-step form validation system:

- **Required fields**: Automatically validated before proceeding
- **Dynamic button labels**: Button text changes when fields become valid (e.g., "skip" → "next")
- **Icon swapping**: Button icons change from arrow-right to checkmark when valid
- **Custom validation**: Can be extended with `customValidation` property

---

## Styling

All components support:
- Dark mode (automatically switches based on system/user preference)
- Responsive design (mobile-first approach)
- Tailwind CSS classes
- Custom classes via `classes` or `class` prop
- Global input classes from `globalClasses()`

---

## Files Modified

1. `/src/lib/multi-step-form-config.ts` - Added type definitions
2. `/src/components/form/MultiStepForm.astro` - Added component rendering logic
3. `/src/components/form/FileUpload.astro` - New file upload component
4. `/src/components/form/UnitSlider.astro` - Existing, now integrated
5. `/src/components/form/ToggleButton.astro` - Existing, now integrated

---

## Next Steps

To use these components in your form:

1. Import your form config in your page
2. Pass it to the `MultiStepForm` component
3. Components will automatically render based on `type` and `component` properties
4. Form data is collected and submitted to your API endpoint

Example:
```astro
---
import MultiStepForm from '../components/form/MultiStepForm.astro';
import { projectFormConfig } from '../lib/forms/project-form-config';
---

<MultiStepForm config={projectFormConfig} />
```
