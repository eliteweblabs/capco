/**
 * Project Element Refresh System - Usage Examples
 * 
 * This file contains practical examples of how to use the project element
 * refresh system to update page elements without full page reloads.
 */

// ============================================================================
// EXAMPLE 1: Update a single project field
// ============================================================================

async function updateProjectStatus(projectId, newStatus) {
  try {
    const response = await fetch("/api/projects/upsert", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: projectId,
        status: newStatus,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update project");
    }

    const result = await response.json();
    
    // Automatically updates all elements with data-project-id="projectId"
    if (result.metadata && window.updateProjectElements) {
      window.updateProjectElements(result.metadata);
    }

    // Show success notification
    if (window.showNotice) {
      window.showNotice("success", "Updated", "Project status updated");
    }
  } catch (error) {
    console.error("Error updating project:", error);
    if (window.showNotice) {
      window.showNotice("error", "Failed", "Could not update project");
    }
  }
}

// ============================================================================
// EXAMPLE 2: Update multiple project fields at once
// ============================================================================

async function updateMultipleFields(projectId, updates) {
  try {
    const response = await fetch("/api/projects/upsert", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: projectId,
        ...updates, // e.g., { status: 50, dueDate: "2026-02-01", assignedToId: "uuid" }
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update project");
    }

    const result = await response.json();
    
    // Automatically updates all changed fields
    if (result.metadata && window.updateProjectElements) {
      window.updateProjectElements(result.metadata);
    }

    return result;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 3: Listen for project update events
// ============================================================================

function setupProjectUpdateListeners() {
  document.addEventListener('projectUpdated', (event) => {
    const { projectId, changedFields, updatedAt } = event.detail;
    
    console.log(`Project ${projectId} was updated at ${updatedAt}`);
    
    // Custom handling for specific fields
    if (changedFields.status !== undefined) {
      console.log(`Status changed to: ${changedFields.status}`);
      // Update any custom status indicators
      updateCustomStatusDisplay(projectId, changedFields.status);
    }
    
    if (changedFields.assignedToId !== undefined) {
      console.log(`Assignment changed to: ${changedFields.assignedToId}`);
      // Refresh related data if needed
      refreshAssignmentData(projectId);
    }
    
    if (changedFields.dueDate !== undefined) {
      console.log(`Due date changed to: ${changedFields.dueDate}`);
      // Update calendar or timeline views
      updateCalendarView(projectId, changedFields.dueDate);
    }
  });
}

// ============================================================================
// EXAMPLE 4: Create HTML structure with auto-update support
// ============================================================================

function createProjectCard(project) {
  const card = document.createElement('div');
  card.className = 'project-card';
  
  // Add data attributes for automatic updates
  card.setAttribute('data-project-id', project.id);
  card.setAttribute('data-updated', project.updatedAt);
  card.setAttribute('data-status', project.status);
  card.setAttribute('data-due-date', project.dueDate || '');
  card.setAttribute('data-assigned-to-id', project.assignedToId || '');
  
  card.innerHTML = `
    <h3>${project.address}</h3>
    
    <!-- Elements with data-field will auto-update their text content -->
    <p>Status: <span data-field="status">${project.status}</span></p>
    <p>Due: <span data-field="dueDate">${project.dueDate || 'Not set'}</span></p>
    <p>Assigned: <span data-field="assignedToId">${project.assignedToId || 'Unassigned'}</span></p>
    
    <!-- Last updated timestamp will auto-update -->
    <small>Updated: <span data-field="updatedAt">${project.updatedAt}</span></small>
  `;
  
  return card;
}

// ============================================================================
// EXAMPLE 5: Batch update multiple projects
// ============================================================================

async function batchUpdateProjects(projectUpdates) {
  // projectUpdates is an array like:
  // [
  //   { id: 1, status: 50 },
  //   { id: 2, dueDate: "2026-02-01" },
  //   { id: 3, assignedToId: "uuid" }
  // ]
  
  const updatePromises = projectUpdates.map(update => 
    fetch("/api/projects/upsert", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    }).then(res => res.json())
  );
  
  try {
    const results = await Promise.all(updatePromises);
    
    // Update all project elements at once
    results.forEach(result => {
      if (result.metadata && window.updateProjectElements) {
        window.updateProjectElements(result.metadata);
      }
    });
    
    console.log(`Successfully updated ${results.length} projects`);
    return results;
  } catch (error) {
    console.error("Error in batch update:", error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 6: Update with optimistic UI
// ============================================================================

async function updateWithOptimisticUI(projectId, fieldName, newValue) {
  // Find all elements for this project
  const elements = document.querySelectorAll(`[data-project-id="${projectId}"]`);
  
  // Store original values for rollback
  const originalValues = new Map();
  
  // Apply optimistic update
  elements.forEach(element => {
    const fieldElement = element.querySelector(`[data-field="${fieldName}"]`);
    if (fieldElement) {
      originalValues.set(fieldElement, fieldElement.textContent);
      fieldElement.textContent = newValue;
      fieldElement.style.opacity = '0.5'; // Visual indicator of pending update
    }
  });
  
  try {
    // Make actual API call
    const response = await fetch("/api/projects/upsert", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: projectId,
        [fieldName]: newValue,
      }),
    });

    if (!response.ok) {
      throw new Error("Update failed");
    }

    const result = await response.json();
    
    // Confirm the update with server data
    if (result.metadata && window.updateProjectElements) {
      window.updateProjectElements(result.metadata);
    }
    
    // Remove opacity indicator
    elements.forEach(element => {
      const fieldElement = element.querySelector(`[data-field="${fieldName}"]`);
      if (fieldElement) {
        fieldElement.style.opacity = '1';
      }
    });
    
  } catch (error) {
    console.error("Update failed, rolling back:", error);
    
    // Rollback to original values
    originalValues.forEach((originalValue, element) => {
      element.textContent = originalValue;
      element.style.opacity = '1';
    });
    
    if (window.showNotice) {
      window.showNotice("error", "Failed", "Could not update project");
    }
  }
}

// ============================================================================
// EXAMPLE 7: Component-specific update handler
// ============================================================================

class ProjectStatusComponent {
  constructor(projectId) {
    this.projectId = projectId;
    this.element = document.querySelector(`[data-project-id="${projectId}"]`);
    
    // Listen for updates specific to this project
    document.addEventListener('projectUpdated', (event) => {
      if (event.detail.projectId === this.projectId) {
        this.handleUpdate(event.detail);
      }
    });
  }
  
  handleUpdate(updateData) {
    const { changedFields } = updateData;
    
    if (changedFields.status !== undefined) {
      this.updateStatusIndicator(changedFields.status);
    }
    
    if (changedFields.dueDate !== undefined) {
      this.updateDueDateDisplay(changedFields.dueDate);
    }
  }
  
  updateStatusIndicator(status) {
    // Custom status indicator update logic
    const statusElement = this.element.querySelector('.status-indicator');
    if (statusElement) {
      statusElement.textContent = this.getStatusName(status);
      statusElement.className = `status-indicator status-${status}`;
    }
  }
  
  updateDueDateDisplay(dueDate) {
    // Custom due date display logic
    const dueDateElement = this.element.querySelector('.due-date-display');
    if (dueDateElement) {
      dueDateElement.textContent = this.formatDate(dueDate);
    }
  }
  
  getStatusName(status) {
    // Map status codes to names
    const statusMap = {
      0: 'Pending',
      50: 'In Progress',
      100: 'Review',
      200: 'Completed',
    };
    return statusMap[status] || 'Unknown';
  }
  
  formatDate(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

// Usage:
// const projectComponent = new ProjectStatusComponent(123);

// ============================================================================
// Initialize on page load
// ============================================================================

if (typeof window !== 'undefined') {
  // Setup event listeners when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupProjectUpdateListeners);
  } else {
    setupProjectUpdateListeners();
  }
}

// ============================================================================
// Export for use in modules
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateProjectStatus,
    updateMultipleFields,
    setupProjectUpdateListeners,
    createProjectCard,
    batchUpdateProjects,
    updateWithOptimisticUI,
    ProjectStatusComponent,
  };
}
