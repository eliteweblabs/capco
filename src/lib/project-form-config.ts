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
  value?: string;
  options?: string[] | { value: string; label: string; selected?: boolean }[];
  groupType?: "radio" | "multi-select"; // For button groups
  dataField?: string; // For OCR/scraping
  component?: string; // Component name to render (e.g., "UnitSlider")
  componentProps?: Record<string, any>; // Props to pass to the component
  allow?: string[]; // Control field visibility based on user roles - array of allowed roles
  hideAtStatus?: number[]; // Control field visibility based on project status - array of status values where field should be hidden
  readOnlyAtStatus?: number[]; // Control field read-only state based on project status - array of status values where field should be read-only
}

// Unified form element interface that combines fields, button groups, and actions
export interface FormElementConfig {
  id: string;
  name: string;
  type: "field" | "button-group" | "action";
  elementType:
    | "text"
    | "number"
    | "textarea"
    | "checkbox"
    | "slider"
    | "select"
    | "button-group"
    | "component"
    | "submit"
    | "button";
  label: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  value?: string;
  options?: string[] | { value: string; label: string; selected?: boolean }[];
  groupType?: "radio" | "multi-select"; // For button groups
  dataField?: string; // For OCR/scraping
  component?: string; // Component name to render (e.g., "UnitSlider")
  componentProps?: Record<string, any>; // Props to pass to the component
  cssClass?: string; // For actions and button groups
  icon?: string; // For actions
  action?: string; // For actions
  tab?: string; // For actions
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info"; // For actions
  allow?: string[]; // Control visibility based on user roles
  hideAtStatus?: number[]; // Control visibility based on project status
  readOnlyAtStatus?: number[]; // Control read-only state based on project status
  columns?: 1 | 2 | 3 | 4 | 6 | 12; // Control grid column span (1=full width, 2=half, 3=third, etc.)
}

export interface FormActionConfig {
  id: string;
  type: "submit" | "button";
  label: string;
  icon?: string;
  cssClass: string;
  action?: string; // Function name or action identifier
  tab?: string; // Tab to navigate to when button is clicked
  allow?: string[]; // Control button visibility based on user roles - array of allowed roles
  hideAtStatus?: number[];
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info"; // Control button visibility based on project status - array of status values where button should be hidden
}

// Helper function to check if a field or button group should be allowed based on user role
export function isAllowed(
  item: FormFieldConfig | FormActionConfig,
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

// Helper function to check if a button should be shown based on project status
export function isStatusAllowed(action: FormActionConfig, projectStatus?: number | null): boolean {
  if (!action.hideAtStatus) return true; // If no hideAtStatus array specified, always display
  if (projectStatus === null || projectStatus === undefined) return true; // If no status provided, show by default
  return !action.hideAtStatus.includes(projectStatus); // Hide if status is in the hideAtStatus array
}

// Helper function to check if a form field should be shown based on project status
export function isFieldStatusAllowed(
  field: FormFieldConfig,
  projectStatus?: number | null
): boolean {
  if (!field.hideAtStatus) return true; // If no hideAtStatus array specified, always display
  if (projectStatus === null || projectStatus === undefined) return true; // If no status provided, show by default
  return !field.hideAtStatus.includes(projectStatus); // Hide if status is in the hideAtStatus array
}
// Helper function to check if a button group should be shown based on project status

// Helper function to check if a form field should be read-only based on project status
export function isFieldReadOnly(field: FormFieldConfig, projectStatus?: number | null): boolean {
  if (!field.readOnlyAtStatus) return false; // If no readOnlyAtStatus array specified, not read-only
  if (projectStatus === null || projectStatus === undefined) return false; // If no status provided, not read-only by default
  return field.readOnlyAtStatus.includes(projectStatus); // Read-only if status is in the readOnlyAtStatus array
}

// Helper function to check if a unified form element should be read-only based on project status
export function isFormElementReadOnly(
  element: FormElementConfig,
  projectStatus?: number | null
): boolean {
  if (!element.readOnlyAtStatus) return false; // If no readOnlyAtStatus array specified, not read-only
  if (projectStatus === null || projectStatus === undefined) return false; // If no status provided, not read-only by default
  return element.readOnlyAtStatus.includes(projectStatus); // Read-only if status is in the readOnlyAtStatus array
}

// Function to get filtered form actions based on user role and project state

const standardReadOnlyStatus = [
  60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160,
  170, 180, 190, 200, 210, 220,
];

const clientReadOnlyStatus = [
  20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130,
  135, 140, 145, 150, 155, 160, 170, 180, 190, 200, 210, 220,
];

// Unified form elements array - combines fields, button groups, and actions in order
export const UNIFIED_FORM_ELEMENTS: FormElementConfig[] = [
  // Address field (special handling for new projects)
  {
    id: "address-input",
    name: "address",
    type: "field",
    elementType: "component",
    label: "Address / Title",
    component: "GoogleAddressAutocomplete",
    componentProps: {
      placeholder: "Enter project address...",
      required: true,
    },
    required: true,
    dataField: "address",
    allow: ["Admin", "Staff", "Client"],
    hideAtStatus: [
      10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200,
    ],
    readOnlyAtStatus: standardReadOnlyStatus,
    columns: 1, // Left column
  },

  // Title field
  {
    id: "title-input",
    name: "title",
    type: "field",
    elementType: "text",
    label: "Title",
    placeholder: "Title",
    dataField: "title",
    allow: ["Admin", "Staff"],
    hideAtStatus: [],
    readOnlyAtStatus: standardReadOnlyStatus,
    columns: 1, // Half width
  },

  // Architect field
  {
    id: "architect-input",
    name: "architect",
    type: "field",
    elementType: "text",
    label: "Architect",
    placeholder: "Architect",
    dataField: "architect",
    allow: ["Admin", "Staff"],
    hideAtStatus: [],
    readOnlyAtStatus: standardReadOnlyStatus,
    columns: 2, // Half width
  },

  {
    id: "architect-input",
    name: "architect",
    type: "field",
    elementType: "text",
    label: "Architect",
    placeholder: "Architect",
    dataField: "architect",
    allow: ["Client"],
    hideAtStatus: [],
    readOnlyAtStatus: clientReadOnlyStatus,
    columns: 2, // Half width
  },

  // Square footage field
  {
    id: "square-foot-input",
    name: "sqFt",
    type: "field",
    elementType: "component",
    label: "Square Footage",
    placeholder: "Gross Square Footage (GFA) *",
    required: false,
    min: 0,
    max: 50000,
    step: 100,
    component: "UnitSlider",
    componentProps: {
      required: false,
    },
    dataField: "sqFt",
    allow: ["Admin", "Staff"],
    // hideAtStatus: [],
    readOnlyAtStatus: standardReadOnlyStatus,
    columns: 2, // Half width
  },
  {
    id: "square-foot-input",
    name: "sqFt",
    type: "field",
    elementType: "component",
    label: "Square Footage",
    placeholder: "Gross Square Footage (GFA) *",
    required: false,
    min: 0,
    max: 50000,
    step: 100,
    component: "UnitSlider",
    componentProps: {
      required: false,
    },
    dataField: "sqFt",
    allow: ["Client"],
    // hideAtStatus: [],
    readOnlyAtStatus: clientReadOnlyStatus,
    columns: 2, // Half width
  },

  // Description field
  {
    id: "description-input",
    name: "description",
    type: "field",
    elementType: "textarea",
    label: "Description",
    placeholder: "Project description...",
    dataField: "description",
    allow: ["Admin", "Staff"],
    // hideAtStatus: [50, 60, 70, 80, 90],
    readOnlyAtStatus: standardReadOnlyStatus,
    columns: 1, // Half width
  },
  {
    id: "description-input",
    name: "description",
    type: "field",
    elementType: "textarea",
    label: "Description",
    placeholder: "Project description...",
    dataField: "description",
    allow: ["Client"],
    // hideAtStatus: [50, 60, 70, 80, 90],
    readOnlyAtStatus: clientReadOnlyStatus,
    columns: 1, // Half width
  },

  {
    id: "nfpa-version-input",
    name: "nfpaVersion",
    type: "field",
    elementType: "text",
    label: "NFPA Version",
    placeholder: "NFPA Version",
    value: "13",
    dataField: "nfpaVersion",
    allow: ["Admin", "Staff"], // Only admin and staff can see architect
    // hideAtStatus: [], // Hide after proposal is signed off
    readOnlyAtStatus: standardReadOnlyStatus, // Read-only after proposal is viewed but before signed off
    columns: 2, // Half width
  },
  {
    id: "hazardous-material-input",
    name: "hazardousMaterial",
    type: "field",
    elementType: "text",
    label: "Hazardous Material Usage and Storage",
    placeholder: "None in excess of exempt amounts allowed by 780 CMR §307.1",
    value: "None in excess of exempt amounts allowed by 780 CMR §307.1",
    dataField: "hazardousMaterial",
    allow: ["Admin", "Staff"], // Only admin and staff can see architect
    // hideAtStatus: [], // Hide after proposal is signed off
    readOnlyAtStatus: standardReadOnlyStatus, // Read-only after proposal is viewed but before signed off
    columns: 2, // Half width
  },
  {
    id: "hps-commodities-input",
    name: "hpsCommodities",
    type: "field",
    elementType: "text",
    label: "HPS Commodities",
    placeholder: "High-Piled Storage (over 12 ft.) of Commodities",
    value: "None in excess of exempt amounts allowed by 780 CMR §307.1",
    dataField: "hpsCommodities",
    allow: ["Admin", "Staff"], // Only admin and staff can see architect
    // hideAtStatus: [], // Hide after proposal is signed off
    readOnlyAtStatus: standardReadOnlyStatus, // Read-only after proposal is viewed but before signed off
    columns: 2, // Half width
  },
  {
    id: "site-access-input",
    name: "siteAccess",
    type: "field",
    elementType: "text",
    label: "Site Access",
    placeholder: "Site access for fire / rescue vehicles is via ____________",
    dataField: "siteAccess",
    allow: ["Admin", "Staff"], // Only admin and staff can see architect
    // hideAtStatus: [0], // Hide after proposal is signed off
    readOnlyAtStatus: standardReadOnlyStatus, // Read-only after proposal is viewed but before signed off
    columns: 2, // Half width
  },

  {
    id: "exterior-beacon-input",
    name: "exteriorBeacon",
    type: "field",
    elementType: "text",
    label: "Exterior Beacon",
    placeholder: "An exterior fire alarm beacon ... visible from __________",
    dataField: "site_exterior_access",
    allow: ["Admin", "Staff"], // Only admin and staff can see architect
    // hideAtStatus: [0], // Hide after proposal is signed off
    readOnlyAtStatus: standardReadOnlyStatus, // Read-only after proposal is viewed but before signed off
    columns: 2, // Half width
  },

  {
    id: "fire-sprinkler-installation-input",
    name: "fireSprinklerInstallation",
    type: "field",
    elementType: "text",
    label: "Fire Sprinkler Installation",
    placeholder: "The fire sprinkler contractor will install: _______",
    dataField: "fireSprinklerInstallation",
    allow: ["Admin", "Staff"], // Only admin and staff can see architect
    // hideAtStatus: [], // Hide after proposal is signed off
    readOnlyAtStatus: standardReadOnlyStatus, // Read-only after proposal is viewed but before signed off
    columns: 2, // Half width
  },
  {
    id: "commencement-of-construction-input",
    name: "commencementOfConstruction",
    type: "field",
    elementType: "text",
    label: "Commencement of Construction",
    placeholder: "Estimated Commencement of Construction",
    dataField: "commencementOfConstruction",
    allow: ["Admin", "Staff"], // Only admin and staff can see architect
    // hideAtStatus: [], // Hide after proposal is signed off
    readOnlyAtStatus: standardReadOnlyStatus, // Read-only after proposal is viewed but before signed off
    columns: 2, // Half width
  },
  {
    id: "suppression-detection-systems-input",
    name: "suppressionDetectionSystems",
    type: "field",
    elementType: "text",
    label: "Suppression & Detection Systems",
    placeholder: "Suppression & Detection Systems",
    dataField: "commencementOfConstruction",
    allow: ["Admin", "Staff"], // Only admin and staff can see architect
    // hideAtStatus: [], // Hide after proposal is signed off
    readOnlyAtStatus: standardReadOnlyStatus, // Read-only after proposal is viewed but before signed off
    columns: 2, // Half width
  },
  // Building height field
  {
    id: "building-height-input",
    name: "buildingHeight",
    type: "field",
    elementType: "component",
    label: "Building Height",
    placeholder: "Building Height",
    required: false,
    min: 0,
    max: 500,
    step: 1,
    component: "UnitSlider",
    componentProps: {
      required: false,
    },
    dataField: "buildingHeight",
    allow: ["Admin", "Staff"],
    hideAtStatus: [],
    readOnlyAtStatus: standardReadOnlyStatus,
  },

  // Fire Service button group
  {
    id: "fire-service",
    name: "service",
    type: "button-group",
    elementType: "button-group",
    label: "Supply / Service",
    groupType: "radio",
    cssClass: "fire-service-radio",
    allow: ["Admin", "Staff"],
    readOnlyAtStatus: standardReadOnlyStatus,
    options: [
      { value: "Pump & Tank", label: "Pump & Tank" },
      { value: "2' Copper", label: "2' Copper" },
      { value: "4' Ductile", label: "4' Ductile" },
      { value: "6' Ductile", label: "6' Ductile" },
      { value: "Unknown", label: "Unknown" },
    ],
    columns: 1,
  },
  {
    id: "fire-service",
    name: "service",
    type: "button-group",
    elementType: "button-group",
    label: "Supply / Service",
    groupType: "radio",
    cssClass: "fire-service-radio",
    allow: ["Client"],
    readOnlyAtStatus: clientReadOnlyStatus,
    options: [
      { value: "Pump & Tank", label: "Pump & Tank" },
      { value: "2' Copper", label: "2' Copper" },
      { value: "4' Ductile", label: "4' Ductile" },
      { value: "6' Ductile", label: "6' Ductile" },
      { value: "Unknown", label: "Unknown" },
    ],
    columns: 1,
  },

  // Fire Protection Service Type button group
  {
    id: "fire-service-type",
    name: "fireServiceType",
    type: "button-group",
    elementType: "button-group",
    label: "Fire Service Type",
    groupType: "radio",
    cssClass: "fire-service-type-radio",
    allow: ["Admin", "Staff"],
    readOnlyAtStatus: standardReadOnlyStatus,
    options: [
      {
        value:
          "The fire protection system will be fed with a newly installed flushed and chlorinated DICL fire service. Installation by licensed and bonded utility contractor",
        label: "DICL",
      },
      {
        value:
          "The fire protection system will be fed with a newly installed flushed and chlorinated Type K Copper fire service. Installation by licensed and bonded utility contractor.  Flushing and testing to be witnessed by the licensed fire sprinkler contractor.",
        label: "Type K Copper",
      },
      {
        value:
          "The fire protection system installed will be fed by a residential GT-15 Goulds fire pump or equivalent. NFPA 13D requires 10 minutes of stored water supply calculated by the head flow of the two hydraulically most remote sprinkler heads. 2-26GPM = 600 Gallons of stored water.",
        label: "GT-15 Goulds",
      },
    ],
    columns: 1,
  },

  // Floors below grade field
  {
    id: "floors-below-grade-input",
    name: "floorsBelowGrade",
    type: "field",
    elementType: "component",
    label: "Floors Below Grade",
    placeholder: "Floors Below Grade",
    required: false,
    min: 0,
    max: 5,
    step: 1,
    component: "UnitSlider",
    componentProps: {
      required: false,
    },
    dataField: "floorsBelowGrade",
    allow: ["Admin", "Staff"],
    hideAtStatus: [],
    readOnlyAtStatus: standardReadOnlyStatus,
    columns: 2,
  },

  // New construction checkbox
  {
    id: "new-construction",
    name: "newConstruction",
    type: "field",
    elementType: "checkbox",
    label: "New Construction",
    allow: ["Admin", "Staff", "Client"],
    readOnlyAtStatus: standardReadOnlyStatus,
  },

  // Units slider
  {
    id: "units-slider",
    name: "units",
    type: "field",
    elementType: "component",
    label: "Units",
    component: "UnitSlider",
    componentProps: {
      required: false,
    },
    allow: ["Admin", "Staff"],
    readOnlyAtStatus: standardReadOnlyStatus,
    columns: 1,
  },
  {
    id: "units-slider",
    name: "units",
    type: "field",
    elementType: "component",
    label: "Units",
    component: "UnitSlider",
    componentProps: {
      required: false,
    },
    allow: ["Client"],
    readOnlyAtStatus: clientReadOnlyStatus,
    columns: 1,
  },

  // Building Type button group
  {
    id: "building-type",
    name: "building",
    type: "button-group",
    elementType: "button-group",
    label: "Building",
    groupType: "multi-select",
    cssClass: "building-type-radio",
    allow: ["Admin", "Staff"],
    readOnlyAtStatus: standardReadOnlyStatus,
    options: [
      { value: "Residential", label: "Residential" },
      { value: "Mixed use", label: "Mixed use" },
      { value: "Mercantile", label: "Mercantile" },
      { value: "Commercial", label: "Commercial" },
      { value: "Storage", label: "Storage" },
      { value: "Warehouse", label: "Warehouse" },
      { value: "Institutional", label: "Institutional" },
    ],
    columns: 1,
  },
  {
    id: "building-type",
    name: "building",
    type: "button-group",
    elementType: "button-group",
    label: "Building",
    groupType: "multi-select",
    cssClass: "building-type-radio",
    allow: ["Client"],
    readOnlyAtStatus: clientReadOnlyStatus,
    options: [
      { value: "Residential", label: "Residential" },
      { value: "Mixed use", label: "Mixed use" },
      { value: "Mercantile", label: "Mercantile" },
      { value: "Commercial", label: "Commercial" },
      { value: "Storage", label: "Storage" },
      { value: "Warehouse", label: "Warehouse" },
      { value: "Institutional", label: "Institutional" },
    ],
    columns: 1,
  },

  // Consulting Services button group
  {
    id: "consulting-services",
    name: "project",
    type: "button-group",
    elementType: "button-group",
    label: "Project",
    groupType: "multi-select",
    cssClass: "project-type-btns",
    allow: ["Admin", "Staff"],
    readOnlyAtStatus: standardReadOnlyStatus,
    options: [
      { value: "Sprinkler", label: "Sprinkler" },
      { value: "Alarm", label: "Alarm" },
      { value: "Mechanical", label: "Mechanical" },
      { value: "Electrical", label: "Electrical" },
      { value: "Plumbing", label: "Plumbing" },
      { value: "Civil engineering", label: "Civil engineering" },
      { value: "Other", label: "Other" },
    ],
    columns: 1,
  },
  {
    id: "consulting-services",
    name: "project",
    type: "button-group",
    elementType: "button-group",
    label: "Project",
    groupType: "multi-select",
    cssClass: "project-type-btns",
    allow: ["Client"],
    readOnlyAtStatus: clientReadOnlyStatus,
    options: [
      { value: "Sprinkler", label: "Sprinkler" },
      { value: "Alarm", label: "Alarm" },
      { value: "Mechanical", label: "Mechanical" },
      { value: "Electrical", label: "Electrical" },
      { value: "Plumbing", label: "Plumbing" },
      { value: "Civil engineering", label: "Civil engineering" },
      { value: "Other", label: "Other" },
    ],
    columns: 1,
  },

  // Tier button group
  {
    id: "tier",
    name: "tier",
    type: "button-group",
    elementType: "button-group",
    label: "Tier",
    groupType: "multi-select",
    cssClass: "project-type-btns",
    allow: ["Admin", "Staff"],
    readOnlyAtStatus: standardReadOnlyStatus,
    options: [
      { value: "Tier I", label: "Tier I" },
      { value: "Tier II", label: "Tier II" },
      { value: "Tier III", label: "Tier III" },
    ],
    columns: 1,
  },

  {
    id: "tier",
    name: "tier",
    type: "button-group",
    elementType: "button-group",
    label: "Tier",
    groupType: "multi-select",
    cssClass: "project-type-btns",
    allow: ["Client"],
    readOnlyAtStatus: clientReadOnlyStatus,
    options: [
      { value: "Tier I", label: "Tier I" },
      { value: "Tier II", label: "Tier II" },
      { value: "Tier III", label: "Tier III" },
    ],
    columns: 1,
  },

  // Reports Required button group
  {
    id: "reports-required",
    name: "requestedDocs",
    type: "button-group",
    elementType: "button-group",
    label: "Reports Required",
    groupType: "multi-select",
    cssClass: "",
    allow: ["Admin", "Staff"],
    readOnlyAtStatus: standardReadOnlyStatus,
    options: [
      { value: "Narrative", label: "Narrative", selected: true },
      { value: "Sprinkler", label: "Sprinkler", selected: true },
      { value: "Alarm", label: "Alarm" },
      { value: "Hydraulic Calculations", label: "Hydraulic Calculations", selected: true },
      { value: "Fire Hydrant Flow Test", label: "Fire Hydrant Flow Test", selected: true },
      { value: "NFPA 241", label: "NFPA 241" },
      { value: "IEBC", label: "IEBC" },
      { value: "IBC", label: "IBC" },
    ],
    columns: 1,
  },

  // Form Actions

  {
    id: "delete-project",
    name: "delete-project",
    type: "action",
    elementType: "button",
    label: "Delete Project",
    icon: "trash",
    variant: "danger",
    action: "deleteProject",
    allow: ["Admin", "Staff"],
    hideAtStatus: [],
    columns: 1,
  },

  {
    id: "save-project",
    name: "save-project",
    type: "action",
    elementType: "submit",
    label: "Save Project",
    icon: "save",
    variant: "primary",
    // cssClass:
    // "flex-1 w-full lg:w-auto px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-full hover:bg-primary-700 transition-colors mt-6",
    allow: ["Admin", "Staff"],
    hideAtStatus: standardReadOnlyStatus,
    columns: 1,
  },

  {
    id: "save-project",
    name: "save-project",
    type: "action",
    elementType: "submit",
    label: "Save Project",
    icon: "save",
    variant: "primary",
    // cssClass:
    // "flex-1 w-full lg:w-auto px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-full hover:bg-primary-700 transition-colors mt-6",
    allow: ["Client"],
    hideAtStatus: [
      20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125,
      130, 135, 140, 145, 150, 155, 160, 170, 180, 190, 200, 210, 220,
    ],
    columns: 1,
  },

  // {
  //   id: "build-proposal",
  //   name: "build-proposal",
  //   type: "action",
  //   elementType: "button",
  //   label: "Build Proposal",
  //   icon: "file-text",
  //   tab: "proposal",
  //   variant: "success",
  //   cssClass:
  //     "flex-1 w-full md:w-auto px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition-colors mt-6",
  //   action: "buildProposal",
  //   allow: ["Admin", "Staff"],
  //   hideAtStatus: [
  //     0, 10, 30, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130,
  //     135, 140, 145, 150, 155, 160, 170, 180, 190, 200, 210, 220,
  //   ],
  // },
];

// Function to get filtered unified form elements based on user role and project status
export function getFilteredUnifiedFormElements(
  userRole?: string | null,
  isNewProject: boolean = false,
  projectStatus?: number | null
): FormElementConfig[] {
  // For new projects, use status 0, otherwise use actual status
  const effectiveStatus = isNewProject ? 0 : projectStatus;

  let elements = UNIFIED_FORM_ELEMENTS.filter(
    (element) =>
      isUnifiedElementAllowed(element, userRole) &&
      isUnifiedElementStatusAllowed(element, effectiveStatus)
  );

  // Elements are already in the correct order from the array

  // Change "Save Project" to "Create Project" for new projects
  if (isNewProject) {
    elements = elements
      .filter((element) => element.id !== "delete-project")
      .map((element) => {
        if (element.id === "save-project") {
          return {
            ...element,
            label: "Create Project",
            icon: "plus", // Change icon to plus for create
          };
        }
        return element;
      });
  }

  return elements;
}

// Helper function to check if a unified form element should be allowed based on user role
export function isUnifiedElementAllowed(
  element: FormElementConfig,
  userRole?: string | null
): boolean {
  if (element.allow === undefined) {
    return true; // Default to allowed if not specified
  }

  if (!userRole) {
    return false; // No role provided, deny access
  }

  // Case-insensitive role matching
  const normalizedUserRole = userRole.toLowerCase();
  return element.allow.some((allowedRole) => allowedRole.toLowerCase() === normalizedUserRole);
}

// Helper function to check if a unified form element should be shown based on project status
export function isUnifiedElementStatusAllowed(
  element: FormElementConfig,
  projectStatus?: number | null
): boolean {
  if (!element.hideAtStatus) return true; // If no hideAtStatus array specified, always display
  if (projectStatus === null || projectStatus === undefined) return true; // If no status provided, show by default
  return !element.hideAtStatus.includes(projectStatus); // Hide if status is in the hideAtStatus array
}
