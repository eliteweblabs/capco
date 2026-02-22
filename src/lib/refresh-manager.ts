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
  private dragInProgress: boolean = false; // Skip refresh during drag (prevents DOM updates mid-drag)

  // Fields that are computed client-side and don't need server polling
  private COMPUTED_FIELDS = ["updatedAt", "createdAt"];

  // Store global state for conditional rendering
  private globalState: Map<string, any> = new Map();

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
   * @param projectId - When provided, only update elements for that project
   * @param userId - When provided, only update elements for that user (e.g. admin users table)
   */
  public updateField(
    fieldName: string,
    newValue: any,
    projectId?: string | number,
    userId?: string
  ): void {
    let elements: NodeListOf<Element>;

    if (projectId) {
      elements = document.querySelectorAll(
        `[data-refresh="${fieldName}"][data-project-id="${projectId}"]`
      );
    } else if (userId) {
      elements = document.querySelectorAll(
        `[data-refresh="${fieldName}"][data-user-id="${userId}"]`
      );
    } else {
      elements = document.querySelectorAll(`[data-refresh="${fieldName}"]`);
    }

    if (elements.length === 0) {
      // console.log(
      //   `🔄 [REFRESH-MANAGER] No elements found with data-refresh="${fieldName}"${projectId ? ` for project ${projectId}` : ""}`
      // );
      return;
    }

    // console.log(`🔄 [REFRESH-MANAGER] Found ${elements.length} elements to update`);

    elements.forEach((element, index) => {
      try {
        // CRITICAL: Skip elements that are actively being edited or saving
        if (element.hasAttribute("data-edited") || element.classList.contains("saving")) {
          // console.log(
          //   `🔄 [REFRESH-MANAGER] ⏭️  Skipping element ${index + 1} - being edited/saved`
          // );
          return; // Skip this element
        }

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
   * @param updates - Field names and values to update
   * @param projectId - Optional. When provided, only updates elements for that project
   * @param userId - Optional. When provided, only updates elements for that user
   */
  public updateFields(
    updates: Record<string, any>,
    projectId?: string | number,
    userId?: string
  ): void {
    Object.entries(updates).forEach(([fieldName, value]) => {
      this.updateField(fieldName, value, projectId, userId);
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
          // Only update if newValue is valid
          if (newValue && newValue !== "" && newValue !== "null") {
            element.setAttribute("data-due-date", String(newValue));
            // Format the display value
            try {
              const date = new Date(newValue);
              // Validate the date is actually valid
              if (!isNaN(date.getTime())) {
                displayValue = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  hour12: true,
                });
              } else {
                displayValue = String(newValue);
              }
            } catch (e) {
              displayValue = String(newValue);
            }
          } else {
            // Handle null/empty dates - clear the field
            element.setAttribute("data-due-date", "");
            displayValue = "";
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
        // Handle null/empty dates
        if (!newValue || newValue === "" || newValue === "null") {
          displayValue = "";
        } else {
          try {
            const date = new Date(newValue);
            // Validate the date is actually valid
            if (!isNaN(date.getTime())) {
              displayValue = date.toLocaleString();
            } else {
              displayValue = String(newValue);
            }
          } catch (e) {
            displayValue = String(newValue);
          }
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
    // IMPORTANT: Use regular function (not arrow) so callback.call(element, newValue) sets this=element
    this.registerCallback("status", function (this: any, value: number) {
      this.textContent = String(value);
      this.classList.remove("status-10", "status-20", "status-30", "status-40", "status-50");
      this.classList.add(`status-${value}`);
    });

    this.registerCallback("adminStatusName", function (this: any, value: string) {
      this.textContent = value;
    });

    this.registerCallback("title", function (this: any, value: string) {
      this.textContent = value;
    });

    this.registerCallback("address", function (this: any, value: string) {
      this.textContent = value;
    });

    this.registerCallback("companyName", function (this: any, value: string) {
      const suffix = this.getAttribute("data-refresh-suffix");
      const displayValue = value || (suffix ? "User" : "");
      this.textContent = suffix ? `${displayValue}${suffix}` : displayValue || "—";
      this.setAttribute("data-meta-value", value || "");
      this.closest("tr")?.setAttribute("data-company", (value || "").toLowerCase());
    });

    this.registerCallback("displayName", function (this: any, value: string) {
      const display = value || "Unknown User";
      this.textContent = display;
      this.setAttribute("data-meta-value", display);
      this.closest("tr")?.setAttribute("data-name", display.toLowerCase());
    });

    this.registerCallback("email", function (this: any, value: string) {
      const email = value || "";
      this.textContent = email;
      this.setAttribute("data-meta-value", email);
      this.closest("tr")?.setAttribute("data-email", email.toLowerCase());
    });

    this.registerCallback("role", function (this: any, value: string) {
      const role = value || "";
      this.textContent = role;
      this.setAttribute("data-meta-value", role);
      this.closest("tr")?.setAttribute("data-role", role);
    });

    this.registerCallback("projectCount", function (this: any, value: number) {
      const count = Number(value) || 0;

      if (count === 0) {
        this.innerHTML = "New<span class='hidden sm:inline'> Project</span>";
      } else if (count === 1) {
        this.innerHTML = "1 Active Project";
      } else {
        this.innerHTML = `${count} Active Projects`;
      }
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
    if (this.isActive) return;

    this.isActive = true;
    const intervalSeconds = this.refreshIntervalMs / 1000;
    const startTime = new Date().toLocaleTimeString();
    console.log(
      `🔄 [REFRESH-MANAGER] [${startTime}] Polling enabled - interval ${intervalSeconds}s`
    );

    this.cycleAndRefresh();

    this.refreshInterval = setInterval(() => {
      console.log(`🔄 [REFRESH-MANAGER] Polling tick - starting cycle`);
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
   * Pause/resume polling during drag. Call from accordion-reorder-init to prevent DOM updates mid-drag.
   */
  public setDragInProgress(inProgress: boolean): void {
    this.dragInProgress = inProgress;
  }

  /**
   * Cycle through all refreshable elements and check for updates
   */
  private async cycleAndRefresh(): Promise<void> {
    if (this.dragInProgress) {
      console.log(`🔄 [REFRESH-MANAGER] ⏭️ Skipping - drag in progress`);
      return;
    }

    const cycleStartTime = new Date().toLocaleTimeString();
    console.log(`🔄 [REFRESH-MANAGER] [${cycleStartTime}] Polling started`);

    // Prevent concurrent refresh cycles
    if (this.isRefreshing) {
      console.log(`🔄 [REFRESH-MANAGER] ⏭️ Skipping - already in progress`);
      return;
    }

    // Rate limiting - prevent refreshes too close together
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTime;
    if (timeSinceLastRefresh < this.minRefreshGap) {
      console.log(
        `🔄 [REFRESH-MANAGER] ⏭️ Skipping - too soon (${timeSinceLastRefresh}ms since last, min ${this.minRefreshGap}ms)`
      );
      return;
    }

    this.isRefreshing = true;
    this.lastRefreshTime = now;

    const elements = this.getRefreshableElements();
    if (elements.length === 0) {
      console.log(`🔄 [REFRESH-MANAGER] Polling finished - no refreshable elements`);
      this.isRefreshing = false;
      return;
    }

    const groupedElements = this.groupElementsByContext(elements);
    console.log(
      `🔄 [REFRESH-MANAGER] Polling ${elements.length} elements across ${groupedElements.size} contexts`
    );

    const results: { context: string; fetched: boolean; updates: number }[] = [];

    // Process each group
    for (const [contextKey, fieldGroups] of groupedElements.entries()) {
      const updateCount = await this.refreshContextGroup(contextKey, fieldGroups);
      results.push({
        context: contextKey,
        fetched: updateCount !== null,
        updates: updateCount ?? 0,
      });
    }

    const cycleEndTime = new Date().toLocaleTimeString();
    const totalUpdates = results.reduce((s, r) => s + r.updates, 0);
    console.log(
      `🔄 [REFRESH-MANAGER] [${cycleEndTime}] Polling finished - ${totalUpdates} updates across ${results.length} contexts`,
      results
    );
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

      // Skip elements without context; global refresh is not implemented
      if (!projectId && !userId) return;

      const contextKey = projectId ? `project:${projectId}` : `user:${userId}`;

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
   * @returns Number of element updates made, or null if fetch failed
   */
  private async refreshContextGroup(
    contextKey: string,
    fieldGroups: Map<string, Element[]>
  ): Promise<number | null> {
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
        // Check if it's a 404 (project/user was deleted)
        if (contextType === "project") {
          const row = document.querySelector(`tr[data-project-id="${contextId}"]`);
          if (row) row.remove();
        } else if (contextType === "user") {
          const row = document.querySelector(`tr[data-user-id="${contextId}"]`);
          if (row) {
            const detail = row.nextElementSibling;
            if (
              detail?.classList.contains("accordion-detail") ||
              detail?.hasAttribute("data-slot")
            ) {
              detail.remove();
            }
            row.remove();
          }
        } else if (contextType !== "global") {
          // Only log for unexpected failures; global context is not implemented
          console.log(`🔄 [REFRESH-MANAGER] ${contextKey}: No data (404/error)`);
        }
        return null;
      }

      let updateCount = 0;
      const fieldsChecked: string[] = [];

      for (const [fieldName, elements] of fieldGroups.entries()) {
        // Skip fields that are computed client-side
        if (this.COMPUTED_FIELDS.includes(fieldName)) {
          //   console.log(
          //   `🔄 [REFRESH-MANAGER] ⏭️ Skipping ${fieldName} - computed live on client-side`
          // );
          continue;
        }

        const currentValue = currentData[fieldName];
        if (currentValue === undefined) continue;

        fieldsChecked.push(fieldName);

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
              // Handle null/empty dates
              if (
                !currentElementValue ||
                currentElementValue === "" ||
                currentElementValue === "null"
              ) {
                valuesAreDifferent = newValueString !== "" && newValueString !== "null";
              } else if (!newValueString || newValueString === "" || newValueString === "null") {
                valuesAreDifferent = currentElementValue !== "" && currentElementValue !== "null";
              } else {
                // Both have values, compare as dates
                const currentDate = new Date(currentElementValue);
                const newDate = new Date(newValueString);
                // Validate both dates are valid before comparing
                if (!isNaN(currentDate.getTime()) && !isNaN(newDate.getTime())) {
                  // Compare timestamps (milliseconds since epoch)
                  valuesAreDifferent = currentDate.getTime() !== newDate.getTime();
                } else {
                  // If date parsing fails, fall back to string comparison
                  valuesAreDifferent = currentElementValue !== newValueString;
                }
              }
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
          updateCount += needsUpdateCount;
          this.updateField(
            fieldName,
            currentValue,
            contextType === "project" ? contextId : undefined,
            contextType === "user" ? contextId : undefined
          );
        }
      }

      if (updateCount > 0) {
        console.log(`🔄 [REFRESH-MANAGER] ${contextKey}: ${updateCount} updates`, {
          fields: fieldsChecked,
          data: currentData,
        });
      }
      return updateCount;
    } catch (error) {
      console.error(`🔄 [REFRESH-MANAGER] Error refreshing ${contextKey}:`, error);
      return null;
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
        // console.log(`🔄 [REFRESH-MANAGER] Global context refresh not implemented yet`);
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

  /**
   * Set global state value (for aggregate counts, etc.)
   */
  public setGlobalState(key: string, value: any): void {
    const oldValue = this.globalState.get(key);
    this.globalState.set(key, value);

    // console.log(`🌐 [REFRESH-MANAGER] Global state updated: ${key} = ${value} (was ${oldValue})`);

    // Update any elements watching this global state
    this.updateField(key, value);

    // Check and update conditional visibility
    this.updateConditionalVisibility();
  }

  /**
   * Get global state value
   */
  public getGlobalState(key: string): any {
    return this.globalState.get(key);
  }

  /**
   * Fetch and update global counts (like total project count)
   */
  public async refreshGlobalCounts(): Promise<void> {
    try {
      // Fetch project count - API uses session to determine access
      // Clients see only their projects, Admins see all
      const projectCountUrl = `/api/projects/get?count=true`;

      // console.log(`🌐 [REFRESH-MANAGER] Fetching global counts from ${projectCountUrl}`);

      const response = await fetch(projectCountUrl);
      if (!response.ok) {
        console.error(`🌐 [REFRESH-MANAGER] Failed to fetch global counts: ${response.status}`);
        return;
      }

      const data = await response.json();
      const projectCount = data.count ?? data.projects?.length ?? 0;

      // console.log(
      //   `🌐 [REFRESH-MANAGER] Fetched project count: ${projectCount} (was: ${this.globalState.get("projectCount")})`
      // );

      // Update global state
      this.setGlobalState("projectCount", projectCount);

      // Dispatch custom event for other listeners
      window.dispatchEvent(
        new CustomEvent("globalCountsUpdated", {
          detail: { projectCount },
        })
      );
    } catch (error) {
      console.error(`🌐 [REFRESH-MANAGER] Error fetching global counts:`, error);
    }
  }

  /**
   * Update visibility of elements based on data-condition attributes
   *
   * Format: data-condition="expression:action"
   * Examples:
   * - data-condition="projectCount>0:show" (show when count > 0)
   * - data-condition="projectCount===0:hide" (hide when count === 0)
   */
  private updateConditionalVisibility(): void {
    const elements = document.querySelectorAll("[data-condition]");

    const currentProjectCount = this.globalState.get("projectCount");

    // Don't update if projectCount hasn't been set yet
    if (currentProjectCount === undefined) {
      // console.log(
      //   `🔄 [REFRESH-MANAGER] updateConditionalVisibility() skipped - projectCount not set yet`
      // );
      return;
    }

    // console.log(
    //   `🔄 [REFRESH-MANAGER] updateConditionalVisibility() called - projectCount=${currentProjectCount}, checking ${elements.length} elements`
    // );

    elements.forEach((element, index) => {
      const condition = element.getAttribute("data-condition");
      if (!condition) return;

      let shouldShow = false;

      // Parse condition format: "expression:action"
      const parts = condition.split(":");
      if (parts.length === 2) {
        const [expression, action] = parts;
        const expressionResult = this.evaluateCondition(expression);

        // If action is "show", element shows when expression is true
        // If action is "hide", element hides when expression is true (so shows when false)
        shouldShow = action === "show" ? expressionResult : !expressionResult;

        // console.log(
        //   `🔄 [REFRESH-MANAGER] [${index}] condition="${condition}", expression="${expression}"=${expressionResult}, action="${action}", shouldShow=${shouldShow}`
        // );
      } else {
        // Legacy support for old format
        if (condition === "show-if-empty") {
          const projectCount = this.globalState.get("projectCount") ?? 0;
          shouldShow = projectCount === 0;
        } else if (condition === "show-if-has-items") {
          const projectCount = this.globalState.get("projectCount") ?? 0;
          shouldShow = projectCount > 0;
        } else {
          // Try to evaluate as expression
          shouldShow = this.evaluateCondition(condition);
        }
        // console.log(
        //   `🔄 [REFRESH-MANAGER] [${index}] legacy condition="${condition}", shouldShow=${shouldShow}`
        // );
      }

      // Update visibility with animation
      const currentlyHidden = element.classList.contains("hidden");

      if (shouldShow && currentlyHidden) {
        // console.log(
        //   `🔄 [REFRESH-MANAGER] ✅ [${index}] SHOWING element with condition: ${condition}`
        // );
        element.classList.remove("hidden");
        // Add fade-in animation
        element.classList.add("animate-fadeIn");
        setTimeout(() => element.classList.remove("animate-fadeIn"), 300);
      } else if (!shouldShow && !currentlyHidden) {
        // console.log(
        //   `🔄 [REFRESH-MANAGER] ❌ [${index}] HIDING element with condition: ${condition}`
        // );
        // Add fade-out animation
        element.classList.add("animate-fadeOut");
        setTimeout(() => {
          element.classList.add("hidden");
          element.classList.remove("animate-fadeOut");
        }, 300);
      } else {
        // console.log(
        //   `🔄 [REFRESH-MANAGER] ⏭️  [${index}] NO CHANGE for condition: ${condition} (hidden=${currentlyHidden}, shouldShow=${shouldShow})`
        // );
      }
    });
  }

  /**
   * Evaluate a condition expression against global state
   */
  private evaluateCondition(condition: string): boolean {
    try {
      // Replace state keys with their values
      let expression = condition;

      // Log the original expression
      // console.log(`🔄 [REFRESH-MANAGER] Evaluating expression: "${condition}"`);

      // Replace known state keys
      this.globalState.forEach((value, key) => {
        const regex = new RegExp(`\\b${key}\\b`, "g");
        const before = expression;
        expression = expression.replace(regex, String(value));
        if (before !== expression) {
          // console.log(
          //   `🔄 [REFRESH-MANAGER]   Replaced "${key}" with "${value}" -> "${expression}"`
          // );
        }
      });

      // Safely evaluate simple expressions
      // Only allow: numbers, operators (>, <, >=, <=, ===, !==, ==, !=), and, or
      const safeExpression = /^[\d\s><=!&|()]+$/;
      if (!safeExpression.test(expression)) {
        console.warn(
          `🔄 [REFRESH-MANAGER] ⚠️  Unsafe condition expression: ${condition} -> ${expression}`
        );
        return false;
      }

      // Use Function constructor for safe evaluation
      const result = new Function(`return ${expression}`)();
      // console.log(`🔄 [REFRESH-MANAGER]   Result: ${expression} = ${result}`);
      return result;
    } catch (error) {
      console.error(`🔄 [REFRESH-MANAGER] ❌ Error evaluating condition "${condition}":`, error);
      return false;
    }
  }

  /**
   * Register callback for global state changes
   */
  public onGlobalStateChange(key: string, callback: (value: any) => void): void {
    this.registerCallback(key, callback);
  }
}

// Export singleton instance
export const refreshManager = RefreshManager.getInstance();

// Make it globally available for easy access
if (typeof window !== "undefined") {
  (window as any).refreshManager = refreshManager;
}
