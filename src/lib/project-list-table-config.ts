/**
 * Project List Table Configuration
 * Generic, JSON-driven column config for the project dashboard table.
 * All client-specific columns come from config (config-${globalCompanyName}.json, config-${RAILWAY_PROJECT_NAME}.json, or config.json)
 * under projectListColumns. No company-specific code; fallback default when config has no columns.
 */

import { getSiteConfig } from "./content";

export interface ProjectListColumnConfig {
  id: string;
  label: string;
  type:
    | "delete"
    | "edit"
    | "text"
    | "company"
    | "status"
    | "featured"
    | "files"
    | "assigned"
    | "progress"
    | "checklist"
    | "elapsed"
    | "timeSince"
    | "dueDate";
  /** Project field for text/value types (e.g. "address", "createdAt") */
  field?: string;
  /** Display options for type "files" column. Replaces flat field: "projectFiles" */
  displayProjectFiles?: {
    /** Project property holding file list. Default "projectFiles" */
    field?: string;
    /** Icon size: sm, md, lg. Default "sm" */
    size?: "sm" | "md" | "lg";
    /** Show tooltips on file icons. Default true */
    tooltips?: boolean;
    /** Text when no files. Default "No files" */
    emptyText?: string;
  };
  /** Roles that can see this column (Admin, Staff, Client). Omit = all roles */
  allow?: string[];
  /** Legacy weight hint; layout is fluid (compact icon cols vs flexible text cols), not %-driven */
  width?: number;
  /** Icon name for header (SimpleIcon) */
  icon?: string;
  /** Tooltip text for header */
  tooltip?: string;
  /** For text: wrap in project link */
  linkToProject?: boolean;
  /** Whether this column is sortable. Defaults true except for action cols (delete/edit). */
  sortable?: boolean;
  /** How to compare values when sorting. Auto-inferred from `type` when omitted. */
  sortType?: "text" | "number" | "date" | "boolean";
}

/** Column types that should never be sortable (action cols with no comparable value). */
const NON_SORTABLE_TYPES: ProjectListColumnConfig["type"][] = ["delete", "edit"];

/** Resolve the sort comparator type for a column (explicit override > inferred from type). */
export function getProjectListColumnSortType(
  col: ProjectListColumnConfig
): "text" | "number" | "date" | "boolean" {
  if (col.sortType) return col.sortType;
  switch (col.type) {
    case "status":
      // Sort by displayed status name (text); progress sorts numerically below.
      return "text";
    case "progress":
    case "files":
    case "checklist":
      return "number";
    case "featured":
      return "boolean";
    case "elapsed":
    case "timeSince":
    case "dueDate":
      return "date";
    default:
      return "text";
  }
}

/** Whether a column should render as a sortable header. Action cols default off. */
export function isSortableProjectListColumn(col: ProjectListColumnConfig): boolean {
  if (col.sortable === false) return false;
  if (col.sortable === true) return true;
  return !NON_SORTABLE_TYPES.includes(col.type);
}

/** Check if a column should be visible for the given role */
export function isColumnAllowed(col: ProjectListColumnConfig, role?: string | null): boolean {
  if (!col.allow || col.allow.length === 0) return true;
  if (!role) return false;
  return col.allow.some((r) => r.toLowerCase() === role?.toLowerCase());
}

/** Narrow icon/control columns vs flexible text-heavy columns (table-auto layout). */
export function isCompactProjectListColumn(col: ProjectListColumnConfig): boolean {
  if (col.width === 0) return true;
  const compact: ProjectListColumnConfig["type"][] = [
    "delete",
    "edit",
    "featured",
    "assigned",
    "progress",
    "checklist",
    "elapsed",
    "timeSince",
  ];
  return compact.includes(col.type);
}

/** Fallback when config has no projectListColumns (e.g. missing config file). `width` is legacy/unused by layout. */
const DEFAULT_PROJECT_LIST_COLUMNS: ProjectListColumnConfig[] = [
  {
    id: "delete",
    label: "",
    type: "delete",
    allow: ["Admin", "Staff", "superAdmin"],
    width: 3,
    icon: "trash",
    tooltip: "Delete",
  },
  { id: "edit", label: "", type: "edit", width: 3, icon: "edit" },
  {
    id: "address",
    label: "Address",
    type: "text",
    field: "address",
    linkToProject: true,
    width: 16,
  },
  {
    id: "company",
    label: "Company",
    type: "company",
    field: "authorProfile.companyName",
    allow: ["Admin", "Staff", "superAdmin"],
    width: 9,
  },
  { id: "status", label: "Status", type: "status", field: "status", width: 7 },
  {
    id: "featured",
    label: "",
    type: "featured",
    allow: ["Admin", "Staff", "superAdmin"],
    width: 5,
    icon: "star",
    tooltip: "Featured",
  },
  {
    id: "files",
    label: "Files",
    type: "files",
    displayProjectFiles: {
      field: "projectFiles",
      size: "sm",
      tooltips: true,
      emptyText: "No files",
    },
    width: 14,
  },
  {
    id: "assigned",
    label: "",
    type: "assigned",
    field: "assignedToId",
    allow: ["Admin", "Staff", "superAdmin"],
    width: 7,
    icon: "user",
    tooltip: "Assigned To",
  },
  {
    id: "progress",
    label: "",
    type: "progress",
    field: "status",
    width: 7,
    icon: "percent",
    tooltip: "Progress Thru Statuses",
  },
  {
    id: "checklist",
    label: "",
    type: "checklist",
    width: 5,
    icon: "checklist",
    tooltip: "Checklist",
  },
  {
    id: "elapsed",
    label: "",
    type: "elapsed",
    field: "createdAt",
    width: 5,
    icon: "calendar",
    tooltip: "Elapsed Time",
  },
  {
    id: "timeSince",
    label: "",
    type: "timeSince",
    field: "updatedAt",
    width: 7,
    icon: "stopwatch",
    tooltip: "Time since last status change",
  },
  { id: "dueDate", label: "Due Date", type: "dueDate", field: "dueDate", width: 11 },
];

/**
 * Get project list table columns from site config (config-${globalCompanyName}.json, config-${RAILWAY_PROJECT_NAME}.json, or config.json).
 * Client-specific layout is entirely in config under projectListColumns.
 */
export async function getProjectListTableColumns(): Promise<ProjectListColumnConfig[]> {
  const siteConfig = await getSiteConfig();
  const jsonColumns = (siteConfig as any).projectListColumns;
  if (Array.isArray(jsonColumns) && jsonColumns.length > 0) {
    return jsonColumns as ProjectListColumnConfig[];
  }
  return DEFAULT_PROJECT_LIST_COLUMNS;
}

/**
 * Sync version: returns default columns filtered by role. Use getProjectListTableColumns() when
 * config-driven columns are needed (e.g. in async page/components).
 */
export function getProjectListTableColumnsSync(role?: string | null): ProjectListColumnConfig[] {
  const cols = DEFAULT_PROJECT_LIST_COLUMNS;
  if (!role) return cols;
  return cols.filter((c) => isColumnAllowed(c, role));
}
