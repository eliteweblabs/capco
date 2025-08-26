// Shared project form configuration
// This defines all form fields and button groups used in both Dashboard.astro and project edit forms

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
    | "button-group"
    | "component"; // New type for custom components
  label: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[] | { value: string; label: string }[];
  groupType?: "radio" | "multi-select"; // For button groups
  dataField?: string; // For OCR/scraping
  component?: string; // Component name to render (e.g., "UnitSlider")
  componentProps?: Record<string, any>; // Props to pass to the component
  allow?: string[]; // Control field visibility based on user roles - array of allowed roles
}

export interface ButtonGroupConfig {
  id: string;
  name: string;
  label: string;
  type: "radio" | "multi-select";
  cssClass: string;
  options: { value: string; label: string }[];
  allow?: string[]; // Control button group visibility based on user roles - array of allowed roles
}

export interface FormActionConfig {
  id: string;
  type: "submit" | "button";
  label: string;
  icon?: string; // BoxIcons class name
  cssClass: string;
  action?: string; // Function name or action identifier
  allow?: string[]; // Control button visibility based on user roles - array of allowed roles
}

// Helper function to check if a field or button group should be allowed based on user role
export function isAllowed(
  item: FormFieldConfig | ButtonGroupConfig | FormActionConfig,
  userRole?: string | null
): boolean {
  if (item.allow === undefined) {
    return true; // Default to allowed if not specified
  }

  if (!userRole) {
    return false; // No role provided, deny access
  }

  // Case-insensitive role matching
  const normalizedUserRole = userRole.toLowerCase();
  return item.allow.some((allowedRole) => allowedRole.toLowerCase() === normalizedUserRole);
}

// Function to get filtered form fields based on user role
export function getFilteredFormFields(
  userRole?: string | null,
  isNewProject: boolean = false
): FormFieldConfig[] {
  let fields = PROJECT_FORM_FIELDS.filter((field) => isAllowed(field, userRole));

  // For existing projects, hide all client-related fields
  if (!isNewProject) {
    fields = fields.filter(
      (field) => !["owner", "owner_email", "existing_client_id", "new_client"].includes(field.name)
    );
  } else {
    // For new projects, keep owner and email fields in DOM but they'll be hidden via CSS initially
    // (they'll be shown via JavaScript based on toggle)
    // Remove the filter so these fields are included in the form
  }

  return fields;
}

// Function to get filtered button groups based on user role
export function getFilteredButtonGroups(
  userRole?: string | null,
  isNewProject: boolean = false
): ButtonGroupConfig[] {
  let groups = BUTTON_GROUPS.filter((group) => isAllowed(group, userRole));

  // For new projects, you could hide certain button groups if needed
  if (isNewProject) {
    // Currently all button groups are shown for new projects
    // You can add logic here to hide specific groups for new projects
  }

  return groups;
}

// Function to get filtered form actions based on user role and project state
export function getFilteredFormActions(
  userRole?: string | null,
  isNewProject: boolean = false
): FormActionConfig[] {
  let actions = FORM_ACTIONS.filter((action) => isAllowed(action, userRole));

  // For new projects, hide delete and estimate buttons
  if (isNewProject) {
    actions = actions.filter(
      (action) =>
        action.id !== "delete-project" &&
        action.id !== "build-estimate" &&
        action.id !== "edit-estimate"
    );

    // Change "Save Project" to "Create Project" for new projects
    actions = actions.map((action) => {
      if (action.id === "save-project") {
        return {
          ...action,
          label: "Create Project",
          icon: "bx-plus", // Change icon to plus for create
        };
      }
      return action;
    });
  }

  return actions;
}

// Core form fields
export const PROJECT_FORM_FIELDS: FormFieldConfig[] = [
  // New client toggle (only for new projects) - moved to top
  {
    id: "new-client-toggle",
    name: "new_client",
    type: "checkbox",
    label: "New Client",
    allow: ["admin", "staff"], // Only admin and staff can set client type
  },
  {
    id: "address-input",
    name: "address",
    type: "text",
    label: "Address / Title",
    placeholder: "Address / Title *",
    required: true,
    dataField: "address",
    allow: ["admin", "staff", "client"], // All roles can see address
  },
  // Owner field (only shown for new projects with new client toggle on)
  {
    id: "owner-input",
    name: "owner",
    type: "text",
    label: "Owner",
    placeholder: "Owner *",
    required: true,
    dataField: "owner",
    allow: ["admin", "staff", "client"], // All roles can see owner
  },
  // Owner email field (only shown for new projects with new client toggle on)
  {
    id: "owner-email-input",
    name: "owner_email",
    type: "text",
    label: "Owner Email",
    placeholder: "owner@example.com",
    required: true,
    dataField: "owner_email",
    allow: ["admin", "staff"], // Only admin and staff can set email
  },
  // Existing client dropdown (only shown for new projects with new client toggle off)
  {
    id: "existing-client-select",
    name: "existing_client_id",
    type: "select",
    label: "Select Existing Client",
    placeholder: "Choose a client...",
    required: true,
    options: [], // Will be populated dynamically
    allow: ["admin", "staff"], // Only admin and staff can select clients
  },
  {
    id: "architect-input",
    name: "architect",
    type: "text",
    label: "Architect",
    placeholder: "Architect",
    dataField: "architect",
    allow: ["admin", "staff"], // Only admin and staff can see architect
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
    allow: ["admin", "staff", "client"], // All roles can see square footage
  },
  {
    id: "description-input",
    name: "description",
    type: "textarea",
    label: "Description",
    placeholder: "Project description...",
    allow: ["admin", "staff"], // Only admin and staff can see description
  },
  {
    id: "new-construction",
    name: "new_construction",
    type: "checkbox",
    label: "New Construction",
    allow: ["admin", "staff", "client"], // All roles can see new construction
  },
  // Units slider is now handled by UnitSlider.astro component
  {
    id: "units-slider",
    name: "units",
    type: "component",
    label: "Units",
    component: "UnitSlider",
    componentProps: {
      name: "units",
      label: "Units",
      required: false,
    },
    allow: ["admin", "staff"], // Only admin and staff can see units slider
  },
];

// Form action button configurations
export const FORM_ACTIONS: FormActionConfig[] = [
  {
    id: "save-project",
    type: "submit",
    label: "Save Project",
    icon: "bx-save",
    cssClass:
      "px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors",
    allow: ["admin", "staff", "client"], // All roles can save
  },
  {
    id: "delete-project",
    type: "button",
    label: "Delete Project",
    icon: "bx-trash",
    cssClass:
      "px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors",
    action: "deleteProject",
    allow: ["admin", "staff"], // Only admin and staff can delete
  },
  {
    id: "build-estimate",
    type: "button",
    label: "Build Estimate",
    icon: "bx-file-pdf",
    cssClass:
      "px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors",
    action: "buildEstimate",
    allow: ["admin", "staff"], // Only admin and staff can build estimates
  },
  {
    id: "edit-estimate",
    type: "button",
    label: "Edit Estimate",
    icon: "bx-edit",
    cssClass:
      "px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors",
    action: "editEstimate",
    allow: ["admin", "staff"], // Only admin and staff can edit estimates
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
    allow: ["admin", "staff", "client"], // All roles can see building type
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
    allow: ["admin", "staff"], // Only admin and staff can see consulting services
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
    allow: ["admin", "staff", "client"], // All roles can see fire service
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
    allow: ["admin", "staff"], // Only admin and staff can see reports required
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
  projectData: any = {}
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
      const isChecked = value === true || value === "true" || value === 1 || value === "1";
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
      // Slider fields are now handled by dedicated components (e.g., UnitSlider.astro)
      return "";

    default:
      return "";
  }
}

// Function to generate button group HTML
export function generateButtonGroupHTML(group: ButtonGroupConfig, projectData: any = {}): string {
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
        selectedValues = Array.isArray(parsed) ? parsed : [projectData[group.name]];
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
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

// Helper function to convert units to slider value (moved to UnitSlider component)
// function getSliderValueFromUnits(units: number, options: string[]): number {
//   const index = options.indexOf(units.toString());
//   return index >= 0 ? index : 0;
// }

// Function to generate complete form HTML
export function generateCompleteFormHTML(index: number = 0, projectData: any = {}): string {
  const coreFields = PROJECT_FORM_FIELDS.slice(0, 4); // Address, Owner, Architect, Sq Ft
  const description = PROJECT_FORM_FIELDS.find((f) => f.name === "description");
  const newConstruction = PROJECT_FORM_FIELDS.find((f) => f.name === "new_construction");

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

      <!-- Units Slider - Use UnitSlider component instead -->
      <div id="units-slider-container-${projectData.id || index}">
        <!-- UnitSlider component will be rendered here -->
      </div>
    </div>

    <!-- Button Groups -->
    ${BUTTON_GROUPS.map((group) => generateButtonGroupHTML(group, projectData)).join("")}
  `;
}
