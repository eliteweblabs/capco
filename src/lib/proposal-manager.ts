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

    // Populate notes section
    this.populateNotes();

    // Update button states based on project status
    this.updateProposalButtonStates(this.project.status);

    // Save the proposal as an invoice in the database
    this.saveProposalAsInvoice();

    // Make proposal editable by default
    this.enterEditMode();

    console.log("Proposal generated successfully");
  }

  /**
   * Save the proposal as an invoice in the database
   */
  private async saveProposalAsInvoice(): Promise<void> {
    try {
      console.log("Saving proposal as invoice for project:", this.projectId);

      // Get the proposal data
      const proposalData = this.getProposalData();

      // Create invoice from proposal data
      const response = await fetch("/api/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: this.projectId,
          projectData: proposalData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Proposal saved as invoice successfully:", data);
      } else {
        console.error("Failed to save proposal as invoice:", data.error);
        if ((window as any).showError) {
          (window as any).showError("Error", data.error || "Failed to save proposal");
        }
      }
    } catch (error) {
      console.error("Error saving proposal as invoice:", error);
      if ((window as any).showError) {
        (window as any).showError("Error", "Failed to save proposal");
      }
    }
  }

  /**
   * Get the current proposal data for saving
   */
  private getProposalData(): any {
    // Get proposal title
    const titleElement = document.getElementById("proposal-title") as HTMLInputElement;
    const title = titleElement?.value || `Proposal for ${this.project.address}`;

    // Get proposal date
    const dateElement = document.getElementById("proposal-date") as HTMLInputElement;
    const date = dateElement?.value || new Date().toISOString().split("T")[0];

    // Get proposal subject
    const subjectElement = document.getElementById("proposal-subject") as HTMLInputElement;
    const subject = subjectElement?.value || "Fire Protection System Proposal";

    // Get line items
    const lineItems = this.getLineItemsData();

    // Get notes
    const notesElement = document.getElementById("proposal-notes");
    const notes = notesElement?.textContent || this.project.notes || this.project.description || "";

    return {
      title,
      date,
      subject,
      status: "proposal", // Set status to "proposal" for proposal invoices
      line_items: lineItems,
      notes,
    };
  }

  /**
   * Create a line item row with consistent structure
   */
  private createLineItemRow(item: any = {}): HTMLTableRowElement {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 dark:hover:bg-gray-700 line-item-row";

    const currentTotal = (item.quantity || 0) * (item.unitPrice || 0);

    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
        <div class="relative">
          <input
            type="text"
            class="line-item-description w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter line item description..."
            value="${item.description || ""}"
            autocomplete="off"
          />
          <!-- Autocomplete dropdown -->
          <div class="autocomplete-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600 hidden">
            <!-- Suggestions will be populated here -->
          </div>
        </div>
        <input
          type="text"
          class="line-item-details w-full mt-2 px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Details (optional)"
          value="${item.details || ""}"
        />
      </td>
      <td class="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
        <input
          type="number"
          class="line-item-quantity w-20 px-2 py-1 text-right border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          value="${item.quantity || 1}"
          min="0"
          step="1"
          oninput="updateRowTotalDirect(this)"
          onchange="updateRowTotalDirect(this)"
        />
      </td>
      <td class="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
        <input
          type="number"
          class="line-item-unit-price w-24 px-2 py-1 text-right border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          value="${item.unitPrice || 0}"
          min="0"
          step="1"
          oninput="updateRowTotalDirect(this)"
          onchange="updateRowTotalDirect(this)"
        />
      </td>
      <td class="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
        <span class="line-item-total">$${currentTotal.toFixed(2)}</span>
      </td>
      <td class="px-4 py-3 text-center">
        <div class="flex gap-2 justify-center">
          <button
            type="button"
            class="add-line-item-btn px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Add
          </button>
          <button
            type="button"
            class="delete-line-item-btn text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            onclick="this.closest('tr').remove(); updateProposalTotal();"
            title="Delete line item"
          >
            <i class="bx bx-trash"></i>
          </button>
        </div>
      </td>
    `;

    // Store catalog_item_id as a data attribute for reference
    if (item.catalog_item_id) {
      row.setAttribute("data-catalog-item-id", item.catalog_item_id.toString());
    }

    return row;
  }

  /**
   * Get line items data from the proposal table
   */
  private getLineItemsData(): any[] {
    const tbody = document.getElementById("proposal-line-items");
    if (!tbody) return [];

    const rows = tbody.querySelectorAll("tr");
    const lineItems: any[] = [];

    console.log("🔍 [PROPOSAL-MANAGER] Getting line items data from", rows.length, "rows");

    rows.forEach((row, index) => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 3) {
        // Look for input elements using the unified class names
        const descInput = row.querySelector(".line-item-description") as HTMLInputElement;
        const detailsInput = row.querySelector(".line-item-details") as HTMLInputElement;
        const qtyInput = row.querySelector(".line-item-quantity") as HTMLInputElement;
        const priceInput = row.querySelector(".line-item-unit-price") as HTMLInputElement;

        console.log(`🔍 [PROPOSAL-MANAGER] Row ${index}:`, {
          descInput: !!descInput,
          detailsInput: !!detailsInput,
          qtyInput: !!qtyInput,
          priceInput: !!priceInput,
        });

        let description = "";
        let details = "";
        let quantity = 1;
        let price = 0;

        if (descInput) {
          // Get values from inputs
          description = descInput.value?.trim() || "";
          details = detailsInput?.value?.trim() || "";
          quantity = parseFloat(qtyInput?.value || "1") || 1;
          price = parseFloat(priceInput?.value || "0") || 0;

          console.log(`🔍 [PROPOSAL-MANAGER] Row ${index} values:`, {
            description,
            details,
            quantity,
            price,
          });
        } else {
          // Fallback: try to get from text content (display mode)
          description = cells[0]?.textContent?.trim() || "";
          quantity = parseFloat(cells[1]?.textContent?.trim() || "1") || 1;
          price = parseFloat(cells[2]?.textContent?.replace(/[$,]/g, "") || "0") || 0;

          console.log(`🔍 [PROPOSAL-MANAGER] Row ${index} fallback values:`, {
            description,
            quantity,
            price,
          });
        }

        // Only add items with a description
        if (description) {
          // Get catalog_item_id from the row's data attribute if it exists
          const catalogItemId = row.getAttribute("data-catalog-item-id");

          lineItems.push({
            description,
            details,
            quantity,
            price,
            catalog_item_id: catalogItemId ? parseInt(catalogItemId) : undefined,
          });
        }
      }
    });

    console.log("🔍 [PROPOSAL-MANAGER] Final line items:", lineItems);
    return lineItems;
  }

  /**
   * Load existing invoice data into the proposal
   */
  async loadExistingInvoice(invoice: any): Promise<void> {
    console.log("🔄 [PROPOSAL-MANAGER] Loading existing invoice into proposal:", invoice);

    if (!invoice) {
      console.error("❌ [PROPOSAL-MANAGER] No invoice data provided");
      return;
    }

    // Hide placeholder and show proposal content
    const placeholder = document.getElementById("proposal-placeholder");
    const content = document.getElementById("proposal-content");

    console.log("🔄 [PROPOSAL-MANAGER] DOM elements:", {
      placeholder: !!placeholder,
      content: !!content,
    });

    if (placeholder) {
      placeholder.classList.add("hidden");
      console.log("✅ [PROPOSAL-MANAGER] Hidden placeholder");
    }
    if (content) {
      content.classList.remove("hidden");
      console.log("✅ [PROPOSAL-MANAGER] Showed content");
    }

    console.log("🔄 [PROPOSAL-MANAGER] Starting to populate proposal with invoice data");

    // Populate proposal header with invoice data
    this.populateHeaderFromInvoice(invoice);
    console.log("✅ [PROPOSAL-MANAGER] Header populated");

    // Populate project and client information
    this.populateProjectInfo();
    this.populateClientInfo();
    console.log("✅ [PROPOSAL-MANAGER] Project and client info populated");

    // Populate line items from invoice data
    await this.populateLineItemsFromInvoice(invoice);
    console.log("✅ [PROPOSAL-MANAGER] Line items populated");

    // Populate notes section
    this.populateNotes();
    console.log("✅ [PROPOSAL-MANAGER] Notes populated");

    console.log("🎉 [PROPOSAL-MANAGER] Proposal loading complete!");

    // Update button states based on project status
    this.updateProposalButtonStates(this.project.status);

    // Hide preloader if it's still showing
    if ((window as any).hidePreloader) {
      (window as any).hidePreloader();
    }

    // Make proposal editable by default
    this.enterEditMode();

    console.log("Existing invoice loaded successfully");
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
   * Save current proposal data to the database
   */
  async saveCurrentProposalData(suppressToast: boolean = false): Promise<void> {
    try {
      console.log("💾 [PROPOSAL-MANAGER] Saving current proposal data");

      // Get line items data
      const lineItems = this.getLineItemsData();
      console.log("💾 [PROPOSAL-MANAGER] Line items to save:", lineItems);

      // Get proposal subject
      const subjectElement = document.getElementById("proposal-subject") as HTMLInputElement;
      const subject = subjectElement?.value || "";

      // For each line item, we need to either:
      // 1. Use existing catalog_item_id if it's from the catalog
      // 2. Create a new catalog item and get its ID
      const processedLineItems = [];

      for (const item of lineItems) {
        if (item.catalog_item_id) {
          // Item already has a catalog ID, use it
          processedLineItems.push({
            catalog_item_id: item.catalog_item_id,
            description: item.description,
            details: item.details,
            quantity: item.quantity,
            unit_price: item.price,
          });
        } else {
          // New item, save to catalog first
          try {
            const catalogResponse = await fetch("/api/line-items-catalog", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: item.description,
                description: item.details,
                unit_price: item.price,
                category: "General",
              }),
            });

            const catalogResult = await catalogResponse.json();

            if (catalogResult.success && catalogResult.item) {
              processedLineItems.push({
                catalog_item_id: catalogResult.item.id,
                description: item.description,
                details: item.details,
                quantity: item.quantity,
                unit_price: item.price,
              });
              console.log("✅ [PROPOSAL-MANAGER] Created new catalog item:", catalogResult.item.id);
            } else {
              console.error(
                "❌ [PROPOSAL-MANAGER] Failed to create catalog item:",
                catalogResult.error
              );
              // Still add the item without catalog_item_id for now
              processedLineItems.push({
                ...item,
                unit_price: item.price,
              });
            }
          } catch (catalogError) {
            console.error("❌ [PROPOSAL-MANAGER] Error creating catalog item:", catalogError);
            // Still add the item without catalog_item_id for now
            processedLineItems.push({
              ...item,
              unit_price: item.price,
            });
          }
        }
      }

      console.log("💾 [PROPOSAL-MANAGER] Processed line items:", processedLineItems);

      // Update line items in database
      const response = await fetch("/api/update-invoice-line-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: this.projectId,
          lineItems: processedLineItems,
          subject: subject,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ [PROPOSAL-MANAGER] Proposal data saved successfully");
        // Show success message only if not suppressed (e.g., when sending proposal)
        if (!suppressToast && (window as any).showSuccess) {
          (window as any).showSuccess(
            "Proposal Saved",
            "Your proposal has been saved successfully!"
          );
        }
      } else {
        console.error("❌ [PROPOSAL-MANAGER] Failed to save proposal data:", result.error);
        if ((window as any).showError) {
          (window as any).showError("Save Failed", result.error || "Failed to save proposal");
        }
      }
    } catch (error) {
      console.error("❌ [PROPOSAL-MANAGER] Error saving proposal data:", error);
      if ((window as any).showError) {
        (window as any).showError("Save Failed", "An error occurred while saving the proposal");
      }
    }
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
      // First, save the current proposal data to the database (suppress toast)
      await this.saveCurrentProposalData(true);

      // Then update project status to 30 (Proposal Shipped)
      const response = await fetch("/api/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          projectId: this.projectId,
          status: 30, // Proposal Shipped
        }),
      });

      const data = await response.json();

      if (data.success) {
        // The update-status API should trigger database-driven toast messages
        // No need for hardcoded notifications - let the status system handle it

        // Check if there's a redirect configuration from the database
        if (data.statusConfig?.redirect_url) {
          const delay = data.statusConfig.redirect_delay || 0;
          const showCountdown = data.statusConfig.redirect_show_countdown !== false;

          if (delay > 0 && showCountdown) {
            // Show countdown and redirect after delay
            if ((window as any).showNotification) {
              (window as any).showNotification({
                type: "success",
                title: "Proposal Sent",
                message:
                  data.message ||
                  "Proposal sent successfully! Redirecting in {{COUNTDOWN}} seconds...",
                redirect: {
                  url: data.statusConfig.redirect_url,
                  delay: delay,
                  showCountdown: true,
                },
              });
            } else {
              // Fallback: redirect after delay
              setTimeout(() => {
                window.location.href = data.statusConfig.redirect_url;
              }, delay * 1000);
            }
          } else {
            // Immediate redirect
            window.location.href = data.statusConfig.redirect_url;
          }
        } else {
          // No redirect configured, just refresh the page
          window.location.reload();
        }

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
      description: "",
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
    console.log("🔍 [PROPOSAL-MANAGER] updateRowTotal called for row:", rowIndex);
    const tbody = document.getElementById("proposal-line-items");
    if (!tbody) {
      console.log("❌ [PROPOSAL-MANAGER] No tbody found");
      return;
    }

    const row = tbody.querySelectorAll("tr")[rowIndex];
    if (!row) {
      console.log("❌ [PROPOSAL-MANAGER] No row found at index:", rowIndex);
      return;
    }

    // Look for both old and new class names to support all row types
    const qtyInput = row.querySelector(
      'input[data-field="quantity"], .line-item-quantity'
    ) as HTMLInputElement;
    const priceInput = row.querySelector(
      'input[data-field="unitPrice"], .line-item-unit-price'
    ) as HTMLInputElement;
    const totalSpan = row.querySelector(".row-total, .line-item-total");

    console.log("🔍 [PROPOSAL-MANAGER] Found elements:", {
      qtyInput: !!qtyInput,
      priceInput: !!priceInput,
      totalSpan: !!totalSpan,
      qtyValue: qtyInput?.value,
      priceValue: priceInput?.value,
    });

    if (qtyInput && priceInput && totalSpan) {
      const quantity = parseFloat(qtyInput.value) || 0;
      const unitPrice = parseFloat(priceInput.value) || 0;
      const total = quantity * unitPrice;

      console.log("🔍 [PROPOSAL-MANAGER] Calculating total:", { quantity, unitPrice, total });
      totalSpan.textContent = `$${total.toFixed(2)}`;

      // Update grand total using both methods
      this.updateGrandTotal();
      // Also call the global updateProposalTotal function
      if ((window as any).updateProposalTotal) {
        (window as any).updateProposalTotal();
      }
    } else {
      console.log("❌ [PROPOSAL-MANAGER] Missing required elements for total calculation");
    }
  }

  // Private methods

  /**
   * Load proposal subject from invoice table
   */
  private async loadProposalSubject(): Promise<string | null> {
    try {
      const response = await fetch(`/api/get-proposal-subject?projectId=${this.project.id}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        return data.subject || null;
      }

      return null;
    } catch (error) {
      console.error("Error loading proposal subject:", error);
      return null;
    }
  }

  private populateHeader(): void {
    const titleElement = document.getElementById("proposal-project-title");
    const dateElement = document.getElementById("proposal-date");
    const subjectElement = document.getElementById("proposal-subject-text");

    if (titleElement) titleElement.textContent = this.project.title || "Untitled Project";
    if (dateElement) dateElement.textContent = new Date().toLocaleDateString();

    // Set proposal subject from project data or use default
    if (subjectElement) {
      const defaultSubject = `Fire Protection Services Proposal - ${this.project.title || "Project"}`;
      // First check if we have a proposal invoice with a subject
      let proposalSubject = defaultSubject;

      // Try to load subject from proposal invoice
      this.loadProposalSubject()
        .then((subject) => {
          if (subject) {
            subjectElement.textContent = subject;
          }
        })
        .catch((error) => {
          console.warn("Could not load proposal subject:", error);
        });

      // Set default for now
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

  private populateNotes(): void {
    const notesElement = document.getElementById("proposal-notes");
    if (!notesElement) return;

    // Get notes from project data or use default
    const notes = this.project.notes || this.project.description || "";

    if (notes) {
      notesElement.textContent = notes;
      notesElement.style.display = "block";
    } else {
      // Hide notes section if no notes available
      notesElement.style.display = "none";
    }
  }

  private populateHeaderFromInvoice(invoice: any): void {
    const titleElement = document.getElementById("proposal-project-title");
    const dateElement = document.getElementById("proposal-date");
    const subjectElement = document.getElementById("proposal-subject-text");

    if (titleElement) titleElement.textContent = this.project.title || "Untitled Project";
    if (dateElement) dateElement.textContent = new Date(invoice.created_at).toLocaleDateString();

    // Set proposal subject from invoice data
    if (subjectElement) {
      const invoiceSubject =
        invoice.subject || `Fire Protection Services Proposal - ${this.project.title || "Project"}`;
      subjectElement.textContent = invoiceSubject;
    }

    // Re-initialize subject editing after populating header
    setTimeout(() => {
      if (typeof window.initializeSubjectEditing === "function") {
        window.initializeSubjectEditing();
      }
    }, 100);
  }

  private async populateLineItemsFromInvoice(invoice: any): Promise<void> {
    const tbody = document.getElementById("proposal-line-items");
    if (!tbody) return;

    // Get line item data from the catalog_line_items JSONB field
    const catalogLineItems = invoice.catalog_line_items || [];
    console.log("🔄 [PROPOSAL-MANAGER] Populating line items from stored data:", catalogLineItems);
    console.log("🔄 [PROPOSAL-MANAGER] Invoice data:", invoice);

    if (catalogLineItems.length === 0) {
      console.log("❌ [PROPOSAL-MANAGER] No catalog line items found in invoice");
      console.log("❌ [PROPOSAL-MANAGER] Invoice structure:", JSON.stringify(invoice, null, 2));
      return;
    }

    // Use the stored catalog line items data directly (no need to fetch from catalog)
    const lineItems = catalogLineItems;
    console.log("🔄 [PROPOSAL-MANAGER] Using stored catalog line items data:", lineItems);

    // Clear existing content
    tbody.innerHTML = "";

    // Optimize: Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    let total = 0;

    // Use line items from the catalog and create interactive rows
    lineItems.forEach((item: any) => {
      console.log("🔍 [PROPOSAL-MANAGER] Processing line item:", item);
      console.log("🔍 [PROPOSAL-MANAGER] Item keys:", Object.keys(item));
      console.log("🔍 [PROPOSAL-MANAGER] Unit price value:", item.unit_price);
      console.log("🔍 [PROPOSAL-MANAGER] Quantity value:", item.quantity);

      // Create row using the stored data (preserves original pricing)
      const row = this.createLineItemRow({
        description: item.description || "Line Item",
        details: item.details || "",
        quantity: item.quantity || 1,
        unitPrice: item.unit_price || 0,
        catalog_item_id: item.catalog_item_id, // Store the catalog item ID for reference
      });

      const itemTotal = (item.quantity || 1) * (item.unit_price || 0);
      total += itemTotal;

      fragment.appendChild(row);
    });

    // Single DOM update
    tbody.appendChild(fragment);

    // Update totals
    this.updateTotalDisplay(total);
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

      // Create delete button cell
      const deleteCell = document.createElement("td");
      deleteCell.className = "px-4 py-3 text-center";
      const deleteButton = document.createElement("button");
      deleteButton.className =
        "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300";
      deleteButton.innerHTML = '<i class="bx bx-trash"></i>';
      deleteButton.title = "Delete line item";
      deleteButton.onclick = () => {
        if (confirm("Are you sure you want to delete this line item?")) {
          row.remove();
          this.updateProposalTotalFromManager();
        }
      };
      deleteCell.appendChild(deleteButton);

      row.appendChild(descCell);
      row.appendChild(qtyCell);
      row.appendChild(priceCell);
      row.appendChild(totalCell);
      row.appendChild(deleteCell);

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

  private updateProposalTotalFromManager(): void {
    const lineItemsContainer = document.getElementById("proposal-line-items");
    if (!lineItemsContainer) return;

    let total = 0;
    const rows = lineItemsContainer.querySelectorAll("tr");

    rows.forEach((row) => {
      const quantityInput = row.querySelector(".quantity-input") as HTMLInputElement;
      const unitPriceInput = row.querySelector(".unit-price-input") as HTMLInputElement;

      if (quantityInput && unitPriceInput) {
        const quantity = parseFloat(quantityInput.value) || 0;
        const unitPrice = parseFloat(unitPriceInput.value) || 0;
        const rowTotal = quantity * unitPrice;
        total += rowTotal;
      }
    });

    // Update total displays
    this.updateTotalDisplay(total);
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

    if (!tbody) return;

    tbody.classList.add("editing-mode");

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

  private saveProposalChanges(suppressToast: boolean = false): void {
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
      if (cells.length !== 5) return;

      // Get values from inputs - look for both data attributes and class names
      const descInput = row.querySelector(
        'input[data-field="description"], .line-item-description'
      ) as HTMLInputElement;
      const detailsInput = row.querySelector(
        'input[data-field="details"], .line-item-details'
      ) as HTMLInputElement;
      const qtyInput = row.querySelector(
        'input[data-field="quantity"], .line-item-quantity'
      ) as HTMLInputElement;
      const priceInput = row.querySelector(
        'input[data-field="unitPrice"], .line-item-unit-price'
      ) as HTMLInputElement;

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
      cells[4].innerHTML = `<span class="text-sm text-gray-500 dark:text-gray-400">-</span>`;
    });

    // Update totals
    const totalElement = document.getElementById("proposal-total");
    const totalFooterElement = document.getElementById("proposal-total-footer");

    if (totalElement) totalElement.textContent = total.toFixed(2);
    if (totalFooterElement) totalFooterElement.textContent = total.toFixed(2);

    // Save changes to database
    this.saveLineItemsToDatabase();

    // Show success message only if not suppressed (e.g., when sending proposal)
    if (!suppressToast && (window as any).showSuccess) {
      (window as any).showSuccess("Proposal Updated", "Your changes have been saved successfully!");
    }
  }

  /**
   * Save line items to the database
   */
  private async saveLineItemsToDatabase(): Promise<void> {
    try {
      console.log("💾 [PROPOSAL-MANAGER] Saving line items to database");

      // Get the current invoice ID from the loaded invoice
      const tbody = document.getElementById("proposal-line-items");
      if (!tbody) {
        console.error("❌ [PROPOSAL-MANAGER] No line items table found");
        return;
      }

      // Get line items data
      const lineItems = this.getLineItemsData();
      console.log("💾 [PROPOSAL-MANAGER] Line items to save:", lineItems);

      // We need to get the invoice ID - let's get it from the existing invoice
      // For now, we'll need to make an API call to update the line items
      const response = await fetch("/api/update-invoice-line-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: this.projectId,
          lineItems: lineItems,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ [PROPOSAL-MANAGER] Line items saved successfully");
      } else {
        console.error("❌ [PROPOSAL-MANAGER] Failed to save line items:", result.error);
        if ((window as any).showError) {
          (window as any).showError("Save Failed", result.error || "Failed to save line items");
        }
      }
    } catch (error) {
      console.error("❌ [PROPOSAL-MANAGER] Error saving line items:", error);
      if ((window as any).showError) {
        (window as any).showError("Save Failed", "Failed to save line items");
      }
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
        <button id="add-row-btn"
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
          min="1" 
          step="1"
          class="line-item-quantity w-20 px-2 py-1 text-right border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          data-field="quantity"
          data-row="${index}"
          oninput="updateRowTotalDirect(this)"
          onchange="updateRowTotalDirect(this)"
        />
      </td>
      <td class="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
        <input 
          type="number" 
          value="${item.unitPrice || 0}" 
          min="0" 
          step="1"
          class="line-item-unit-price w-24 px-2 py-1 text-right border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          data-field="unitPrice"
          data-row="${index}"
          oninput="updateRowTotalDirect(this)"
          onchange="updateRowTotalDirect(this)"
        />
      </td>
      <td class="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
        <span class="line-item-total font-medium text-gray-900 dark:text-white">$${currentTotal.toFixed(2)}</span>
      </td>
      <td class="px-4 py-3 text-sm text-center">
        <div class="flex items-center justify-center space-x-2">
          <button 
            type="button"
            class="add-line-item-btn px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            title="Add line item"
          >
            Add
          </button>
          <button 
            type="button"
            onclick="window.proposalManager?.deleteProposalRow(${index})"
            class="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
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
    PROPOSAL_EXISTING_INVOICE?: any;
    PROPOSAL_HAS_EXISTING_INVOICE?: boolean;
    buildProposal?: (id: any) => void;
    editProposal?: (id: any) => void;
    regenerateProposal?: () => void;
    sendProposal?: () => void;
    convertToInvoice?: () => void;
    updateRowTotal?: (index: any) => void;
    addProposalRow?: () => void;
    deleteProposalRow?: (index: any) => void;
    initializeSubjectEditing?: () => void;
    saveProposal?: () => void;
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
