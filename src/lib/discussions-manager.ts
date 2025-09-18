/**
 * Discussions Manager
 *
 * Centralized TypeScript module for handling discussion functionality
 * including image uploads, comment management, and UI interactions.
 */

import { imageManager } from "./image-utils";

export interface Discussion {
  id: number;
  message: string;
  author_id: string;
  project_id: number;
  mark_completed: boolean;
  created_at: string;
  updated_at: string;
  display_name: string;
  images?: any[];
}

export class DiscussionManager {
  private projectId: string;
  private discussions: Discussion[] = [];
  private currentUser: any = null;
  private currentRole: string = "";
  private project: any = null;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Initialize the discussion manager
   */
  public async initialize(): Promise<void> {
    console.log("💬 [DISCUSSIONS] Initializing discussion manager");

    // Make imageManager globally available
    (window as any).imageManager = imageManager;

    // Load current user and project data
    await this.loadUserData();
    await this.loadProjectData();

    // Load initial discussions
    await this.loadDiscussions();

    // Set up event listeners
    this.setupEventListeners();

    // Update incomplete comments count
    this.updateIncompleteCommentsCount();
  }

  /**
   * Load current user data from API
   */
  private async loadUserData(): Promise<void> {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        this.currentUser = data.user;
        this.currentRole = data.role || "Client";
        console.log(
          "💬 [DISCUSSIONS] Loaded user data:",
          this.currentUser?.company_name,
          this.currentRole
        );
      }
    } catch (error) {
      console.error("💬 [DISCUSSIONS] Error loading user data:", error);
    }
  }

  /**
   * Load project data from API
   */
  private async loadProjectData(): Promise<void> {
    try {
      const response = await fetch(`/api/get-project/${this.projectId}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        this.project = data.project;
        console.log("💬 [DISCUSSIONS] Loaded project data:", this.project?.title);
      }
    } catch (error) {
      console.error("💬 [DISCUSSIONS] Error loading project data:", error);
    }
  }

  /**
   * Load discussions from the server
   */
  public async loadDiscussions(): Promise<void> {
    try {
      console.log("💬 [DISCUSSIONS] Loading discussions for project:", this.projectId);

      const response = await fetch(`/api/discussions?projectId=${this.projectId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to load discussions: ${response.status}`);
      }

      const data = await response.json();
      this.discussions = data.discussions || [];

      console.log("💬 [DISCUSSIONS] Loaded", this.discussions.length, "discussions");

      // Render discussions
      this.renderDiscussions();
    } catch (error) {
      console.error("💬 [DISCUSSIONS] Error loading discussions:", error);
      this.showError("Failed to load discussions");
    }
  }

  /**
   * Render discussions to the DOM
   */
  private renderDiscussions(): void {
    const commentsList = document.getElementById("comments-list");
    if (!commentsList) {
      console.error("💬 [DISCUSSIONS] Comments list element not found");
      return;
    }

    if (this.discussions.length === 0) {
      commentsList.innerHTML = `
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <i class="bx bx-message-dots text-4xl mb-2"></i>
          <p>No discussions yet. Start a conversation!</p>
        </div>
      `;
      return;
    }

    commentsList.innerHTML = this.discussions
      .map((discussion) => this.renderDiscussion(discussion))
      .join("");

    // Set up toggle listeners for each discussion
    this.setupToggleListeners();
  }

  /**
   * Render a single discussion
   */
  private renderDiscussion(discussion: Discussion): string {
    const isInternal = this.currentRole === "Admin" || this.currentRole === "Staff";
    const isAuthor = discussion.author_id === this.currentUser?.id;
    const canToggleCompleted = isInternal || isAuthor;
    const canReply = isInternal;

    const marginLeft = isInternal ? "ml-0" : "ml-4";
    const borderLeft = isInternal ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-gray-300";

    const completedClass = discussion.mark_completed ? "opacity-60" : "";
    const completedIcon = discussion.mark_completed
      ? "bx-check-circle text-green-500"
      : "bx-circle text-gray-400";

    return `
      <div class="discussion-item ${completedClass} ${marginLeft} ${borderLeft} p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm" data-discussion-id="${discussion.id}">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-medium text-sm text-gray-900 dark:text-white">${discussion.display_name}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">${this.formatTimeAgo(discussion.created_at)}</span>
            </div>
            <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${discussion.message}</div>
            
            ${discussion.images && discussion.images.length > 0 ? this.renderImages(discussion.images) : ""}
          </div>
          
          ${
            canToggleCompleted
              ? `
            <div class="flex items-center gap-2 ml-4">
              <button 
                class="toggle-completed-btn p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                data-discussion-id="${discussion.id}"
                data-completed="${discussion.mark_completed}"
                title="${discussion.mark_completed ? "Mark as incomplete" : "Mark as complete"}"
              >
                <i class="bx ${completedIcon} text-lg"></i>
              </button>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  /**
   * Render images for a discussion
   */
  private renderImages(images: any[]): string {
    return `
      <div class="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
        ${images
          .map(
            (image) => `
          <div class="relative group">
            <img 
              src="${image.public_url || image.signed_url}" 
              alt="${image.title || "Discussion image"}"
              class="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              onclick="window.open('${image.public_url || image.signed_url}', '_blank')"
            />
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
              <i class="bx bx-zoom-in text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Submit discussion form
    const form = document.getElementById("discussion-form") as HTMLFormElement;
    if (form) {
      form.addEventListener("submit", (e) => this.handleSubmitDiscussion(e));
    }

    // Image upload
    const imageInput = document.getElementById("image-input") as HTMLInputElement;
    if (imageInput) {
      imageInput.addEventListener("change", (e) => this.handleImageUpload(e));
    }

    // Image preview
    const imagePreview = document.getElementById("image-preview");
    if (imagePreview) {
      imagePreview.addEventListener("click", (e) => this.handleImagePreviewClick(e));
    }
  }

  /**
   * Set up toggle listeners for completed status
   */
  private setupToggleListeners(): void {
    const toggleButtons = document.querySelectorAll(".toggle-completed-btn");
    toggleButtons.forEach((button) => {
      button.addEventListener("click", (e) => this.handleToggleCompleted(e));
    });
  }

  /**
   * Handle discussion form submission
   */
  private async handleSubmitDiscussion(e: Event): Promise<void> {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const message = formData.get("message") as string;
    const images = formData.getAll("images") as File[];

    if (!message.trim()) {
      this.showError("Please enter a message");
      return;
    }

    try {
      console.log("💬 [DISCUSSIONS] Submitting discussion with", images.length, "images");

      // Upload images first if any
      let uploadedImages: any[] = [];
      if (images.length > 0) {
        uploadedImages = await this.uploadImages(images);
      }

      // Submit discussion
      const response = await fetch("/api/discussions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          projectId: this.projectId,
          message: message.trim(),
          images: uploadedImages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit discussion");
      }

      const result = await response.json();
      console.log("💬 [DISCUSSIONS] Discussion submitted successfully");

      // Clear form
      form.reset();
      this.clearImagePreview();

      // Reload discussions
      await this.loadDiscussions();

      // Show success message
      this.showSuccess("Discussion submitted successfully");
    } catch (error) {
      console.error("💬 [DISCUSSIONS] Error submitting discussion:", error);
      this.showError(
        `Failed to submit discussion: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Handle image upload
   */
  private async handleImageUpload(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (files.length === 0) return;

    console.log("📎 [DISCUSSIONS] Selected", files.length, "files for upload");
    this.showImagePreview(files);
  }

  /**
   * Show file preview (images and documents)
   */
  private showImagePreview(files: File[]): void {
    const preview = document.getElementById("image-preview");
    if (!preview) return;

    preview.innerHTML = files
      .map((file, index) => {
        const isImage = file.type.startsWith("image/");
        const fileName = file.name.length > 20 ? file.name.substring(0, 17) + "..." : file.name;

        if (isImage) {
          return `
              <div class="relative group">
                <img 
                  src="${URL.createObjectURL(file)}" 
                  alt="Preview ${index + 1}"
                  class="w-20 h-20 object-cover rounded-lg"
                />
                <button 
                  type="button"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  onclick="this.parentElement.remove()"
                >
                  ×
                </button>
              </div>
            `;
        } else {
          // Document preview
          const fileIcon = this.getFileIcon(file.type);
          return `
              <div class="relative group">
                <div class="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center p-2 border border-gray-200 dark:border-gray-600">
                  ${fileIcon}
                  <span class="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center leading-tight">${fileName}</span>
                </div>
                <button 
                  type="button"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  onclick="this.parentElement.remove()"
                >
                  ×
                </button>
              </div>
            `;
        }
      })
      .join("");

    preview.classList.remove("hidden");
  }

  /**
   * Get file icon based on file type
   */
  private getFileIcon(fileType: string): string {
    const type = fileType.toLowerCase();

    // PDF files
    if (type.includes("pdf")) {
      return `<svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
        <path d="M9 12h6v2H9zm0 4h6v2H9z"/>
      </svg>`;
    }

    // CAD files
    if (type.includes("dwg") || type.includes("dxf") || type.includes("cad")) {
      return `<svg class="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>`;
    }

    // Document files
    if (
      type.includes("doc") ||
      type.includes("docx") ||
      type.includes("txt") ||
      type.includes("rtf")
    ) {
      return `<svg class="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
        <path d="M9 12h6v2H9zm0 4h6v2H9z"/>
      </svg>`;
    }

    // Spreadsheet files
    if (type.includes("xls") || type.includes("xlsx") || type.includes("csv")) {
      return `<svg class="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
        <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
      </svg>`;
    }

    // Default file icon
    return `<svg class="h-4 w-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
    </svg>`;
  }

  /**
   * Clear image preview
   */
  private clearImagePreview(): void {
    const preview = document.getElementById("image-preview");
    if (preview) {
      preview.innerHTML = "";
      preview.classList.add("hidden");
    }
  }

  /**
   * Handle image preview click
   */
  private handleImagePreviewClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON") {
      target.parentElement?.remove();
    }
  }

  /**
   * Upload images using the image manager
   */
  private async uploadImages(files: File[]): Promise<any[]> {
    try {
      console.log("📸 [DISCUSSIONS] Uploading images using imageManager");

      const results = await imageManager.uploadImages(files, {
        context: "discussion",
        projectId: this.projectId,
        onProgress: (progress) => {
          console.log(`📸 Upload progress: ${progress}%`);
        },
        onSuccess: (result) => {
          console.log("✅ Image uploaded:", result.file.file_name);
        },
        onError: (error) => {
          console.error("❌ Image upload error:", error);
        },
      });

      return results.map((result) => result.file);
    } catch (error) {
      console.error("📸 [DISCUSSIONS] Error uploading images:", error);
      throw error;
    }
  }

  /**
   * Handle toggle completed status
   */
  private async handleToggleCompleted(e: Event): Promise<void> {
    const button = e.currentTarget as HTMLButtonElement;
    const discussionId = button.getAttribute("data-discussion-id");
    const isCompleted = button.getAttribute("data-completed") === "true";

    if (!discussionId) return;

    try {
      console.log("💬 [DISCUSSIONS] Toggling discussion", discussionId, "to", !isCompleted);

      const response = await fetch("/api/discussions/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          discussionId: parseInt(discussionId),
          completed: !isCompleted,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle discussion status");
      }

      // Update local state
      const discussion = this.discussions.find((d) => d.id === parseInt(discussionId));
      if (discussion) {
        discussion.mark_completed = !isCompleted;
      }

      // Update UI
      button.setAttribute("data-completed", (!isCompleted).toString());
      const icon = button.querySelector("i");
      if (icon) {
        if (!isCompleted) {
          icon.className = "bx bx-check-circle text-green-500 text-lg";
          button.title = "Mark as incomplete";
        } else {
          icon.className = "bx bx-circle text-gray-400 text-lg";
          button.title = "Mark as complete";
        }
      }

      // Update discussion item appearance
      const discussionItem = button.closest(".discussion-item");
      if (discussionItem) {
        if (!isCompleted) {
          discussionItem.classList.add("opacity-60");
        } else {
          discussionItem.classList.remove("opacity-60");
        }
      }

      // Update incomplete comments count
      this.updateIncompleteCommentsCount();

      // Log the action
      if ((window as any).SimpleProjectLogger) {
        (window as any).SimpleProjectLogger.logDiscussionToggle(
          this.projectId,
          parseInt(discussionId),
          !isCompleted,
          this.currentUser,
          discussion?.message?.substring(0, 50) + "..." || "No message"
        );
      }
    } catch (error) {
      console.error("💬 [DISCUSSIONS] Error toggling discussion status:", error);
      this.showError(
        `Failed to update discussion status: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Update incomplete comments count
   */
  private updateIncompleteCommentsCount(): void {
    const incompleteCount = this.discussions.filter((d) => !d.mark_completed).length;
    const tabButton = document.getElementById("status-discussion");

    if (tabButton) {
      let countBubble = tabButton.querySelector(".discussion-count-bubble");

      if (incompleteCount > 0) {
        if (!countBubble) {
          countBubble = document.createElement("span");
          countBubble.className =
            "discussion-count-bubble absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full border border-primary-500 bg-white text-xs font-medium text-primary-500 dark:border-primary-400 dark:bg-background-dark dark:text-primary-400";
          tabButton.style.position = "relative";
          tabButton.appendChild(countBubble);
        }
        countBubble.textContent = incompleteCount.toString();
        (countBubble as HTMLElement).style.display = "flex";
        tabButton.setAttribute("data-count", incompleteCount.toString());
      } else {
        if (countBubble) {
          (countBubble as HTMLElement).style.display = "none";
        }
        tabButton.setAttribute("data-count", "0");
      }
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    console.error("💬 [DISCUSSIONS] Error:", message);
    // You can implement a toast notification system here
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    console.log("💬 [DISCUSSIONS] Success:", message);
    // You can implement a toast notification system here
  }

  /**
   * Format time ago string
   */
  private formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  }
}
