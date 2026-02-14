/**
 * Project List Table Configuration
 * JSON-driven column config for the project dashboard table.
 * Loads from site-config-{company-slug}.json projectListColumns when present,
 * else falls back to TS modules (same pattern as asideNav).
 */

import { getSiteConfig } from "./content";
import { globalCompanyData } from "../pages/api/global/global-company-data";

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
  /** Roles that can see this column (Admin, Staff, Client). Omit = all roles */
  allow?: string[];
  /** Default width in px for resizable columns */
  width?: number;
  /** Icon name for header (SimpleIcon) */
  icon?: string;
  /** Tooltip text for header */
  tooltip?: string;
  /** For text: wrap in project link */
  linkToProject?: boolean;
}

function slugifyCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/** Check if a column should be visible for the given role */
export function isColumnAllowed(col: ProjectListColumnConfig, role?: string | null): boolean {
  if (!col.allow || col.allow.length === 0) return true;
  if (!role) return false;
  return col.allow.some((r) => r.toLowerCase() === role?.toLowerCase());
}

let configCache: ProjectListColumnConfig[] | null = null;
let configCompanySlug: string | null = null;

import * as defaultConfig from "./project-list-table-config-capco-design-group";
import * as rothcoBuiltConfig from "./project-list-table-config-rothco-built";

export async function getProjectListTableColumns(): Promise<ProjectListColumnConfig[]> {
  const siteConfig = await getSiteConfig();
  const jsonColumns = (siteConfig as any).projectListColumns;
  if (Array.isArray(jsonColumns) && jsonColumns.length > 0) {
    return jsonColumns as ProjectListColumnConfig[];
  }

  let companyName = "";
  try {
    const companyData = await globalCompanyData();
    companyName = companyData?.globalCompanyName || process.env.RAILWAY_PROJECT_NAME || "";
  } catch {
    companyName = process.env.RAILWAY_PROJECT_NAME || "";
  }
  const companySlug = slugifyCompanyName(companyName);

  if (configCache && configCompanySlug === companySlug) {
    return configCache;
  }

  let configModule = defaultConfig;

  switch (companySlug) {
    case "capco-design-group":
      configModule = defaultConfig;
      break;
    case "rothco-built":
      configModule = rothcoBuiltConfig;
      break;
    default:
      configModule = defaultConfig;
  }

  configCache = configModule.PROJECT_LIST_COLUMNS;
  configCompanySlug = companySlug;
  return configCache;
}

/** Get filtered columns for a role (sync, uses default config) */
export function getProjectListTableColumnsSync(role?: string | null): ProjectListColumnConfig[] {
  const cols = defaultConfig.PROJECT_LIST_COLUMNS;
  if (!role) return cols;
  return cols.filter((c) => isColumnAllowed(c, role));
}
