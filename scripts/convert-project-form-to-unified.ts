/**
 * Converts projectForm from array (FormElementConfig[]) to MultiStepFormConfig structure.
 * Run: npx tsx scripts/convert-project-form-to-unified.ts
 * Output: overwrites projectForm in public/data/config.json
 */

import * as fs from "fs";
import * as path from "path";

const CONFIG_PATH = path.join(process.cwd(), "public/data/config.json");

interface FormElementConfig {
  id: string;
  name: string;
  type: string;
  elementType?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  component?: string;
  componentProps?: Record<string, unknown>;
  dataField?: string;
  dataScrap?: boolean;
  allow?: string[];
  hideAtStatus?: number[];
  readOnlyAtStatus?: number[];
  columns?: number;
  min?: number;
  max?: number;
  step?: number;
  value?: number | string;
  options?: Array<{ value: string; label: string; selected?: boolean }>;
  groupType?: string;
  cssClass?: string;
  icon?: string;
  iconPosition?: string;
  variant?: string;
  action?: string;
  [key: string]: unknown;
}

/** Map FormElementConfig (field or button-group) to FormFieldConfig (MultiStepForm style) */
function elementToField(el: FormElementConfig): Record<string, unknown> | null {
  if (el.type === "action") return null;

  const base: Record<string, unknown> = {
    id: el.id,
    name: el.name,
    label: el.label,
    placeholder: el.placeholder,
    required: el.required,
    columns: el.columns ?? 1,
    allow: el.allow,
    hideAtStatus: el.hideAtStatus,
    readOnlyAtStatus: el.readOnlyAtStatus,
    dataField: el.dataField,
    dataScrap: el.dataScrap,
  };

  if (el.type === "field") {
    const et = el.elementType || "text";
    if (et === "text" || et === "number") {
      return {
        ...base,
        type: et,
        min: el.min,
        max: el.max,
        step: el.step,
      };
    }
    if (et === "textarea") {
      return { ...base, type: "textarea" };
    }
    if (et === "checkbox") {
      return { ...base, type: "component", component: "SlideToggle", componentProps: { ...el.componentProps } };
    }
    if (et === "component" && el.component === "UnitSlider") {
      return {
        ...base,
        type: "component",
        component: "UnitSlider",
        min: el.min,
        max: el.max,
        step: el.step,
        value: el.value,
        componentProps: el.componentProps,
      };
    }
    if (et === "component" && el.id === "address-input") {
      return {
        ...base,
        type: "component",
        component: "GoogleAddressAutocomplete",
        componentProps: el.componentProps,
      };
    }
    if (et === "component" && el.component) {
      return {
        ...base,
        type: "component",
        component: el.component,
        componentProps: el.componentProps,
      };
    }
    return { ...base, type: "text" };
  }

  if (el.type === "button-group") {
    return {
      ...base,
      type: "button-group",
      options: el.options,
      toggleType: el.groupType === "multi-select" ? "multi-select" : "radio",
      classes: el.cssClass,
    };
  }

  return null;
}

/** Map FormElementConfig (action) to FormButtonConfig */
function elementToButton(el: FormElementConfig): Record<string, unknown> | null {
  if (el.type !== "action") return null;
  const isSubmit = el.elementType === "submit";
  return {
    type: isSubmit ? "submit" : "action",
    id: el.id,
    label: el.label,
    icon: el.icon,
    iconPosition: el.iconPosition || "left",
    variant: el.variant || "secondary",
    classes: el.cssClass,
    action: el.action,
    allow: el.allow,
    hideAtStatus: el.hideAtStatus,
  };
}

function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  const arr = config.projectForm;
  if (!Array.isArray(arr)) {
    console.log("projectForm is already an object (unified format), skipping.");
    process.exit(0);
  }

  const fields: Record<string, unknown>[] = [];
  const buttons: Record<string, unknown>[] = [];

  for (const el of arr) {
    if (el.type === "action") {
      const btn = elementToButton(el);
      if (btn) buttons.push(btn);
    } else {
      const f = elementToField(el);
      if (f) fields.push(f);
    }
  }

  const unified = {
    formId: "project-form",
    formAction: "/api/projects/upsert",
    formMethod: "post",
    layout: "standard",
    totalSteps: 1,
    progressBar: false,
    steps: [
      {
        title: "Project Details",
        fields,
        buttons,
      },
    ],
  };

  config.projectForm = unified;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
  console.log(`Converted ${fields.length} fields and ${buttons.length} buttons to unified projectForm structure.`);
}

main();
