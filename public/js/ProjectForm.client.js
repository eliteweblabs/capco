// Client-side project form logic - no server dependencies
console.log("🚀 ProjectForm.client.js loaded");

// Status labels (fallback if API fails)
const PROJECT_STATUS_LABELS = {
  10: "Specs Received",
  20: "Generating Proposal",
  30: "Proposal Shipped",
  40: "Proposal Viewed",
  50: "Proposal Signed Off",
  60: "Generating Deposit Invoice",
  70: "Deposit Invoice Shipped",
  80: "Deposit Invoice Viewed",
  90: "Deposit Invoice Paid",
  100: "Generating Submittals",
  110: "Submittals Shipped",
  120: "Submittals Viewed",
  130: "Submittals Signed Off",
  140: "Generating Final Invoice",
  150: "Final Invoice Shipped",
  160: "Final Invoice Viewed",
  170: "Final Invoice Paid",
  180: "Generating Final Deliverables",
  190: "Stamping Final Deliverables",
  200: "Final Deliverables Shipped",
  210: "Final Deliverables Viewed",
  220: "Project Complete",
};

// Load statuses from API (client-safe)
async function loadProjectStatuses() {
  console.log("📋 loadProjectStatuses() called");
  try {
    console.log("Loading project statuses...");
    const res = await fetch("/api/get-project-statuses");
    console.log("Status API response:", res.status, res.statusText);
    if (res.ok) {
      const data = await res.json();
      console.log("Status data received:", data);
      if (data.statuses) {
        // Update the labels with data from API
        Object.entries(data.statuses).forEach(([code, status]) => {
          PROJECT_STATUS_LABELS[parseInt(code)] = status.status_name;
        });
        console.log("Updated status labels:", PROJECT_STATUS_LABELS);
      }
    } else {
      console.error("Status API failed:", res.status, res.statusText);
    }
  } catch (error) {
    console.error("Failed to load project statuses:", error);
    // Keep using fallback labels
  }
}

function formatFileSize(bytes) {
  console.log("📏 formatFileSize() called with:", bytes);
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const result =
    parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  console.log("📏 formatFileSize() result:", result);
  return result;
}

function formatTimestamp(ts) {
  console.log("⏰ formatTimestamp() called with:", ts);
  try {
    const result = ts ? new Date(ts).toLocaleString() : "";
    console.log("⏰ formatTimestamp() result:", result);
    return result;
  } catch {
    console.log("⏰ formatTimestamp() error, returning empty string");
    return "";
  }
}

async function initSingle(container) {
  console.log("🔧 initSingle() called with container:", container);

  // Get project ID from URL path (e.g., /project/123 -> 123)
  const pathParts = window.location.pathname.split("/");
  const projectId = pathParts[pathParts.length - 1];
  console.log("Project ID from URL:", projectId);

  // Only initialize if we're on a project page and have a valid project ID
  if (!projectId || projectId === "new" || isNaN(parseInt(projectId))) {
    console.log("❌ Not on a valid project page, skipping initialization");
    return;
  }

  console.log(
    "✅ Valid project page detected, initializing for project:",
    projectId,
  );

  const jsonEl = container.querySelector(
    `script[id="project-json-${projectId}"]`,
  );
  console.log("JSON element found:", !!jsonEl);
  if (jsonEl) {
    console.log("Raw JSON content:", jsonEl.textContent);
    console.log("JSON content length:", jsonEl.textContent?.length);
  }
  let project = {};
  if (jsonEl && jsonEl.textContent) {
    try {
      project = JSON.parse(jsonEl.textContent.trim());
      console.log("✅ Project JSON parsed successfully:", project);
    } catch (error) {
      console.error("❌ Failed to parse project JSON:", error);
      console.error("JSON content:", jsonEl.textContent);
      console.error("JSON content type:", typeof jsonEl.textContent);
      project = {};
    }
  }
  console.log("Final project data:", project);

  async function populateStatusSelect() {
    console.log("📋 populateStatusSelect() called");
    try {
      await loadProjectStatuses();
    } catch {}
    const select = container.querySelector("#project-status-select");
    console.log("Status select element found:", !!select);
    if (!select) return;
    select.innerHTML = Object.entries(PROJECT_STATUS_LABELS)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(
        ([code, label]) =>
          `<option value="${code}">${code} - ${label}</option>`,
      )
      .join("");
    console.log("Status select populated with options");
    if (project.status) {
      select.value = String(project.status);
      console.log("Status select set to:", project.status);
    }
    select.addEventListener("change", async (e) => {
      console.log("🔄 Status select changed to:", e.target.value);
      const newStatus = Number(e.target.value);
      try {
        console.log("📤 Sending status update to API...");
        const res = await fetch("/api/update-project-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, status: newStatus }),
        });
        console.log("📥 Status update API response:", res.status);
        const result = await res.json();
        console.log("📥 Status update result:", result);
        if (!res.ok) throw new Error(result.error || "Failed to update status");
        const labelEl = container.querySelector(
          `#project-status-label-${projectId}`,
        );
        if (labelEl) {
          labelEl.textContent =
            PROJECT_STATUS_LABELS[newStatus] || `Status ${newStatus}`;
          console.log("✅ Status label updated in DOM");
        }
        const rawEl = container.querySelector(`#project-status-${projectId}`);
        if (rawEl) {
          rawEl.textContent = String(newStatus);
          console.log("✅ Status raw value updated in DOM");
        }
        if (window.globalServices) {
          console.log("📢 Showing success notification");
          window.globalServices.showNotification({
            type: "success",
            title: "Status Updated",
            message: `Status set to ${PROJECT_STATUS_LABELS[newStatus] || newStatus}`,
          });
        } else {
          console.log(
            "✅ Status updated to:",
            PROJECT_STATUS_LABELS[newStatus] || newStatus,
          );
        }
      } catch (err) {
        console.error("❌ Status update failed:", err);
        if (window.globalServices) {
          console.log("📢 Showing error notification");
          window.globalServices.showNotification({
            type: "error",
            title: "Update Failed",
            message: err.message || "Failed to update status",
          });
        } else {
          console.error("❌ Status update failed:", err.message);
        }
      }
    });
  }

  async function populateStaffAssignment() {
    console.log("👥 populateStaffAssignment() called");
    const select = container.querySelector(`#staff-assignment-${projectId}`);
    console.log("Staff assignment select found:", !!select);
    if (!select) return;
    try {
      console.log("Loading staff users...");
      const res = await fetch("/api/get-staff-users");
      console.log("Staff API response:", res.status, res.statusText);
      if (!res.ok) {
        console.error("Staff API failed:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      console.log("Staff data received:", data);
      const users = data.staffUsers || [];
      console.log("Staff users count:", users.length);
      select.innerHTML = [
        '<option value="">Unassigned</option>',
        ...users.map(
          (u) => `<option value="${u.id}">${u.name || u.id}</option>`,
        ),
      ].join("");
      console.log("Staff select populated with options");
      if (project.assigned_to_id) {
        select.value = project.assigned_to_id;
        console.log("Staff select set to:", project.assigned_to_id);
      }
      select.addEventListener("change", async (e) => {
        console.log("🔄 Staff assignment changed to:", e.target.value);
        try {
          const assignedToId = e.target.value || null;
          console.log("📤 Sending staff assignment to API...");
          const res2 = await fetch("/api/assign-project", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId, assignedToId }),
          });
          console.log("📥 Staff assignment API response:", res2.status);
          const result = await res2.json();
          console.log("📥 Staff assignment result:", result);
          if (!res2.ok) throw new Error(result.error || "Failed to assign");
          if (window.globalServices) {
            console.log("📢 Showing success notification");
            window.globalServices.showNotification({
              type: "success",
              title: "Assigned",
              message: result.message || "Assignment updated",
            });
          } else {
            console.log("✅ Assignment updated");
          }
        } catch (err) {
          console.error("❌ Staff assignment failed:", err);
          if (window.globalServices) {
            console.log("📢 Showing error notification");
            window.globalServices.showNotification({
              type: "error",
              title: "Assign Failed",
              message: err.message || "Failed to assign project",
            });
          } else {
            console.error("❌ Assignment failed:", err.message);
          }
        }
      });
    } catch (err) {
      console.error("❌ Failed to populate staff list", err);
    }
  }

  async function loadProjectFiles() {
    console.log("📁 loadProjectFiles() called for project:", projectId);
    const mediaContainer = container.querySelector(`#media-links-${projectId}`);
    console.log("Media container found:", !!mediaContainer);
    if (!mediaContainer) return;
    mediaContainer.innerHTML =
      '<div class="text-xs text-gray-500 dark:text-gray-400 italic">Loading media...</div>';
    try {
      console.log("Loading project files for project:", projectId);
      const res = await fetch("/api/get-project-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      console.log("Files API response:", res.status, res.statusText);
      if (!res.ok) {
        console.error("Files API failed:", res.status, res.statusText);
        mediaContainer.innerHTML =
          '<div class="text-xs text-red-500 dark:text-red-400 italic">Error loading media files</div>';
        return;
      }
      const data = await res.json();
      console.log("Files data received:", data);
      const files = data.files || [];
      console.log("Files count:", files.length);
      if (files.length === 0) {
        mediaContainer.innerHTML =
          '<div class="text-xs text-gray-500 dark:text-gray-400 italic">No media files attached</div>';
        console.log("No files found, showing empty state");
        return;
      }
      mediaContainer.innerHTML = files
        .map((file) => {
          const fileName = file.file_name || file.name || "Unknown file";
          const fileSize = file.file_size ? formatFileSize(file.file_size) : "";
          const uploadDate = file.uploaded_at
            ? formatTimestamp(file.uploaded_at)
            : "";
          const iconClass = file.file_type?.includes("image")
            ? "bx bx-image text-green-500"
            : file.file_type?.includes("spreadsheet") ||
                file.file_type?.includes("excel")
              ? "bx bx-file-spreadsheet text-green-600"
              : file.file_type?.includes("document") ||
                  file.file_type?.includes("word")
                ? "bx bx-file-doc text-blue-500"
                : "bx bx-file-pdf text-red-500";
          return `
          <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border">
            <div class="flex items-center flex-1 min-w-0">
              <i class="${iconClass} mr-2 flex-shrink-0"></i>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title="${fileName}">${fileName}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${fileSize}${uploadDate ? ` • ${uploadDate}` : ""}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 ml-2">
              ${
                file.public_url
                  ? `
                <a href="${file.public_url}" target="_blank" rel="noopener noreferrer" class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" title="View file"><i class="bx bx-external-link mr-1"></i>View</a>
                <a href="${file.public_url}" download="${fileName}" class="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors" title="Download file"><i class="bx bx-download mr-1"></i>Download</a>
              `
                  : `<span class="text-xs text-gray-500 dark:text-gray-400 italic">File not accessible</span>`
              }
            </div>
          </div>`;
        })
        .join("");
      console.log("✅ Files loaded and rendered");
    } catch (err) {
      console.error("❌ Error loading project files:", err);
      mediaContainer.innerHTML =
        '<div class="text-xs text-red-500 dark:text-red-400 italic">Error loading media files</div>';
    }
  }

  async function loadProjectInvoices() {
    console.log("🧾 loadProjectInvoices() called for project:", projectId);
    const invoiceContainer = container.querySelector(
      `#invoice-link-${projectId}`,
    );
    console.log("Invoice container found:", !!invoiceContainer);
    if (!invoiceContainer) return;
    try {
      console.log("Loading invoices...");
      const res = await fetch("/api/list-invoices");
      console.log("Invoices API response:", res.status, res.statusText);
      if (!res.ok) {
        console.error("Invoices API failed:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      console.log("Invoices data received:", data);
      const projectInvoices = (data.invoices || []).filter(
        (inv) => String(inv.project_id) === String(projectId),
      );
      console.log("Project invoices count:", projectInvoices.length);
      if (projectInvoices.length === 0) {
        invoiceContainer.classList.add("hidden");
        console.log("No invoices found, hiding container");
        return;
      }
      invoiceContainer.innerHTML = projectInvoices
        .map((inv) => {
          const statusColor =
            inv.status === "paid"
              ? "bg-green-500"
              : inv.status === "sent"
                ? "bg-blue-500"
                : "bg-gray-500";
          return `<a href="/invoice/${inv.id}" target="_blank" class="inline-flex items-center px-3 py-1 text-xs font-medium text-white ${statusColor} rounded-lg hover:opacity-80 transition-opacity mr-2 mb-2" title="Invoice ${inv.invoice_number} - ${inv.status}"><i class="bx bx-receipt mr-1"></i>${inv.invoice_number}</a>`;
        })
        .join("");
      invoiceContainer.classList.remove("hidden");
      console.log("✅ Invoices loaded and rendered");
      const editBtn = container.querySelector(
        `.edit-estimate-btn[data-project-id="${projectId}"]`,
      );
      if (editBtn && projectInvoices[0]?.id) {
        editBtn.addEventListener(
          "click",
          (e) => {
            console.log(
              "🔄 Edit estimate button clicked, redirecting to invoice",
            );
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `/invoice/${projectInvoices[0].id}`;
          },
          { once: true },
        );
      }
    } catch (err) {
      console.error("❌ Error loading invoices:", err);
    }
  }

  async function handleEstimateCreate() {
    console.log("📄 handleEstimateCreate() called for project:", projectId);
    try {
      console.log("📤 Creating invoice for project...");
      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, projectData: project }),
      });
      console.log("📥 Invoice creation API response:", res.status);
      const result = await res.json();
      console.log("📥 Invoice creation result:", result);
      if (!res.ok || !result.success)
        throw new Error(result.error || "Failed to create invoice");
      try {
        console.log("📤 Updating project status to 20...");
        await fetch("/api/update-project-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, status: 20 }),
        });
        console.log("✅ Project status updated");
      } catch {}
      if (window.globalServices) {
        console.log("📢 Showing success notification");
        window.globalServices.showNotification({
          type: "success",
          title: "Invoice Created",
          message: `Invoice ${result.invoice?.invoice_number || ""} created`,
        });
      } else {
        console.log("✅ Invoice created:", result.invoice?.invoice_number);
      }
      setTimeout(() => {
        console.log("🔄 Redirecting to invoice page");
        window.location.href = `/invoice/${result.invoice.id}`;
      }, 800);
    } catch (err) {
      console.error("❌ Error creating invoice:", err);
      if (window.globalServices) {
        console.log("📢 Showing error notification");
        window.globalServices.showNotification({
          type: "error",
          title: "Invoice Failed",
          message: err.message || "Failed to create invoice",
        });
      } else {
        console.error("❌ Invoice creation failed:", err.message);
      }
    }
  }

  function setupUpload() {
    console.log("📤 setupUpload() called for project:", projectId);
    const dropzone = container.querySelector(`#media-dropzone-${projectId}`);
    const input = container.querySelector(`#media-file-input-${projectId}`);
    console.log("Dropzone found:", !!dropzone);
    console.log("File input found:", !!input);
    if (!dropzone || !input) return;
    dropzone.addEventListener("click", () => {
      console.log("🖱️ Dropzone clicked, opening file picker");
      input.click();
    });
    dropzone.addEventListener("dragover", (e) => {
      console.log("📁 File drag over dropzone");
      e.preventDefault();
      dropzone.classList.add(
        "border-blue-500",
        "bg-blue-50",
        "dark:bg-blue-900/20",
      );
    });
    dropzone.addEventListener("dragleave", (e) => {
      console.log("📁 File drag leave dropzone");
      e.preventDefault();
      dropzone.classList.remove(
        "border-blue-500",
        "bg-blue-50",
        "dark:bg-blue-900/20",
      );
    });
    dropzone.addEventListener("drop", async (e) => {
      console.log("📁 File dropped on dropzone");
      e.preventDefault();
      dropzone.classList.remove(
        "border-blue-500",
        "bg-blue-50",
        "dark:bg-blue-900/20",
      );
      const files = e.dataTransfer?.files;
      console.log("Dropped files count:", files?.length || 0);
      if (files?.length) await uploadFiles(Array.from(files));
    });
    input.addEventListener("change", async (e) => {
      const files = e.target.files;
      console.log("File input changed, files count:", files?.length || 0);
      if (files?.length) {
        await uploadFiles(Array.from(files));
        input.value = "";
      }
    });
  }

  async function uploadFiles(files) {
    console.log("📤 uploadFiles() called with files:", files.length);
    const progressContainer = container.querySelector(
      `#media-upload-progress-${projectId}`,
    );
    const progressBar = container.querySelector(
      `#media-upload-bar-${projectId}`,
    );
    console.log("Progress container found:", !!progressContainer);
    console.log("Progress bar found:", !!progressBar);
    if (progressContainer && progressBar)
      progressContainer.classList.remove("hidden");
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📤 Uploading file ${i + 1}/${files.length}:`, file.name);
        if (progressBar)
          progressBar.style.width = `${((i + 1) / files.length) * 100}%`;
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`⚠️ File too large: ${file.name}`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);
        formData.append("fileType", "media");
        console.log("📤 Sending file upload request...");
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        console.log("📥 File upload response:", res.status);
        if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
        console.log(`✅ File uploaded successfully: ${file.name}`);
      }
      if (progressContainer && progressBar) {
        progressContainer.classList.add("hidden");
        progressBar.style.width = "0%";
      }
      console.log("🔄 Reloading project files...");
      await loadProjectFiles();
      if (window.globalServices) {
        console.log("📢 Showing success notification");
        window.globalServices.showNotification({
          type: "success",
          title: "Upload Complete",
          message: `Successfully uploaded ${files.length} file(s)`,
        });
      } else {
        console.log("✅ Upload complete:", files.length, "files");
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      if (progressContainer && progressBar) {
        progressContainer.classList.add("hidden");
        progressBar.style.width = "0%";
      }
      if (window.globalServices) {
        console.log("📢 Showing error notification");
        window.globalServices.showNotification({
          type: "error",
          title: "Upload Failed",
          message: err.message || "Failed to upload files",
        });
      } else {
        console.error("❌ Upload failed:", err.message);
      }
    }
  }

  // Wire actions
  container
    .querySelector("#refresh-media-btn")
    ?.addEventListener("click", () => loadProjectFiles());
  container
    .querySelector(".estimate-btn[data-project-id]")
    ?.addEventListener("click", () => handleEstimateCreate());
  container
    .querySelector("#delete-project-btn")
    ?.addEventListener("click", async () => {
      if (
        !confirm(
          "Are you sure you want to delete this project? This action cannot be undone.",
        )
      )
        return;
      try {
        const res = await fetch("/api/delete-project", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });
        if (!res.ok) throw new Error(await res.text());
        if (window.globalServices) {
          window.globalServices.showNotification({
            type: "success",
            title: "Project Deleted",
            message: "Project deleted successfully",
          });
        } else {
          console.log("✅ Project deleted successfully");
        }
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } catch (err) {
        console.error("Delete failed:", err);
        if (window.globalServices) {
          window.globalServices.showNotification({
            type: "error",
            title: "Delete Failed",
            message: err.message || "Failed to delete project",
          });
        } else {
          console.error("❌ Delete failed:", err.message);
        }
      }
    });

  // Setup auto-save functionality
  setupAutoSave();

  async function setupAutoSave() {
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    const autoSaveProject = debounce(async (projectId, form) => {
      console.log("💾 autoSaveProject() called for project:", projectId);
      try {
        const formData = new FormData(form);
        const projectData = {};

        for (const [key, value] of formData.entries()) {
          if (key === "new_construction") {
            projectData[key] = true;
          } else if (key === "sq_ft" || key === "units" || key === "status") {
            projectData[key] = parseInt(value) || 0;
          } else {
            projectData[key] = value;
          }
        }

        if (!formData.has("new_construction")) {
          projectData.new_construction = false;
        }

        // Convert units slider to actual value
        const unitsSlider = form.querySelector('input[name="units"]');
        if (unitsSlider) {
          const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50];
          const sliderIndex = parseInt(unitsSlider.value);
          projectData.units = values[sliderIndex] || 1;
        }

        // Collect button group data
        const buttonGroups = [
          "building",
          "project",
          "service",
          "requested_docs",
        ];
        buttonGroups.forEach((groupName) => {
          const groupButtons = form.querySelectorAll(
            `[data-group="${groupName}"]`,
          );
          const groupType =
            groupButtons.length > 0 ? groupButtons[0].dataset.type : null;

          if (groupType === "radio") {
            const selectedButton = Array.from(groupButtons).find((btn) =>
              btn.classList.contains("bg-blue-500"),
            );
            if (selectedButton) {
              projectData[groupName] = selectedButton.dataset.value;
            }
          } else if (groupType === "multi-select") {
            const selectedButtons = Array.from(groupButtons).filter((btn) =>
              btn.classList.contains("bg-blue-500"),
            );
            if (selectedButtons.length > 0) {
              projectData[groupName] = selectedButtons.map(
                (btn) => btn.dataset.value,
              );
            }
          }
        });

        const response = await fetch("/api/update-project-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, ...projectData }),
        });

        if (!response.ok) {
          throw new Error("Auto-save failed");
        }

        // Use global services notification system
        if (window.globalServices) {
          window.globalServices.showNotification({
            type: "success",
            title: "Changes Saved",
            message: "Your project changes have been saved automatically",
            duration: 3000,
          });
        } else {
          // Fallback to console log if global services not available
          console.log("✅ Changes saved automatically");
        }
      } catch (error) {
        console.error("Auto-save error:", error);

        // Use global services notification system
        if (window.globalServices) {
          window.globalServices.showNotification({
            type: "error",
            title: "Save Failed",
            message: "Could not save changes. Please try again.",
            duration: 5000,
          });
        } else {
          // Fallback to console log if global services not available
          console.error("❌ Save failed:", error.message);
        }
      }
    }, 1000);

    // Listen for form changes
    container.addEventListener("input", (e) => {
      const target = e.target;
      const form = target.closest("form[data-project-id]");
      if (!form) return;

      const projectId = form.dataset.projectId;
      if (!projectId) return;

      autoSaveProject(projectId, form);
    });

    // Listen for button group changes
    container.addEventListener("click", (e) => {
      const button = e.target.closest(
        ".building-type-radio, .consulting-service-btn, .fire-service-radio, .fire-safety-service-btn",
      );
      if (!button) return;

      const form = button.closest("form[data-project-id]");
      if (!form) return;

      const projectId = form.dataset.projectId;
      if (!projectId) return;

      autoSaveProject(projectId, form);
    });

    // Setup button group functionality
    container.addEventListener("click", (e) => {
      const button = e.target.closest(
        ".building-type-radio, .consulting-service-btn, .fire-service-radio, .fire-safety-service-btn",
      );
      if (!button) return;

      e.preventDefault();

      const value = button.dataset.value;
      const group = button.dataset.group;
      const type = button.dataset.type;

      if (type === "radio") {
        // Remove active class from all buttons in the group
        const groupButtons = container.querySelectorAll(
          `[data-group="${group}"]`,
        );
        groupButtons.forEach((btn) =>
          btn.classList.remove("bg-blue-500", "text-white", "border-blue-500"),
        );
        groupButtons.forEach((btn) =>
          btn.classList.add("bg-white", "text-gray-700", "border-gray-300"),
        );

        // Add active class to clicked button
        button.classList.remove("bg-white", "text-gray-700", "border-gray-300");
        button.classList.add("bg-blue-500", "text-white", "border-blue-500");
      } else if (type === "multi-select") {
        // Toggle active class on clicked button
        if (button.classList.contains("bg-blue-500")) {
          button.classList.remove(
            "bg-blue-500",
            "text-white",
            "border-blue-500",
          );
          button.classList.add("bg-white", "text-gray-700", "border-gray-300");
        } else {
          button.classList.remove(
            "bg-white",
            "text-gray-700",
            "border-gray-300",
          );
          button.classList.add("bg-blue-500", "text-white", "border-blue-500");
        }
      }
    });
  }

  await populateStatusSelect();
  await populateStaffAssignment();
  await loadProjectFiles();
  await loadProjectInvoices();
  setupUpload();
}

function initAll() {
  console.log("🚀 initAll() called");

  // Check if we're on a project page
  const pathParts = window.location.pathname.split("/");
  const isProjectPage =
    pathParts.length >= 3 &&
    pathParts[1] === "project" &&
    pathParts[2] !== "new";

  if (!isProjectPage) {
    console.log(
      "❌ Not on a project page, skipping ProjectForm initialization",
    );
    return;
  }

  console.log("✅ On project page, initializing project forms...");
  const forms = document.querySelectorAll("[data-project-form]");
  console.log("Found project forms:", forms.length);
  forms.forEach((el) => {
    initSingle(el);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll);
} else {
  initAll();
}
