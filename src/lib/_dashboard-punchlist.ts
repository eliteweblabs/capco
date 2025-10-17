/**
 * Dashboard punchlist utilities
 * Use this to display punchlist counts on the dashboard
 */

import {
  fetchPunchlistData,
  updatePunchlistCount,
  type PunchlistResponse,
} from "./_punchlist-utils";

/**
 * Load punchlist data for multiple projects and update their counts
 * @param projectIds - Array of project IDs to fetch punchlist data for
 * @returns Promise with punchlist data for each project
 */
export async function loadDashboardPunchlistData(
  projectIds: (string | number)[]
): Promise<Record<string, PunchlistResponse>> {
  const results: Record<string, PunchlistResponse> = {};

  // Fetch punchlist data for all projects in parallel
  const promises = projectIds.map(async (projectId) => {
    const data = await fetchPunchlistData(projectId);
    results[projectId.toString()] = data;
    return { projectId: projectId.toString(), data };
  });

  await Promise.all(promises);

  return results;
}

/**
 * Update punchlist count for a specific project in the dashboard
 * @param projectId - Project ID
 * @param incompleteCount - Number of incomplete items
 * @param selector - CSS selector for the count element (optional)
 */
export function updateProjectPunchlistCount(
  projectId: string | number,
  incompleteCount: number,
  selector?: string
) {
  const projectSelector = selector || `[data-project-id="${projectId}"] .punchlist-count`;
  updatePunchlistCount(incompleteCount, projectSelector);
}

/**
 * Load and display punchlist data for a single project
 * @param projectId - Project ID to load punchlist data for
 * @param selector - CSS selector for the container (optional)
 * @returns Promise with punchlist data
 */
export async function loadProjectPunchlist(
  projectId: string | number,
  selector?: string
): Promise<PunchlistResponse> {
  const data = await fetchPunchlistData(projectId);

  if (data.success && data.incompleteCount !== undefined) {
    updateProjectPunchlistCount(projectId, data.incompleteCount, selector);
  }

  return data;
}

/**
 * Example usage for dashboard:
 *
 * ```javascript
 * // Load punchlist data for multiple projects
 * const projectIds = ['1', '2', '3'];
 * const punchlistData = await loadDashboardPunchlistData(projectIds);
 *
 * // Update counts for each project
 * Object.entries(punchlistData).forEach(([projectId, data]) => {
 *   if (data.success && data.incompleteCount !== undefined) {
 *     updateProjectPunchlistCount(projectId, data.incompleteCount);
 *   }
 * });
 *
 * // Or load data for a single project
 * const data = await loadProjectPunchlist('123');
 * if (data.success) {
 *   console.log(`Project has ${data.incompleteCount} incomplete punchlist items`);
 * }
 * ```
 */
