/**
 * Browser stub for content.ts - used when bundling app-globals for the client.
 * content.ts uses fs/path and is server-only. This stub provides no-op exports.
 */

export function quoteClientIdForPostgrest(clientId: string): string {
  return clientId.includes(" ") || clientId.includes(",") || clientId.includes('"')
    ? `"${clientId.replace(/"/g, '""')}"`
    : clientId;
}

export function clearSiteConfigCache(): void {}

export interface SiteConfig {
  site: { name: string; slogan: string; description: string; url: string; email: string; phone: string; address: string; year: string };
  branding: Record<string, unknown>;
  navigation: Record<string, unknown>;
  features: Record<string, unknown>;
  pages?: Record<string, unknown>;
  integrations?: Record<string, unknown>;
}

export interface PageContent {
  title: string;
  description?: string;
  content?: string;
  [k: string]: unknown;
}

export async function getSiteConfig(): Promise<SiteConfig> {
  return {} as SiteConfig;
}

export async function getPageContent(_slug: string): Promise<PageContent | null> {
  return null;
}

export async function isFeatureEnabled(_featureKey: string): Promise<boolean> {
  return false;
}

export async function getNavigation(_type: "main" | "footer" = "main") {
  return [];
}

export function clearContentCache(): void {}

export async function getAvailablePages(): Promise<string[]> {
  return [];
}
