/**
 * Admin Components Index
 *
 * Export all admin panel components for easy importing.
 * These components are designed to be embedded in pages or managed via CMS.
 *
 * Usage:
 *   import { AdminDiscussions, AdminAnalytics } from "../../components/admin";
 *
 * Or import individual components:
 *   import AdminDiscussions from "../../components/admin/AdminDiscussions.astro";
 */

// Re-export admin components
// Note: Astro components cannot be directly re-exported in JS files,
// but this serves as documentation for available components.

export const adminComponents = {
  AdminDiscussions: "AdminDiscussions.astro",
  AdminAnalytics: "AdminAnalytics.astro",
  AdminGlobalActivity: "AdminGlobalActivity.astro",
  AdminMedia: "AdminMedia.astro",
  AdminUsers: "AdminUsers.astro",
  ContractEditor: "ContractEditor.astro",
  FinanceDashboard: "FinanceDashboard.astro",
} as const;

export type AdminComponentName = keyof typeof adminComponents;
