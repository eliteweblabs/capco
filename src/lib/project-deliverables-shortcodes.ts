/**
 * Flat string map for filling PDF AcroForm fields + showing shortcodes in the Deliverables UI.
 * Field names in the PDF should match a shortcode slug (recommended: lowercase_snake_case
 * aligned with dotted paths below, e.g. project.address → project_address or {{project.address}}).
 */

/** Human-facing reference rows for the Deliverables tab. */
export interface DeliverableShortcodeRow {
  shortcode: string;
  pdfFieldHint: string;
  description: string;
}

export const DELIVERABLE_SHORTCODE_ROWS: DeliverableShortcodeRow[] = [
  { shortcode: "{{project.id}}", pdfFieldHint: "project_id", description: "Numeric project ID" },
  { shortcode: "{{project.title}}", pdfFieldHint: "project_title", description: "Project title" },
  {
    shortcode: "{{project.address}}",
    pdfFieldHint: "project_address",
    description: "Site address",
  },
  {
    shortcode: "{{project.status}}",
    pdfFieldHint: "project_status",
    description: "Status code (integer)",
  },
  { shortcode: "{{project.sqFt}}", pdfFieldHint: "project_sqft", description: "Square footage" },
  {
    shortcode: "{{project.newConstruction}}",
    pdfFieldHint: "project_new_construction",
    description: '"Yes" / "No" for new vs existing construction',
  },
  {
    shortcode: "{{project.description}}",
    pdfFieldHint: "project_description",
    description: "Project description",
  },
  {
    shortcode: "{{project.architect}}",
    pdfFieldHint: "project_architect",
    description: "Architect field",
  },
  {
    shortcode: "{{project.subject}}",
    pdfFieldHint: "project_subject",
    description: "Custom subject line",
  },
  {
    shortcode: "{{project.dueDate}}",
    pdfFieldHint: "project_due_date",
    description: "Due date (locale-formatted)",
  },
  {
    shortcode: "{{project.createdAt}}",
    pdfFieldHint: "project_created_at",
    description: "Created timestamp (locale date)",
  },
  {
    shortcode: "{{project.updatedAt}}",
    pdfFieldHint: "project_updated_at",
    description: "Last updated (locale date)",
  },
  {
    shortcode: "{{project.nfpaVersion}}",
    pdfFieldHint: "project_nfpa_version",
    description: "NFPA version string",
  },
  {
    shortcode: "{{client.name}}",
    pdfFieldHint: "client_name",
    description: "Client contact name (author profile)",
  },
  {
    shortcode: "{{client.companyName}}",
    pdfFieldHint: "client_company",
    description: "Client company / organization name",
  },
  {
    shortcode: "{{client.email}}",
    pdfFieldHint: "client_email",
    description: "Client email",
  },
  {
    shortcode: "{{client.phone}}",
    pdfFieldHint: "client_phone",
    description: "Client phone",
  },
  {
    shortcode: "{{installer.companyName}}",
    pdfFieldHint: "installer_company",
    description: "This site operator (company name from settings)",
  },
  {
    shortcode: "{{installer.phone}}",
    pdfFieldHint: "installer_phone",
    description: "Company phone",
  },
  {
    shortcode: "{{installer.email}}",
    pdfFieldHint: "installer_email",
    description: "Company email",
  },
  {
    shortcode: "{{installer.website}}",
    pdfFieldHint: "installer_website",
    description: "Company website URL",
  },
  {
    shortcode: "{{installer.address}}",
    pdfFieldHint: "installer_address",
    description: "Company mailing address",
  },
  {
    shortcode: "{{today}}",
    pdfFieldHint: "today",
    description: "Current date when the PDF is generated (locale)",
  },
  {
    shortcode: "{{projectUrl}}",
    pdfFieldHint: "project_url",
    description: "Link to open this project in the app",
  },
];

export interface DeliverableShortcodeExtras {
  installerCompanyName: string;
  installerPhone?: string;
  installerEmail?: string;
  installerWebsite?: string;
  installerAddress?: string;
  /** Public origin including scheme, no trailing slash, e.g. https://capco.up.railway.app */
  appOrigin?: string;
}

/** Normalize shortcode slug / PDF field names for tolerant matching. */
export function normalizeShortcodeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^\{\{/, "")
    .replace(/\}\}$/, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "_");
}

function formatBool(v: unknown): string {
  if (typeof v !== "boolean") return String(v ?? "");
  return v ? "Yes" : "No";
}

function formatDate(v: unknown): string {
  if (v == null || v === "") return "";
  try {
    const d = new Date(typeof v === "string" || typeof v === "number" ? v : String(v));
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString();
  } catch {
    return String(v);
  }
}

function defaultDeployOrigin(): string {
  const rail = typeof process !== "undefined" ? process.env?.RAILWAY_PUBLIC_DOMAIN?.trim() : "";
  if (!rail) return "";
  const noTrail = rail.replace(/\/+$/, "");
  return noTrail.startsWith("http") ? noTrail : `https://${noTrail.replace(/^https?:\/\//, "")}`;
}

/**
 * Builds a lookup map keyed by normalized slugs. PDF AcroForm field names should normalize
 * to the same slug (hyphens handled like underscores).
 */
export function buildDeliverableShortcodeValues(
  project: Record<string, unknown>,
  extras: DeliverableShortcodeExtras
): Record<string, string> {
  const author = (project.authorProfile || project.author) as Record<string, unknown> | null;
  const appOrigin = extras.appOrigin || defaultDeployOrigin();

  const projectUrl =
    project.id != null && appOrigin ? `${appOrigin.replace(/\/+$/, "")}/project/${project.id}` : "";

  const labeled: Record<string, string> = {
    "{{project.id}}": String(project.id ?? ""),
    "{{project.title}}": String(project.title ?? ""),
    "{{project.address}}": String(project.address ?? ""),
    "{{project.status}}": String(project.status ?? ""),
    "{{project.sqFt}}": project.sqFt != null ? String(project.sqFt) : "",
    "{{project.newConstruction}}": formatBool(project.newConstruction),
    "{{project.description}}": String(project.description ?? ""),
    "{{project.architect}}": String(project.architect ?? ""),
    "{{project.subject}}": String(project.subject ?? ""),
    "{{project.dueDate}}": formatDate(project.dueDate),
    "{{project.createdAt}}": formatDate(project.createdAt),
    "{{project.updatedAt}}": formatDate(project.updatedAt),
    "{{project.nfpaVersion}}": String(project.nfpaVersion ?? ""),

    "{{client.name}}": String((author?.name as string | undefined) ?? ""),
    "{{client.companyName}}": String((author?.companyName as string | undefined) ?? ""),
    "{{client.email}}": String((author?.email as string | undefined) ?? ""),
    "{{client.phone}}": String((author?.phone as string | undefined) ?? ""),

    "{{installer.companyName}}": extras.installerCompanyName ?? "",
    "{{installer.phone}}": String(extras.installerPhone ?? ""),
    "{{installer.email}}": String(extras.installerEmail ?? ""),
    "{{installer.website}}": String(extras.installerWebsite ?? ""),
    "{{installer.address}}": String(extras.installerAddress ?? ""),
    "{{today}}": new Date().toLocaleDateString(),
    "{{projectUrl}}": projectUrl,

    project_id: String(project.id ?? ""),
    project_title: String(project.title ?? ""),
    project_address: String(project.address ?? ""),
    project_status: String(project.status ?? ""),
    project_sqft: project.sqFt != null ? String(project.sqFt) : "",
    project_sqFt: project.sqFt != null ? String(project.sqFt) : "",
    project_new_construction: formatBool(project.newConstruction),
    project_description: String(project.description ?? ""),
    project_architect: String(project.architect ?? ""),
    project_subject: String(project.subject ?? ""),
    project_due_date: formatDate(project.dueDate),
    project_created_at: formatDate(project.createdAt),
    project_updated_at: formatDate(project.updatedAt),
    project_nfpa_version: String(project.nfpaVersion ?? ""),
    client_name: String((author?.name as string | undefined) ?? ""),
    client_company: String((author?.companyName as string | undefined) ?? ""),
    client_email: String((author?.email as string | undefined) ?? ""),
    client_phone: String((author?.phone as string | undefined) ?? ""),
    installer_company: extras.installerCompanyName ?? "",
    installer_phone: String(extras.installerPhone ?? ""),
    installer_email: String(extras.installerEmail ?? ""),
    installer_website: String(extras.installerWebsite ?? ""),
    installer_address: String(extras.installerAddress ?? ""),
    today: new Date().toLocaleDateString(),
    project_url: projectUrl,

    ...(typeof project.units === "number" || typeof project.units === "string"
      ? { "{{project.units}}": String(project.units), project_units: String(project.units) }
      : {}),
    ...(typeof project.punchlistComplete === "number" ||
    typeof project.punchlistComplete === "string"
      ? {
          "{{project.punchlistComplete}}": String(project.punchlistComplete),
          project_punchlist_complete: String(project.punchlistComplete),
        }
      : {}),
    ...(typeof project.punchlistCount === "number" || typeof project.punchlistCount === "string"
      ? {
          "{{project.punchlistCount}}": String(project.punchlistCount),
          project_punchlist_count: String(project.punchlistCount),
        }
      : {}),
  };

  const out: Record<string, string> = {};
  for (const [rawKey, rawVal] of Object.entries(labeled)) {
    out[normalizeShortcodeKey(rawKey)] = rawVal ?? "";
    out[normalizeShortcodeKey(rawKey.replace(/\./g, "_"))] = rawVal ?? "";
    out[normalizeShortcodeKey(rawKey.replace(/-/g, "_"))] = rawVal ?? "";
  }

  const rawCamel = ["authorId", "assignedToId", "building", "project", "service", "tier"] as const;
  for (const key of rawCamel) {
    if (project[key] != null && typeof project[key] === "object") {
      const json = JSON.stringify(project[key]);
      const slug = normalizeShortcodeKey(`project.${key}`);
      const slugBrace = normalizeShortcodeKey(`{{project.${key}}}`);
      out[slug] = json;
      out[slugBrace] = json;
    }
  }

  return out;
}
