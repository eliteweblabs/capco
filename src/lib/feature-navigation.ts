/**
 * Feature Navigation Helper
 * 
 * Generates navigation from enabled features with navigation metadata
 */

import { getSiteConfig } from './content';

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

/**
 * Get all navigation items from enabled features
 */
export function getFeatureNavigation(userRole?: string): NavigationItem[] {
  const config = getSiteConfig();
  const navItems: NavigationItem[] = [];

  // Loop through features
  for (const [featureKey, featureData] of Object.entries(config.features)) {
    // Skip if not enabled
    if (typeof featureData === 'boolean') {
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
      section: nav.section || 'main',
      roles: nav.roles,
    });
  }

  // Sort by position
  return navItems.sort((a, b) => a.position - b.position);
}

/**
 * Get navigation grouped by section
 */
export function getGroupedNavigation(userRole?: string): GroupedNavigation {
  const items = getFeatureNavigation(userRole);
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
 * Get navigation for a specific section
 */
export function getSectionNavigation(section: string, userRole?: string): NavigationItem[] {
  const grouped = getGroupedNavigation(userRole);
  return grouped[section] || [];
}

