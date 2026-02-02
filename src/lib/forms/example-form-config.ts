// Example form configuration demonstrating all available component types
// This can be used as a reference or template for creating new multi-step forms

import type { MultiStepFormConfig } from "../multi-step-form-config";

export const exampleFormConfig: MultiStepFormConfig = {
  formId: "multi-step-example-form",
  formAction: "/api/example/submit",
  formMethod: "post",
  totalSteps: 7,
  progressBar: true,

  buttonDefaults: {
    next: {
      variant: "secondary",
      size: "md",
      icon: "arrow-right",
      iconPosition: "right",
      label: "next",
    },
    prev: {
      variant: "anchor",
      size: "md",
      icon: "arrow-left",
      iconPosition: "left",
      label: "back",
    },
  },

  steps: [
    // Step 1: Basic Text Inputs
    {
      stepNumber: 1,
      title: "Let's start with the basics",
      subtitle: "Tell us about your project",
      fieldLayout: "grid",
      fields: [
        {
          id: "first-name",
          name: "firstName",
          type: "text",
          placeholder: "John",
          required: true,
          icon: "user",
          iconPosition: "left",
          columns: 2,
        },
        {
          id: "last-name",
          name: "lastName",
          type: "text",
          placeholder: "Doe",
          required: true,
          icon: "user",
          iconPosition: "left",
          columns: 2,
        },
        {
          id: "email",
          name: "email",
          type: "email",
          placeholder: "john@example.com",
          required: true,
          icon: "mail",
          iconPosition: "left",
        },
      ],
      buttons: [{ type: "next", dataNext: 2 }],
    },

    // Step 2: UnitSlider Component (Custom Units)
    {
      stepNumber: 2,
      title: "How many units?",
      subtitle: "Select the number of units for your project",
      fields: [
        {
          id: "units",
          name: "units",
          type: "component",
          component: "UnitSlider",
          label: "Number of Units",
          value: 5,
          required: true,
        },
      ],
      buttons: [
        { type: "prev", dataPrev: 1 },
        { type: "next", dataNext: 3 },
      ],
    },

    // Step 3: Range Type (Regular Slider)
    {
      stepNumber: 3,
      title: "What's the square footage?",
      subtitle: "Approximate size of your project",
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
        },
      ],
      buttons: [
        { type: "prev", dataPrev: 2 },
        { type: "next", dataNext: 4 },
      ],
    },

    // Step 4: ToggleButton - Radio (Single Selection)
    {
      stepNumber: 4,
      title: "Select your project type",
      subtitle: "Choose one option that best describes your project",
      fields: [
        {
          id: "project-type",
          name: "projectType",
          type: "component",
          component: "ToggleButton",
          toggleType: "radio",
          options: [
            { value: "new", label: "🏗️ New Construction" },
            { value: "renovation", label: "🔨 Renovation" },
            { value: "addition", label: "➕ Addition" },
            { value: "tenant-improvement", label: "🏢 Tenant Improvement" },
          ],
          required: true,
        },
      ],
      buttons: [
        { type: "prev", dataPrev: 3 },
        { type: "next", dataNext: 5 },
      ],
    },

    // Step 5: ToggleButton - Multi-Select
    {
      stepNumber: 5,
      title: "Which systems are needed?",
      subtitle: "Select all that apply",
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
            { value: "fire-protection", label: "Fire Protection" },
            { value: "sprinkler", label: "Sprinkler System" },
            { value: "mechanical", label: "Mechanical" },
          ],
        },
      ],
      buttons: [
        { type: "prev", dataPrev: 4 },
        { type: "next", dataNext: 6 },
      ],
    },

    // Step 6: FileUpload Component
    {
      stepNumber: 6,
      title: "Upload your documents",
      subtitle: "Plans, specifications, or any relevant files",
      fields: [
        {
          id: "documents",
          name: "documents",
          type: "component",
          component: "FileUpload",
          label: "Project Documents",
          required: false,
          multiple: true,
          maxFiles: 10,
          maxSize: 10485760, // 10MB
          accept: ".pdf,.doc,.docx,.dwg,.dxf,.png,.jpg,.jpeg",
        },
      ],
      buttons: [
        { type: "prev", dataPrev: 5 },
        { type: "next", label: "skip", validLabel: "next", dataNext: 7 },
      ],
    },

    // Step 7: Review & Submit
    {
      stepNumber: 7,
      title: "Review your information",
      subtitle: "Make sure everything looks good",
      isReview: true,
      reviewFields: ["firstName", "lastName", "email", "units", "sqft", "projectType", "systems"],
      fields: [],
      buttons: [
        { type: "prev", dataPrev: 6 },
        {
          type: "submit",
          variant: "primary",
          size: "lg",
          icon: "send",
          iconPosition: "right",
          label: "Submit Project",
        },
      ],
    },
  ],

  hiddenFields: [
    { name: "formType", value: "example" },
    { name: "source", value: "multistep-form" },
  ],
};
