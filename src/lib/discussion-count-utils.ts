/**
 * Utility functions for counting incomplete discussion items
 */

import { updateCountBubble, COUNT_BUBBLE_PRESETS } from "./count-bubble-utils";

export interface DiscussionCountResponse {
  success: boolean;
  incompleteCount?: number;
  totalCount?: number;
  error?: string;
}

/**
 * Fetch incomplete discussion count for a project
 * @param projectId - The project ID to fetch discussion count for
 * @returns Promise<DiscussionCountResponse>
 */
export async function fetchDiscussionCount(
  projectId: string | number
): Promise<DiscussionCountResponse> {
  console.log("💬 [DISCUSSION-COUNT-UTILS] fetchDiscussionCount called with projectId:", projectId);
  try {
    const response = await fetch(
      `/api/discussions?projectId=${projectId}&completed=false&limit=1`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();
    console.log("💬 [DISCUSSION-COUNT-UTILS] API response received:", {
      success: data.success,
      incompleteCount: data.incompleteCount,
      totalCount: data.totalCount,
      discussionsLength: data.discussions?.length || 0,
    });

    if (!response.ok) {
      console.error("Failed to fetch discussion count:", data);
      return {
        success: false,
        error: data.error || "Failed to fetch discussion count",
      };
    }

    return {
      success: true,
      incompleteCount: data.incompleteCount || 0,
      totalCount: data.totalCount || 0,
    };
  } catch (error) {
    console.error("Error fetching discussion count:", error);
    return {
      success: false,
      error: "Network error while fetching discussion count",
    };
  }
}

/**
 * Update incomplete discussion count in the UI
 * @param incompleteCount - Number of incomplete discussion items
 * @param selector - CSS selector for the count element (optional)
 */
export function updateDiscussionCount(incompleteCount: number, selector?: string) {
  console.log("💬 [DISCUSSION-COUNT-UTILS] updateDiscussionCount called with:", {
    incompleteCount,
    selector,
  });

  // Update the status-discussion tab button
  const tabButton = document.querySelector("#status-discussion") as HTMLElement;

  if (tabButton) {
    // Use global count bubble utility
    updateCountBubble(tabButton, incompleteCount, COUNT_BUBBLE_PRESETS.default);
  }

  // Also update any specific count element if selector provided
  if (selector) {
    const countElement = document.querySelector(selector);
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
 * Load and update discussion count for a project
 * @param projectId - The project ID to load count for
 * @param selector - Optional CSS selector for specific count element
 */
export async function loadDiscussionCount(projectId: string | number, selector?: string) {
  console.log("💬 [DISCUSSION-COUNT-UTILS] loadDiscussionCount called with:", {
    projectId,
    selector,
  });

  try {
    const result = await fetchDiscussionCount(projectId);

    if (result.success && result.incompleteCount !== undefined) {
      updateDiscussionCount(result.incompleteCount, selector);
      console.log("💬 [DISCUSSION-COUNT-UTILS] Discussion count updated:", result.incompleteCount);
    } else {
      console.error("💬 [DISCUSSION-COUNT-UTILS] Failed to load discussion count:", result.error);
    }
  } catch (error) {
    console.error("💬 [DISCUSSION-COUNT-UTILS] Error loading discussion count:", error);
  }
}
