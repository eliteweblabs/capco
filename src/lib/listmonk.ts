/**
 * Listmonk API Client Library
 * Server-side integration with Listmonk for newsletter management
 */

const LISTMONK_URL = import.meta.env.LISTMONK_URL || "https://listmonk-firstbranch.up.railway.app";
const LISTMONK_USERNAME = import.meta.env.LISTMONK_USERNAME;
const LISTMONK_PASSWORD = import.meta.env.LISTMONK_PASSWORD;

if (!LISTMONK_USERNAME || !LISTMONK_PASSWORD) {
  console.warn(
    "Listmonk credentials not configured. Set LISTMONK_USERNAME and LISTMONK_PASSWORD in .env"
  );
}

/**
 * Base fetch wrapper for Listmonk API calls
 */
async function listmonkFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${LISTMONK_URL}/api${endpoint}`;
  const auth = Buffer.from(`${LISTMONK_USERNAME}:${LISTMONK_PASSWORD}`).toString("base64");

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Listmonk API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ============================================================================
// SUBSCRIBERS
// ============================================================================

export interface ListmonkSubscriber {
  id?: number;
  email: string;
  name: string;
  status?: "enabled" | "disabled" | "blocklisted";
  attribs?: Record<string, any>;
  lists?: number[];
}

export async function getSubscribers(params?: {
  query?: string;
  list_id?: number;
  page?: number;
  per_page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.set("query", params.query);
  if (params?.list_id) searchParams.set("list_id", params.list_id.toString());
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.per_page) searchParams.set("per_page", params.per_page.toString());

  return listmonkFetch(`/subscribers?${searchParams.toString()}`);
}

export async function getSubscriber(id: number) {
  return listmonkFetch(`/subscribers/${id}`);
}

export async function createSubscriber(subscriber: ListmonkSubscriber) {
  return listmonkFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify(subscriber),
  });
}

export async function updateSubscriber(id: number, subscriber: Partial<ListmonkSubscriber>) {
  return listmonkFetch(`/subscribers/${id}`, {
    method: "PUT",
    body: JSON.stringify(subscriber),
  });
}

export async function deleteSubscriber(id: number) {
  return listmonkFetch(`/subscribers/${id}`, {
    method: "DELETE",
  });
}

// ============================================================================
// LISTS (Mailing Lists)
// ============================================================================

export interface ListmonkList {
  id?: number;
  name: string;
  type: "public" | "private";
  optin: "single" | "double";
  description?: string;
  tags?: string[];
}

export async function getLists() {
  return listmonkFetch("/lists");
}

export async function getList(id: number) {
  return listmonkFetch(`/lists/${id}`);
}

export async function createList(list: ListmonkList) {
  return listmonkFetch("/lists", {
    method: "POST",
    body: JSON.stringify(list),
  });
}

export async function updateList(id: number, list: Partial<ListmonkList>) {
  return listmonkFetch(`/lists/${id}`, {
    method: "PUT",
    body: JSON.stringify(list),
  });
}

export async function deleteList(id: number) {
  return listmonkFetch(`/lists/${id}`, {
    method: "DELETE",
  });
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

export interface ListmonkCampaign {
  id?: number;
  name: string;
  subject: string;
  lists: number[];
  type?: "regular" | "optin";
  content_type?: "richtext" | "html" | "markdown" | "plain";
  body?: string;
  altbody?: string;
  send_at?: string; // ISO date string for scheduled campaigns
  messenger?: string;
  template_id?: number;
  tags?: string[];
  headers?: Array<{ [key: string]: string }>;
}

export async function getCampaigns(params?: {
  query?: string;
  status?: string;
  page?: number;
  per_page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.set("query", params.query);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.per_page) searchParams.set("per_page", params.per_page.toString());

  return listmonkFetch(`/campaigns?${searchParams.toString()}`);
}

export async function getCampaign(id: number) {
  return listmonkFetch(`/campaigns/${id}`);
}

export async function createCampaign(campaign: ListmonkCampaign) {
  return listmonkFetch("/campaigns", {
    method: "POST",
    body: JSON.stringify(campaign),
  });
}

export async function updateCampaign(id: number, campaign: Partial<ListmonkCampaign>) {
  return listmonkFetch(`/campaigns/${id}`, {
    method: "PUT",
    body: JSON.stringify(campaign),
  });
}

export async function deleteCampaign(id: number) {
  return listmonkFetch(`/campaigns/${id}`, {
    method: "DELETE",
  });
}

export async function updateCampaignStatus(
  id: number,
  status: "draft" | "scheduled" | "running" | "paused" | "cancelled"
) {
  return listmonkFetch(`/campaigns/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// ============================================================================
// TEMPLATES
// ============================================================================

export interface ListmonkTemplate {
  id?: number;
  name: string;
  type?: "campaign" | "tx";
  subject?: string;
  body: string;
  is_default?: boolean;
}

export async function getTemplates() {
  return listmonkFetch("/templates");
}

export async function getTemplate(id: number) {
  return listmonkFetch(`/templates/${id}`);
}

export async function createTemplate(template: ListmonkTemplate) {
  return listmonkFetch("/templates", {
    method: "POST",
    body: JSON.stringify(template),
  });
}

export async function updateTemplate(id: number, template: Partial<ListmonkTemplate>) {
  return listmonkFetch(`/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(template),
  });
}

export async function deleteTemplate(id: number) {
  return listmonkFetch(`/templates/${id}`, {
    method: "DELETE",
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sync Supabase profiles to Listmonk subscribers
 * This allows you to use your existing user base as newsletter subscribers
 */
export async function syncProfileToSubscriber(profile: {
  id: string;
  email: string;
  name: string;
  role?: string;
  phone?: string;
}) {
  try {
    // Check if subscriber already exists
    const subscribers = await getSubscribers({ query: profile.email });

    const subscriberData: ListmonkSubscriber = {
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      status: "enabled",
      attribs: {
        supabase_id: profile.id,
        role: profile.role || "Client",
        phone: profile.phone || "",
        synced_at: new Date().toISOString(),
      },
    };

    if (subscribers.data?.results?.length > 0) {
      // Update existing subscriber
      const existingId = subscribers.data.results[0].id;
      return updateSubscriber(existingId, subscriberData);
    } else {
      // Create new subscriber
      return createSubscriber(subscriberData);
    }
  } catch (error) {
    console.error("Error syncing profile to subscriber:", error);
    throw error;
  }
}

/**
 * Bulk sync all Supabase profiles to Listmonk
 */
export async function bulkSyncProfiles(
  profiles: Array<{
    id: string;
    email: string;
    name: string;
    role?: string;
    phone?: string;
  }>
) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const profile of profiles) {
    try {
      await syncProfileToSubscriber(profile);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${profile.email}: ${error}`);
    }
  }

  return results;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const listmonk = {
  // Subscribers
  subscribers: {
    list: getSubscribers,
    get: getSubscriber,
    create: createSubscriber,
    update: updateSubscriber,
    delete: deleteSubscriber,
  },
  // Lists
  lists: {
    list: getLists,
    get: getList,
    create: createList,
    update: updateList,
    delete: deleteList,
  },
  // Campaigns
  campaigns: {
    list: getCampaigns,
    get: getCampaign,
    create: createCampaign,
    update: updateCampaign,
    delete: deleteCampaign,
    updateStatus: updateCampaignStatus,
  },
  // Templates
  templates: {
    list: getTemplates,
    get: getTemplate,
    create: createTemplate,
    update: updateTemplate,
    delete: deleteTemplate,
  },
  // Utils
  sync: {
    profile: syncProfileToSubscriber,
    bulkProfiles: bulkSyncProfiles,
  },
};
