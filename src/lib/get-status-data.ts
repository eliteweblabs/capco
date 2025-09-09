/**
 * Get status data - Step 1 in the chain
 */

import { getProfileData, getProjectData, getStatusConfig } from "./database-utils";

export interface StatusData {
  project: any;
  profile: any;
  statusConfig: any;
  notify: string | null;
  projectId: number;
  newStatus: number;
}

/**
 * Get all status data needed for processing
 */
export async function getStatusData(
  projectId: number,
  newStatus: number
): Promise<StatusData | null> {
  console.log("🔍 [GET-STATUS-DATA] ==========================================");
  console.log(
    `🔍 [GET-STATUS-DATA] Starting data collection for project ${projectId}, status ${newStatus}`
  );
  console.log("🔍 [GET-STATUS-DATA] ==========================================");

  // Get project data
  console.log("🔍 [GET-STATUS-DATA] Step 1: Fetching project data...");
  const project = await getProjectData(projectId);
  if (!project) {
    console.error("🔍 [GET-STATUS-DATA] ❌ Failed to get project data");
    return null;
  }
  console.log("🔍 [GET-STATUS-DATA] ✅ Project data retrieved:", {
    id: project.id,
    address: project.address,
    author_id: project.author_id,
    status: project.status,
  });

  // Get profile data
  console.log("🔍 [GET-STATUS-DATA] Step 2: Fetching profile data...");
  const profile = await getProfileData(project.author_id);
  if (!profile) {
    console.error("🔍 [GET-STATUS-DATA] ❌ Failed to get profile data");
    return null;
  }
  console.log("🔍 [GET-STATUS-DATA] ✅ Profile data retrieved:", {
    id: profile.id,
    company_name: profile.company_name,
    email: profile.email,
  });

  // Get status config
  console.log("🔍 [GET-STATUS-DATA] Step 3: Fetching status config...");
  const statusConfig = await getStatusConfig(newStatus);
  if (!statusConfig) {
    console.error("🔍 [GET-STATUS-DATA] ❌ Failed to get status config");
    return null;
  }
  console.log("🔍 [GET-STATUS-DATA] ✅ Status config retrieved:", {
    modal_admin: statusConfig.modal_admin,
    modal_client: statusConfig.modal_client,
    notify: statusConfig.notify,
    admin_email_subject: statusConfig.admin_email_subject,
    admin_email_content: statusConfig.admin_email_content,
  });

  const result = {
    project,
    profile,
    statusConfig,
    notify: statusConfig.notify || null,
    projectId,
    newStatus,
  };

  console.log("🔍 [GET-STATUS-DATA] ==========================================");
  console.log("🔍 [GET-STATUS-DATA] ✅ All data successfully gathered!");
  console.log("🔍 [GET-STATUS-DATA] ==========================================");

  return result;
}
