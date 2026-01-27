// Example: How to refactor the existing page-editor-modal in cms.astro
// to use the new global showModal() function

/**
 * BEFORE: Old pattern with manual modal manipulation
 */
function openPageEditorOld(page = null) {
  const modal = document.getElementById("page-editor-modal");
  const modalTitle = document.getElementById("modal-title");
  const form = document.getElementById("page-form");
  
  // Show modal
  modal.classList.remove("hidden");
  
  // Update content
  modalTitle.textContent = page ? "Edit Page" : "Create New Page";
  
  // Populate form
  if (page) {
    document.getElementById("page-slug").value = page.slug;
    document.getElementById("page-title").value = page.title;
    // ... more fields
  } else {
    form.reset();
  }
}

/**
 * AFTER: New pattern with global showModal() function
 */
function openPageEditor(page = null) {
  const isEdit = !!page;
  
  // Build form HTML
  const formHTML = `
    <form id="page-form" class="space-y-4">
      <div>
        <label for="page-slug" class="block text-sm font-medium mb-2">
          Slug (URL path)
        </label>
        <input
          type="text"
          id="page-slug"
          name="slug"
          value="${page?.slug || ''}"
          required
          class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          placeholder="about"
        />
      </div>
      
      <div>
        <label for="page-title" class="block text-sm font-medium mb-2">
          Title
        </label>
        <input
          type="text"
          id="page-title"
          name="title"
          value="${page?.title || ''}"
          class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          placeholder="About Us"
        />
      </div>
      
      <div>
        <label for="page-description" class="block text-sm font-medium mb-2">
          Description
        </label>
        <input
          type="text"
          id="page-description"
          name="description"
          value="${page?.description || ''}"
          class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          placeholder="Page meta description"
        />
      </div>
      
      <div>
        <label for="page-template" class="block text-sm font-medium mb-2">
          Template
        </label>
        <select 
          id="page-template" 
          name="template" 
          class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="default" ${page?.template === 'default' ? 'selected' : ''}>Default</option>
          <option value="fullwidth" ${page?.template === 'fullwidth' ? 'selected' : ''}>Full Width</option>
          <option value="minimal" ${page?.template === 'minimal' ? 'selected' : ''}>Minimal</option>
          <option value="centered" ${page?.template === 'centered' ? 'selected' : ''}>Centered Content</option>
        </select>
      </div>
      
      <div class="flex items-center">
        <input
          type="checkbox"
          id="page-include-in-navigation"
          name="includeInNavigation"
          ${page?.includeInNavigation ? 'checked' : ''}
          class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded"
        />
        <label for="page-include-in-navigation" class="ml-2 text-sm font-medium">
          Include in primary navigation
        </label>
      </div>
    </form>
  `;
  
  // Show modal with the new global function
  window.showModal({
    id: "page-editor-modal",
    title: isEdit ? "Edit Page" : "Create New Page",
    body: formHTML,
    primaryButtonText: isEdit ? "Update Page" : "Create Page",
    secondaryButtonText: "Cancel",
    size: "large",
    onConfirm: async () => {
      const form = document.getElementById("page-form");
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Show loading state
      const btn = document.getElementById("page-editor-modal-confirm-btn");
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.innerHTML = '<i class="bx bx-loader-alt animate-spin mr-1"></i>Saving...';
      
      try {
        const endpoint = isEdit ? `/api/pages/update` : `/api/pages/create`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            id: page?.id
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          window.showNotice(
            "success",
            isEdit ? "Page Updated" : "Page Created",
            result.message,
            3000
          );
          
          // Refresh page list or update UI
          if (typeof refreshPageList === "function") {
            refreshPageList();
          }
        } else {
          throw new Error(result.error || "Failed to save page");
        }
      } catch (error) {
        console.error("Error saving page:", error);
        window.showNotice(
          "error",
          "Save Failed",
          error.message,
          5000
        );
        
        // Don't close modal on error
        btn.disabled = false;
        btn.textContent = originalText;
        throw error;
      }
    },
    onCancel: () => {
      console.log("Page editor cancelled");
    }
  });
}

/**
 * EXAMPLE: Simple confirmation dialog
 */
function confirmDeletePage(pageId) {
  window.showModal({
    title: "Confirm Deletion",
    body: `
      <div class="space-y-4">
        <p class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this page? This action cannot be undone.
        </p>
        <p class="text-sm text-danger-600 dark:text-danger-400">
          <i class="bx bx-error-circle mr-1"></i>
          Warning: This will permanently delete the page and all its content.
        </p>
      </div>
    `,
    primaryButtonText: "Delete Page",
    secondaryButtonText: "Cancel",
    size: "small",
    onConfirm: async () => {
      const response = await fetch(`/api/pages/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pageId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        window.showNotice("success", "Page Deleted", result.message, 3000);
        // Refresh list
        if (typeof refreshPageList === "function") {
          refreshPageList();
        }
      } else {
        throw new Error(result.error || "Failed to delete page");
      }
    }
  });
}

/**
 * EXAMPLE: View page details (no footer)
 */
function viewPageDetails(page) {
  const detailsHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Slug:</span>
          <p class="text-gray-900 dark:text-white">${page.slug}</p>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Title:</span>
          <p class="text-gray-900 dark:text-white">${page.title}</p>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Template:</span>
          <p class="text-gray-900 dark:text-white">${page.template}</p>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Created:</span>
          <p class="text-gray-900 dark:text-white">${new Date(page.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div>
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Description:</span>
        <p class="text-gray-900 dark:text-white">${page.description || 'N/A'}</p>
      </div>
      
      <div class="flex gap-2 pt-4">
        <button 
          onclick="openPageEditor(${JSON.stringify(page)})"
          class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          <i class="bx bx-edit mr-1"></i> Edit
        </button>
        <button 
          onclick="window.hideModal('page-details-modal')"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  `;
  
  window.showModal({
    id: "page-details-modal",
    title: "Page Details",
    body: detailsHTML,
    showFooter: false,
    size: "medium"
  });
}

/**
 * INTEGRATION: Add to your event listeners
 */
document.addEventListener("DOMContentLoaded", () => {
  // Create new page button
  document.getElementById("create-page-btn")?.addEventListener("click", () => {
    openPageEditor();
  });
  
  // Edit page buttons (delegated event listener)
  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit-page]");
    if (editBtn) {
      const pageId = editBtn.dataset.editPage;
      // Fetch page data
      fetch(`/api/pages/${pageId}`)
        .then(res => res.json())
        .then(page => openPageEditor(page));
    }
    
    const deleteBtn = e.target.closest("[data-delete-page]");
    if (deleteBtn) {
      const pageId = deleteBtn.dataset.deletePage;
      confirmDeletePage(pageId);
    }
    
    const viewBtn = e.target.closest("[data-view-page]");
    if (viewBtn) {
      const pageId = viewBtn.dataset.viewPage;
      fetch(`/api/pages/${pageId}`)
        .then(res => res.json())
        .then(page => viewPageDetails(page));
    }
  });
});

/**
 * USAGE IN HTML:
 * 
 * <button id="create-page-btn">Create Page</button>
 * 
 * <button data-edit-page="123">Edit</button>
 * <button data-delete-page="123">Delete</button>
 * <button data-view-page="123">View</button>
 */
