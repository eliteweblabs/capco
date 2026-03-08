/**
 * User/Profile form configuration - reads from site-config JSON (userForm).
 * Mirrors ProjectForm pattern: fields driven by JSON config.
 *
 * Used by Form.astro type="user" and ProfileTabForm
 */

import { getSiteConfig } from "./content";
import type { FormElementConfig } from "./project-form-config";

// Re-export for consumers
export type { FormElementConfig } from "./project-form-config";
export { isUnifiedElementAllowed } from "./project-form-config";

// Default user form elements - fallback when userForm not in site-config
export const USER_FORM_ELEMENTS: FormElementConfig[] = [
  {
    id: "profile-avatar",
    name: "avatar",
    type: "field",
    elementType: "avatar",
    label: "Profile Picture",
    allow: ["Admin", "Staff", "Client"],
    columns: 1,
    updateOnly: true,
  },
  {
    id: "role-select",
    name: "role",
    type: "field",
    elementType: "select",
    label: "Role",
    options: [
      { value: "Client", label: "Client" },
      { value: "Staff", label: "Staff" },
      { value: "Admin", label: "Admin" },
    ],
    allow: ["Admin"],
    columns: 1,
  },
  {
    id: "companyName",
    name: "companyName",
    type: "field",
    elementType: "text",
    label: "Company Name",
    placeholder: "Enter company name",
    required: true,
    allow: ["Admin", "Staff", "Client"],
    columns: 1,
  },
  {
    id: "firstName",
    name: "firstName",
    type: "field",
    elementType: "text",
    label: "First Name",
    placeholder: "Enter first name",
    required: true,
    allow: ["Admin", "Staff", "Client"],
    columns: 2,
  },
  {
    id: "lastName",
    name: "lastName",
    type: "field",
    elementType: "text",
    label: "Last Name",
    placeholder: "Enter last name",
    required: true,
    allow: ["Admin", "Staff", "Client"],
    columns: 2,
  },
  {
    id: "title",
    name: "title",
    type: "field",
    elementType: "text",
    label: "Title",
    placeholder: "e.g. Project Manager, Engineer",
    allow: ["Admin", "Staff", "Client"],
    columns: 1,
  },
  {
    id: "email",
    name: "email",
    type: "field",
    elementType: "email",
    label: "Email Address",
    placeholder: "Enter email address",
    required: true,
    readOnly: true,
    allow: ["Admin", "Staff", "Client"],
    columns: 1,
  },
  {
    id: "password",
    name: "password",
    type: "field",
    elementType: "password",
    label: "Password",
    placeholder: "Optional - auto-generate if empty",
    allow: ["Admin"],
    columns: 1,
    createOnly: true,
  },
  {
    id: "phone",
    name: "phone",
    type: "field",
    elementType: "phone-sms",
    label: "Phone Number",
    placeholder: "Enter phone number",
    component: "PhoneAndSMS",
    componentProps: {
      showSMS: true,
    },
    allow: ["Admin", "Staff", "Client"],
    columns: 1,
  },
  {
    id: "bio",
    name: "bio",
    type: "field",
    elementType: "textarea",
    label: "Bio",
    placeholder: "Tell us about yourself",
    allow: ["Admin", "Staff", "Client"],
    columns: 1,
  },
  {
    id: "back-button",
    name: "back",
    type: "action",
    elementType: "button",
    label: "<span class='hidden sm:inline'> Back </span>",
    icon: "chevron-left",
    iconPosition: "left",
    variant: "outline",
    cssClass: "w-auto md:w-full md:flex-1",
    action: "back",
    allow: ["Admin", "Staff", "Client"],
    updateOnly: true,
  },
  {
    id: "save-profile-btn",
    name: "save",
    type: "action",
    elementType: "submit",
    label: "Save Changes",
    icon: "save",
    iconPosition: "left",
    variant: "secondary",
    cssClass: "flex-1 md:w-full md:flex-grow save-profile-btn",
    allow: ["Admin", "Staff", "Client"],
  },
];

export async function getFilteredUserFormElements(
  userRole?: string | null,
  isAdminEdit?: boolean,
  isCreateMode?: boolean,
  includeAllModes?: boolean
): Promise<FormElementConfig[]> {
  const config = await getSiteConfig();
  const uf = (config as any).userForm;
  const base = Array.isArray(uf) && uf.length > 0 ? uf : USER_FORM_ELEMENTS;

  return base.filter((element: FormElementConfig) => {
    const allowed = !element.allow || element.allow.includes(userRole || "");
    if (!allowed) return false;
    // Role select only shown when admin is editing or creating
    if (element.id === "role-select" && !isAdminEdit && !isCreateMode && !includeAllModes)
      return false;
    // When includeAllModes, include everything (no createOnly/updateOnly filtering)
    if (includeAllModes) return true;
    // createOnly: show only when isCreateMode
    if ((element as any).createOnly && !isCreateMode) return false;
    // updateOnly: hide when isCreateMode
    if ((element as any).updateOnly && isCreateMode) return false;
    return true;
  });
}
