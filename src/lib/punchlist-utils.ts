/**
 * Utility functions for punchlist operations
 */

export interface PunchlistItem {
  id: number;
  project_id: number;
  author_id: string;
  content: string;
  internal: boolean;
  mark_completed: boolean;
  created_at: string;
  updated_at: string;
  parent_id?: number;
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
  const tabButton = document.querySelector("[data-count]") as HTMLElement;

  if (tabButton) {
    // Create or update count bubble
    let countBubble = tabButton.querySelector(".punchlist-count-bubble") as HTMLSpanElement;

    if (incompleteCount > 0) {
      if (!countBubble) {
        // Create count bubble if it doesn't exist
        countBubble = document.createElement("span") as HTMLSpanElement;
        countBubble.className =
          "absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs text-bold font-medium text-white dark:bg-primary-dark";
        tabButton.style.position = "relative";
        tabButton.appendChild(countBubble);
      }
      countBubble.textContent = incompleteCount.toString();
      countBubble.style.display = "flex";
      tabButton.setAttribute("data-count", incompleteCount.toString());
    } else {
      if (countBubble) {
        countBubble.style.display = "none";
      }
      tabButton.setAttribute("data-count", "0");
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
