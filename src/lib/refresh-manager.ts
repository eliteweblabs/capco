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
  private refreshIntervalMs: number = 15000; // 15 seconds

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
    // // // console.log(
      `🔄 [REFRESH-MANAGER] Updating field '${fieldName}' to:`,
      newValue,
      projectId ? `for project ${projectId}` : ""
    );

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
      // // // console.log(
        `🔄 [REFRESH-MANAGER] No elements found with data-refresh="${fieldName}"${projectId ? ` for project ${projectId}` : ""}`
      );
      return;
    }

    // // // console.log(`🔄 [REFRESH-MANAGER] Found ${elements.length} elements to update`);

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

        // // // console.log(`🔄 [REFRESH-MANAGER] Updated element ${index + 1}/${elements.length}`);
      } catch (error) {
        console.error(`🔄 [REFRESH-MANAGER] Error updating element ${index + 1}:`, error);
      }
    });
  }

  /**
   * Update multiple fields at once
   */
  public updateFields(updates: Record<string, any>): void {
    // // // console.log(`🔄 [REFRESH-MANAGER] Updating multiple fields:`, updates);

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

    // Handle different element types
    if (tagName === "input") {
      if (elementType === "checkbox") {
        (element as HTMLInputElement).checked = Boolean(newValue);
      } else {
        (element as HTMLInputElement).value = String(newValue);
      }
    } else if (tagName === "select") {
      (element as HTMLSelectElement).value = String(newValue);
    } else if (tagName === "textarea") {
      (element as HTMLTextAreaElement).value = String(newValue);
    } else {
      // For other elements, update text content
      element.textContent = String(newValue);
    }
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
    this.registerCallback("admin_status_name", (value: string) => {
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
    this.registerCallback("company_name", (value: string) => {
      const element = this as any;
      element.textContent = value;
    });

    // Assigned user name - update text content
    this.registerCallback("assigned_to_name", (value: string) => {
      const element = this as any;
      element.textContent = value || "Unassigned";
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
    // // // console.log(`🔄 [REFRESH-MANAGER] Found ${elements.length} refreshable elements:`);

    elements.forEach((element, index) => {
      const fieldName = element.getAttribute("data-refresh");
      const tagName = element.tagName.toLowerCase();
      const id = element.id || `element-${index}`;

      // // // console.log(`  ${index + 1}. ${tagName}#${id} -> data-refresh="${fieldName}"`);
    });
  }

  /**
   * Start the automatic refresh cycle
   */
  public startAutoRefresh(): void {
    if (this.isActive) {
      // // // console.log(`🔄 [REFRESH-MANAGER] Auto-refresh is already active`);
      return;
    }

    this.isActive = true;
    // // // console.log(
      `🔄 [REFRESH-MANAGER] Starting auto-refresh cycle every ${this.refreshIntervalMs / 1000} seconds`
    );

    this.refreshInterval = setInterval(() => {
      this.cycleAndRefresh();
    }, this.refreshIntervalMs);
  }

  /**
   * Stop the automatic refresh cycle
   */
  public stopAutoRefresh(): void {
    if (!this.isActive) {
      // // // console.log(`🔄 [REFRESH-MANAGER] Auto-refresh is not active`);
      return;
    }

    this.isActive = false;
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    // // // console.log(`🔄 [REFRESH-MANAGER] Stopped auto-refresh cycle`);
  }

  /**
   * Set the refresh interval (in milliseconds)
   */
  public setRefreshInterval(intervalMs: number): void {
    this.refreshIntervalMs = intervalMs;
    // // // console.log(`🔄 [REFRESH-MANAGER] Refresh interval set to ${intervalMs / 1000} seconds`);

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
    // // // console.log(`🔄 [REFRESH-MANAGER] Starting refresh cycle...`);

    const elements = this.getRefreshableElements();
    if (elements.length === 0) {
      // // // console.log(`🔄 [REFRESH-MANAGER] No refreshable elements found`);
      return;
    }

    // // // console.log(`🔄 [REFRESH-MANAGER] Found ${elements.length} refreshable elements to check`);

    // Group elements by project/user and field type for efficient API calls
    const groupedElements = this.groupElementsByContext(elements);

    // Process each group
    for (const [contextKey, fieldGroups] of groupedElements.entries()) {
      await this.refreshContextGroup(contextKey, fieldGroups);
    }

    // // // console.log(`🔄 [REFRESH-MANAGER] Refresh cycle completed`);
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

    // // // console.log(
      `🔄 [REFRESH-MANAGER] Refreshing ${contextType} ${contextId} with ${fieldGroups.size} field types`
    );

    try {
      // Fetch current data from database
      const currentData = await this.fetchCurrentData(
        contextType,
        contextId,
        Array.from(fieldGroups.keys())
      );

      if (!currentData) {
        // // // console.log(`🔄 [REFRESH-MANAGER] No data found for ${contextKey}`);
        return;
      }

      // Update each field group
      for (const [fieldName, elements] of fieldGroups.entries()) {
        const currentValue = currentData[fieldName];
        if (currentValue === undefined) continue;

        // Check if any element needs updating
        const needsUpdate = elements.some((element) => {
          const currentElementValue = this.getElementValue(element);
          return currentElementValue !== String(currentValue);
        });

        if (needsUpdate) {
          // // // console.log(`🔄 [REFRESH-MANAGER] Updating ${fieldName} from database:`, currentValue);
          this.updateField(
            fieldName,
            currentValue,
            contextType === "project" ? contextId : undefined
          );
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
        apiUrl = `/api/get-project/${contextId}`;
      } else if (contextType === "user") {
        apiUrl = `/api/get-user/${contextId}`;
      } else {
        // For global context, we might need a different approach
        // // // console.log(`🔄 [REFRESH-MANAGER] Global context refresh not implemented yet`);
        return null;
      }

      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error(`🔄 [REFRESH-MANAGER] Failed to fetch data from ${apiUrl}:`, response.status);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`🔄 [REFRESH-MANAGER] Error fetching data:`, error);
      return null;
    }
  }

  /**
   * Get the current value of an element
   */
  private getElementValue(element: Element): string {
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
    // // // console.log(`🔄 [REFRESH-MANAGER] Force refresh requested`);
    await this.cycleAndRefresh();
  }
}

// Export singleton instance
export const refreshManager = RefreshManager.getInstance();

// Make it globally available for easy access
if (typeof window !== "undefined") {
  (window as any).refreshManager = refreshManager;
}
