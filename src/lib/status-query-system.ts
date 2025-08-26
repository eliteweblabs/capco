// Status-based query system for showing/hiding elements based on project status
export class StatusQuerySystem {
  private static instance: StatusQuerySystem;
  private statusQueries: Map<string, number> = new Map();

  constructor() {
    this.init();
  }

  static getInstance(): StatusQuerySystem {
    if (!StatusQuerySystem.instance) {
      StatusQuerySystem.instance = new StatusQuerySystem();
    }
    return StatusQuerySystem.instance;
  }

  private init() {
    // Initialize status queries for all project containers
    this.updateAllStatusQueries();

    // Listen for dynamic content changes
    this.observeDOMChanges();
  }

  private updateAllStatusQueries() {
    // Find all project containers with status classes
    const projectContainers = document.querySelectorAll('[class*="status-"]');

    projectContainers.forEach((container) => {
      const statusClass = Array.from(container.classList).find((cls) => cls.startsWith("status-"));
      if (statusClass) {
        const status = parseInt(statusClass.replace("status-", ""));
        const containerId = container.id || this.generateId(container);
        this.statusQueries.set(containerId, status);
        this.updateVisibilityForContainer(container, status);
      }
    });

    // Also find containers with data-project-id that might not have status classes yet
    const projectContainersById = document.querySelectorAll("[data-project-id]");
    projectContainersById.forEach((container) => {
      const statusClass = Array.from(container.classList).find((cls) => cls.startsWith("status-"));
      if (statusClass) {
        const status = parseInt(statusClass.replace("status-", ""));
        const projectId = container.getAttribute("data-project-id");
        if (projectId) {
          this.statusQueries.set(projectId, status);
          this.updateVisibilityForContainer(container, status);
        }
      }
    });
  }

  private updateVisibilityForContainer(container: Element, status: number) {
    // Find all elements with status attributes
    const statusElements = container.querySelectorAll("[data-status-show], [data-status-hide]");

    // Process each element considering both show and hide attributes
    statusElements.forEach((element) => {
      const showStatus = element.getAttribute("data-status-show");
      const hideStatus = element.getAttribute("data-status-hide");

      let shouldBeVisible = true; // Default to visible

      // If element has data-status-show, it should be hidden by default
      if (showStatus) {
        const requiredShowStatus = parseInt(showStatus);
        shouldBeVisible = status >= requiredShowStatus;
      }

      // If element also has data-status-hide, check hide condition
      if (hideStatus && shouldBeVisible) {
        const requiredHideStatus = parseInt(hideStatus);
        shouldBeVisible = status < requiredHideStatus;
      }

      const wasVisible = element.style.display !== "none" && element.style.display !== "";

      if (shouldBeVisible) {
        element.style.display = "block";
      } else {
        element.style.display = "none";
      }

      if (wasVisible !== shouldBeVisible) {
        console.log(
          `Element "${element.textContent?.trim()}" visibility changed: ${wasVisible} -> ${shouldBeVisible} (status: ${status}, show: ${showStatus}, hide: ${hideStatus})`
        );
      }
    });

    // Trigger refresh on elements with 'refresh' class
    const refreshElements = container.querySelectorAll(".refresh");
    refreshElements.forEach((element) => {
      // Dispatch a custom event to notify elements that need to refresh
      element.dispatchEvent(
        new CustomEvent("status-refresh", {
          detail: {
            status,
            containerId: container.id || this.generateId(container),
          },
        })
      );
    });
  }

  private observeDOMChanges() {
    // Use MutationObserver to watch for new project containers
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (
                element.classList.contains("status-") ||
                element.querySelector('[class*="status-"]') ||
                element.querySelector("[data-status-show]") ||
                element.querySelector("[data-status-hide]") ||
                element.querySelector(".refresh")
              ) {
                shouldUpdate = true;
              }
            }
          });
        }
      });

      if (shouldUpdate) {
        this.updateAllStatusQueries();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Public method to update status for a specific project
  updateProjectStatus(projectId: string, newStatus: number) {
    const container = document.querySelector(`[data-project-id="${projectId}"]`);
    if (container) {
      // Update the status class
      const oldStatusClass = Array.from(container.classList).find((cls) =>
        cls.startsWith("status-")
      );
      if (oldStatusClass) {
        container.classList.remove(oldStatusClass);
      }
      container.classList.add(`status-${newStatus}`);

      // Update visibility based on data attributes
      this.updateVisibilityForContainer(container, newStatus);

      // Update the internal map
      this.statusQueries.set(projectId, newStatus);

      // Trigger global refresh event
      document.dispatchEvent(
        new CustomEvent("project-status-changed", {
          detail: {
            projectId,
            newStatus,
            oldStatus: this.statusQueries.get(projectId),
          },
        })
      );

      console.log(`Updated project ${projectId} status to ${newStatus}`);
    } else {
      console.warn(`Project container not found for ID: ${projectId}`);
    }
  }

  // Public method to get current status for a project
  getProjectStatus(projectId: string): number | null {
    return this.statusQueries.get(projectId) || null;
  }

  // Public method to check if element should be visible
  isElementVisible(element: Element, currentStatus: number): boolean {
    const showStatus = element.getAttribute("data-status-show");
    const hideStatus = element.getAttribute("data-status-hide");

    if (showStatus) {
      const requiredStatus = parseInt(showStatus);
      return currentStatus >= requiredStatus;
    }

    if (hideStatus) {
      const requiredStatus = parseInt(hideStatus);
      return currentStatus < requiredStatus;
    }

    return true; // Default to visible if no status attributes
  }

  // Public method to refresh all status queries
  refresh() {
    this.updateAllStatusQueries();
  }

  // Public method to refresh a specific project
  refreshProject(projectId: string) {
    const container = document.querySelector(`[data-project-id="${projectId}"]`);
    if (container) {
      const statusClass = Array.from(container.classList).find((cls) => cls.startsWith("status-"));
      if (statusClass) {
        const status = parseInt(statusClass.replace("status-", ""));
        this.updateVisibilityForContainer(container, status);
      }
    }
  }

  private generateId(element: Element): string {
    return `project-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize the system when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  StatusQuerySystem.getInstance();
});

// Make it globally available
declare global {
  interface Window {
    statusQuerySystem: StatusQuerySystem;
  }
}

window.statusQuerySystem = StatusQuerySystem.getInstance();
