/**
 * Aside Navigation Configuration
 * JSON-driven sidebar nav from site-config-{company-slug}.json.
 * Same pattern as navigation.main/footer in content.ts.
 */

import { getSiteConfig } from "./content";
import { getSectionNavigation } from "./feature-navigation";
import type { NavigationItem } from "./feature-navigation";

/** Built-in aside item ID */
export type AsideNavBuiltinId =
  | "dashboard"
  | "settings"
  | "design"
  | "content"
  | "media"
  | "alerts"
  | "testimonials"
  | "global-functions"
  | "projects"
  | "feature-admin"
  | "notifications"
  | "feature-tools";

/** Custom link item in aside config */
export interface AsideNavLinkItem {
  label: string;
  href: string;
  icon?: string;
  roles?: string[];
}

/** Custom dropdown item in aside config */
export interface AsideNavDropdownItem {
  label: string;
  icon?: string;
  roles?: string[];
  children: Array<{ label: string; href: string }>;
}

/** Feature nav injection (uses getSectionNavigation) */
export interface AsideNavFeatureItem {
  insertFeatureNav: "admin" | "tools";
  sectionLabel?: string;
}

/** Config item: built-in ID, custom link, custom dropdown, or feature injection */
export type AsideNavItemConfig =
  | AsideNavBuiltinId
  | AsideNavLinkItem
  | AsideNavDropdownItem
  | AsideNavFeatureItem;

/** Default aside order when not in site-config */
const DEFAULT_ASIDE_NAV: AsideNavItemConfig[] = [
  "dashboard",
  "settings",
  "design",
  "content",
  "media",
  "alerts",
  "testimonials",
  "global-functions",
  "projects",
  "feature-admin",
  "notifications",
  "feature-tools",
];

/** Resolved item for rendering: either a built-in block or a simple/dropdown link */
export type AsideNavResolvedItem =
  | { type: "link"; label: string; href: string; icon?: string; roles?: string[] }
  | {
      type: "dropdown";
      label: string;
      icon?: string;
      roles?: string[];
      children: Array<{ label: string; href: string }>;
    }
  | { type: "feature-admin"; items: NavigationItem[] }
  | {
      type: "feature-tools";
      sectionLabel?: string;
      items: NavigationItem[];
    }
  | { type: "section-header"; label: string };

/** Get aside nav config from site-config (company-specific) */
export async function getAsideNavConfig(): Promise<AsideNavItemConfig[]> {
  const config = await getSiteConfig();
  const asideNav = (config.navigation as any)?.aside ?? (config as any).asideNav;
  if (Array.isArray(asideNav) && asideNav.length > 0) {
    return asideNav;
  }
  return DEFAULT_ASIDE_NAV;
}

/** Check if user role is allowed for an item */
function isRoleAllowed(roles: string[] | undefined, userRole?: string): boolean {
  if (!roles || roles.length === 0) return true;
  if (!userRole) return false;
  return roles.some((r) => r.toLowerCase() === userRole.toLowerCase());
}

/** Resolve a single config item to renderable shape */
async function resolveItem(
  item: AsideNavItemConfig,
  currentRole?: string
): Promise<AsideNavResolvedItem | null> {
  if (typeof item === "string") {
    return resolveBuiltin(item, currentRole);
  }
  if ("insertFeatureNav" in item) {
    return resolveFeatureNav(item, currentRole);
  }
  if ("children" in item) {
    if (!isRoleAllowed(item.roles, currentRole)) return null;
    return {
      type: "dropdown",
      label: item.label,
      icon: item.icon,
      roles: item.roles,
      children: item.children,
    };
  }
  if ("href" in item) {
    if (!isRoleAllowed(item.roles, currentRole)) return null;
    return {
      type: "link",
      label: item.label,
      href: item.href,
      icon: item.icon,
      roles: item.roles,
    };
  }
  return null;
}

/** Resolve built-in ID to renderable item (structure only; Aside.astro knows the hrefs/icons) */
async function resolveBuiltin(
  id: AsideNavBuiltinId,
  currentRole?: string
): Promise<AsideNavResolvedItem | null> {
  const adminOnly = [
    "settings",
    "design",
    "content",
    "media",
    "alerts",
    "testimonials",
    "global-functions",
    "feature-admin",
    "notifications",
    "feature-tools",
  ];
  const needsAdmin = adminOnly.includes(id);
  if (needsAdmin && currentRole !== "Admin") return null;

  switch (id) {
    case "dashboard":
      return { type: "link", label: "Dashboard", href: "/dashboard", icon: "dashboard" };
    case "settings":
      return { type: "link", label: "Settings", href: "/admin/settings", icon: "settings" };
    case "design":
      return {
        type: "dropdown",
        label: "Design",
        icon: "palette",
        roles: ["Admin"],
        children: [
          { label: "Components", href: "/admin/design" },
          { label: "Placeholders", href: "/admin/design/placeholders" },
        ],
      };
    case "content":
      return { type: "link", label: "Content", href: "/admin/cms", icon: "dashboard" };
    case "media":
      return { type: "link", label: "Media", href: "/admin/media", icon: "image" };
    case "alerts":
      return { type: "link", label: "Alerts", href: "/admin/banner-alerts", icon: "alert" };
    case "testimonials":
      return { type: "link", label: "Testimonials", href: "/admin/testimonials", icon: "quote" };
    case "global-functions":
      return {
        type: "link",
        label: "Global Functions",
        href: "/admin/global-functions",
        icon: "code",
      };
    case "projects":
      return {
        type: "dropdown",
        label: "Projects",
        icon: "folder",
        children: [
          { label: "Dashboard", href: "/project/dashboard/" },
          { label: "New", href: "/project/new" },
          ...(currentRole === "Admin"
            ? [
                { label: "Proposals", href: "/project/proposals" },
                { label: "Settings", href: "/project/settings" },
              ]
            : []),
        ],
      };
    case "notifications":
      return {
        type: "link",
        label: "Send Notifications",
        href: "/admin/notifications",
        icon: "zap",
        roles: ["Admin"],
      };
    case "feature-admin": {
      const items = await getSectionNavigation("admin", currentRole);
      return { type: "feature-admin", items };
    }
    case "feature-tools": {
      const items = await getSectionNavigation("tools", currentRole);
      return { type: "feature-tools", sectionLabel: "Tools", items };
    }
    default:
      return null;
  }
}

async function resolveFeatureNav(
  item: AsideNavFeatureItem,
  currentRole?: string
): Promise<AsideNavResolvedItem | null> {
  const section = item.insertFeatureNav;
  const items = await getSectionNavigation(section, currentRole);
  if (section === "tools") {
    return { type: "feature-tools", sectionLabel: item.sectionLabel ?? "Tools", items };
  }
  return { type: "feature-admin", items };
}

/** Get resolved aside nav items for rendering (filters by role, injects feature nav) */
export async function getResolvedAsideNav(currentRole?: string): Promise<AsideNavResolvedItem[]> {
  const config = await getAsideNavConfig();
  const resolved: AsideNavResolvedItem[] = [];
  for (const item of config) {
    const r = await resolveItem(item, currentRole);
    if (r) resolved.push(r);
  }
  return resolved;
}
