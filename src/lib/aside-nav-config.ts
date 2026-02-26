/**
 * Aside Navigation Configuration
 * JSON-driven sidebar nav from site-config-{company-slug}.json.
 * projectListColumns-style format with parent/child support.
 */

import { getSiteConfig } from "./content";

/** Aside nav item - projectListColumns style with parent/child. Type is optional: inferred from children (dropdown) or href (link). Order = array index. */
export interface AsideNavItem {
  id: string;
  label: string;
  type?: "link" | "dropdown" | "section";
  href?: string;
  icon?: string;
  allow?: string[];
  tooltip?: string;
  children?: AsideNavChild[];
}

/** Child item - link or nested dropdown */
export interface AsideNavChild {
  id?: string;
  label: string;
  href?: string;
  icon?: string;
  allow?: string[];
  children?: AsideNavChild[];
}

/** Resolved item for rendering */
export type AsideNavResolvedItem =
  | { type: "link"; label: string; href: string; icon?: string }
  | {
      type: "dropdown";
      label: string;
      icon?: string;
      children: Array<{ label: string; href: string }>;
    };

/** Check if user role is allowed */
function isRoleAllowed(allow: string[] | undefined, userRole?: string): boolean {
  if (!allow || allow.length === 0) return true;
  if (!userRole) return false;
  return allow.some((r) => r.toLowerCase() === userRole.toLowerCase());
}

/** Resolve children, filtering by role and flattening nested dropdowns */
function resolveChildren(
  children: AsideNavChild[] | undefined,
  userRole?: string
): Array<{ label: string; href: string }> {
  if (!children || children.length === 0) return [];
  const out: Array<{ label: string; href: string }> = [];
  for (const c of children) {
    if (!isRoleAllowed(c.allow, userRole)) continue;
    if (c.children?.length) {
      for (const sub of resolveChildren(c.children, userRole)) {
        out.push(sub);
      }
    } else if (c.href) {
      out.push({ label: c.label, href: c.href });
    }
  }
  return out;
}

/** Infer type from structure when not set: has children → dropdown, else href → link */
function getItemKind(item: AsideNavItem): "link" | "dropdown" | "section" | null {
  if (item.type) return item.type;
  if (item.children?.length) return "dropdown";
  if (item.href) return "link";
  return null;
}

/** Resolve a single config item */
function resolveItem(item: AsideNavItem, userRole?: string): AsideNavResolvedItem | null {
  if (!isRoleAllowed(item.allow, userRole)) return null;

  const kind = getItemKind(item);

  if (kind === "link" && item.href) {
    return {
      type: "link",
      label: item.label,
      href: item.href,
      icon: item.icon,
    };
  }

  if (kind === "dropdown" || kind === "section") {
    const children = resolveChildren(item.children, userRole);
    if (children.length === 0) return null;
    return {
      type: "dropdown",
      label: item.label,
      icon: item.icon,
      children,
    };
  }

  return null;
}

/** Legacy string IDs → convert to new format (uses feature-navigation for feature-admin/feature-tools) */
const LEGACY_BUILTIN: Record<string, Omit<AsideNavItem, "id">> = {
  dashboard: {
    label: "Dashboard",
    type: "link",
    href: "/dashboard",
    icon: "dashboard",
  },
  settings: {
    label: "Settings",
    type: "link",
    href: "/admin/settings",
    icon: "settings",
    allow: ["Admin"],
  },
  design: {
    label: "Design",
    type: "dropdown",
    icon: "palette",
    allow: ["Admin"],
    children: [
      { label: "Style reference", href: "/admin/components" },
      { label: "Components", href: "/admin/design" },
      { label: "Placeholders", href: "/admin/design/placeholders" },
    ],
  },
  content: {
    label: "Content",
    type: "link",
    href: "/admin/cms",
    icon: "dashboard",
    allow: ["Admin"],
  },
  media: {
    label: "Media",
    type: "link",
    href: "/admin/media",
    icon: "image",
    allow: ["Admin"],
  },
  alerts: {
    label: "Alerts",
    type: "link",
    href: "/admin/banner-alerts",
    icon: "alert",
    allow: ["Admin"],
  },
  testimonials: {
    label: "Testimonials",
    type: "link",
    href: "/admin/testimonials",
    icon: "quote",
    allow: ["Admin"],
  },
  "contact-form-leads": {
    label: "Contact Form Leads",
    type: "link",
    href: "/admin/contact-form-leads",
    icon: "envelope",
    allow: ["Admin"],
  },
  "global-functions": {
    label: "Global Functions",
    type: "link",
    href: "/admin/global-functions",
    icon: "code",
    allow: ["Admin"],
  },
  projects: {
    label: "Projects",
    type: "dropdown",
    icon: "folder",
    children: [
      { label: "Dashboard", href: "/project/dashboard/" },
      { label: "New", href: "/project/new" },
      { label: "Proposals", href: "/project/proposals", allow: ["Admin"] },
      { label: "Settings", href: "/project/settings", allow: ["Admin"] },
    ],
  },
  "team-locations": {
    label: "Team Locations",
    type: "link",
    href: "/admin/team-locations",
    icon: "map-pin",
    allow: ["Admin"],
  },
  "time-entries": {
    label: "Time Entries",
    type: "link",
    href: "/admin/time-entries",
    icon: "clock",
    allow: ["Admin", "Staff"],
  },
  notifications: {
    label: "Send Notifications",
    type: "link",
    href: "/admin/notifications",
    icon: "zap",
    allow: ["Admin"],
  },
};

/** Get aside nav from site-config (new object format or legacy string array) */
async function getAsideNavItems(userRole?: string): Promise<AsideNavItem[]> {
  const config = await getSiteConfig();
  const asideNav = (config.navigation as any)?.aside ?? (config as any).asideNav;
  if (Array.isArray(asideNav) && asideNav.length > 0) {
    const first = asideNav[0];
    if (typeof first === "object" && first !== null && "id" in first) {
      return asideNav.filter((x: any) => typeof x === "object" && x !== null && x?.id);
    }
    if (typeof first === "string") {
      const items: AsideNavItem[] = [];
      for (const id of asideNav) {
        if (id === "feature-admin" || id === "feature-tools") {
          const { getSectionNavigation } = await import("./feature-navigation");
          const section = id === "feature-admin" ? "admin" : "tools";
          const navItems = await getSectionNavigation(section, userRole);
          const children = navItems.map((n) => ({
            label: n.label,
            href: n.href,
            icon: n.icon,
            allow: n.roles,
          }));
          if (children.length > 0) {
            items.push({
              id: `feature-${section}`,
              label: section === "tools" ? "Tools" : "Admin",
              type: "dropdown",
              icon: section === "admin" ? "settings" : "wrench",
              allow: ["Admin"],
              children,
            });
          }
        } else if (LEGACY_BUILTIN[id]) {
          items.push({ id, ...LEGACY_BUILTIN[id] } as AsideNavItem);
        }
      }
      return items;
    }
  }
  return [];
}

/** Get resolved aside nav items for rendering */
export async function getResolvedAsideNav(currentRole?: string): Promise<AsideNavResolvedItem[]> {
  const items = await getAsideNavItems(currentRole);
  const resolved: AsideNavResolvedItem[] = [];
  for (const item of items) {
    const r = resolveItem(item, currentRole);
    if (r) resolved.push(r);
  }
  return resolved;
}
