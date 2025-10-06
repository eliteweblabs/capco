/**
 * Utility functions for punchlist operations
 */

import { COUNT_BUBBLE_PRESETS, updateCountBubble } from "./count-bubble-utils";

export interface PunchlistItem {
  id: number;
  projectId: number;
  authorId: string;
  content: string;
  internal: boolean;
  markCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  parentId?: number;
  author?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface PunchlistResponse {
  success: boolean;
  punchlist?: PunchlistItem[];
  incompleteCount?: number;
  userRole?: string;
  totalCount?: number;
  error?: string;
  details?: string;
  migration_needed?: boolean;
  // Dashboard format compatibility
  punchlistItems?: {
    completed: number;
    total: number;
  };
}

/**
 * Fetch punchlist data for a project
 * @param projectId - The project ID to fetch punchlist items for
 * @returns Promise<PunchlistResponse>
 */
export async function fetchPunchlistData(projectId: string | number): Promise<PunchlistResponse> {
  console.log("🔍 [PUNCHLIST-UTILS] fetchPunchlistData called with projectId:", projectId);
  try {
    const response = await fetch(`/api/get-punchlist?projectId=${projectId}`, {
      credentials: "include",
    });

    const data = await response.json();
    console.log("🔍 [PUNCHLIST-UTILS] API response received:", {
      success: data.success,
      incompleteCount: data.incompleteCount,
      totalCount: data.totalCount,
      punchlistLength: data.punchlist?.length || 0,
    });

    if (!response.ok) {
      console.error("Failed to fetch punchlist data:", data);
      return {
        success: false,
        error: data.error || "Failed to fetch punchlist data",
        details: data.details,
        migration_needed: data.migration_needed,
      };
    }

    // Transform the response to include dashboard-compatible format
    if (data.success && data.incompleteCount !== undefined && data.totalCount !== undefined) {
      data.punchlistItems = {
        completed: data.totalCount - data.incompleteCount,
        total: data.totalCount,
      };
      console.log("🔍 [PUNCHLIST-UTILS] Transformed data for dashboard:", data.punchlistItems);
    }

    console.log("🔍 [PUNCHLIST-UTILS] Returning final data:", {
      success: data.success,
      punchlistItems: data.punchlistItems,
      incompleteCount: data.incompleteCount,
      totalCount: data.totalCount,
    });
    return data;
  } catch (error) {
    console.error("Error fetching punchlist data:", error);
    return {
      success: false,
      error: "Network error while fetching punchlist data",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update incomplete punchlist count in the UI
 * @param incompleteCount - Number of incomplete items
 * @param selector - CSS selector for the count element (optional)
 */
export function updatePunchlistCount(incompleteCount: number, selector?: string) {
  console.log("🔍 [PUNCHLIST-UTILS] updatePunchlistCount called with:", {
    incompleteCount,
    selector,
  });
  const countElement = document.querySelector(selector || ".incomplete-punchlist-items-count");
  const tabButton = document.querySelector(
    '[data-dropdown-toggle="checklist-dropdown"]'
  ) as HTMLElement;

  if (tabButton) {
    // Use global count bubble utility
    updateCountBubble(tabButton, incompleteCount, COUNT_BUBBLE_PRESETS.default);
  }

  // Also update the old count element if it exists
  if (countElement) {
    if (incompleteCount > 0) {
      countElement.textContent = incompleteCount.toString();
      countElement.classList.remove("hidden");
    } else {
      countElement.classList.add("hidden");
    }
  }
}

/**
 * Show punchlist error message
 * @param message - Error message to display
 * @param containerId - ID of the container to show error in (default: "punchlist-items-list")
 */
export function showPunchlistError(message: string, containerId: string = "punchlist-items-list") {
  console.log("🔍 [PUNCHLIST-UTILS] showPunchlistError called with:", { message, containerId });
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="text-center py-8 text-red-500">
        <i class="bx bx-error-circle mx-auto mb-4 text-4xl"></i>
        <p>${message}</p>
      </div>
    `;
  }
}
