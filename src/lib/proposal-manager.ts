/**
 * Proposal Management System
 * Handles all proposal generation, editing, and management functionality
 */

export interface LineItem {
  description: string;
  details?: string;
  quantity: number;
  unitPrice: number;
}

export interface ProposalData {
  projectId: string;
  project: any;
  projectAuthor: any;
  lineItems: LineItem[];
  total: number;
  subject?: string;
}

export class ProposalManager {
  private projectId: string;
  private project: any;
  private projectAuthor: any;
  private isEditMode: boolean = false;
  private cachedLineItems: LineItem[] | null = null;
  private cachedTotal: number | null = null;

  constructor(projectId: string, project: any, projectAuthor: any) {
    this.projectId = projectId;
    this.project = project;
    this.projectAuthor = projectAuthor;
  }

  /**
   * Build and display the proposal
   */
  buildProposal(): void {
    console.log("Building proposal for project:", this.projectId);

    if (!this.project) {
      console.error("Project data not available");
      return;
    }

    // Hide placeholder and show proposal content
    const placeholder = document.getElementById("proposal-placeholder");
    const content = document.getElementById("proposal-content");

    if (placeholder) placeholder.classList.add("hidden");
    if (content) content.classList.remove("hidden");

    // Populate proposal header
    this.populateHeader();

    // Populate project and client information
    this.populateProjectInfo();
    this.populateClientInfo();

    // Generate and populate line items (with caching)
    const lineItems = this.getLineItems();
    this.populateLineItems(lineItems);

    // Update button states based on project status
    this.updateProposalButtonStates(this.project.status);

    console.log("Proposal generated successfully");
  }

  /**
   * Toggle between edit and view mode
   */
  editProposal(): void {
    console.log("Editing proposal for project:", this.projectId);

    const tbody = document.getElementById("proposal-line-items");
    if (!tbody) {
      console.error("Line items table not found");
      return;
    }

    // Toggle edit mode
    this.isEditMode = tbody.classList.contains("editing-mode");

    if (this.isEditMode) {
      // Save changes and exit edit mode
      this.saveProposalChanges();
    } else {
      // Enter edit mode
      this.enterEditMode();
    }
  }

  /**
   * Regenerate proposal with current project data
   */
  regenerateProposal(): void {
    this.buildProposal();
  }

  /**
   * Send proposal by updating project status to 30
   */
  async sendProposal(): Promise<void> {
    if (!this.projectId) {
      console.error("Project ID not available");
      return;
    }

    // Show loading state
    const sendBtn = document.getElementById("send-proposal-btn") as HTMLButtonElement;
    if (sendBtn) {
      const originalText = sendBtn.innerHTML;
      sendBtn.innerHTML = this.getLoadingSpinner() + "Sending...";
      sendBtn.disabled = true;
    }

    try {
      // Update project status to 30 (Proposal Shipped)
      const response = await fetch("/api/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: this.projectId,
          status: 30, // Proposal Shipped
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        if ((window as any).showSuccess) {
          (window as any).showSuccess(
            "Proposal Sent",
            'The proposal has been sent to the client successfully! Status updated to "Proposal Shipped".'
          );
        }

        // Update the project status in the global data
        if (this.project) {
          this.project.status = 30;
        }

        // Update the status display on the page if it exists
        this.updateStatusDisplay();

        // Update send button to show success state
        if (sendBtn) {
          sendBtn.innerHTML = this.getCheckIcon() + "Proposal Sent";
          sendBtn.className = sendBtn.className.replace(
            "bg-purple-600 hover:bg-purple-700",
            "bg-green-600 hover:bg-green-700"
          );
          sendBtn.disabled = true;
        }
      } else {
        console.error("Failed to send proposal:", data.error);
        if ((window as any).showError) {
          (window as any).showError("Error", data.error || "Failed to send proposal");
        }
      }
    } catch (error) {
      console.error("Error sending proposal:", error);
      if ((window as any).showError) {
        (window as any).showError("Error", "Failed to send proposal");
      }
    } finally {
      // Reset button state if there was an error
      if (sendBtn && !sendBtn.disabled) {
        sendBtn.innerHTML = this.getSendIcon() + "Send Proposal";
        sendBtn.disabled = false;
      }
    }
  }

  /**
   * Convert proposal to invoice
   */
  async convertToInvoice(): Promise<void> {
    if (!this.projectId) {
      console.error("Project ID not available");
      return;
    }

    // Show loading state
    const convertBtn = document.querySelector(
      'button[onclick="convertToInvoice()"]'
    ) as HTMLButtonElement;
    if (convertBtn) {
      const originalText = convertBtn.innerHTML;
      convertBtn.innerHTML = this.getLoadingSpinner() + "Converting...";
      convertBtn.disabled = true;
    }

    try {
      // Create invoice from proposal data
      const response = await fetch("/api/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: this.projectId,
          projectData: this.project,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        if ((window as any).showSuccess) {
          (window as any).showSuccess(
            "Invoice Created",
            "Proposal has been converted to an invoice successfully!"
          );
        }

        // Redirect to invoice page
        setTimeout(() => {
          window.location.href = `/invoice/${data.invoice.id}`;
        }, 1500);
      } else {
        console.error("Failed to create invoice:", data.error);
        if ((window as any).showError) {
          (window as any).showError("Error", data.error || "Failed to create invoice");
        }
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      if ((window as any).showError) {
        (window as any).showError("Error", "Failed to create invoice");
      }
    } finally {
      // Reset button state
      if (convertBtn) {
        convertBtn.innerHTML = this.getInvoiceIcon() + "Convert to Invoice";
        convertBtn.disabled = false;
      }
    }
  }

  /**
   * Add a new line item row in edit mode
   */
  addProposalRow(): void {
    const tbody = document.getElementById("proposal-line-items");
    const addRowBtn = document.getElementById("add-row-btn");

    if (!tbody || !addRowBtn) return;

    const rowIndex = tbody.querySelectorAll("tr").length - 1; // -1 for add button row

    const newRow = document.createElement("tr");
    newRow.className = "hover:bg-gray-50 dark:hover:bg-gray-700";
    newRow.innerHTML = this.getEditableRowHTML(rowIndex, {
      description: "New Line Item",
      details: "",
      quantity: 1,
      unitPrice: 0,
    });

    // Insert before the add button row
    tbody.insertBefore(newRow, addRowBtn);

    // Focus on the description input
    const descInput = newRow.querySelector('input[data-field="description"]') as HTMLInputElement;
    if (descInput) {
      descInput.focus();
      descInput.select();
    }
  }

  /**
   * Delete a line item row
   */
  deleteProposalRow(rowIndex: number): void {
    const tbody = document.getElementById("proposal-line-items");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");
    const targetRow = rows[rowIndex];

    if (targetRow && !targetRow.id) {
      // Don't delete the add button row
      // Confirm deletion
      if (confirm("Are you sure you want to delete this line item?")) {
        targetRow.remove();
        this.updateGrandTotal();

        // Update row indices for remaining rows
        this.reindexRows();
      }
    }
  }

  /**
   * Update total for a specific row
   */
  updateRowTotal(rowIndex: number): void {
    const tbody = document.getElementById("proposal-line-items");
    if (!tbody) return;

    const row = tbody.querySelectorAll("tr")[rowIndex];
    if (!row) return;

    const qtyInput = row.querySelector('input[data-field="quantity"]') as HTMLInputElement;
    const priceInput = row.querySelector('input[data-field="unitPrice"]') as HTMLInputElement;
    const totalSpan = row.querySelector(".row-total");

    if (qtyInput && priceInput && totalSpan) {
      const quantity = parseFloat(qtyInput.value) || 0;
      const unitPrice = parseFloat(priceInput.value) || 0;
      const total = quantity * unitPrice;

      totalSpan.textContent = `$${total.toFixed(2)}`;

      // Update grand total
      this.updateGrandTotal();
    }
  }

  // Private methods
  private populateHeader(): void {
    const titleElement = document.getElementById("proposal-project-title");
    const dateElement = document.getElementById("proposal-date");
    const subjectElement = document.getElementById("proposal-subject-text");

    if (titleElement) titleElement.textContent = this.project.title || "Untitled Project";
    if (dateElement) dateElement.textContent = new Date().toLocaleDateString();

    // Set proposal subject from project data or use default
    if (subjectElement) {
      const defaultSubject = `Fire Protection Services Proposal - ${this.project.title || "Project"}`;
      const proposalSubject = this.project.subject || defaultSubject;
      subjectElement.textContent = proposalSubject;
    }

    // Re-initialize subject editing after populating header
    setTimeout(() => {
      if (typeof window.initializeSubjectEditing === "function") {
        window.initializeSubjectEditing();
      }
    }, 100);
  }

  private populateProjectInfo(): void {
    const addressElement = document.getElementById("proposal-address");
    const sqFtElement = document.getElementById("proposal-sq-ft");
    const constructionTypeElement = document.getElementById("proposal-construction-type");

    if (addressElement) addressElement.textContent = this.project.address || "Not specified";
    if (sqFtElement) {
      sqFtElement.textContent = this.project.sq_ft
        ? this.project.sq_ft.toLocaleString()
        : "Not specified";
    }

    // Determine construction type
    let constructionType = "Not specified";
    if (this.project.new_construction) {
      constructionType = "New Construction";
    } else if (this.project.renovation) {
      constructionType = "Renovation";
    } else if (this.project.addition) {
      constructionType = "Addition";
    }

    if (constructionTypeElement) constructionTypeElement.textContent = constructionType;
  }

  private populateClientInfo(): void {
    if (!this.projectAuthor) return;

    const nameElement = document.getElementById("proposal-client-name");
    const emailElement = document.getElementById("proposal-client-email");
    const phoneElement = document.getElementById("proposal-client-phone");

    if (nameElement) {
      nameElement.textContent =
        this.projectAuthor.company_name || this.projectAuthor.name || "Not specified";
    }
    if (emailElement) emailElement.textContent = this.projectAuthor.email || "Not specified";
    if (phoneElement) phoneElement.textContent = this.projectAuthor.phone || "Not specified";
  }

  private populateLineItems(lineItems: LineItem[]): void {
    const tbody = document.getElementById("proposal-line-items");
    if (!tbody) return;

    // Optimize: Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    let total = 0;

    lineItems.forEach((item) => {
      const row = document.createElement("tr");
      row.className = "hover:bg-gray-50 dark:hover:bg-gray-700";

      const itemTotal = item.quantity * item.unitPrice;
      total += itemTotal;

      // Create cells programmatically instead of innerHTML for better performance
      const descCell = document.createElement("td");
      descCell.className = "px-4 py-3 text-sm text-gray-900 dark:text-white";

      const descDiv = document.createElement("div");
      descDiv.className = "font-medium";
      descDiv.textContent = item.description;
      descCell.appendChild(descDiv);

      if (item.details) {
        const detailsDiv = document.createElement("div");
        detailsDiv.className = "text-xs text-gray-500 dark:text-gray-400";
        detailsDiv.textContent = item.details;
        descCell.appendChild(detailsDiv);
      }

      const qtyCell = document.createElement("td");
      qtyCell.className = "px-4 py-3 text-sm text-right text-gray-900 dark:text-white";
      qtyCell.textContent = item.quantity.toString();

      const priceCell = document.createElement("td");
      priceCell.className = "px-4 py-3 text-sm text-right text-gray-900 dark:text-white";
      priceCell.textContent = `$${item.unitPrice.toFixed(2)}`;

      const totalCell = document.createElement("td");
      totalCell.className =
        "px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white";
      totalCell.textContent = `$${itemTotal.toFixed(2)}`;

      row.appendChild(descCell);
      row.appendChild(qtyCell);
      row.appendChild(priceCell);
      row.appendChild(totalCell);

      fragment.appendChild(row);
    });

    // Single DOM update
    tbody.innerHTML = "";
    tbody.appendChild(fragment);

    // Update totals
    this.updateTotalDisplay(total);
  }

  private updateTotalDisplay(total: number): void {
    const totalElement = document.getElementById("proposal-total");
    const totalFooterElement = document.getElementById("proposal-total-footer");

    if (totalElement) totalElement.textContent = total.toFixed(2);
    if (totalFooterElement) totalFooterElement.textContent = total.toFixed(2);
  }

  /**
   * Get line items with caching
   */
  private getLineItems(): LineItem[] {
    if (this.cachedLineItems === null) {
      this.cachedLineItems = this.generateLineItemsFromProject(this.project);
    }
    return this.cachedLineItems;
  }

  /**
   * Clear cached data (call when project changes)
   */
  private clearCache(): void {
    this.cachedLineItems = null;
    this.cachedTotal = null;
  }

  private generateLineItemsFromProject(project: any): LineItem[] {
    const lineItems: LineItem[] = [];

    // Base fire protection design service
    lineItems.push({
      description: "Fire Protection System Design",
      details: "Comprehensive fire sprinkler and alarm system design",
      quantity: 1,
      unitPrice: 2500.0,
    });

    // Square footage based pricing
    if (project.sq_ft && project.sq_ft > 0) {
      const sqFtRate = 0.75; // $0.75 per sq ft
      lineItems.push({
        description: "Design Services - Square Footage",
        details: `${project.sq_ft.toLocaleString()} sq ft @ $${sqFtRate}/sq ft`,
        quantity: project.sq_ft,
        unitPrice: sqFtRate,
      });
    }

    // Construction type additions
    if (project.new_construction) {
      lineItems.push({
        description: "New Construction Services",
        details: "Additional design requirements for new construction",
        quantity: 1,
        unitPrice: 1500.0,
      });
    }

    if (project.renovation) {
      lineItems.push({
        description: "Renovation Services",
        details: "Existing system assessment and modification design",
        quantity: 1,
        unitPrice: 1200.0,
      });
    }

    if (project.addition) {
      lineItems.push({
        description: "Addition Services",
        details: "Integration with existing fire protection systems",
        quantity: 1,
        unitPrice: 1000.0,
      });
    }

    // Hydraulic calculations
    lineItems.push({
      description: "Hydraulic Calculations",
      details: "Complete hydraulic analysis and calculations",
      quantity: 1,
      unitPrice: 800.0,
    });

    // Project narrative and documentation
    lineItems.push({
      description: "Project Documentation",
      details: "Project narrative, NFPA 241 plan, and technical specifications",
      quantity: 1,
      unitPrice: 500.0,
    });

    // Additional services based on project complexity
    if (project.description && project.description.length > 200) {
      lineItems.push({
        description: "Complex Project Management",
        details: "Additional coordination for complex project requirements",
        quantity: 1,
        unitPrice: 750.0,
      });
    }

    return lineItems;
  }

  private enterEditMode(): void {
    console.log("Entering edit mode");

    const tbody = document.getElementById("proposal-line-items");
    const editBtn = document.querySelector('button[onclick*="editProposal"]') as HTMLButtonElement;

    if (!tbody) return;

    tbody.classList.add("editing-mode");

    // Update button text
    if (editBtn) {
      editBtn.innerHTML = this.getCheckIcon() + "Save Changes";
      editBtn.className = editBtn.className.replace(
        "bg-blue-600 hover:bg-blue-700",
        "bg-green-600 hover:bg-green-700"
      );
    }

    // Convert each row to editable inputs
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll("td");
      if (cells.length !== 4) return;

      // Extract current values
      const descDiv = cells[0].querySelector(".font-medium");
      const detailsDiv = cells[0].querySelector(".text-xs");
      const currentDesc = descDiv?.textContent || "";
      const currentDetails = detailsDiv?.textContent || "";
      const currentQty = parseFloat(cells[1].textContent?.trim() || "1") || 1;
      const currentPrice = parseFloat(cells[2].textContent?.replace("$", "").trim() || "0") || 0;

      // Replace with editable inputs
      row.innerHTML = this.getEditableRowHTML(index, {
        description: currentDesc,
        details: currentDetails,
        quantity: currentQty,
        unitPrice: currentPrice,
      });
    });

    // Add "Add Line Item" button at the bottom
    this.addRowButton(tbody);
  }

  private saveProposalChanges(): void {
    console.log("Saving proposal changes");

    const tbody = document.getElementById("proposal-line-items");
    const editBtn = document.querySelector('button[onclick*="editProposal"]') as HTMLButtonElement;

    if (!tbody) return;

    // Remove editing mode
    tbody.classList.remove("editing-mode");

    // Update button text back
    if (editBtn) {
      editBtn.innerHTML = this.getEditIcon() + "Edit Proposal";
      editBtn.className = editBtn.className.replace(
        "bg-green-600 hover:bg-green-700",
        "bg-blue-600 hover:bg-blue-700"
      );
    }

    // Remove add row button
    const addRowBtn = document.getElementById("add-row-btn");
    if (addRowBtn) addRowBtn.remove();

    // Convert inputs back to display text and collect data
    const rows = tbody.querySelectorAll("tr");
    let total = 0;

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length !== 4) return;

      // Get values from inputs
      const descInput = row.querySelector('input[data-field="description"]') as HTMLInputElement;
      const detailsInput = row.querySelector('input[data-field="details"]') as HTMLInputElement;
      const qtyInput = row.querySelector('input[data-field="quantity"]') as HTMLInputElement;
      const priceInput = row.querySelector('input[data-field="unitPrice"]') as HTMLInputElement;

      if (!descInput || !qtyInput || !priceInput) return;

      const description = descInput.value || "Untitled Item";
      const details = detailsInput ? detailsInput.value : "";
      const quantity = parseFloat(qtyInput.value) || 1;
      const unitPrice = parseFloat(priceInput.value) || 0;
      const itemTotal = quantity * unitPrice;

      total += itemTotal;

      // Update cells with display format
      cells[0].innerHTML = `
        <div class="font-medium">${description}</div>
        ${details ? `<div class="text-xs text-gray-500 dark:text-gray-400">${details}</div>` : ""}
      `;
      cells[1].innerHTML = `<span class="text-sm text-gray-900 dark:text-white">${quantity}</span>`;
      cells[2].innerHTML = `<span class="text-sm text-gray-900 dark:text-white">$${unitPrice.toFixed(2)}</span>`;
      cells[3].innerHTML = `<span class="text-sm font-medium text-gray-900 dark:text-white">$${itemTotal.toFixed(2)}</span>`;
    });

    // Update totals
    const totalElement = document.getElementById("proposal-total");
    const totalFooterElement = document.getElementById("proposal-total-footer");

    if (totalElement) totalElement.textContent = total.toFixed(2);
    if (totalFooterElement) totalFooterElement.textContent = total.toFixed(2);

    // Show success message
    if ((window as any).showSuccess) {
      (window as any).showSuccess("Proposal Updated", "Your changes have been saved successfully!");
    }
  }

  private updateGrandTotal(): void {
    const tbody = document.getElementById("proposal-line-items");
    if (!tbody) return;

    let grandTotal = 0;
    const totalSpans = tbody.querySelectorAll(".row-total");

    totalSpans.forEach((span) => {
      const value = parseFloat(span.textContent?.replace("$", "") || "0") || 0;
      grandTotal += value;
    });

    const totalElement = document.getElementById("proposal-total");
    const totalFooterElement = document.getElementById("proposal-total-footer");

    if (totalElement) totalElement.textContent = grandTotal.toFixed(2);
    if (totalFooterElement) totalFooterElement.textContent = grandTotal.toFixed(2);
  }

  private updateProposalButtonStates(currentStatus: number): void {
    const sendBtn = document.getElementById("send-proposal-btn") as HTMLButtonElement;

    if (sendBtn) {
      if (currentStatus >= 30) {
        // Status is 30 (Proposal Shipped) or higher - proposal has already been sent
        sendBtn.innerHTML = this.getCheckIcon() + "Proposal Sent";
        sendBtn.className = sendBtn.className.replace(
          "bg-purple-600 hover:bg-purple-700",
          "bg-green-600 hover:bg-green-700"
        );
        sendBtn.disabled = true;
      } else {
        // Status is less than 30 - proposal can be sent
        sendBtn.innerHTML = this.getSendIcon() + "Send Proposal";
        sendBtn.className = sendBtn.className.replace(
          "bg-green-600 hover:bg-green-700",
          "bg-purple-600 hover:bg-purple-700"
        );
        sendBtn.disabled = false;
      }
    }
  }

  private updateStatusDisplay(): void {
    const statusElements = document.querySelectorAll("[data-project-status]");
    statusElements.forEach((element) => {
      element.textContent = "Proposal Shipped";
      element.className = element.className.replace(/bg-\w+-\d+/, "bg-purple-100");
      element.className = element.className.replace(/text-\w+-\d+/, "text-purple-800");
    });
  }

  private reindexRows(): void {
    const tbody = document.getElementById("proposal-line-items");
    if (!tbody) return;

    const remainingRows = tbody.querySelectorAll("tr:not(#add-row-btn)");
    remainingRows.forEach((row, newIndex) => {
      const inputs = row.querySelectorAll("input, button");
      inputs.forEach((input) => {
        if (input.hasAttribute("data-row")) {
          input.setAttribute("data-row", newIndex.toString());
        }
        if (input.hasAttribute("onclick")) {
          const onclick = input.getAttribute("onclick");
          if (
            onclick &&
            (onclick.includes("updateRowTotal") || onclick.includes("deleteProposalRow"))
          ) {
            input.setAttribute("onclick", onclick.replace(/\d+/, newIndex.toString()));
          }
        }
      });
    });
  }

  private addRowButton(tbody: HTMLElement): void {
    const addRowBtn = document.createElement("tr");
    addRowBtn.innerHTML = `
      <td colspan="4" class="px-4 py-3 text-center border-t border-gray-200 dark:border-gray-600">
        <button 
          type="button"
          onclick="window.proposalManager?.addProposalRow()"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
        >
          <svg class="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add Line Item
        </button>
      </td>
    `;
    addRowBtn.id = "add-row-btn";
    tbody.appendChild(addRowBtn);
  }

  private getEditableRowHTML(index: number, item: Partial<LineItem>): string {
    const currentTotal = (item.quantity || 0) * (item.unitPrice || 0);
    return `
      <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
        <div class="space-y-2">
          <input 
            type="text" 
            value="${item.description || ""}" 
            class="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            data-field="description"
            data-row="${index}"
          />
          <input 
            type="text" 
            value="${item.details || ""}" 
            placeholder="Details (optional)"
            class="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
            data-field="details"
            data-row="${index}"
          />
        </div>
      </td>
      <td class="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
        <input 
          type="number" 
          value="${item.quantity || 1}" 
          min="0" 
          step="0.01"
          class="w-full px-2 py-1 text-sm text-right border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          data-field="quantity"
          data-row="${index}"
          onchange="window.proposalManager?.updateRowTotal(${index})"
        />
      </td>
      <td class="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
        <input 
          type="number" 
          value="${item.unitPrice || 0}" 
          min="0" 
          step="0.01"
          class="w-full px-2 py-1 text-sm text-right border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          data-field="unitPrice"
          data-row="${index}"
          onchange="window.proposalManager?.updateRowTotal(${index})"
        />
      </td>
      <td class="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
        <div class="flex items-center justify-between">
          <span class="row-total font-medium text-gray-900 dark:text-white">$${currentTotal.toFixed(2)}</span>
          <button 
            type="button"
            onclick="window.proposalManager?.deleteProposalRow(${index})"
            class="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
            title="Delete line item"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </td>
    `;
  }

  // Icon helper methods
  private getLoadingSpinner(): string {
    return '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
  }

  private getCheckIcon(): string {
    return '<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
  }

  private getSendIcon(): string {
    return '<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>';
  }

  private getEditIcon(): string {
    return '<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>';
  }

  private getInvoiceIcon(): string {
    return '<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
  }
}

// Global instance for easy access
declare global {
  interface Window {
    proposalManager?: ProposalManager;
    PROPOSAL_PROJECT_ID?: string;
    PROPOSAL_PROJECT_DATA?: any;
    PROPOSAL_PROJECT_AUTHOR?: any;
    buildProposal?: (id: any) => void;
    editProposal?: (id: any) => void;
    regenerateProposal?: () => void;
    sendProposal?: () => void;
    convertToInvoice?: () => void;
    updateRowTotal?: (index: any) => void;
    addProposalRow?: () => void;
    deleteProposalRow?: (index: any) => void;
  }
}

// Export utility functions for direct use
export const createProposalManager = (
  projectId: string,
  project: any,
  projectAuthor: any
): ProposalManager => {
  return new ProposalManager(projectId, project, projectAuthor);
};

export const initializeProposalManager = (
  projectId: string,
  project: any,
  projectAuthor: any
): void => {
  window.proposalManager = new ProposalManager(projectId, project, projectAuthor);
};
