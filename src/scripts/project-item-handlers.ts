/**
 * Global Project Item Handlers
 * These functions are shared across all project items on the dashboard
 */

/**
 * Generic function to update any project field
 * @param element - The DOM element with data-refresh, data-meta, data-meta-value
 * @param newValue - The new value to set
 * @param formatDisplay - Optional function to format the display value
 */
(window as any).updateProjectField = async function (
  element: HTMLElement,
  newValue: any,
  formatDisplay?: (value: any) => string
) {
  const projectId = element.getAttribute("data-project-id");
  const metaName = element.getAttribute("data-meta"); // e.g., "dueDate", "status", etc.

  if (!projectId || !metaName) {
    console.error("Missing data-project-id or data-meta attributes");
    return;
  }

  // Format display value if formatter provided, otherwise use raw value
  const displayValue = formatDisplay ? formatDisplay(newValue) : String(newValue);

  // Update display
  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
    (element as HTMLInputElement).value = displayValue;
  } else {
    element.textContent = displayValue;
  }

  // Update data attributes immediately
  element.setAttribute("data-meta-value", String(newValue));
  if (element.hasAttribute("data-due-date")) {
    element.setAttribute("data-due-date", String(newValue));
  }

  // Mark this element as being edited (for CSS specificity)
  element.setAttribute("data-edited", "true");

  // Show saving indicator
  element.classList.add("saving");
  element.classList.remove("saved", "save-error", "fade-out");

  // Clear existing timeout for this element
  const timeoutKey = `fieldTimeout_${projectId}_${metaName}`;
  if ((window as any)[timeoutKey]) {
    clearTimeout((window as any)[timeoutKey]);
  }

  // Debounce: save after 200ms of inactivity
  (window as any)[timeoutKey] = setTimeout(async () => {
    console.log(`💾 [SAVE] Saving ${metaName} for project ${projectId}`);

    try {
      const response = await fetch("/api/projects/upsert", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: parseInt(projectId),
          [metaName]: newValue, // Dynamic field name
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${metaName}`);
      }

      // Success: show checkmark
      element.classList.remove("saving");
      element.classList.add("saved");

      // Fade out after 1 second
      setTimeout(() => {
        element.classList.add("fade-out");
        setTimeout(() => {
          element.classList.remove("saved", "fade-out");
          element.removeAttribute("data-edited"); // Clear edited flag
        }, 300);
      }, 1000);
    } catch (error) {
      console.error(`Error updating ${metaName}:`, error);

      // Error: show red X
      element.classList.remove("saving", "saved");
      element.classList.add("save-error");

      // Remove error after 2 seconds
      setTimeout(() => {
        element.classList.remove("save-error");
        element.removeAttribute("data-edited"); // Clear edited flag
      }, 2000);

      // Show error toast
      if (typeof window !== "undefined" && (window as any).showNotice) {
        (window as any).showNotice(
          "error",
          "Update Failed",
          `Failed to update ${metaName}. Please try again.`,
          3000
        );
      }
    }
  }, 500);
};

/**
 * Adjust due date by hours (uses generic function)
 */
(window as any).adjustDueDate = async function (projectId: number, hours: number) {
  console.log(`🎯 [ADJUST] adjustDueDate called: projectId=${projectId}, hours=${hours}`);

  const input = document.getElementById(`stepper-${projectId}`) as HTMLInputElement;
  if (!input) {
    console.error(`❌ [ADJUST] Input not found for project ${projectId}`);
    return;
  }

  const currentDate = input.getAttribute("data-due-date");
  if (!currentDate || currentDate === "") {
    console.error(`❌ [ADJUST] No current date for project ${projectId}`);
    return;
  }

  // Validate the date before parsing
  const date = new Date(currentDate);
  if (isNaN(date.getTime())) {
    console.error(`❌ [ADJUST] Invalid date format for project ${projectId}:`, currentDate);
    return;
  }

  date.setHours(date.getHours() + hours);
  const newISO = date.toISOString();

  // Update display immediately (instant feedback)
  const displayValue = new Date(newISO).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    hour12: true,
  });
  input.value = displayValue;
  input.setAttribute("data-due-date", newISO);
  input.setAttribute("data-meta-value", newISO);

  // Show saving indicator (ONLY on this element)
  input.classList.add("saving");
  input.classList.remove("saved", "save-error", "fade-out");
  input.setAttribute("data-edited", "true");

  // Debounce the actual save
  const metaName = "dueDate";
  const timeoutKey = `fieldTimeout_${projectId}_${metaName}`;

  if ((window as any)[timeoutKey]) {
    console.log(`⏱️  [ADJUST] Clearing existing timeout for ${timeoutKey}`);
    clearTimeout((window as any)[timeoutKey]);
  }

  console.log(`⏱️  [ADJUST] Setting new timeout for ${timeoutKey} (200ms)`);
  (window as any)[timeoutKey] = setTimeout(async () => {
    console.log(`💾 [SAVE] Saving ${metaName} for project ${projectId} after debounce`);

    try {
      const response = await fetch("/api/projects/upsert", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: projectId.toString(),
          dueDate: newISO,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${metaName}`);
      }

      console.log(`✅ [SAVE] Successfully saved ${metaName} for project ${projectId}`);

      // Success: show checkmark
      input.classList.remove("saving");
      input.classList.add("saved");

      // Fade out after 1 second
      setTimeout(() => {
        input.classList.add("fade-out");
        setTimeout(() => {
          input.classList.remove("saved", "fade-out");
          input.removeAttribute("data-edited");
        }, 300);
      }, 1000);
    } catch (error) {
      console.error(`Error updating ${metaName}:`, error);

      // Error: show red X
      input.classList.remove("saving", "saved");
      input.classList.add("save-error");

      // Remove error after 2 seconds
      setTimeout(() => {
        input.classList.remove("save-error");
        input.removeAttribute("data-edited");
      }, 2000);

      // Show error toast
      if (typeof window !== "undefined" && (window as any).showNotice) {
        (window as any).showNotice(
          "error",
          "Update Failed",
          `Failed to update ${metaName}. Please try again.`,
          3000
        );
      }
    }
  }, 200); // Wait 200ms after last click before saving
};

/**
 * Update time display every minute
 */
(window as any).updateTimeDisplay = function () {
  const timeElements = document.querySelectorAll("[data-time-since-update]");

  timeElements.forEach((element) => {
    const updatedAt = element.getAttribute("data-updated-at");
    if (updatedAt) {
      const now = new Date();
      const updated = new Date(updatedAt);
      const diffMs = now.getTime() - updated.getTime();
      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);

      let timeText;
      if (years > 0) {
        timeText = `${years} year${years > 1 ? "s" : ""} ago`;
      } else if (months > 0) {
        timeText = `${months} month${months > 1 ? "s" : ""} ago`;
      } else if (weeks > 0) {
        timeText = `${weeks} week${weeks > 1 ? "s" : ""} ago`;
      } else if (days > 0) {
        timeText = `${days} day${days > 1 ? "s" : ""} ago`;
      } else if (hours > 0) {
        timeText = `${hours} hour${hours > 1 ? "s" : ""} ago`;
      } else if (minutes > 0) {
        timeText = `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
      } else {
        timeText = "Just now";
      }

      element.textContent = timeText;
    }
  });
};

import { getFileIconSvg, getFileName } from "../lib/file-icon";

/** @deprecated Use getFileIconSvg from lib/file-icon. Kept for backwards compat in renderFileIcons. */
(window as any).getFileIcon = function (fileType: string, size: "sm" | "md" | "lg" = "sm") {
  return getFileIconSvg(fileType, size);
};

/**
 * Render file icons with native browser tooltips
 */
(window as any).renderFileIcons = function () {
  console.log("📁 [RENDER-FILE-ICONS] Called");

  // Find all project file containers
  const containers = document.querySelectorAll('[id^="project-files-"]');
  console.log(`📁 [RENDER-FILE-ICONS] Found ${containers.length} file containers`);

  containers.forEach((container) => {
    if (container.getAttribute("data-prerendered") === "true") {
      return; /* Pre-rendered in Astro with Tooltip.astro */
    }
    const projectFilesData = container.getAttribute("data-project-files");
    if (!projectFilesData) {
      return;
    }

    const projectFiles = JSON.parse(projectFilesData);
    console.log(
      `📁 [RENDER-FILE-ICONS] Container ${container.id} has ${projectFiles?.length || 0} files`
    );

    if (!projectFiles || projectFiles.length === 0) {
      return;
    }

    // Clear existing content
    container.innerHTML = "";

    const size = (container.getAttribute("data-file-size") || "sm") as "sm" | "md" | "lg";
    const tooltips = container.getAttribute("data-file-tooltips") !== "false";

    projectFiles.forEach((file: any) => {
      const fileIconContainer = document.createElement("div");
      fileIconContainer.className = "cursor-pointer inline-flex";
      const fileName = getFileName(file);
      const fileType = file.fileType || file.file_type || "";
      if (tooltips) {
        fileIconContainer.title = fileName;
      }
      fileIconContainer.innerHTML = getFileIconSvg(fileType, size);

      container.appendChild(fileIconContainer);
    });
  });
};

// Initialize time display updates (once globally)
if (!(window as any).__timeDisplayInitialized) {
  (window as any).__timeDisplayInitialized = true;
  (window as any).updateTimeDisplay();
  setInterval((window as any).updateTimeDisplay, 60000); // 60000ms = 1 minute
}

/**
 * Generic staff icon update callback for SlotMachineModalStaff
 * Can be called from any project row after staff assignment
 * @param projectId - The project ID
 * @param result - The API response result
 * @param assignedToId - The staff member ID
 * @param staffName - The staff member name
 */
(window as any).updateStaffIcon = function (
  projectId: number,
  result: any,
  assignedToId: string,
  staffName: string
) {
  console.log(`🔄 [PROJECT-${projectId}] updateStaffIcon called`, {
    result,
    assignedToId,
    staffName,
  });

  // Find the staff assignment element
  const staffElement = document.querySelector(`#assign-staff-slot-machine-${projectId}`);
  if (!staffElement) {
    console.error(`🔄 [PROJECT-${projectId}] Staff element not found`);
    return;
  }

  // Update the staff element with the new icon/avatar
  if (result?.updatedProject?.assignedToProfile) {
    const profile = result.updatedProject.assignedToProfile;
    console.log(`🔄 [PROJECT-${projectId}] Updating with profile:`, profile);

    // Create the initials from the profile data
    const fullName =
      profile.companyName ||
      `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
      profile.name ||
      "User";
    const initials = fullName
      .split(" ")
      .map((n: string) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Create the new UserIcon HTML with tooltip - matching UserIcon.astro styling
    const newHTML = `
        <span class="sr-only">Open user menu</span>
        <div class="w-8 h-8 text-sm rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-medium cursor-pointer">
          ${initials}
        </div>
    `;

    staffElement.innerHTML = newHTML;
    if (staffElement instanceof HTMLElement) {
      staffElement.title = staffName || fullName;
    }
    console.log(
      `🔄 [PROJECT-${projectId}] Successfully updated staff icon with initials: ${initials}`
    );
  } else if (!assignedToId || assignedToId === "") {
    // Handle unassignment - show the default icon
    console.log(`🔄 [PROJECT-${projectId}] Unassigning staff, showing default icon`);

    const newHTML = `
      <span class="relative inline-block group w-8 h-8">
        <span class="sr-only">Open user menu</span>
        <svg
          class="inline-block avatar-fallback"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM20 21h1v-1c0-3.859-3.141-7-7-7h-4c-3.86 0-7 3.141-7 7v1h17z" />
        </svg>
      </span>
    `;

    staffElement.innerHTML = newHTML;
    if (staffElement instanceof HTMLElement) {
      staffElement.title = "Assign to Staff";
    }
    console.log(`🔄 [PROJECT-${projectId}] Successfully updated to default icon`);
  }
};

/**
 * Featured toggle change handler (event delegation)
 */
document.addEventListener("change", async (e) => {
  const target = e.target as HTMLElement;
  if (target.getAttribute("data-meta") !== "featured" || !target.hasAttribute("data-project-id")) {
    return;
  }
  const projectId = target.getAttribute("data-project-id");
  const checked = (target as HTMLInputElement).checked;

  try {
    const response = await fetch("/api/projects/upsert", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: parseInt(projectId!), featured: checked }),
    });

    if (!response.ok) {
      throw new Error("Failed to update featured");
    }

    if ((window as any).showNotice) {
      (window as any).showNotice(
        "success",
        checked ? "Project featured" : "Project unfeatured",
        "",
        1500
      );
    }
  } catch (err) {
    console.error("Error updating featured:", err);
    (target as HTMLInputElement).checked = !checked; // Revert on error
    if ((window as any).showNotice) {
      (window as any).showNotice("error", "Update Failed", "Failed to update featured.", 3000);
    }
  }
});

// Ensure file icons render when DOM is ready (project-files-* containers)
document.addEventListener("DOMContentLoaded", () => {
  if (typeof (window as any).renderFileIcons === "function") {
    (window as any).renderFileIcons();
  }
});

console.log("✅ [GLOBAL] Project item handlers loaded");
