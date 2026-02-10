/**
 * Feature Navigation Helper
 *
 * Generates navigation from enabled features with navigation metadata
 */

import { getSiteConfig } from "./content";

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  position: number;
  section: string;
  roles?: string[];
  children?: NavigationItem[];
}

export interface GroupedNavigation {
  [section: string]: NavigationItem[];
}

/** Static tools nav items (e.g. Tests dropdown) — not from feature flags */
const TOOLS_NAV_ITEMS: NavigationItem[] = [
  {
    label: "Tests",
    href: "#",
    icon: "folder",
    position: 5,
    section: "tools",
    roles: ["Admin"],
    children: [
      { label: "Cal.com Booking", href: "/tests/cal-booking/", position: 0, section: "tools" },
      {
        label: "Push Notifications",
        href: "/tests/push-notifications/",
        position: 1,
        section: "tools",
      },
      { label: "VAPI Booking", href: "/tests/vapi-booking/", position: 2, section: "tools" },
      { label: "AI Autocomplete", href: "/tests/ai-autocomplete/", position: 3, section: "tools" },
      { label: "Google Sign-In", href: "/tests/google-signin/", position: 4, section: "tools" },
    ],
  },
];

/**
 * Get all navigation items from enabled features
 */
export async function getFeatureNavigation(userRole?: string): Promise<NavigationItem[]> {
  const config = await getSiteConfig();
  const navItems: NavigationItem[] = [];

  // Loop through features
  for (const [featureKey, featureData] of Object.entries(config.features)) {
    // Skip if not enabled
    if (typeof featureData === "boolean") {
      // Old format - skip
      continue;
    }

    if (!featureData.enabled) {
      continue;
    }

    // Skip widget features (no navigation)
    if (!featureData.navigation) {
      continue;
    }

    const nav = featureData.navigation;

    // Check role access
    if (userRole && nav.roles && !nav.roles.includes(userRole)) {
      continue;
    }

    navItems.push({
      label: nav.label,
      href: nav.href,
      icon: nav.icon,
      position: nav.position || 999,
      section: nav.section || "main",
      roles: nav.roles,
    });
  }

  // Sort by position
  return navItems.sort((a, b) => a.position - b.position);
}

/**
 * Get navigation grouped by section
 */
export async function getGroupedNavigation(userRole?: string): Promise<GroupedNavigation> {
  const items = await getFeatureNavigation(userRole);
  const grouped: GroupedNavigation = {};

  for (const item of items) {
    if (!grouped[item.section]) {
      grouped[item.section] = [];
    }
    grouped[item.section].push(item);
  }

  return grouped;
}

/**
 * Get navigation for a specific section (features + static items like Tools > Tests)
 */
export async function getSectionNavigation(
  section: string,
  userRole?: string
): Promise<NavigationItem[]> {
  const grouped = await getGroupedNavigation(userRole);
  const fromFeatures = grouped[section] || [];

  if (section === "tools") {
    const staticItems = TOOLS_NAV_ITEMS.filter(
      (item) => !userRole || !item.roles || item.roles.includes(userRole)
    );
    return [...staticItems, ...fromFeatures].sort((a, b) => a.position - b.position);
  }

  return fromFeatures;
}
