/**
 * Simple database utility for toast data
 */

import { createClient } from "@supabase/supabase-js";
import type { PlaceholderData } from "./placeholder-utils";
import { supabaseAdmin } from "./supabase-admin";

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL as string,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string
);

export interface ProjectData {
  id: number;
  address: string;
  author_id: string;
  status: number;
}

export interface ProfileData {
  id: string;
  email: string;
  company_name?: string;
}

export interface StatusConfig {
  modal_admin?: string;
  modal_client?: string;
  modal_auto_redirect?: boolean;
  admin_email_subject?: string;
  admin_email_content?: string;
  client_email_subject?: string;
  client_email_content?: string;
  button_text?: string;
  button_link?: string;
  notify?: string;
}

/**
 * Get project data by ID
 */
export async function getProjectData(projectId: number): Promise<ProjectData | null> {
  console.log(`🗄️ [DATABASE-UTILS] Fetching project data for ID: ${projectId}`);

  const { data, error } = await supabase
    .from("projects")
    .select("id, address, author_id, status")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("🗄️ [DATABASE-UTILS] ❌ Error fetching project:", error);
    return null;
  }

  console.log("🗄️ [DATABASE-UTILS] ✅ Project data retrieved:", {
    id: data.id,
    address: data.address,
    addressType: typeof data.address,
    addressLength: data.address?.length,
    author_id: data.author_id,
    status: data.status,
  });

  return data;
}

/**
 * Get profile data by user ID
 */
export async function getProfileData(userId: string): Promise<ProfileData | null> {
  console.log(`🗄️ [DATABASE-UTILS] Fetching profile data for user ID: ${userId}`);

  // Get profile data from profiles table
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_name, first_name, last_name, role")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("🗄️ [DATABASE-UTILS] ❌ Error fetching profile:", profileError);
    return null;
  }

  // Get email from auth.users table using admin client
  if (!supabaseAdmin) {
    console.error("🗄️ [DATABASE-UTILS] ❌ Supabase admin client not available");
    return null;
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (authError || !authData.user) {
    console.error("🗄️ [DATABASE-UTILS] ❌ Error fetching auth data:", authError);
    return null;
  }

  const result = {
    id: profileData.id,
    company_name: profileData.company_name,
    email: authData.user.email || "",
  };

  console.log("🗄️ [DATABASE-UTILS] ✅ Profile data retrieved (merged with auth):", {
    id: result.id,
    company_name: result.company_name,
    email: result.email,
    emailFromAuth: authData.user.email,
  });

  return result;
}

/**
 * Get status configuration
 */
export async function getStatusConfig(statusId: number): Promise<StatusConfig | null> {
  console.log(`🗄️ [DATABASE-UTILS] Fetching status config for status ID: ${statusId}`);

  const { data, error } = await supabase
    .from("project_statuses")
    .select(
      "modal_admin, modal_client, modal_auto_redirect, admin_email_subject, admin_email_content, client_email_subject, client_email_content, button_text, button_link, notify"
    )
    .eq("status_code", statusId)
    .single();

  if (error) {
    console.error("🗄️ [DATABASE-UTILS] ❌ Error fetching status config:", error);
    return null;
  }

  console.log("🗄️ [DATABASE-UTILS] ✅ Status config retrieved:", {
    modal_admin: data.modal_admin,
    modal_client: data.modal_client,
    notify: data.notify,
    admin_email_subject: data.admin_email_subject,
    admin_email_content: data.admin_email_content
      ? `${data.admin_email_content.substring(0, 50)}...`
      : null,
    client_email_subject: data.client_email_subject,
    client_email_content: data.client_email_content
      ? `${data.client_email_content.substring(0, 50)}...`
      : null,
    button_text: data.button_text,
    button_link: data.button_link,
  });

  return data;
}

/**
 * Prepare placeholder data from project and profile
 */
export function preparePlaceholderData(
  project: ProjectData,
  profile: ProfileData,
  statusName?: string,
  estTime?: string
): PlaceholderData {
  console.log("🗄️ [DATABASE-UTILS] Preparing placeholder data...");
  console.log("🗄️ [DATABASE-UTILS] Profile data:", {
    id: profile.id,
    company_name: profile.company_name,
    email: profile.email,
    emailType: typeof profile.email,
    emailLength: profile.email?.length,
  });

  const placeholderData = {
    projectAddress: project.address,
    clientName: profile.company_name,
    clientEmail: profile.email,
    statusName: statusName || "Status Update",
    estTime: estTime || "2-3 business days",
  };

  console.log("🗄️ [DATABASE-UTILS] ✅ Placeholder data prepared:", placeholderData);

  return placeholderData;
}
