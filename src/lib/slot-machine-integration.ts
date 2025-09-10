/**
 * Integration examples for using the Slot Machine Picker with existing components
 */

import type { SlotMachineConfig } from "./slot-machine-utils";
import { showSlotMachinePicker } from "./slot-machine-utils";

/**
 * Replace the existing status dropdown with a slot machine picker
 */
export async function showStatusPickerModal(
  projectId: string,
  currentStatus: string,
  statuses: Array<{ status_code: number; admin_status_name: string }>
) {
  const statusOptions = statuses.map((status) => ({
    value: status.status_code.toString(),
    label: status.admin_status_name,
  }));

  const result = await showSlotMachinePicker({
    id: "status-picker",
    title: "Select Project Status",
    options: statusOptions,
    selectedValue: currentStatus,
    onSelect: async (value, label) => {
      // Update the project status via API
      try {
        const response = await fetch("/api/update-project-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: projectId,
            status: parseInt(value),
            statusName: label,
          }),
        });

        if (response.ok) {
          // Show success notification
          if ((window as any).showModal) {
            (window as any).showModal(
              "success",
              "Status Updated",
              `Project status changed to: ${label}`
            );
          }

          // Refresh the page or update the UI
          window.location.reload();
        } else {
          throw new Error("Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        if ((window as any).showModal) {
          (window as any).showModal(
            "error",
            "Update Failed",
            "Failed to update project status. Please try again."
          );
        }
      }
    },
  });

  return result;
}

/**
 * Replace the existing staff select dropdown with a slot machine picker
 */
export async function showStaffPickerModal(
  projectId: string,
  currentStaffId: string,
  staffMembers: Array<{ id: string; company_name: string; email: string }>
) {
  const staffOptions = staffMembers.map((staff) => ({
    value: staff.id,
    label: staff.company_name || staff.email,
  }));

  const result = await showSlotMachinePicker({
    id: "staff-picker",
    title: "Assign Staff Member",
    options: staffOptions,
    selectedValue: currentStaffId,
    onSelect: async (value, label) => {
      // Update the project assignment via API
      try {
        const response = await fetch("/api/update-project-assignment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: projectId,
            assignedToId: value,
            assignedToName: label,
          }),
        });

        if (response.ok) {
          // Show success notification
          if ((window as any).showModal) {
            (window as any).showModal(
              "success",
              "Assignment Updated",
              `Project assigned to: ${label}`
            );
          }

          // Refresh the page or update the UI
          window.location.reload();
        } else {
          throw new Error("Failed to update assignment");
        }
      } catch (error) {
        console.error("Error updating assignment:", error);
        if ((window as any).showModal) {
          (window as any).showModal(
            "error",
            "Update Failed",
            "Failed to update project assignment. Please try again."
          );
        }
      }
    },
  });

  return result;
}

/**
 * Show a priority picker for tasks or projects
 */
export async function showPriorityPickerModal(
  itemId: string,
  currentPriority: string,
  onUpdate: (priority: string, label: string) => Promise<void>
) {
  const priorityOptions = [
    { value: "low", label: "Low Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "high", label: "High Priority" },
    { value: "urgent", label: "Urgent" },
  ];

  const result = await showSlotMachinePicker({
    id: "priority-picker",
    title: "Set Priority Level",
    options: priorityOptions,
    selectedValue: currentPriority,
    onSelect: async (value, label) => {
      await onUpdate(value, label);
    },
  });

  return result;
}

/**
 * Show a category picker for organizing items
 */
export async function showCategoryPickerModal(
  itemId: string,
  currentCategory: string,
  categories: Array<{ id: string; name: string }>,
  onUpdate: (categoryId: string, categoryName: string) => Promise<void>
) {
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const result = await showSlotMachinePicker({
    id: "category-picker",
    title: "Select Category",
    options: categoryOptions,
    selectedValue: currentCategory,
    onSelect: async (value, label) => {
      await onUpdate(value, label);
    },
  });

  return result;
}

/**
 * Utility function to replace existing dropdown buttons with slot machine pickers
 */
export function replaceDropdownWithSlotMachine(buttonId: string, pickerConfig: SlotMachineConfig) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  // Remove existing event listeners by cloning the button
  const newButton = button.cloneNode(true) as HTMLElement;
  button.parentNode?.replaceChild(newButton, button);

  // Add new event listener for slot machine picker
  newButton.addEventListener("click", async () => {
    await showSlotMachinePicker(pickerConfig);
  });
}

/**
 * Example: Replace the status dropdown button
 */
export function replaceStatusDropdown() {
  replaceDropdownWithSlotMachine("status-dropdown-button", {
    id: "status-picker",
    title: "Select Project Status",
    options: [
      { value: "0", label: "New Project" },
      { value: "10", label: "In Review" },
      { value: "20", label: "Approved" },
      { value: "30", label: "In Progress" },
      { value: "40", label: "Completed" },
      { value: "50", label: "Delivered" },
    ],
    selectedValue: "20",
    onSelect: (value, label) => {
      console.log("Status selected:", value, label);
      // Handle status change here
    },
  });
}
