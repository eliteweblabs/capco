/**
 * Aside Navigation Configuration
 * JSON-driven sidebar nav from config (navigation.aside / asideNav in config.json).
 * Branch on children: has children → dropdown, else → link.
 */

import { getSiteConfig } from "./content";

export interface AsideNavItem {
  id?: string;
  label: string;
  href?: string;
  icon?: string;
  allow?: string[];
  children?: AsideNavChild[];
}

export interface AsideNavChild {
  label: string;
  href?: string;
  allow?: string[];
}

/** Item ready for rendering (role-filtered) */
export type AsideNavRenderItem = {
  label: string;
  href?: string;
  icon?: string;
  children?: Array<{ label: string; href: string }>;
};

function isRoleAllowed(allow: string[] | undefined, userRole?: string): boolean {
  if (!allow || allow.length === 0) return true;
  if (!userRole) return false;
  return allow.some((r) => r.toLowerCase() === userRole.toLowerCase());
}

function filterChildren(
  children: AsideNavChild[] | undefined,
  userRole?: string
): Array<{ label: string; href: string }> {
  if (!children || children.length === 0) return [];
  const out: Array<{ label: string; href: string }> = [];
  for (const c of children) {
    if (!isRoleAllowed(c.allow, userRole)) continue;
    if (c.href) out.push({ label: c.label, href: c.href });
  }
  return out;
}

/**
 * Get aside nav from config (config.json / SITE_CONFIG). Object-array format only.
 * Filters by role (allow). Returns items for rendering: branch on children in the template.
 */
export async function getAsideNav(userRole?: string): Promise<AsideNavRenderItem[]> {
  const config = await getSiteConfig();
  const asideNav = (config.navigation as any)?.aside ?? (config as any).asideNav;
  if (!Array.isArray(asideNav) || asideNav.length === 0) return [];

  const first = asideNav[0];
  if (typeof first !== "object" || first === null || !("label" in first)) return [];

  const result: AsideNavRenderItem[] = [];
  for (const item of asideNav) {
    if (typeof item !== "object" || item === null) continue;
    if (!isRoleAllowed(item.allow, userRole)) continue;

    const filteredChildren = filterChildren(item.children, userRole);
    if (filteredChildren.length > 0) {
      result.push({
        label: item.label,
        icon: item.icon,
        children: filteredChildren,
      });
    } else if (item.href) {
      result.push({
        label: item.label,
        href: item.href,
        icon: item.icon,
      });
    }
  }
  return result;
}

/** Design index page links: same source as aside nav (config asideNav design.children). */
export async function getDesignPageLinks(userRole?: string): Promise<Array<{ label: string; href: string }>> {
  const config = await getSiteConfig();
  const asideNav = (config.navigation as any)?.aside ?? (config as any).asideNav;
  if (!Array.isArray(asideNav)) return [];

  const designItem = asideNav.find(
    (item: any) => item && typeof item === "object" && (item.id === "design" || item.label === "Design")
  );
  const children = designItem?.children;
  if (!Array.isArray(children) || children.length === 0) return [];

  return filterChildren(children, userRole);
}
