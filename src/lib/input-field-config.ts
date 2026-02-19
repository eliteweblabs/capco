/**
 * Unified Input Field Configuration
 * Single source of truth for input types used across Forms, Tables, MultiStepForm.
 * Add new types here; ConfigurableInput.astro maps type → component.
 */

/** Generic input types (built-in HTML or shared components) */
export type GenericInputType =
  | "input"
  | "telephone"
  | "googleAddress"
  | "textarea"
  | "slider"
  | "toggle"
  | "stepper"
  | "dateTime"
  | "buttonGroup"
  | "dropdownSelect";

/** Custom input types (domain-specific components) */
export type CustomInputType = "staffSelect";

/** All input types */
export type InputType = GenericInputType | CustomInputType | (string & Record<never, never>);

/** Where the input is rendered */
export type InputContext = "form" | "table" | "multistep";

/** Option for select, buttonGroup, dropdown */
export interface InputOption {
  value: string;
  label: string;
  disabled?: boolean;
  selected?: boolean;
}

/** Base config shared by all input types */
export interface InputFieldConfigBase {
  id: string;
  name: string;
  type: InputType;
  label?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  /** For tables: project/row field path (e.g. "dueDate", "address") */
  field?: string;
  /** For refresh/save: meta key (e.g. "dueDate") */
  meta?: string;
  columns?: number;
  /** Role-based visibility */
  allow?: string[];
}

/** input: text, email, number, password, tel */
export interface InputFieldConfig extends InputFieldConfigBase {
  type: "input";
  inputType?: "text" | "email" | "number" | "password" | "tel";
  min?: number;
  max?: number;
  step?: number;
  minlength?: number;
  autocomplete?: string;
}

/** telephone: PhoneAndSMS */
export interface TelephoneFieldConfig extends InputFieldConfigBase {
  type: "telephone";
  showSMS?: boolean;
  smsChecked?: boolean;
  selectedCarrier?: string;
}

/** googleAddress: SlotMachineModal with Places API */
export interface GoogleAddressFieldConfig extends InputFieldConfigBase {
  type: "googleAddress";
  fetchApiEndpoint?: string;
  apiParams?: Record<string, unknown>;
  valueField?: string;
  currentLocation?: boolean;
  requiredText?: string;
}

/** textarea */
export interface TextareaFieldConfig extends InputFieldConfigBase {
  type: "textarea";
  rows?: number;
}

/** slider: UnitSlider, range input */
export interface SliderFieldConfig extends InputFieldConfigBase {
  type: "slider";
  min?: number;
  max?: number;
  step?: number;
  /** "units" triggers special units preset in UnitSlider */
  preset?: "units" | "default";
}

/** toggle: SlideToggle */
export interface ToggleFieldConfig extends InputFieldConfigBase {
  type: "toggle";
  checked?: boolean;
  icon?: string;
  color?: "primary" | "secondary" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
}

/** stepper: NumberStepper (numeric) or Stepper (date) */
export interface StepperFieldConfig extends InputFieldConfigBase {
  type: "stepper";
  min?: number;
  max?: number;
  step?: number;
  /** "date" = Stepper.astro (dueDate style); default = NumberStepper */
  variant?: "number" | "date";
  /** For date variant: hours to add on increment */
  hourStep?: number;
}

/** dateTime: native date/datetime input */
export interface DateTimeFieldConfig extends InputFieldConfigBase {
  type: "dateTime";
  /** "date" | "datetime-local" | "time" */
  inputType?: "date" | "datetime-local" | "time";
}

/** buttonGroup: ToggleButton radio or multi-select */
export interface ButtonGroupFieldConfig extends InputFieldConfigBase {
  type: "buttonGroup";
  options: InputOption[];
  groupType: "radio" | "multi-select";
  cssClass?: string;
}

/** dropdownSelect: native select or SlotMachine-style picker */
export interface DropdownSelectFieldConfig extends InputFieldConfigBase {
  type: "dropdownSelect";
  options: InputOption[];
  /** Use SlotMachineModal for searchable; otherwise native select */
  searchable?: boolean;
}

/** staffSelect: StaffSelectTooltip / staff picker */
export interface StaffSelectFieldConfig extends InputFieldConfigBase {
  type: "staffSelect";
  title?: string;
  fetchApiEndpoint?: string;
  saveApiEndpoint?: string;
  project?: unknown;
  currentUser?: unknown;
  icon?: string;
  updateCallback?: string;
}

/** Union of all field configs */
export type InputFieldConfigUnion =
  | InputFieldConfig
  | TelephoneFieldConfig
  | GoogleAddressFieldConfig
  | TextareaFieldConfig
  | SliderFieldConfig
  | ToggleFieldConfig
  | StepperFieldConfig
  | DateTimeFieldConfig
  | ButtonGroupFieldConfig
  | DropdownSelectFieldConfig
  | StaffSelectFieldConfig;

/** Generic config for unknown/custom types (spreads componentProps) */
export interface CustomComponentFieldConfig extends InputFieldConfigBase {
  type: string;
  component?: string;
  componentProps?: Record<string, unknown>;
}

/** Resolved config passed to ConfigurableInput */
export type ResolvedInputFieldConfig =
  | InputFieldConfigUnion
  | (CustomComponentFieldConfig & { component: string });

/** Input types that map to known components */
export const KNOWN_INPUT_TYPES: InputType[] = [
  "input",
  "telephone",
  "googleAddress",
  "textarea",
  "slider",
  "toggle",
  "stepper",
  "dateTime",
  "buttonGroup",
  "dropdownSelect",
  "staffSelect",
];

export function isKnownInputType(t: string): t is InputType {
  return KNOWN_INPUT_TYPES.includes(t as InputType);
}

/** Adapter: project-form-config / site-config.projectForm element → unified config */
export function formElementToInputConfig(el: {
  id: string;
  name: string;
  type?: string;
  elementType?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  dataField?: string;
  component?: string;
  componentProps?: Record<string, unknown>;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string; selected?: boolean }>;
  groupType?: string;
  cssClass?: string;
  [key: string]: unknown;
}): ResolvedInputFieldConfig | null {
  const id = el.id;
  const name = el.name ?? el.id;
  const label = el.label ?? name;
  const base = { id, name, label, type: "input" as const };

  // field + elementType mapping
  const et = el.elementType ?? el.type;
  if (et === "text" || et === "number") {
    return {
      ...base,
      type: "input",
      inputType: et as "text" | "number",
      placeholder: el.placeholder,
      required: el.required,
      min: el.min,
      max: el.max,
      step: el.step,
      field: el.dataField,
    };
  }
  if (et === "textarea") {
    return { ...base, type: "textarea", placeholder: el.placeholder, required: el.required };
  }
  if (et === "checkbox") {
    return { ...base, type: "toggle", checked: false };
  }
  if (et === "component" && el.component === "UnitSlider") {
    return {
      ...base,
      type: "slider",
      min: el.min,
      max: el.max,
      step: el.step,
      field: el.dataField,
    };
  }
  if (el.type === "button-group") {
    const opts = (el.options ?? []).map((o: any) =>
      typeof o === "string"
        ? { value: o, label: o }
        : { value: o.value ?? o.label, label: o.label ?? o.value }
    );
    return {
      ...base,
      type: "buttonGroup",
      options: opts,
      groupType: (el.groupType === "multi-select" ? "multi-select" : "radio") as
        | "radio"
        | "multi-select",
      cssClass: el.cssClass,
    };
  }
  return null;
}

/** Adapter: projectListColumns column → unified config (for editable columns) */
export function tableColumnToInputConfig(col: {
  id: string;
  label?: string;
  type: string;
  field?: string;
  min?: number;
  max?: number;
  step?: number;
  [key: string]: unknown;
}): ResolvedInputFieldConfig | null {
  if (col.type === "dueDate") {
    return {
      id: col.id,
      name: col.field ?? col.id,
      type: "stepper",
      label: col.label,
      field: col.field,
      meta: col.field ?? "dueDate",
      variant: "date",
    } as StepperFieldConfig;
  }
  if (col.type === "text" && col.field) {
    return {
      id: col.id,
      name: col.field,
      type: "input",
      inputType: "text",
      label: col.label,
      field: col.field,
    } as InputFieldConfig;
  }
  // Future: stepper with min/max/step for numeric columns
  if (col.type === "stepper" && col.field) {
    return {
      id: col.id,
      name: col.field,
      type: "stepper",
      label: col.label,
      field: col.field,
      min: col.min,
      max: col.max,
      step: col.step,
    } as StepperFieldConfig;
  }
  return null;
}

/** Adapter: MultiStepForm step.fields field → unified config */
export function multiStepFieldToInputConfig(field: {
  id: string;
  name?: string;
  type?: string;
  label?: string;
  component?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  [key: string]: unknown;
}): ResolvedInputFieldConfig | null {
  const id = field.id;
  const name = field.name ?? field.id;
  const label = field.label ?? name;
  const base = { id, name, label };

  const t = field.type;
  if (t === "component") {
    const comp = field.component;
    if (comp === "UnitSlider") {
      return {
        ...base,
        type: "slider",
        min: field.min,
        max: field.max,
        step: field.step,
      } as SliderFieldConfig;
    }
    if (comp === "SlideToggle") {
      return { ...base, type: "toggle" } as ToggleFieldConfig;
    }
    // SlotMachineModalStaff, InlineAddressSearch, etc. → use componentProps
    return null;
  }
  if (t === "textarea") {
    return {
      ...base,
      type: "textarea",
      rows: field.rows,
      placeholder: field.placeholder,
      required: field.required,
    } as TextareaFieldConfig;
  }
  if (t === "text" || t === "email" || t === "tel" || t === "password" || t === "number") {
    return {
      ...base,
      type: "input",
      inputType: t as "text" | "email" | "tel" | "password" | "number",
      placeholder: field.placeholder,
      required: field.required,
      min: field.min,
      max: field.max,
      step: field.step,
    } as InputFieldConfig;
  }
  if (t === "range") {
    return {
      ...base,
      type: "slider",
      min: field.min,
      max: field.max,
      step: field.step,
    } as SliderFieldConfig;
  }
  return null;
}
