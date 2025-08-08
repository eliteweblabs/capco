// Shared project form configuration
// This defines all form fields and button groups used in both ProjectNew.astro and project edit forms

export interface FormFieldConfig {
  id: string;
  name: string;
  type:
    | "text"
    | "number"
    | "textarea"
    | "checkbox"
    | "slider"
    | "select"
    | "button-group";
  label: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[] | { value: string; label: string }[];
  groupType?: "radio" | "multi-select"; // For button groups
  dataField?: string; // For OCR/scraping
}

export interface ButtonGroupConfig {
  id: string;
  name: string;
  label: string;
  type: "radio" | "multi-select";
  cssClass: string;
  options: { value: string; label: string }[];
}

// Core form fields
export const PROJECT_FORM_FIELDS: FormFieldConfig[] = [
  {
    id: "address-input",
    name: "address",
    type: "text",
    label: "Address / Title",
    placeholder: "Address / Title *",
    required: true,
    dataField: "address",
  },
  {
    id: "owner-input",
    name: "owner",
    type: "text",
    label: "Owner",
    placeholder: "Owner *",
    required: true,
    dataField: "owner",
  },
  {
    id: "architect-input",
    name: "architect",
    type: "text",
    label: "Architect",
    placeholder: "Architect",
    dataField: "architect",
  },
  {
    id: "square-foot-input",
    name: "sq_ft",
    type: "number",
    label: "Square Footage",
    placeholder: "Gross Square Footage (GFA) *",
    required: true,
    min: 0,
    max: 50000,
    step: 1,
    dataField: "square_foot",
  },
  {
    id: "description-input",
    name: "description",
    type: "textarea",
    label: "Description",
    placeholder: "Project description...",
  },
  {
    id: "new-construction",
    name: "new_construction",
    type: "checkbox",
    label: "New Construction",
  },
  {
    id: "units-slider",
    name: "units",
    type: "slider",
    label: "Units",
    min: 0,
    max: 14,
    options: [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "15",
      "20",
      "30",
      "40",
      "50",
    ],
  },
];

// Button group configurations
export const BUTTON_GROUPS: ButtonGroupConfig[] = [
  {
    id: "building-type",
    name: "building",
    label: "Building",
    type: "radio",
    cssClass: "building-type-radio",
    options: [
      { value: "Residential", label: "Residential" },
      { value: "Mixed use", label: "Mixed use" },
      { value: "Mercantile", label: "Mercantile" },
      { value: "Commercial", label: "Commercial" },
      { value: "Storage", label: "Storage" },
      { value: "Warehouse", label: "Warehouse" },
      { value: "Institutional", label: "Institutional" },
    ],
  },
  {
    id: "consulting-services",
    name: "project",
    label: "Project",
    type: "multi-select",
    cssClass: "consulting-service-btn",
    options: [
      { value: "Sprinkler", label: "Sprinkler" },
      { value: "Alarm", label: "Alarm" },
      { value: "Mechanical", label: "Mechanical" },
      { value: "Electrical", label: "Electrical" },
      { value: "Plumbing", label: "Plumbing" },
      { value: "Civil engineering", label: "Civil engineering" },
      { value: "Other", label: "Other" },
    ],
  },
  {
    id: "fire-service",
    name: "service",
    label: "Supply / Service",
    type: "radio",
    cssClass: "fire-service-radio",
    options: [
      { value: "Pump & Tank", label: "Pump & Tank" },
      { value: "2' Copper", label: "2' Copper" },
      { value: "4' Ductile", label: "4' Ductile" },
      { value: "6' Ductile", label: "6' Ductile" },
      { value: "Unknown", label: "Unknown" },
    ],
  },
  {
    id: "fire-safety-services",
    name: "requested_docs",
    label: "Reports Required",
    type: "multi-select",
    cssClass: "fire-safety-service-btn",
    options: [
      { value: "Narrative", label: "Narrative" },
      { value: "Sprinkler", label: "Sprinkler" },
      { value: "Alarm", label: "Alarm" },
      { value: "NFPA 241", label: "NFPA 241" },
      { value: "IEBC", label: "IEBC" },
      { value: "IBC", label: "IBC" },
    ],
  },
];

// Function to generate form field HTML
export function generateFormFieldHTML(
  field: FormFieldConfig,
  index: number = 0,
  projectData: any = {},
): string {
  // Use project ID for unique field IDs instead of array index
  const projectId = projectData.id || `project-${index}`;
  const fieldId = `${field.id}-${projectId}`;

  // Robust value parsing for different data types
  let value: any = projectData[field.name];

  if (value === undefined || value === null) {
    value = "";
  } else if (typeof value === "string") {
    // Handle string values that might be JSON or other formats
    try {
      const parsed = JSON.parse(value);
      value = parsed;
    } catch {
      // Keep as string if JSON parsing fails
      value = value;
    }
  }

  switch (field.type) {
    case "text":
    case "number":
      return `
        <div class="relative">
          <label for="${fieldId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${field.label}${field.required ? " *" : ""}</label>
          <input
            type="${field.type}"
            id="${fieldId}"
            name="${field.name}"
            value="${value}"
            class="w-full py-2 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            placeholder="${field.placeholder || ""}"
            ${field.required ? "required" : ""}
            ${field.min !== undefined ? `min="${field.min}"` : ""}
            ${field.max !== undefined ? `max="${field.max}"` : ""}
            ${field.step !== undefined ? `step="${field.step}"` : ""}
            ${field.dataField ? `data-field="${field.dataField}"` : ""}
            data-project-id="${projectId}"
          >
        </div>
      `;

    case "textarea":
      return `
        <div class="relative">
          <label for="${fieldId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${field.label}</label>
          <textarea
            id="${fieldId}"
            name="${field.name}"
            rows="3"
            class="w-full py-2 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            placeholder="${field.placeholder || ""}"
            data-project-id="${projectId}"
          >${value}</textarea>
        </div>
      `;

    case "checkbox":
      // Handle boolean values for checkboxes (new_construction)
      const isChecked =
        value === true || value === "true" || value === 1 || value === "1";
      return `
        <div>
          <label class="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              id="${fieldId}" 
              name="${field.name}"
              ${isChecked ? "checked" : ""}
              class="sr-only peer"
              data-project-id="${projectId}"
            >
            <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
            <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">${field.label}</span>
          </label>
        </div>
      `;

    case "slider":
      // Handle numeric values for sliders (units)
      let unitsValue = 1;
      if (typeof value === "number") {
        unitsValue = value;
      } else if (typeof value === "string") {
        const parsed = parseInt(value);
        if (!isNaN(parsed)) {
          unitsValue = parsed;
        }
      }

      const sliderValue = getSliderValueFromUnits(
        unitsValue,
        field.options as string[],
      );
      return `
        <div>
          <label for="${fieldId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ${field.label}: <span id="units-value-${projectId}" class="font-semibold text-blue-600 dark:text-blue-400">${unitsValue}</span>
          </label>
          <div class="relative">
            <input
              type="range"
              id="${fieldId}"
              name="${field.name}"
              min="${field.min}"
              max="${field.max}"
              value="${sliderValue}"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 units-range-slider relative z-10"
              data-values="${field.options?.join(",")}"
              data-project-id="${projectId}"
              aria-label="Select number of units"
            >
            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>30</span>
              <span>50</span>
            </div>
          </div>
        </div>
      `;

    default:
      return "";
  }
}

// Function to generate button group HTML
export function generateButtonGroupHTML(
  group: ButtonGroupConfig,
  projectData: any = {},
): string {
  // Use project ID for unique button IDs
  const projectId = projectData.id || "project-unknown";
  let selectedValues: string[] = [];

  if (projectData[group.name]) {
    if (Array.isArray(projectData[group.name])) {
      // Already an array
      selectedValues = projectData[group.name];
    } else if (typeof projectData[group.name] === "string") {
      // Could be a JSON string or comma-separated string
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(projectData[group.name]);
        selectedValues = Array.isArray(parsed)
          ? parsed
          : [projectData[group.name]];
      } catch {
        // If JSON parsing fails, treat as comma-separated string
        selectedValues = projectData[group.name]
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s);
      }
    } else {
      // Single value
      selectedValues = [projectData[group.name]];
    }
  }

  return `
    <div class="space-y-3">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        ${group.label}
      </label>
      <div class="flex flex-wrap gap-2">
        ${group.options
          .map(
            (option) => `
          <button
            type="button"
            class="${group.cssClass} px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${selectedValues.includes(option.value) ? "bg-blue-500 text-white border-blue-500" : ""}"
            data-value="${option.value}"
            data-group="${group.name}"
            data-type="${group.type}"
            data-project-id="${projectId}"
          >
            ${option.label}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

// Helper function to convert units to slider value
function getSliderValueFromUnits(units: number, options: string[]): number {
  const index = options.indexOf(units.toString());
  return index >= 0 ? index : 0;
}

// Function to generate complete form HTML
export function generateCompleteFormHTML(
  index: number = 0,
  projectData: any = {},
): string {
  const coreFields = PROJECT_FORM_FIELDS.slice(0, 4); // Address, Owner, Architect, Sq Ft
  const description = PROJECT_FORM_FIELDS.find((f) => f.name === "description");
  const newConstruction = PROJECT_FORM_FIELDS.find(
    (f) => f.name === "new_construction",
  );
  const units = PROJECT_FORM_FIELDS.find((f) => f.name === "units");

  return `
    <!-- Address Field (Full Width) -->
    ${coreFields
      .filter((field) => field.name === "address")
      .map((field) => generateFormFieldHTML(field, index, projectData))
      .join("")}
    
    <!-- Other Core Fields Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${coreFields
        .filter((field) => field.name !== "address")
        .map((field) => generateFormFieldHTML(field, index, projectData))
        .join("")}
    </div>

    <!-- Description -->
    ${description ? generateFormFieldHTML(description, index, projectData) : ""}

    <!-- Construction Type & Units Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Construction Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Construction Type</label>
        <div class="flex gap-4">
          ${newConstruction ? generateFormFieldHTML(newConstruction, index, projectData) : ""}
        </div>
      </div>

      <!-- Units Slider -->
      ${units ? generateFormFieldHTML(units, index, projectData) : ""}
    </div>

    <!-- Button Groups -->
    ${BUTTON_GROUPS.map((group) => generateButtonGroupHTML(group, projectData)).join("")}
  `;
}

// Function to generate edit form HTML (without owner field)
export function generateEditFormHTML(
  index: number = 0,
  projectData: any = {},
): string {
  // Exclude owner field for edit forms
  const coreFields = PROJECT_FORM_FIELDS.filter(
    (field) => field.name !== "owner",
  ).slice(0, 3); // Address, Architect, Sq Ft
  const description = PROJECT_FORM_FIELDS.find((f) => f.name === "description");
  const newConstruction = PROJECT_FORM_FIELDS.find(
    (f) => f.name === "new_construction",
  );
  const units = PROJECT_FORM_FIELDS.find((f) => f.name === "units");

  return `
    <!-- Address Field (Full Width) -->
    ${coreFields
      .filter((field) => field.name === "address")
      .map((field) => generateFormFieldHTML(field, index, projectData))
      .join("")}
    
    <!-- Other Core Fields Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${coreFields
        .filter((field) => field.name !== "address")
        .map((field) => generateFormFieldHTML(field, index, projectData))
        .join("")}
    </div>

    <!-- Description -->
    ${description ? generateFormFieldHTML(description, index, projectData) : ""}

    <!-- Construction Type & Units Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Construction Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Construction Type</label>
        <div class="flex gap-4">
          ${newConstruction ? generateFormFieldHTML(newConstruction, index, projectData) : ""}
        </div>
      </div>

      <!-- Units Slider -->
      ${units ? generateFormFieldHTML(units, index, projectData) : ""}
    </div>

    <!-- Button Groups -->
    ${BUTTON_GROUPS.map((group) => generateButtonGroupHTML(group, projectData)).join("")}
  `;
}
