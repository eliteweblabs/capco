/**
 * RefreshManager - Handles updating DOM elements after database changes
 *
 * Usage:
 * 1. Add data-refresh="column_name" to any DOM element that should be updated
 * 2. Add data-project-id="123" or data-user-id="456" to specify the context
 * 3. Call RefreshManager.updateField('column_name', newValue) after database updates
 * 4. Or use RefreshManager.startAutoRefresh() to automatically check for changes every 15 seconds
 *
 * Auto-refresh functionality:
 * - Cycles through all elements with data-refresh attributes every 15 seconds
 * - Groups elements by project/user context for efficient API calls
 * - Fetches current data from database and compares with DOM values
 * - Only updates elements that have changed values
 * - Supports both project and user contexts
 */

export class RefreshManager {
  private static instance: RefreshManager;
  private updateCallbacks: Map<string, (value: any) => void> = new Map();
  private refreshInterval: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private refreshIntervalMs: number = 5000; // 3 seconds (increased from 15s to reduce database load)
  private isRefreshing: boolean = false; // Prevent concurrent refresh cycles
  private lastRefreshTime: number = 0; // Track last refresh time
  private minRefreshGap: number = 3000; // Minimum 3 seconds between refreshes

  // Fields that are computed client-side and don't need server polling
  private COMPUTED_FIELDS = ["updatedAt", "createdAt"];

  private constructor() {
    // Register default update callbacks for common field types
    this.registerDefaultCallbacks();
  }

  public static getInstance(): RefreshManager {
    if (!RefreshManager.instance) {
      RefreshManager.instance = new RefreshManager();
    }
    return RefreshManager.instance;
  }

  /**
   * Register a custom callback for a specific field type
   */
  public registerCallback(fieldName: string, callback: (value: any) => void): void {
    this.updateCallbacks.set(fieldName, callback);
  }

  /**
   * Update a specific field across all elements with matching data-refresh attribute
   */
  public updateField(fieldName: string, newValue: any, projectId?: string | number): void {
    // console.log(
    //   `🔄 [REFRESH-MANAGER] Updating field '${fieldName}' to:`,
    //   newValue,
    //   projectId ? `for project ${projectId}` : ""
    // );

    // Find all elements with matching data-refresh attribute
    let elements: NodeListOf<Element>;

    if (projectId) {
      // If projectId is specified, only update elements for that specific project
      elements = document.querySelectorAll(
        `[data-refresh="${fieldName}"][data-project-id="${projectId}"]`
      );
    } else {
      // Update all elements with matching data-refresh attribute
      elements = document.querySelectorAll(`[data-refresh="${fieldName}"]`);
    }

    if (elements.length === 0) {
      // console.log(
      //   `🔄 [REFRESH-MANAGER] No elements found with data-refresh="${fieldName}"${projectId ? ` for project ${projectId}` : ""}`
      // );
      return;
    }

    console.log(`🔄 [REFRESH-MANAGER] Found ${elements.length} elements to update`);

    elements.forEach((element, index) => {
      try {
        // Use custom callback if registered
        if (this.updateCallbacks.has(fieldName)) {
          const callback = this.updateCallbacks.get(fieldName)!;
          callback.call(element, newValue);
        } else {
          // Use default update logic
          this.defaultUpdate(element, newValue);
        }

        // console.log(`🔄 [REFRESH-MANAGER] Updated element ${index + 1}/${elements.length}`);
      } catch (error) {
        console.error(`🔄 [REFRESH-MANAGER] Error updating element ${index + 1}:`, error);
      }
    });
  }

  /**
   * Update multiple fields at once
   */
  public updateFields(updates: Record<string, any>): void {
    // console.log(`🔄 [REFRESH-MANAGER] Updating multiple fields:`, updates);

    Object.entries(updates).forEach(([fieldName, value]) => {
      this.updateField(fieldName, value);
    });
  }

  /**
   * Default update logic for common element types
   */
  private defaultUpdate(element: Element, newValue: any): void {
    const tagName = element.tagName.toLowerCase();
    const elementType = element.getAttribute("type")?.toLowerCase();

    // CRITICAL: Update data-meta-value FIRST (for next comparison)
    if (element.hasAttribute("data-meta-value")) {
      element.setAttribute("data-meta-value", String(newValue));
    }

    // Handle different element types - update display with animation
    if (tagName === "input") {
      if (elementType === "checkbox") {
        (element as HTMLInputElement).checked = Boolean(newValue);
      } else {
        let displayValue: string;

        // For date inputs with formatted display, update the data attribute
        if (element.hasAttribute("data-due-date")) {
          element.setAttribute("data-due-date", String(newValue));
          // Format the display value
          try {
            const date = new Date(newValue);
            displayValue = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              hour12: true,
            });
          } catch (e) {
            displayValue = String(newValue);
          }
        } else {
          displayValue = String(newValue);
        }

        // Animate the value change
        this.animateValueChange(element as HTMLInputElement, displayValue);
      }
    } else if (tagName === "select") {
      (element as HTMLSelectElement).value = String(newValue);
    } else if (tagName === "textarea") {
      (element as HTMLTextAreaElement).value = String(newValue);
    } else {
      // For span elements with dates, format them nicely
      const fieldName = element.getAttribute("data-refresh");
      let displayValue: string;

      if (fieldName && (fieldName.includes("Date") || fieldName.includes("At"))) {
        try {
          const date = new Date(newValue);
          displayValue = date.toLocaleString();
        } catch (e) {
          displayValue = String(newValue);
        }
      } else {
        displayValue = String(newValue);
      }

      // Animate the value change for text elements
      this.animateTextChange(element as HTMLElement, displayValue);
    }
  }

  /**
   * Animate value change for input elements (slide out old, slide in new)
   */
  private animateValueChange(element: HTMLInputElement, newValue: string): void {
    const oldValue = element.value;

    // Skip animation if values are the same
    if (oldValue === newValue) {
      return;
    }

    // Create wrapper if it doesn't exist
    let wrapper = element.parentElement;
    if (!wrapper || !wrapper.classList.contains("relative")) {
      console.warn("Input element needs a relative positioned parent for animation");
      element.value = newValue;
      return;
    }

    // Create old value overlay
    const overlay = document.createElement("div");
    overlay.textContent = oldValue;
    overlay.className =
      "absolute inset-0 flex items-center justify-center bg-inherit text-inherit pointer-events-none";
    overlay.style.animation = "slideOutDown 0.3s ease-out forwards";
    wrapper.appendChild(overlay);

    // Update the input value immediately but make it invisible briefly
    element.style.opacity = "0";
    element.value = newValue;

    // Slide in the new value
    setTimeout(() => {
      element.style.animation = "slideInDown 0.3s ease-out forwards";
      element.style.opacity = "1";

      // Clean up
      setTimeout(() => {
        overlay.remove();
        element.style.animation = "";
      }, 300);
    }, 50);
  }

  /**
   * Animate text change for span/div elements (slide out old, slide in new)
   */
  private animateTextChange(element: HTMLElement, newValue: string): void {
    const oldValue = element.textContent || "";

    // Skip animation if values are the same
    if (oldValue === newValue) {
      return;
    }

    // Slide out old value
    element.style.animation = "slideOutDown 0.3s ease-out forwards";

    setTimeout(() => {
      element.textContent = newValue;
      element.style.animation = "slideInDown 0.3s ease-out forwards";

      // Clean up
      setTimeout(() => {
        element.style.animation = "";
      }, 300);
    }, 300);
  }

  /**
   * Register default callbacks for common field types
   */
  private registerDefaultCallbacks(): void {
    // Status field - update text and potentially styling
    this.registerCallback("status", (value: number) => {
      const element = this as any;
      element.textContent = String(value);

      // Add status-specific styling if needed
      element.classList.remove("status-10", "status-20", "status-30", "status-40", "status-50");
      element.classList.add(`status-${value}`);
    });

    // Admin status name - update text content
    this.registerCallback("adminStatusName", (value: string) => {
      const element = this as any;
      element.textContent = value;
    });

    // Project title - update text content
    this.registerCallback("title", (value: string) => {
      const element = this as any;
      element.textContent = value;
    });

    // Project address - update text content
    this.registerCallback("address", (value: string) => {
      const element = this as any;
      element.textContent = value;
    });

    // User name/company name - update text content
    this.registerCallback("companyName", (value: string) => {
      const element = this as any;
      element.textContent = value;
    });
  }

  /**
   * Get all elements that have data-refresh attributes (for debugging)
   */
  public getRefreshableElements(): Element[] {
    return Array.from(document.querySelectorAll("[data-refresh]"));
  }

  /**
   * Log all refreshable elements (for debugging)
   */
  public debugRefreshableElements(): void {
    const elements = this.getRefreshableElements();
    // console.log(`🔄 [REFRESH-MANAGER] Found ${elements.length} refreshable elements:`);

    elements.forEach((element, index) => {
      const fieldName = element.getAttribute("data-refresh");
      const tagName = element.tagName.toLowerCase();
      const id = element.id || `element-${index}`;

      // console.log(`  ${index + 1}. ${tagName}#${id} -> data-refresh="${fieldName}"`);
    });
  }

  /**
   * Start the automatic refresh cycle
   */
  public startAutoRefresh(): void {
    if (this.isActive) {
      // console.log(`🔄 [REFRESH-MANAGER] Auto-refresh is already active`);
      return;
    }

    this.isActive = true;
    const intervalSeconds = this.refreshIntervalMs / 1000;
    const startTime = new Date().toLocaleTimeString();
    // console.log(
    //   `🔄 [REFRESH-MANAGER] ⏰ [${startTime}] Starting auto-refresh cycle every ${intervalSeconds} seconds (${this.refreshIntervalMs}ms)`
    // );

    // // Run the first cycle immediately
    // console.log(`🔄 [REFRESH-MANAGER] ⏰ [${startTime}] Running initial refresh cycle immediately`);
    this.cycleAndRefresh();

    // Then set up the interval for subsequent cycles
    this.refreshInterval = setInterval(() => {
      const tickTime = new Date().toLocaleTimeString();
      // console.log(
      //   `🔄 [REFRESH-MANAGER] ⏰⏰⏰ [${tickTime}] INTERVAL TICK (every ${intervalSeconds}s) - starting cycle now`
      // );
      this.cycleAndRefresh();
    }, this.refreshIntervalMs);

    // console.log(
    //   `🔄 [REFRESH-MANAGER] ⏰ Interval ID: ${this.refreshInterval}, will fire every ${this.refreshIntervalMs}ms`
    // );
  }

  /**
   * Stop the automatic refresh cycle
   */
  public stopAutoRefresh(): void {
    if (!this.isActive) {
      // console.log(`🔄 [REFRESH-MANAGER] Auto-refresh is not active`);
      return;
    }

    this.isActive = false;
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    // console.log(`🔄 [REFRESH-MANAGER] Stopped auto-refresh cycle`);
  }

  /**
   * Set the refresh interval (in milliseconds)
   */
  public setRefreshInterval(intervalMs: number): void {
    this.refreshIntervalMs = intervalMs;
    // console.log(`🔄 [REFRESH-MANAGER] Refresh interval set to ${intervalMs / 1000} seconds`);

    // Restart if currently active
    if (this.isActive) {
      this.stopAutoRefresh();
      this.startAutoRefresh();
    }
  }

  /**
   * Check if auto-refresh is currently active
   */
  public isAutoRefreshActive(): boolean {
    return this.isActive;
  }

  /**
   * Cycle through all refreshable elements and check for updates
   */
  private async cycleAndRefresh(): Promise<void> {
    const cycleStartTime = new Date().toLocaleTimeString();
    // console.log(`🔄 [REFRESH-MANAGER] 🟢 [${cycleStartTime}] cycleAndRefresh() called`);

    // Prevent concurrent refresh cycles
    if (this.isRefreshing) {
      // console.log(
      //   `🔄 [REFRESH-MANAGER] ⏭️  [${cycleStartTime}] Skipping refresh cycle - already in progress`
      // );
      return;
    }

    // Rate limiting - prevent refreshes too close together
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTime;
    if (timeSinceLastRefresh < this.minRefreshGap) {
      // console.log(
      //   `🔄 [REFRESH-MANAGER] ⏭️  [${cycleStartTime}] Skipping refresh cycle - too soon (${timeSinceLastRefresh}ms since last refresh, minimum ${this.minRefreshGap}ms)`
      // );
      return;
    }

    this.isRefreshing = true;
    this.lastRefreshTime = now;

    const timestamp = new Date().toLocaleTimeString();
    // console.log(`🔄 [REFRESH-MANAGER] ⏰ [${timestamp}] Starting refresh cycle...`);

    const elements = this.getRefreshableElements();
    if (elements.length === 0) {
      // console.log(`🔄 [REFRESH-MANAGER] No refreshable elements found`);
      this.isRefreshing = false;
      return;
    }

    // console.log(`🔄 [REFRESH-MANAGER] Found ${elements.length} refreshable elements to check`);

    // Group elements by project/user and field type for efficient API calls
    const groupedElements = this.groupElementsByContext(elements);
    // console.log(`🔄 [REFRESH-MANAGER] Grouped into ${groupedElements.size} unique contexts`);

    // Process each group
    for (const [contextKey, fieldGroups] of groupedElements.entries()) {
      await this.refreshContextGroup(contextKey, fieldGroups);
    }

    // console.log(`🔄 [REFRESH-MANAGER] ⏰ [${timestamp}] Refresh cycle completed`);
    this.isRefreshing = false;
  }

  /**
   * Group elements by their context (project/user) and field types
   */
  private groupElementsByContext(elements: Element[]): Map<string, Map<string, Element[]>> {
    const grouped = new Map<string, Map<string, Element[]>>();

    elements.forEach((element) => {
      const fieldName = element.getAttribute("data-refresh");
      if (!fieldName) return;

      const projectId = element.getAttribute("data-project-id");
      const userId = element.getAttribute("data-user-id");

      // Create context key
      let contextKey: string;
      if (projectId) {
        contextKey = `project:${projectId}`;
      } else if (userId) {
        contextKey = `user:${userId}`;
      } else {
        contextKey = "global";
      }

      // Initialize context group if not exists
      if (!grouped.has(contextKey)) {
        grouped.set(contextKey, new Map());
      }

      const contextGroup = grouped.get(contextKey)!;

      // Initialize field group if not exists
      if (!contextGroup.has(fieldName)) {
        contextGroup.set(fieldName, []);
      }

      contextGroup.get(fieldName)!.push(element);
    });

    return grouped;
  }

  /**
   * Refresh a group of elements for a specific context
   */
  private async refreshContextGroup(
    contextKey: string,
    fieldGroups: Map<string, Element[]>
  ): Promise<void> {
    const [contextType, contextId] = contextKey.split(":");

    // console.log(
    //   `🔄 [REFRESH-MANAGER] Refreshing ${contextType} ${contextId} with ${fieldGroups.size} field types`
    // );

    try {
      // Fetch current data from database
      const currentData = await this.fetchCurrentData(
        contextType,
        contextId,
        Array.from(fieldGroups.keys())
      );

      if (!currentData) {
        // Check if it's a 404 (project was deleted)
        if (contextType === "project") {
          // console.log(`🔄 [REFRESH-MANAGER] 🗑️  Project ${contextId} not found (likely deleted)`);
          // Find and remove the row from the DOM
          const row = document.querySelector(`tr[data-project-id="${contextId}"]`);
          if (row) {
            // console.log(`🔄 [REFRESH-MANAGER] 🗑️  Removing deleted project row from DOM`);
            row.remove();
          }
        } else {
          console.log(`🔄 [REFRESH-MANAGER] No data found for ${contextKey}`);
        }
        return;
      }

      // Update each field group
      for (const [fieldName, elements] of fieldGroups.entries()) {
        // Skip fields that are computed client-side
        if (this.COMPUTED_FIELDS.includes(fieldName)) {
          //   console.log(
          //   `🔄 [REFRESH-MANAGER] ⏭️ Skipping ${fieldName} - computed live on client-side`
          // );
          continue;
        }

        const currentValue = currentData[fieldName];
        if (currentValue === undefined) {
          // console.log(`🔄 [REFRESH-MANAGER] ⚠️  Field ${fieldName} not in API response`);
          continue;
        }

        // Check if any element needs updating
        let needsUpdateCount = 0;
        elements.forEach((element) => {
          // CRITICAL: Skip elements that are actively being edited or saving
          if (element.hasAttribute("data-edited") || element.classList.contains("saving")) {
            // console.log(
            //   `🔄 [REFRESH-MANAGER] ⏭️  Skipping ${fieldName} - element is being edited/saved`
            // );
            return; // Skip this element
          }

          const currentElementValue = this.getElementValue(element);
          const newValueString = String(currentValue);

          // Special handling for date fields - compare as Date objects
          let valuesAreDifferent = currentElementValue !== newValueString;

          if (fieldName.includes("Date") || fieldName.includes("At")) {
            try {
              const currentDate = new Date(currentElementValue);
              const newDate = new Date(newValueString);
              // Compare timestamps (milliseconds since epoch)
              valuesAreDifferent = currentDate.getTime() !== newDate.getTime();
            } catch (e) {
              // If date parsing fails, fall back to string comparison
              valuesAreDifferent = currentElementValue !== newValueString;
            }
          }

          if (valuesAreDifferent) {
            needsUpdateCount++;
            // console.log(
            //   `🔄 [REFRESH-MANAGER] 🔄 Field ${fieldName} changed: "${currentElementValue}" → "${newValueString}"`
            // );
          }
        });

        if (needsUpdateCount > 0) {
          // console.log(
          //   `🔄 [REFRESH-MANAGER] Updating ${fieldName} (${needsUpdateCount} elements changed)`
          // );
          this.updateField(
            fieldName,
            currentValue,
            contextType === "project" ? contextId : undefined
          );
        } else {
          console.log(`🔄 [REFRESH-MANAGER] ✓ Field ${fieldName} up to date`);
        }
      }
    } catch (error) {
      console.error(`🔄 [REFRESH-MANAGER] Error refreshing ${contextKey}:`, error);
    }
  }

  /**
   * Fetch current data from database for a specific context and fields
   */
  private async fetchCurrentData(
    contextType: string,
    contextId: string,
    fieldNames: string[]
  ): Promise<Record<string, any> | null> {
    try {
      let apiUrl: string;

      if (contextType === "project") {
        apiUrl = `/api/projects/get?id=${contextId}`;
      } else if (contextType === "user") {
        apiUrl = `/api/users/get?id=${contextId}`;
      } else {
        // For global context, we might need a different approach
        console.log(`🔄 [REFRESH-MANAGER] Global context refresh not implemented yet`);
        return null;
      }

      // console.log(`🔄 [REFRESH-MANAGER] 📡 Fetching: ${apiUrl}`);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error(
          `🔄 [REFRESH-MANAGER] ❌ Failed to fetch data from ${apiUrl}: ${response.status}`
        );
        return null;
      }

      const data = await response.json();
      // console.log(`🔄 [REFRESH-MANAGER] 📦 API Response keys:`, Object.keys(data));
      // console.log(`🔄 [REFRESH-MANAGER] 🔍 Looking for fields:`, fieldNames);

      // The API might return { data: {...} } or { projects: [...] } or just the project directly
      let projectData = data;
      if (data.data) {
        projectData = data.data;
        // console.log(`🔄 [REFRESH-MANAGER] Using data.data`);
      } else if (data.projects && data.projects[0]) {
        projectData = data.projects[0];
        // console.log(`🔄 [REFRESH-MANAGER] Using data.projects[0]`);
      }

      // console.log(`🔄 [REFRESH-MANAGER] 📋 Project data keys:`, Object.keys(projectData));
      return projectData;
    } catch (error) {
      console.error(`🔄 [REFRESH-MANAGER] Error fetching data:`, error);
      return null;
    }
  }

  /**
   * Get the current value of an element
   */
  private getElementValue(element: Element): string {
    // IMPORTANT: Check data-meta-value first (raw database value)
    // This prevents false positives from formatted display values
    const dataMetaValue = element.getAttribute("data-meta-value");
    if (dataMetaValue !== null) {
      return dataMetaValue;
    }

    // Fallback to reading the actual display value
    const tagName = element.tagName.toLowerCase();
    const elementType = element.getAttribute("type")?.toLowerCase();

    if (tagName === "input") {
      if (elementType === "checkbox") {
        return String((element as HTMLInputElement).checked);
      } else {
        return (element as HTMLInputElement).value;
      }
    } else if (tagName === "select") {
      return (element as HTMLSelectElement).value;
    } else if (tagName === "textarea") {
      return (element as HTMLTextAreaElement).value;
    } else {
      return element.textContent || "";
    }
  }

  /**
   * Convenience method to start auto-refresh with a custom interval
   */
  public startAutoRefreshWithInterval(intervalSeconds: number): void {
    this.setRefreshInterval(intervalSeconds * 1000);
    this.startAutoRefresh();
  }

  /**
   * Get refresh statistics (for debugging)
   */
  public getRefreshStats(): { isActive: boolean; intervalMs: number; elementCount: number } {
    return {
      isActive: this.isActive,
      intervalMs: this.refreshIntervalMs,
      elementCount: this.getRefreshableElements().length,
    };
  }

  /**
   * Force a manual refresh cycle (useful for testing)
   */
  public async forceRefresh(): Promise<void> {
    // console.log(`🔄 [REFRESH-MANAGER] Force refresh requested`);

    // Reset the last refresh time to allow immediate refresh
    this.lastRefreshTime = 0;

    await this.cycleAndRefresh();
  }
}

// Export singleton instance
export const refreshManager = RefreshManager.getInstance();

// Make it globally available for easy access
if (typeof window !== "undefined") {
  (window as any).refreshManager = refreshManager;
}
