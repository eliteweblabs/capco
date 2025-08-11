// // <script src="/js/pdf.worker.min.js" defer is:inline></script>
// // <script src="/js/pdf.min.js" defer is:inline></script>

//   import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js";

//   class PDFUploader {
//     async setupSession() {
//       if (window.SUPABASE_ACCESS_TOKEN && window.SUPABASE_REFRESH_TOKEN) {
//         try {
//           await this.supabase.auth.setSession({
//             access_token: window.SUPABASE_ACCESS_TOKEN,
//             refresh_token: window.SUPABASE_REFRESH_TOKEN,
//           });
//           console.log("Session set up successfully");
//         } catch (error) {
//           console.error("Error setting up session:", error);
//         }
//       }
//     }

//     constructor(container) {
//       this.container = container;
//       this.supabaseUrl = window.SUPABASE_URL;
//       this.supabaseAnonKey = window.SUPABASE_ANON_KEY;
//       // Reuse existing client or create new one
//       if (window.supabaseClient) {
//         this.supabase = window.supabaseClient;
//       } else {
//         this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
//         window.supabaseClient = this.supabase;
//       }

//       this.setupEventListeners();

//       // Set up session if tokens are available (async)
//       this.setupSession();
//     }

//     setupEventListeners() {
//       const dropzone = this.container.querySelector("#dropzone-landing");
//       const fileInput = this.container.querySelector("#file-input");
//       const browseBtn = this.container.querySelector("#browse-btn");

//       // Browse button
//       browseBtn.addEventListener("click", () => {
//         console.log("Browse button clicked");
//         fileInput.click();
//       });

//       // File input change
//       fileInput.addEventListener("change", (e) => {
//         console.log("File input changed");
//         this.handleFiles(e.target.files);
//       });

//       // Drag and drop events
//       dropzone.addEventListener("dragover", (e) => {
//         e.preventDefault();
//         dropzone.classList.add("border-sky-500", "bg-sky-50");
//         dropzone.classList.remove("border-gray-300");
//       });

//       dropzone.addEventListener("dragleave", (e) => {
//         e.preventDefault();
//         dropzone.classList.remove("border-sky-500", "bg-sky-50");
//         dropzone.classList.add("border-gray-300");
//       });

//       dropzone.addEventListener("drop", (e) => {
//         e.preventDefault();
//         dropzone.classList.remove("border-sky-500", "bg-sky-50");
//         dropzone.classList.add("border-gray-300");

//         const files = e.dataTransfer.files;
//         this.handleFiles(files);
//       });
//     }

//     async handleFiles(files) {
//       console.log("Handling files:", files);
//       const pdfFiles = Array.from(files).filter(
//         (file) =>
//           file.type === "application/pdf" && file.size <= 10 * 1024 * 1024
//       );

//       if (pdfFiles.length === 0) {
//         alert("Please select valid PDF files under 10MB");
//         return;
//       }

//       // Show upload progress
//       const uploadProgress = this.container.querySelector(
//         "#upload-progress-dynamic"
//       );
//       const progressList = this.container.querySelector(
//         "#progress-list-dynamic"
//       );
//       uploadProgress.classList.remove("hidden");
//       progressList.innerHTML = "";

//       for (const file of pdfFiles) {
//         const progressItem = this.createProgressItem(file.name);
//         progressList.appendChild(progressItem);

//         try {
//           // Get current user from Supabase auth
//           const {
//             data: { user },
//             error: userError,
//           } = await this.supabase.auth.getUser();

//           if (userError || !user) {
//             throw new Error("User not authenticated - please sign in again");
//           }

//           // Step 1: Create new project with minimal data
//           const { data: project, error: projectError } = await this.supabase
//             .from("projects")
//             .insert({
//               title: "New Project",
//               description: "Project created from PDF upload",
//               author_id: user.id,
//               status: 0,
//               sq_ft: 0,
//               new_construction: false,
//             })
//             .select()
//             .single();

//           if (projectError) throw projectError;

//           // Step 2: Upload PDF to storage
//           const timestamp = Date.now();
//           const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
//           const fileName = `${user.id}/${timestamp}_${sanitizedFileName}`;

//           const { data: uploadData, error: uploadError } =
//             await this.supabase.storage
//               .from("project-documents")
//               .upload(fileName, file, {
//                 cacheControl: "3600",
//                 upsert: false,
//               });

//           if (uploadError) throw uploadError;

//           // Step 3: Get public URL
//           const {
//             data: { publicUrl },
//           } = this.supabase.storage
//             .from("project-documents")
//             .getPublicUrl(fileName);

//           // Step 4: Create file record in database
//           const { error: fileError } = await this.supabase
//             .from("files")
//             .insert({
//               project_id: project.id,
//               author_id: user.id,
//               name: file.name,
//               file_name: file.name,
//               file_path: fileName,
//               file_type: "application/pdf",
//               file_size: file.size,
//               status: "active",
//             });

//           if (fileError) throw fileError;

//           // Update progress
//           this.updateProgress(
//             progressItem,
//             "success",
//             "Project created successfully"
//           );

//           // Store file and URL for viewer
//           this.uploadedFile = file;
//           this.publicUrl = publicUrl;
//           this.projectId = project.id;

//           // Replace with PDF viewer
//           this.onUploadComplete();
//         } catch (error) {
//           console.error("Upload error:", error);
//           this.updateProgress(
//             progressItem,
//             "error",
//             error.message || "Upload failed"
//           );
//         }
//       }

//       // Hide progress after a delay
//       setTimeout(() => {
//         uploadProgress.classList.add("hidden");
//       }, 3000);
//     }

//     createProgressItem(fileName) {
//       const div = document.createElement("div");
//       div.className =
//         "flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-700";
//       div.innerHTML = `
//         <div class="flex items-center space-x-3">
//           <i class="bx bx-file-pdf bx-sm text-red-500"></i>
//           <span class="text-sm font-medium text-gray-900 dark:text-white">${fileName}</span>
//         </div>
//         <div class="flex items-center space-x-2">
//           <div class="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-600">
//             <div class="progress-bar h-2 rounded-full bg-sky-500 transition-all duration-300" style="width: 0%"></div>
//           </div>
//           <span class="progress-text text-xs text-gray-500 dark:text-gray-400">0%</span>
//         </div>
//       `;
//       return div;
//     }

//     updateProgress(progressItem, status, message) {
//       const progressBar = progressItem.querySelector(".progress-bar");
//       const progressText = progressItem.querySelector(".progress-text");

//       // debugger;
//       if (status === "success") {
//         progressBar.className =
//           "progress-bar h-2 rounded-full bg-green-500 transition-all duration-300 w-full";
//         // progressBar.style.width = "100%";
//         progressText.textContent = "100%";
//         progressText.className = "progress-text text-xs text-green-500";
//       } else if (status === "error") {
//         progressBar.className =
//           "progress-bar h-2 rounded-full bg-red-500 transition-all duration-300";
//         progressText.textContent = "Failed";
//         progressText.className = "progress-text text-xs text-red-500";
//       }
//     }

//     onUploadComplete() {
//       // Destroy uploader, create PDFViewer + PDFScraper
//       this.container.innerHTML = "";
//       new PDFViewer(
//         this.container,
//         this.uploadedFile,
//         this.publicUrl,
//         this.projectId
//       );
//       new PDFScraper(this.container, this.projectId);

//       // Toggle layout: hide projects list, make PDF viewer full width
//       if (window.toggleLayoutForPDF) {
//         window.toggleLayoutForPDF(true);
//       }
//     }

//     toggleLayoutForPDF(hasPDF) {
//       const projectsList = document.getElementById("projects-list");
//       const pdfViewerContainer = document.getElementById("new-project-upload");
//       const layoutContainer = document.getElementById("layout-container");
//       const statusFilterButtons = document.getElementById(
//         "status-filter-buttons"
//       );

//       if (hasPDF) {
//         // Hide projects list
//         if (projectsList) {
//           projectsList.style.display = "none";
//         }

//         // Hide status filter buttons
//         if (statusFilterButtons) {
//           statusFilterButtons.style.visibility = "hidden";
//         }

//         // Make PDF viewer full width
//         if (pdfViewerContainer) {
//           pdfViewerContainer.className = pdfViewerContainer.className.replace(
//             "w-full md:w-1/3 md:sticky md:top-20 md:self-start",
//             "w-full"
//           );
//         }

//         // Update layout container to single column
//         if (layoutContainer) {
//           layoutContainer.className = layoutContainer.className.replace(
//             "md:flex-row",
//             "flex-col"
//           );
//         }
//       } else {
//         // Show projects list
//         if (projectsList) {
//           projectsList.style.display = "block";
//         }

//         // Show status filter buttons
//         if (statusFilterButtons) {
//           statusFilterButtons.style.visibility = "visible";
//         }

//         // Restore PDF viewer to 1/3 width with sticky positioning
//         if (pdfViewerContainer) {
//           if (!pdfViewerContainer.className.includes("md:w-1/3")) {
//             pdfViewerContainer.className = pdfViewerContainer.className.replace(
//               /w-full(?!\s+md:)/,
//               "w-full md:w-1/3 md:sticky md:top-20 md:self-start"
//             );
//           }
//         }

//         // Restore layout container to responsive row
//         if (layoutContainer) {
//           if (!layoutContainer.className.includes("md:flex-row")) {
//             layoutContainer.className = layoutContainer.className.replace(
//               /flex-col(?!\s+md:)/,
//               "flex-col md:flex-row"
//             );
//           }
//         }
//       }
//     }
//   }

//   // Global function to toggle layout (accessible from anywhere)
//   window.toggleLayoutForPDF = function (hasPDF) {
//     const projectsList = document.getElementById("projects-list");
//     const pdfViewerContainer = document.getElementById("new-project-upload");
//     const layoutContainer = document.getElementById("layout-container");
//     const statusFilterButtons = document.getElementById(
//       "status-filter-buttons"
//     );

//     if (hasPDF) {
//       // Hide projects list
//       if (projectsList) {
//         projectsList.style.display = "none";
//       }

//       // Hide status filter buttons
//       if (statusFilterButtons) {
//         statusFilterButtons.style.visibility = "hidden";
//       }

//       // Make PDF viewer full width
//       if (pdfViewerContainer) {
//         pdfViewerContainer.className = pdfViewerContainer.className.replace(
//           "w-full md:w-1/3 md:sticky md:top-20 md:self-start",
//           "w-full"
//         );
//       }

//       // Update layout container to single column
//       if (layoutContainer) {
//         layoutContainer.className = layoutContainer.className.replace(
//           "md:flex-row",
//           "flex-col"
//         );
//       }
//     } else {
//       // Show projects list
//       if (projectsList) {
//         projectsList.style.display = "block";
//       }

//       // Show status filter buttons
//       if (statusFilterButtons) {
//         statusFilterButtons.style.visibility = "visible";
//       }

//       // Restore PDF viewer to 1/3 width with sticky positioning
//       if (pdfViewerContainer) {
//         if (!pdfViewerContainer.className.includes("md:w-1/3")) {
//           pdfViewerContainer.className = pdfViewerContainer.className.replace(
//             /w-full(?!\s+md:)/,
//             "w-full md:w-1/3 md:sticky md:top-20 md:self-start"
//           );
//         }
//       }

//       // Restore layout container to responsive row
//       if (layoutContainer) {
//         if (!layoutContainer.className.includes("md:flex-row")) {
//           layoutContainer.className = layoutContainer.className.replace(
//             /flex-col(?!\s+md:)/,
//             "flex-col md:flex-row"
//           );
//         }
//       }
//     }
//   };

//   class PDFViewer {
//     constructor(container, file, publicUrl, projectId) {
//       this.container = container;
//       this.file = file;
//       this.publicUrl = publicUrl;
//       this.projectId = projectId;
//       // Reuse existing client or create new one
//       if (window.supabaseClient) {
//         this.supabase = window.supabaseClient;
//       } else {
//         this.supabase = createClient(
//           window.SUPABASE_URL,
//           window.SUPABASE_ANON_KEY
//         );
//         window.supabaseClient = this.supabase;
//       }
//       this.setupEventListeners();
//     }

//     setupEventListeners() {
//       const prevBtn = this.container.querySelector(".pdf-prev-page");
//       const nextBtn = this.container.querySelector(".pdf-next-page");
//       const pageInfo = this.container.querySelector(".pdf-page-info");
//       const downloadBtn = this.container.querySelector(".pdf-download");
//       const printBtn = this.container.querySelector(".pdf-print");
//       const deleteBtn = this.container.querySelector(".pdf-delete");
//       const canvas = this.container.querySelector("#pdf-canvas");

//       // Basic PDF viewer setup
//       this.pdfDoc = null;
//       this.currentPage = 1;
//       this.totalPages = 1;
//       this.pageRendering = false;
//       this.pageNumPending = null;
//       this.scale = 1.5;

//       // Navigation buttons
//       prevBtn.addEventListener("click", () => {
//         console.log("Previous page clicked");
//         if (this.currentPage <= 1) return;
//         if (this.pageRendering) {
//           this.pageNumPending = this.currentPage - 1;
//         } else {
//           this.currentPage--;
//           this.renderPage(this.currentPage);
//         }
//       });

//       nextBtn.addEventListener("click", () => {
//         console.log("Next page clicked");
//         if (this.currentPage >= this.totalPages) return;
//         if (this.pageRendering) {
//           this.pageNumPending = this.currentPage + 1;
//         } else {
//           this.currentPage++;
//           this.renderPage(this.currentPage);
//         }
//       });

//       downloadBtn.addEventListener("click", () => {
//         console.log("Download clicked");
//         const link = document.createElement("a");
//         link.href = this.publicUrl;
//         link.download = this.publicUrl.split("/").pop() || "document.pdf";
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//       });

//       printBtn.addEventListener("click", () => {
//         console.log("Print clicked");
//         window.print();
//       });

//       deleteBtn.addEventListener("click", () => {
//         console.log("Delete clicked");
//         if (confirm("Are you sure you want to delete this PDF?")) {
//           this.deletePDF();
//         }
//       });

//       // Setup drag/swipe navigation
//       this.setupDragNavigation();

//       // Load PDF if public URL is provided
//       if (this.publicUrl) {
//         this.loadPDF();
//       } else {
//         console.log("No PDF URL provided, showing placeholder");
//         pageInfo.textContent = "PDF viewer ready";
//       }
//     }

//     loadPDF() {
//       console.log("Loading PDF from Supabase URL:", this.publicUrl);

//       // Wait for PDF.js to be available
//       this.waitForPDFJS().then(() => {
//         const pdfjsLib = window.pdfjsLib;

//         // Set worker source
//         if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
//           pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.js";
//         }

//         // Load PDF from Supabase URL
//         if (this.publicUrl) {
//           console.log("Loading PDF from URL:", this.publicUrl);

//           pdfjsLib
//             .getDocument(this.publicUrl)
//             .promise.then((pdf) => {
//               this.pdfDoc = pdf;
//               this.totalPages = pdf.numPages;
//               this.currentPage = 1;
//               this.renderPage(this.currentPage);
//             })
//             .catch((error) => {
//               console.error("Error loading PDF from URL:", error);
//             });
//         } else {
//           console.log("No public URL to load");
//         }
//       });
//     }

//     waitForPDFJS() {
//       return new Promise((resolve) => {
//         function check() {
//           if (window.pdfjsLib) {
//             resolve();
//           } else {
//             setTimeout(check, 50);
//           }
//         }
//         check();
//       });
//     }

//     setupDragNavigation() {
//       const canvas = this.container.querySelector("#pdf-canvas");
//       if (!canvas) {
//         console.log("Canvas not found for drag navigation");
//         return;
//       }

//       let isDragging = false;
//       let startX = 0;
//       let startY = 0;
//       let startTime = 0;
//       const minDragDistance = 50; // Minimum pixels to trigger navigation
//       const maxDragTime = 500; // Maximum time for a valid swipe (ms)
//       const maxVerticalMovement = 100; // Maximum vertical movement for horizontal swipe

//       // Mouse events
//       const handleMouseStart = (e) => {
//         // Check if overlay is active for scraping - if so, don't start drag
//         const overlay = this.container.querySelector(
//           "#pdf-meta-extractor-overlay"
//         );
//         if (overlay && overlay.style.pointerEvents === "auto") {
//           return; // Let the overlay handle the interaction
//         }

//         isDragging = true;
//         startX = e.clientX;
//         startY = e.clientY;
//         startTime = Date.now();
//         canvas.style.cursor = "grabbing";
//         e.preventDefault();
//       };

//       const handleMouseMove = (e) => {
//         if (!isDragging) return;

//         const deltaX = e.clientX - startX;
//         const deltaY = e.clientY - startY;

//         // Visual feedback - add a subtle transform
//         const translateX = Math.max(-30, Math.min(30, deltaX * 0.3));
//         canvas.style.transform = `translateX(${translateX}px)`;

//         e.preventDefault();
//       };

//       const handleMouseEnd = (e) => {
//         if (!isDragging) return;

//         isDragging = false;
//         const deltaX = e.clientX - startX;
//         const deltaY = e.clientY - startY;
//         const deltaTime = Date.now() - startTime;

//         // Reset visual state
//         canvas.style.cursor = "grab";
//         canvas.style.transform = "translateX(0px)";

//         // Check if this was a valid horizontal swipe
//         if (
//           deltaTime <= maxDragTime &&
//           Math.abs(deltaY) <= maxVerticalMovement &&
//           Math.abs(deltaX) >= minDragDistance
//         ) {
//           if (deltaX > 0) {
//             // Swiped right - go to previous page
//             this.goToPreviousPage();
//           } else {
//             // Swiped left - go to next page
//             this.goToNextPage();
//           }
//         }

//         e.preventDefault();
//       };

//       // Touch events
//       const handleTouchStart = (e) => {
//         if (e.touches.length === 1) {
//           // Check if overlay is active for scraping - if so, don't start drag
//           const overlay = this.container.querySelector(
//             "#pdf-meta-extractor-overlay"
//           );
//           if (overlay && overlay.style.pointerEvents === "auto") {
//             return; // Let the overlay handle the interaction
//           }

//           const touch = e.touches[0];
//           isDragging = true;
//           startX = touch.clientX;
//           startY = touch.clientY;
//           startTime = Date.now();
//           e.preventDefault();
//         }
//       };

//       const handleTouchMove = (e) => {
//         if (!isDragging || e.touches.length !== 1) return;

//         const touch = e.touches[0];
//         const deltaX = touch.clientX - startX;
//         const deltaY = touch.clientY - startY;

//         // Visual feedback
//         const translateX = Math.max(-30, Math.min(30, deltaX * 0.3));
//         canvas.style.transform = `translateX(${translateX}px)`;

//         e.preventDefault();
//       };

//       const handleTouchEnd = (e) => {
//         if (!isDragging) return;

//         const touch = e.changedTouches[0];
//         const deltaX = touch.clientX - startX;
//         const deltaY = touch.clientY - startY;
//         const deltaTime = Date.now() - startTime;

//         isDragging = false;

//         // Reset visual state
//         canvas.style.transform = "translateX(0px)";

//         // Check if this was a valid horizontal swipe
//         if (
//           deltaTime <= maxDragTime &&
//           Math.abs(deltaY) <= maxVerticalMovement &&
//           Math.abs(deltaX) >= minDragDistance
//         ) {
//           if (deltaX > 0) {
//             // Swiped right - go to previous page
//             this.goToPreviousPage();
//           } else {
//             // Swiped left - go to next page
//             this.goToNextPage();
//           }
//         }

//         e.preventDefault();
//       };

//       // Add event listeners
//       canvas.addEventListener("mousedown", handleMouseStart);
//       canvas.addEventListener("mousemove", handleMouseMove);
//       canvas.addEventListener("mouseup", handleMouseEnd);
//       canvas.addEventListener("mouseleave", handleMouseEnd); // Handle mouse leaving canvas

//       canvas.addEventListener("touchstart", handleTouchStart, {
//         passive: false,
//       });
//       canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
//       canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

//       // Set initial cursor style
//       canvas.style.cursor = "grab";
//       canvas.style.transition = "transform 0.2s ease-out";

//       console.log("Drag navigation setup complete");
//     }

//     goToPreviousPage() {
//       if (this.currentPage <= 1) return;
//       if (this.pageRendering) {
//         this.pageNumPending = this.currentPage - 1;
//       } else {
//         this.currentPage--;
//         this.renderPage(this.currentPage);
//       }
//       console.log("Dragged to previous page:", this.currentPage);
//     }

//     goToNextPage() {
//       if (this.currentPage >= this.totalPages) return;
//       if (this.pageRendering) {
//         this.pageNumPending = this.currentPage + 1;
//       } else {
//         this.currentPage++;
//         this.renderPage(this.currentPage);
//       }
//       console.log("Dragged to next page:", this.currentPage);
//     }

//     renderPage(num) {
//       console.log("Rendering page:", num);
//       if (!this.pdfDoc) {
//         console.log("No PDF document loaded");
//         return;
//       }

//       this.pageRendering = true;
//       this.pdfDoc.getPage(num).then((page) => {
//         const canvas = this.container.querySelector("#pdf-canvas");
//         const overlay = this.container.querySelector(
//           "#pdf-meta-extractor-overlay"
//         );
//         const viewport = page.getViewport({ scale: this.scale });

//         canvas.width = viewport.width;
//         canvas.height = viewport.height;

//         // Size the overlay to match the canvas
//         if (overlay) {
//           overlay.width = viewport.width;
//           overlay.height = viewport.height;
//         }

//         const context = canvas.getContext("2d");
//         const renderContext = {
//           canvasContext: context,
//           viewport: viewport,
//         };

//         const renderTask = page.render(renderContext);
//         renderTask.promise.then(() => {
//           this.pageRendering = false;
//           this.container.querySelector(".pdf-page-info").textContent =
//             `Page ${this.currentPage} of ${this.totalPages}`;

//           if (this.pageNumPending !== null) {
//             this.renderPage(this.pageNumPending);
//             this.pageNumPending = null;
//           }
//         });
//       });
//     }

//     async deletePDF() {
//       console.log("Deleting PDF and returning to uploader");

//       if (this.projectId && this.publicUrl) {
//         try {
//           // Get the file path from the URL
//           const urlParts = this.publicUrl.split("/");
//           const fileName = urlParts[urlParts.length - 1];
//           const filePath = `${fileName}`;

//           // Delete from Supabase storage
//           const { error: storageError } = await this.supabase.storage
//             .from("project-documents")
//             .remove([filePath]);

//           if (storageError) {
//             console.error("Error deleting from storage:", storageError);
//           }

//           // Delete file record from database
//           const { error: fileError } = await this.supabase
//             .from("files")
//             .delete()
//             .eq("project_id", this.projectId);

//           if (fileError) {
//             console.error("Error deleting file record:", fileError);
//           }

//           // Delete project from database
//           const { error: projectError } = await this.supabase
//             .from("projects")
//             .delete()
//             .eq("id", this.projectId);

//           if (projectError) {
//             console.error("Error deleting project:", projectError);
//           }
//         } catch (error) {
//           console.error("Error during deletion:", error);
//         }
//       }

//       // Clear cached data
//       this.pdfDoc = null;
//       this.file = null;

//       // Return to uploader
//       this.container.innerHTML = "";

//       // Clean up any active scraper instance
//       if (window.currentPDFScraper && window.currentPDFScraper.cleanup) {
//         window.currentPDFScraper.cleanup();
//         window.currentPDFScraper = null;
//       }

//       // Restore layout: show projects list, restore original widths
//       if (window.toggleLayoutForPDF) {
//         window.toggleLayoutForPDF(false);
//       }

//       new PDFUploader(this.container);
//     }
//   }

//   class PDFScraper {
//     constructor(container, projectId) {
//       this.container = container;
//       this.projectId = projectId;
//       this.canvas = null;
//       this.overlay = null;
//       this.isSelecting = false;
//       this.readyToSelect = false;
//       this.blurTimeout = null;
//       this.startX = 0;
//       this.startY = 0;
//       this.endX = 0;
//       this.endY = 0;
//       this.selectedField = null;
//       this.targetImageId = null;
//       this.ocrText = "";
//       this.imageBlob = null;
//       this.selectedImages = []; // Array to store multiple images with titles
//       this.currentUserProfile = null; // Store current user's profile data

//       // Initialize Supabase client (same logic as PDFUploader)
//       this.supabaseUrl = window.SUPABASE_URL;
//       this.supabaseAnonKey = window.SUPABASE_ANON_KEY;
//       if (window.supabaseClient) {
//         this.supabase = window.supabaseClient;
//       } else {
//         this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
//         window.supabaseClient = this.supabase;
//       }

//       this.attachToViewer();
//       this.setupEventListeners();
//       this.setupSession(); // Set up session if tokens are available
//       this.getCurrentUserProfile(); // Load current user's profile
//     }

//     async setupSession() {
//       if (window.SUPABASE_ACCESS_TOKEN && window.SUPABASE_REFRESH_TOKEN) {
//         try {
//           await this.supabase.auth.setSession({
//             access_token: window.SUPABASE_ACCESS_TOKEN,
//             refresh_token: window.SUPABASE_REFRESH_TOKEN,
//           });
//           console.log("PDFScraper: Session set up successfully");
//         } catch (error) {
//           console.error("PDFScraper: Error setting up session:", error);
//         }
//       }
//     }

//     async getCurrentUserProfile() {
//       try {
//         // Get current user
//         const {
//           data: { user },
//           error: userError,
//         } = await this.supabase.auth.getUser();

//         if (userError || !user) {
//           console.log("No authenticated user found");
//           return;
//         }

//         // Get user's profile data
//         const { data: profile, error: profileError } = await this.supabase
//           .from("profiles")
//           .select("*")
//           .eq("id", user.id)
//           .single();

//         if (profileError) {
//           console.error("Error fetching user profile:", profileError);
//           return;
//         }

//         this.currentUserProfile = {
//           ...profile,
//           email: user.email, // Use email from auth user
//           user_metadata: user.user_metadata, // Include OAuth metadata
//         };

//         console.log("Current user profile loaded:", this.currentUserProfile);

//         // Apply UI changes based on role
//         this.setupFormForUserRole();
//       } catch (error) {
//         console.error("Error getting current user profile:", error);
//       }
//     }

//     setupFormForUserRole() {
//       if (!this.currentUserProfile) return;

//       const isClient = this.currentUserProfile.role === "Client";

//       if (isClient) {
//         // Hide the client type toggle section for client users
//         const clientTypeToggle =
//           this.container.querySelector("#owner-type-toggle");
//         if (clientTypeToggle) {
//           const clientTypeSection = clientTypeToggle.closest(".space-y-3");
//           if (clientTypeSection) {
//             console.log("Hiding client type toggle for client user");
//             clientTypeSection.style.display = "none";
//           }
//         }

//         // Show new user inputs by default and prepopulate them
//         const newUserInputs = this.container.querySelector("#new-user-inputs");
//         const existingUserInputs = this.container.querySelector(
//           "#existing-user-inputs"
//         );

//         if (newUserInputs) {
//           newUserInputs.classList.remove("hidden");
//           this.prepopulateClientFields();
//         }

//         if (existingUserInputs) {
//           existingUserInputs.classList.add("hidden");
//         }
//       }
//     }

//     prepopulateClientFields() {
//       if (!this.currentUserProfile) return;

//       const profile = this.currentUserProfile;

//       // Prepopulate company/client name
//       const companyInput = this.container.querySelector("#owner-name-input");
//       if (companyInput && profile.name) {
//         companyInput.value = profile.name;
//         companyInput.readOnly = true;
//         companyInput.style.backgroundColor = "#f3f4f6"; // Gray background to indicate readonly
//         companyInput.style.cursor = "not-allowed";
//       }

//       // Try to extract first and last name from OAuth metadata or profile name
//       let firstName = "";
//       let lastName = "";

//       if (profile.user_metadata?.name) {
//         const nameParts = profile.user_metadata.name.split(" ");
//         firstName = nameParts[0] || "";
//         lastName = nameParts.slice(1).join(" ") || "";
//       } else if (profile.name) {
//         const nameParts = profile.name.split(" ");
//         firstName = nameParts[0] || "";
//         lastName = nameParts.slice(1).join(" ") || "";
//       }

//       // Prepopulate first name
//       const firstNameInput = this.container.querySelector(
//         "#owner-first-name-input"
//       );
//       if (firstNameInput) {
//         firstNameInput.value = firstName;
//       }

//       // Prepopulate last name
//       const lastNameInput = this.container.querySelector(
//         "#owner-last-name-input"
//       );
//       if (lastNameInput) {
//         lastNameInput.value = lastName;
//       }

//       // Prepopulate email and make it readonly
//       const emailInput = this.container.querySelector("#owner-email-input");
//       if (emailInput && profile.email) {
//         emailInput.value = profile.email;
//         emailInput.readOnly = true;
//         emailInput.style.backgroundColor = "#f3f4f6"; // Gray background to indicate readonly
//         emailInput.style.cursor = "not-allowed";
//       }

//       // Prepopulate phone if available
//       const phoneInput = this.container.querySelector("#owner-phone-input");
//       if (phoneInput && profile.phone) {
//         phoneInput.value = profile.phone;
//       }

//       console.log("Prepopulated client fields:", {
//         company: profile.name,
//         firstName,
//         lastName,
//         email: profile.email,
//         phone: profile.phone,
//       });
//     }

//     attachToViewer() {
//       const sidebar = this.container.querySelector("#scraper-sidebar");
//       if (!sidebar) {
//         console.error("Scraper sidebar not found");
//         return;
//       }

//       // Add OCR overlay and field selection buttons to sidebar
//       sidebar.innerHTML = `
//         <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
//           <div class="flex flex-col gap-3">
//                         <div class="relative scrape-input-container">
//               <input
//                 type="text"
//                 id="address-input"
//                 data-field="address"
//                 class="scrape-input w-full py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//                 placeholder="Address / Title *"
//                 required
//               >
//             </div>

//             <!-- Client Selection Toggle -->
//             <div class="space-y-3">
//               <div class="flex items-center justify-between">
//                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                   Client Type
//                 </label>
//                 <label class="inline-flex items-center cursor-pointer">
//                   <input type="checkbox" id="owner-type-toggle" class="sr-only peer">
//                   <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
//                   <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Existing Client</span>
//                 </label>
//               </div>

//               <!-- New Client Inputs (default visible) -->
//               <div id="new-user-inputs" class="space-y-3">
//                 <div class="relative scrape-input-container">
//                   <input
//                     type="text"
//                     id="owner-name-input"
//                     data-field="owner_name"
//                     class="scrape-input w-full py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//                     placeholder="Company / Client Name *"
//                     required
//                   >
//                 </div>
//                 <div class="grid grid-cols-2 gap-3">
//                   <div class="relative scrape-input-container">
//                     <input
//                       type="text"
//                       id="owner-first-name-input"
//                       data-field="owner_first_name"
//                       class="scrape-input w-full py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//                       placeholder="First Name *"
//                       required
//                     >
//                   </div>
//                   <div class="relative scrape-input-container">
//                     <input
//                       type="text"
//                       id="owner-last-name-input"
//                       data-field="owner_last_name"
//                       class="scrape-input w-full py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//                       placeholder="Last Name *"
//                       required
//                     >
//                   </div>
//                 </div>
//                 <div class="relative scrape-input-container">
//                   <input
//                     type="email"
//                     id="owner-email-input"
//                     data-field="owner_email"
//                     class="scrape-input w-full py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//                     placeholder="Email Address *"
//                     required
//                   >
//                 </div>
//                 <div class="relative scrape-input-container">
//                   <input
//                     type="tel"
//                     id="owner-phone-input"
//                     data-field="owner_phone"
//                     class="scrape-input w-full py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//                     placeholder="Phone Number"
//                   >
//                 </div>
//               </div>

//               <!-- Existing Client Inputs (initially hidden) -->
//               <div id="existing-user-inputs" class="space-y-3 hidden">
//                 <div class="relative">
//                   <input
//                     type="text"
//                     id="existing-user-search"
//                     class="w-full py-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//                     placeholder="Search existing clients..."
//                   >
//                   <button
//                     type="button"
//                     id="clear-user-search-btn"
//                     class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none hidden"
//                     title="Clear search"
//                   >
//                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
//                     </svg>
//                   </button>
//                   <input type="hidden" id="existing-user-id">
//                   <div id="user-search-results" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg hidden max-h-40 overflow-y-auto">
//                     <!-- Search results will be populated here -->
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div class="relative scrape-input-container">
//               <input
//                 type="text"
//                 id="architect-input"
//                 data-field="architect"
//                 class="scrape-input w-full py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//                 placeholder="Architect"
//               >
//             </div>

//             <div class="relative scrape-input-container">
//               <input
//                 type="number"
//                 id="square-foot-input"
//                 data-field="square_foot"
//                 class="scrape-input w-full py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//                 placeholder="Gross Square Footage (GFA) *"
//                 min="0"
//                 max="50000"
//                 step="1"
//                 title="Maximum value: 50000 square feet"
//                 required
//               >
//             </div>

//             <button id="select-image"
//               class="pdf-meta-extractor-select-field px-4 py-2 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 text-left"
//               data-field="image"
//               type="button">Select Image(s)</button>

//             <div class="flex gap-4 mt-2">
//               <label class="inline-flex items-center cursor-pointer">
//                 <input type="checkbox" id="sprinkler-toggle" class="sr-only peer">
//                 <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
//                 <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">New Construction</span>
//               </label>
//               <label class="inline-flex items-center cursor-pointer">
//                 <input type="checkbox" id="alarm-toggle" class="sr-only peer">
//                 <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
//                 <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Existing</span>
//               </label>
//             </div>

//             <div class="space-y-2">
//               <label for="units-slider" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Units: <span id="units-value" class="font-semibold text-blue-600 dark:text-blue-400">1</span>
//               </label>
//               <div class="relative">

//                 <input
//                   type="range"
//                   id="units-slider"
//                   name="units"
//                   min="0"
//                   max="14"
//                   value="0"
//                   class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 units-range-slider relative z-10"
//                   data-values="1,2,3,4,5,6,7,8,9,10,15,20,30,40,50"
//                   aria-label="Select number of units"
//                 >
//                 <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
//                   <span>1</span>
//                   <span>5</span>
//                   <span>10</span>
//                   <span>30</span>
//                   <span>50</span>
//                 </div>
//               </div>
//             </div>

//             <!-- Multi-select building type buttons (commented out for later use)
//             <div class="space-y-3">
//               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Building Type (Multi-select)
//               </label>
//               <div class="flex flex-wrap gap-2">
//                 <button
//                   type="button"
//                   class="building-type-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Residential"
//                 >
//                   Residential
//                 </button>
//                 <button
//                   type="button"
//                   class="building-type-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Mixed use"
//                 >
//                   Mixed use
//                 </button>
//                 <button
//                   type="button"
//                   class="building-type-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Mercantile"
//                 >
//                   Mercantile
//                 </button>
//                 <button
//                   type="button"
//                   class="building-type-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Commercial"
//                 >
//                   Commercial
//                 </button>
//                 <button
//                   type="button"
//                   class="building-type-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Storage"
//                 >
//                   Storage
//                 </button>
//                  <button
//                   type="button"
//                   class="building-type-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Warehouse"
//                 >
//                   Warehouse
//                 </button>
//                 <button
//                   type="button"
//                   class="building-type-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Institutional"
//                 >
//                   Institutional
//                 </button>
//               </div>
//             </div>
//             -->

//             <!-- Radio-style building type selection (single select) -->
//             <div class="space-y-3">
//               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Building
//               </label>
//               <div class="flex flex-wrap gap-2">
//                 <button
//                   type="button"
//                   class="building-type-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Residential"
//                 >
//                   Residential
//                 </button>
//                 <button
//                   type="button"
//                   class="building-type-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Mixed use"
//                 >
//                   Mixed use
//                 </button>
//                 <button
//                   type="button"
//                   class="building-type-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Mercantile"
//                 >
//                   Mercantile
//                 </button>
//                 <button
//                   type="button"
//                   class="building-type-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Commercial"
//                 >
//                   Commercial
//                 </button>
//                 <button
//                   type="button"
//                   class="building-type-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Storage"
//                 >
//                   Storage
//                 </button>
//                 <button
//                   type="button"
//                   class="building-type-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Warehouse"
//                 >
//                   Warehouse
//                 </button>
//                 <button
//                   type="button"
//                   class="building-type-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Institutional"
//                 >
//                   Institutional
//                 </button>
//               </div>
//             </div>

//             <!-- Consulting Services (Multi-select) -->
//             <div class="space-y-3">
//               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Project
//               </label>
//               <div class="flex flex-wrap gap-2">
//                 <button
//                   type="button"
//                   class="consulting-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Sprinkler"
//                 >
//                   Sprinkler
//                 </button>
//                 <button
//                   type="button"
//                   class="consulting-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Alarm"
//                 >
//                   Alarm
//                 </button>
//                 <button
//                   type="button"
//                   class="consulting-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Mechanical"
//                 >
//                   Mechanical
//                 </button>
//                 <button
//                   type="button"
//                   class="consulting-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Electrical"
//                 >
//                   Electrical
//                 </button>
//                 <button
//                   type="button"
//                   class="consulting-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Plumbing"
//                 >
//                   Plumbing
//                 </button>
//                 <button
//                   type="button"
//                   class="consulting-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Civil engineering"
//                 >
//                   Civil engineering
//                 </button>
//                 <button
//                   type="button"
//                   class="consulting-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Other"
//                 >
//                   Other
//                 </button>
//               </div>
//             </div>

//             <!-- Fire Service Type (Single select) -->
//             <div class="space-y-3">
//               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Supply / Service
//               </label>
//               <div class="flex flex-wrap gap-2">
//                 <button
//                   type="button"
//                   class="fire-service-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Pump &amp; Tank"
//                 >
//                   Pump &amp; Tank
//                 </button>
//                 <button
//                   type="button"
//                   class="fire-service-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="2\' copper"
//                 >
//                   2' Copper
//                 </button>
//                 <button
//                   type="button"
//                   class="fire-service-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="4\' Ductile"
//                 >
//                   4' Ductile
//                 </button>
//                 <button
//                   type="button"
//                   class="fire-service-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="6\' Ductile"
//                 >
//                   6' Ductile
//                 </button>
//                 <button
//                   type="button"
//                   class="fire-service-radio px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Unknown"
//                 >
//                   Unknown
//                 </button>
//               </div>
//             </div>

//             <!-- Fire Safety Services (Multi-select) -->
//             <div class="space-y-3">
//               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Reports Required
//               </label>
//               <div class="flex flex-wrap gap-2">
//                 <button
//                   type="button"
//                   class="fire-safety-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Sprinkler"
//                 >
//                   Sprinkler
//                 </button>
//                 <button
//                   type="button"
//                   class="fire-safety-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="Alarm"
//                 >
//                 Alarm
//                 </button>
//                 <button
//                   type="button"
//                   class="fire-safety-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="NFPA 241"
//                 >
//                   NFPA 241
//                 </button>
//                 <button
//                   type="button"
//                   class="fire-safety-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="IEBC"
//                 >
//                   IEBC
//                 </button>
//                 <button
//                   type="button"
//                   class="fire-safety-service-btn px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//                   data-value="IBC"
//                 >
//                   IBC
//                 </button>
//               </div>
//             </div>
//           </div>
//                    <!-- OCR result area for image gallery - initially hidden -->
//          <div id="images-container" class="mt-4 bg-gray-50 dark:bg-gray-800 rounded-md min-h-[100px] hidden">
//            <!-- Image gallery will be inserted here -->
//          </div>

//          <!-- Project action buttons - always visible at bottom -->
//          <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
//            <div class="flex gap-3 justify-end">
//              <button id="clear-project" class="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
//                Clear All
//              </button>
//              <button id="save-project" class="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
//                Create & Save Project
//              </button>
//            </div>
//          </div>
//         </div>
//       `;
//     }

//     setupEventListeners() {
//       // Get references to canvas and overlay from the PDF viewer
//       this.canvas = this.container.querySelector("#pdf-canvas");
//       this.overlay = this.container.querySelector(
//         "#pdf-meta-extractor-overlay"
//       );
//       const ocrResultDiv = this.container.querySelector("#images-container");
//       const saveProjectBtn = this.container.querySelector("#save-project");
//       const clearProjectBtn = this.container.querySelector("#clear-project");
//       const fieldBtns = this.container.querySelectorAll(
//         ".pdf-meta-extractor-select-field"
//       );
//       const scrapeButtons = this.container.querySelectorAll(
//         "button[data-field][data-input-id]"
//       );

//       if (!this.canvas || !this.overlay) {
//         console.error("Canvas or overlay not found");
//         return;
//       }

//       // If field buttons are not found, retry after a short delay
//       if (fieldBtns.length === 0) {
//         console.log("Field buttons not found, retrying in 100ms...");
//         setTimeout(() => {
//           this.setupEventListeners();
//         }, 100);
//         return;
//       }

//       // Ensure overlay starts in inactive state
//       this.overlay.style.pointerEvents = "none";
//       this.overlay.style.cursor = "default";

//       // Scrape buttons are now purely visual (CSS pseudo-elements)
//       // No event listeners needed - input focus handles everything

//       // Field selection buttons (for image and other special fields)
//       fieldBtns.forEach((btn) => {
//         btn.addEventListener("click", () => {
//           console.log("Field button clicked:", btn.getAttribute("data-field"));
//           this.selectedField = btn.getAttribute("data-field");
//           this.overlay.style.pointerEvents = "auto";
//           this.overlay.style.cursor = "crosshair";

//           this.clearOverlay();
//           this.isSelecting = false;

//           if (this.selectedField === "image") {
//             this.setupImageGallery();
//           }
//         });
//       });

//       // Add event delegation for select-image button (works even if button is created later)
//       this.container.addEventListener("click", (e) => {
//         const target = e.target.closest(".pdf-meta-extractor-select-field");
//         if (target && target.id === "select-image") {
//           console.log("Select image button clicked via event delegation");
//           this.selectedField = "image";
//           this.overlay.style.pointerEvents = "auto";
//           this.overlay.style.cursor = "crosshair";

//           this.clearOverlay();
//           this.isSelecting = false;

//           this.setupImageGallery();
//         }
//       });

//       // Mouse events for selection
//       this.overlay.addEventListener("mousedown", (e) => {
//         // Only handle if overlay is in active scraping mode
//         if (this.overlay.style.pointerEvents !== "auto") {
//           return; // Let canvas drag handle it
//         }

//         console.log("Overlay mousedown");

//         // Prevent input blur when clicking on overlay
//         e.preventDefault();
//         e.stopPropagation(); // Prevent canvas drag from interfering

//         this.isSelecting = true;
//         const rect = this.overlay.getBoundingClientRect();
//         this.startX = e.clientX - rect.left;
//         this.startY = e.clientY - rect.top;
//       });

//       this.overlay.addEventListener("mousemove", (e) => {
//         if (!this.isSelecting) return;
//         if (this.overlay.style.pointerEvents !== "auto") return;

//         e.stopPropagation(); // Prevent canvas drag from interfering
//         const rect = this.overlay.getBoundingClientRect();
//         this.endX = e.clientX - rect.left;
//         this.endY = e.clientY - rect.top;
//         this.drawSelection();
//       });

//       this.overlay.addEventListener("mouseup", (e) => {
//         if (!this.isSelecting) return;
//         if (this.overlay.style.pointerEvents !== "auto") return;

//         console.log("Overlay mouseup");
//         e.stopPropagation(); // Prevent canvas drag from interfering

//         this.isSelecting = false;
//         this.cropAndOCR();

//         // Don't disable overlay immediately - let blur handler manage it
//         // This allows multiple inputs to work in sequence
//       });

//       // Save project button
//       if (saveProjectBtn) {
//         saveProjectBtn.addEventListener("click", () => {
//           console.log("Save project clicked");
//           this.saveProjectData();
//         });
//       }

//       // Clear project button
//       if (clearProjectBtn) {
//         clearProjectBtn.addEventListener("click", () => {
//           console.log("Clear project clicked");
//           this.clearProjectData();
//         });
//       }

//       // Setup input field listeners for focus-based scraping
//       this.setupInputFieldListeners();

//       // Setup units slider
//       this.setupUnitsSlider();

//       // Setup building type radio buttons
//       this.setupBuildingTypeRadio();

//       // Setup fire service type radio buttons
//       this.setupFireServiceTypeRadio();

//       // Setup consulting services multi-select buttons
//       this.setupConsultingServices();

//       // Setup fire safety services multi-select buttons
//       this.setupFireSafetyServices();

//       // Setup ESC key handler for exiting scrape mode
//       this.setupEscapeKeyHandler();

//       // Setup owner toggle functionality
//       this.setupOwnerToggle();
//     }

//     setupOwnerToggle() {
//       const ownerTypeToggle =
//         this.container.querySelector("#owner-type-toggle");
//       const newUserInputs = this.container.querySelector("#new-user-inputs");
//       const existingUserInputs = this.container.querySelector(
//         "#existing-user-inputs"
//       );

//       if (ownerTypeToggle) {
//         // Set initial state (unchecked = new user, checked = existing user)
//         this.updateOwnerInputs(ownerTypeToggle.checked);

//         ownerTypeToggle.addEventListener("change", () => {
//           this.updateOwnerInputs(ownerTypeToggle.checked);
//         });
//       }
//     }

//     updateOwnerInputs(isExistingUser) {
//       const newUserInputs = this.container.querySelector("#new-user-inputs");
//       const existingUserInputs = this.container.querySelector(
//         "#existing-user-inputs"
//       );

//       if (isExistingUser) {
//         // Show existing user inputs, hide new user inputs
//         existingUserInputs.classList.remove("hidden");
//         newUserInputs.classList.add("hidden");
//         this.loadExistingUsers(); // Load users for dropdown
//       } else {
//         // Show new user inputs, hide existing user inputs
//         newUserInputs.classList.remove("hidden");
//         existingUserInputs.classList.add("hidden");
//       }
//     }

//     async loadExistingUsers() {
//       try {
//         const response = await fetch("/api/get-staff-users");
//         const result = await response.json();

//         if (result.success) {
//           // Store users for search functionality (even if empty array)
//           this.availableUsers = result.staffUsers || [];

//           // Update placeholder text based on availability
//           const searchInput = this.container.querySelector(
//             "#existing-user-search"
//           );
//           if (searchInput) {
//             if (this.availableUsers.length === 0) {
//               searchInput.placeholder = "No clients available";
//               searchInput.disabled = true;
//             } else {
//               searchInput.placeholder = "Search existing clients...";
//               searchInput.disabled = false;
//             }
//           }

//           // Setup search input event listeners
//           this.setupUserSearch();
//         } else {
//           console.error("Failed to load users:", result.error);
//           // Handle error case
//           const searchInput = this.container.querySelector(
//             "#existing-user-search"
//           );
//           if (searchInput) {
//             searchInput.placeholder = "Error loading clients";
//             searchInput.disabled = true;
//           }
//         }
//       } catch (error) {
//         console.error("Error loading existing users:", error);
//         // Handle network/other errors
//         const searchInput = this.container.querySelector(
//           "#existing-user-search"
//         );
//         if (searchInput) {
//           searchInput.placeholder = "Error loading clients";
//           searchInput.disabled = true;
//         }
//       }
//     }

//     setupUserSearch() {
//       const searchInput = this.container.querySelector("#existing-user-search");
//       const clearBtn = this.container.querySelector("#clear-user-search-btn");
//       const resultsList = this.container.querySelector("#user-search-results");

//       if (searchInput) {
//         // Debounced search
//         let searchTimeout;
//         searchInput.addEventListener("input", (e) => {
//           clearTimeout(searchTimeout);
//           searchTimeout = setTimeout(() => {
//             this.performUserSearch(e.target.value);
//           }, 300);
//         });

//         // Clear search functionality
//         if (clearBtn) {
//           clearBtn.addEventListener("click", () => {
//             searchInput.value = "";
//             this.clearUserSearch();
//           });
//         }

//         // Show/hide clear button based on input (only if clear button exists)
//         if (clearBtn) {
//           searchInput.addEventListener("input", () => {
//             if (searchInput.value.length > 0) {
//               clearBtn.classList.remove("hidden");
//             } else {
//               clearBtn.classList.add("hidden");
//             }
//           });
//         }
//       }
//     }

//     performUserSearch(searchTerm) {
//       const resultsList = this.container.querySelector("#user-search-results");
//       const searchInput = this.container.querySelector("#existing-user-search");

//       if (!this.availableUsers || !resultsList) return;

//       const filteredUsers = this.availableUsers.filter((user) => {
//         const searchLower = searchTerm.toLowerCase();
//         return (
//           user.name.toLowerCase().includes(searchLower) ||
//           (user.email && user.email.toLowerCase().includes(searchLower))
//         );
//       });

//       // Display results
//       if (searchTerm.length > 0 && filteredUsers.length > 0) {
//         resultsList.innerHTML = filteredUsers
//           .map(
//             (user) => `
//             <div class="user-result-item p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0" data-user-id="${user.id}" data-user-name="${user.name}">
//               <div class="font-medium text-gray-900 dark:text-white">${user.name}</div>
//               <div class="text-sm text-gray-500 dark:text-gray-400">${user.email || "No email"}</div>
//             </div>
//           `
//           )
//           .join("");

//         resultsList.classList.remove("hidden");

//         // Add click handlers to results
//         resultsList.querySelectorAll(".user-result-item").forEach((item) => {
//           item.addEventListener("click", () => {
//             const userId = item.getAttribute("data-user-id");
//             const userName = item.getAttribute("data-user-name");
//             this.selectUser(userId, userName);
//           });
//         });
//       } else if (searchTerm.length > 0) {
//         resultsList.innerHTML = `
//           <div class="p-3 text-gray-500 dark:text-gray-400 text-center">
//             No users found matching "${searchTerm}"
//           </div>
//         `;
//         resultsList.classList.remove("hidden");
//       } else {
//         resultsList.classList.add("hidden");
//       }
//     }

//     selectUser(userId, userName) {
//       const searchInput = this.container.querySelector("#existing-user-search");
//       const hiddenInput = this.container.querySelector("#existing-user-id");
//       const resultsList = this.container.querySelector("#user-search-results");

//       if (searchInput && hiddenInput) {
//         searchInput.value = userName;
//         hiddenInput.value = userId;
//         if (resultsList) {
//           resultsList.classList.add("hidden");
//         }
//       }
//     }

//     clearUserSearch() {
//       const searchInput = this.container.querySelector("#existing-user-search");
//       const hiddenInput = this.container.querySelector("#existing-user-id");
//       const resultsList = this.container.querySelector("#user-search-results");
//       const clearBtn = this.container.querySelector("#clear-user-search-btn");

//       if (searchInput && hiddenInput) {
//         searchInput.value = "";
//         hiddenInput.value = "";
//         if (resultsList) {
//           resultsList.classList.add("hidden");
//         }
//         if (clearBtn) {
//           clearBtn.classList.add("hidden");
//         }
//       }
//     }

//     showSaveSuccessToast() {
//       // Create a temporary toast message
//       const toast = document.createElement("div");
//       toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-md text-sm font-medium transition-all duration-300 transform translate-x-full opacity-0 bg-green-500 text-white shadow-lg`;
//       toast.innerHTML = `
//         <div class="flex items-center gap-2">
//           <i class="bx bx-check-circle text-lg"></i>
//           <span>Project saved successfully!</span>
//         </div>
//       `;
//       document.body.appendChild(toast);

//       // Animate in
//       setTimeout(() => {
//         toast.style.transform = "translateX(0)";
//         toast.style.opacity = "1";
//       }, 10);

//       // Animate out and remove
//       setTimeout(() => {
//         toast.style.transform = "translateX(full)";
//         toast.style.opacity = "0";
//         setTimeout(() => {
//           if (toast.parentNode) {
//             toast.parentNode.removeChild(toast);
//           }
//         }, 300);
//       }, 3000);
//     }

//     setupImageGallery() {
//       const ocrResultDiv = this.container.querySelector("#images-container");

//       if (ocrResultDiv) {
//         ocrResultDiv.classList.remove("hidden");

//         // Check for existing gallery container in the correct location
//         const selectImageBtn = document.querySelector("#select-image");
//         let galleryContainer = null;

//         if (selectImageBtn) {
//           // Look for existing gallery after the select-image button
//           galleryContainer = selectImageBtn.nextElementSibling;
//           if (galleryContainer && galleryContainer.id === "image-gallery") {
//             // Gallery already exists, just ensure it's visible
//             galleryContainer.style.display = "block";
//             return;
//           }

//           // Clean up any duplicate galleries that might exist elsewhere
//           this.cleanupDuplicateGalleries();
//         }

//         // Create new gallery container if it doesn't exist
//         if (!galleryContainer) {
//           galleryContainer = document.createElement("div");
//           galleryContainer.id = "image-gallery";
//           galleryContainer.innerHTML = `
//             <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Selected Images</h4>
//             <div id="images-list" class="space-y-3"></div>
//           `;

//           if (selectImageBtn) {
//             selectImageBtn.insertAdjacentElement("afterend", galleryContainer);
//           } else {
//             console.warn("Select image button not found for gallery container");
//           }
//         }
//       }
//     }

//     cleanupDuplicateGalleries() {
//       // Remove any duplicate image-gallery containers
//       const allGalleries = document.querySelectorAll("#image-gallery");
//       if (allGalleries.length > 1) {
//         console.log(
//           `Found ${allGalleries.length} gallery containers, cleaning up duplicates`
//         );
//         // Keep only the first one, remove the rest
//         for (let i = 1; i < allGalleries.length; i++) {
//           allGalleries[i].remove();
//         }
//       }
//     }

//     clearOverlay() {
//       if (!this.overlay) return;
//       const ctx = this.overlay.getContext("2d");
//       ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
//     }

//     resetSelectionState() {
//       // Reset all selection-related state
//       this.selectedField = null;
//       this.isSelecting = false;
//       this.targetInputId = null;
//       this.targetImageId = null;

//       if (this.overlay) {
//         this.overlay.style.pointerEvents = "none";
//         this.overlay.style.cursor = "default";
//       }

//       console.log("Selection state reset - ready for next selection");
//     }

//     drawSelection() {
//       if (!this.overlay) return;

//       this.clearOverlay();
//       const ctx = this.overlay.getContext("2d");
//       ctx.strokeStyle = "red";
//       ctx.lineWidth = 6;
//       ctx.setLineDash([6]);

//       // Scale coordinates from CSS pixels to canvas pixels
//       const overlayRect = this.overlay.getBoundingClientRect();
//       const scaleX = this.overlay.width / overlayRect.width;
//       const scaleY = this.overlay.height / overlayRect.height;

//       const x = Math.min(this.startX, this.endX) * scaleX;
//       const y = Math.min(this.startY, this.endY) * scaleY;
//       const w = Math.abs(this.endX - this.startX) * scaleX;
//       const h = Math.abs(this.endY - this.startY) * scaleY;

//       ctx.strokeRect(x, y, w, h);
//     }

//     cropAndOCR() {
//       if (!this.canvas) return;

//       console.log("Crop and OCR");
//       // Map overlay selection to actual canvas pixel coordinates
//       const overlayRect = this.overlay.getBoundingClientRect();
//       const scaleX = this.canvas.width / overlayRect.width;
//       const scaleY = this.canvas.height / overlayRect.height;
//       const sx = Math.min(this.startX, this.endX) * scaleX;
//       const sy = Math.min(this.startY, this.endY) * scaleY;
//       const sw = Math.abs(this.endX - this.startX) * scaleX;
//       const sh = Math.abs(this.endY - this.startY) * scaleY;

//       // Validate selection size - must be at least 10x10 pixels
//       if (sw < 10 || sh < 10) {
//         console.log("Selection too small, skipping OCR");
//         this.clearOverlay();
//         return;
//       }

//       const tempCanvas = document.createElement("canvas");
//       tempCanvas.width = sw;
//       tempCanvas.height = sh;
//       const tempCtx = tempCanvas.getContext("2d");
//       tempCtx.drawImage(this.canvas, sx, sy, sw, sh, 0, 0, sw, sh);

//       if (this.selectedField === "image") {
//         tempCanvas.toBlob((blob) => {
//           this.addImageToGallery(blob);
//           // Reset selection state after image is added
//           this.resetSelectionState();
//         }, "image/png");
//         this.clearOverlay();
//         return;
//       }

//       tempCanvas.toBlob((blob) => {
//         if (blob && blob.size > 0) {
//           // Capture current target IDs to prevent race conditions
//           const capturedInputId = this.targetInputId;
//           const capturedImageId = this.targetImageId;
//           this.sendToOCR(blob, capturedInputId, capturedImageId);
//         } else {
//           console.error("Failed to create blob from selection");
//         }
//       }, "image/png");
//       this.clearOverlay();
//     }

//     // Helper function to convert text to title case
//     toTitleCase(str) {
//       return str.replace(/\w\S*/g, (txt) => {
//         return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
//       });
//     }

//     // Helper function to sanitize text for number inputs
//     sanitizeNumber(str) {
//       console.log("Sanitizing number from:", str);

//       // Remove all non-numeric characters except decimal points and commas
//       let cleaned = str.replace(/[^\d.,]/g, "");

//       // Handle common OCR mistakes
//       cleaned = cleaned
//         .replace(/[Oo]/g, "0") // O → 0
//         .replace(/[Il|]/g, "1") // I, l, | → 1
//         .replace(/[Ss]/g, "5") // S → 5 (sometimes)
//         .replace(/[Bb]/g, "6"); // B → 6 (sometimes)

//       // Remove duplicate decimal points, keep only the first one
//       const parts = cleaned.split(".");
//       if (parts.length > 2) {
//         cleaned = parts[0] + "." + parts.slice(1).join("");
//       }

//       // Remove commas (thousand separators)
//       cleaned = cleaned.replace(/,/g, "");

//       // Extract just the number part
//       const match = cleaned.match(/^\d+\.?\d*/);
//       const result = match ? match[0] : "";

//       console.log("Sanitized number result:", result);
//       return result;
//     }

//     // Start scraping mode for a specific field
//     startScraping(field, inputId) {
//       console.log("Starting scraping for field:", field, "inputId:", inputId);
//       console.log("Overlay found:", !!this.overlay);

//       this.selectedField = field;
//       this.targetInputId = inputId;
//       this.targetImageId = null; // Clear image ID when scraping form fields

//       if (this.overlay) {
//         this.overlay.style.pointerEvents = "auto";
//         this.overlay.style.cursor = "crosshair";
//         console.log("Set overlay to scraping mode");
//       } else {
//         console.error("Overlay not found!");
//       }

//       this.clearOverlay();
//       this.isSelecting = false;
//     }

//     // Start scraping mode for image title
//     startImageTitleScraping(imageId) {
//       console.log("Starting image title scraping for:", imageId);
//       console.log("Overlay found:", !!this.overlay);

//       this.selectedField = "text"; // Set to text mode, not image mode
//       this.targetInputId = null; // Clear form field ID
//       this.targetImageId = imageId; // Set image ID for title scraping

//       if (this.overlay) {
//         this.overlay.style.pointerEvents = "auto";
//         this.overlay.style.cursor = "crosshair";
//         console.log("Set overlay to image title scraping mode (text OCR)");
//       } else {
//         console.error("Overlay not found!");
//       }

//       this.clearOverlay();
//       this.isSelecting = false;
//     }

//     sendToOCR(blob, inputId, imageId) {
//       console.log("Send to OCR");

//       // Validate blob
//       if (!blob || !(blob instanceof Blob) || blob.size === 0) {
//         console.error("Invalid blob provided to sendToOCR");
//         return;
//       }

//       // Set processing message in target input
//       if (inputId) {
//         const targetInput = this.container.querySelector(`#${inputId}`);
//         if (targetInput) {
//           targetInput.value = "Processing...";
//         }
//       }

//       // Try multiple OCR services in sequence
//       this.tryOCRService(blob, inputId, imageId, 0);
//     }

//     tryOCRService(blob, inputId, imageId, serviceIndex) {
//       const services = [
//         {
//           name: "OCR.space",
//           url: "https://api.ocr.space/parse/image",
//           headers: { apikey: "K81932338788957" },
//           body: (formData) => {
//             formData.append("file", blob, "selection.png");
//             formData.append("language", "eng");
//             formData.append("isOverlayRequired", "false");
//             formData.append("OCREngine", "2");
//           },
//         },
//         {
//           name: "OCR.space (backup)",
//           url: "https://api.ocr.space/parse/image",
//           headers: { apikey: "helloworld" }, // Free tier key
//           body: (formData) => {
//             formData.append("file", blob, "selection.png");
//             formData.append("language", "eng");
//             formData.append("isOverlayRequired", "false");
//             formData.append("OCREngine", "1");
//           },
//         },
//       ];

//       if (serviceIndex >= services.length) {
//         console.error("All OCR services failed");
//         const errorMsg = "All OCR services failed. Please try again.";
//         if (inputId) {
//           const targetInput = this.container.querySelector(`#${inputId}`);
//           if (targetInput) targetInput.value = errorMsg;
//         }
//         this.resetSelectionState();
//         return;
//       }

//       const service = services[serviceIndex];
//       console.log(`Trying OCR service: ${service.name}`);

//       const formData = new FormData();
//       service.body(formData);

//       // Add timeout to prevent hanging
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout per service

//       fetch(service.url, {
//         method: "POST",
//         headers: service.headers,
//         body: formData,
//         signal: controller.signal,
//       })
//         .then((response) => {
//           clearTimeout(timeoutId);
//           console.log(`${service.name} response status:`, response.status);
//           if (!response.ok) {
//             throw new Error(
//               `${service.name} API error: ${response.status} ${response.statusText}`
//             );
//           }
//           return response.json();
//         })
//         .then((data) => {
//           console.log(`${service.name} response data:`, data);

//           if (data.IsErroredOnProcessing) {
//             const errorMsg = `${service.name} error: ${data.ErrorMessage || "Unknown error"}`;
//             console.error(errorMsg);
//             // Try next service
//             this.tryOCRService(blob, inputId, imageId, serviceIndex + 1);
//             return;
//           }

//           if (data.ParsedResults && data.ParsedResults[0].ParsedText) {
//             // Get raw OCR text
//             let rawText = data.ParsedResults[0].ParsedText.trim();
//             console.log(`OCR text from ${service.name}:`, rawText);

//             if (inputId) {
//               const targetInput = this.container.querySelector(`#${inputId}`);
//               if (targetInput) {
//                 // Check if this is a number input
//                 if (targetInput.type === "number") {
//                   this.ocrText = this.sanitizeNumber(rawText);
//                 } else {
//                   // Apply title case for text inputs
//                   this.ocrText = this.toTitleCase(rawText);
//                 }
//                 targetInput.value = this.ocrText;
//               }
//             } else if (imageId) {
//               // Handle image title OCR
//               const titleInput = this.container.querySelector(
//                 `input[data-image-id="${imageId}"]`
//               );
//               if (titleInput) {
//                 // Apply title case for image titles
//                 this.ocrText = this.toTitleCase(rawText);
//                 titleInput.value = this.ocrText;

//                 // Update the stored image data
//                 const image = this.selectedImages.find(
//                   (img) => img.id === imageId
//                 );
//                 if (image) {
//                   image.title = this.ocrText;
//                 }

//                 console.log(
//                   `Updated image ${imageId} title to: ${this.ocrText}`
//                 );
//               }
//             }

//             // Reset selection state after successful OCR
//             this.resetSelectionState();
//           } else {
//             const noTextMsg = "No text found.";
//             if (inputId) {
//               const targetInput = this.container.querySelector(`#${inputId}`);
//               if (targetInput) targetInput.value = noTextMsg;
//             }
//             this.resetSelectionState();
//           }
//         })
//         .catch((err) => {
//           clearTimeout(timeoutId);
//           console.error(`${service.name} error:`, err);

//           // Try next service
//           this.tryOCRService(blob, inputId, imageId, serviceIndex + 1);
//         });
//     }

//     setupInputFieldListeners() {
//       // Add event listeners for input fields (both form inputs and image title inputs)
//       const inputFields = this.container.querySelectorAll(
//         "input[data-field], input[data-image-id]"
//       );
//       console.log(
//         "Setting up listeners for",
//         inputFields.length,
//         "input fields"
//       );

//       inputFields.forEach((input) => {
//         this.setupSingleInputListener(input);
//       });
//     }

//     setupUnitsSlider() {
//       const slider = this.container.querySelector("#units-slider");
//       const valueDisplay = this.container.querySelector("#units-value");

//       if (!slider || !valueDisplay) return;

//       const values = slider
//         .getAttribute("data-values")
//         .split(",")
//         .map((v) => parseInt(v));

//       // Update display when slider changes
//       slider.addEventListener("input", (e) => {
//         const index = parseInt(e.target.value);
//         const actualValue = values[index];
//         valueDisplay.textContent = actualValue;

//         // Store the actual value in a data attribute for easy access
//         slider.setAttribute("data-current-value", actualValue);
//       });

//       // Initialize with first value
//       valueDisplay.textContent = values[0];
//       slider.setAttribute("data-current-value", values[0]);
//     }

//     setupBuildingTypeRadio() {
//       const buttons = this.container.querySelectorAll(".building-type-radio");

//       buttons.forEach((button) => {
//         button.addEventListener("click", () => {
//           const value = button.getAttribute("data-value");

//           // Radio behavior - deselect all others first
//           buttons.forEach((btn) => {
//             btn.classList.remove(
//               "selected",
//               "bg-blue-500",
//               "text-white",
//               "border-blue-500"
//             );
//             btn.classList.add(
//               "bg-white",
//               "dark:bg-gray-700",
//               "text-gray-700",
//               "dark:text-gray-300",
//               "border-gray-300",
//               "dark:border-gray-600",
//               "hover:bg-gray-50",
//               "dark:hover:bg-gray-600"
//             );
//           });

//           // Select the clicked button
//           button.classList.add(
//             "selected",
//             "bg-blue-500",
//             "text-white",
//             "border-blue-500"
//           );
//           button.classList.remove(
//             "bg-white",
//             "dark:bg-gray-700",
//             "text-gray-700",
//             "dark:text-gray-300",
//             "border-gray-300",
//             "dark:border-gray-600",
//             "hover:bg-gray-50",
//             "dark:hover:bg-gray-600"
//           );

//           console.log("Building type selected:", value);
//         });
//       });
//     }

//     setupFireServiceTypeRadio() {
//       const buttons = this.container.querySelectorAll(".fire-service-radio");

//       buttons.forEach((button) => {
//         button.addEventListener("click", () => {
//           const value = button.getAttribute("data-value");

//           // Radio behavior - deselect all others first
//           buttons.forEach((btn) => {
//             btn.classList.remove(
//               "selected",
//               "bg-blue-500",
//               "text-white",
//               "border-blue-500"
//             );
//             btn.classList.add(
//               "bg-white",
//               "dark:bg-gray-700",
//               "text-gray-700",
//               "dark:text-gray-300",
//               "border-gray-300",
//               "dark:border-gray-600",
//               "hover:bg-gray-50",
//               "dark:hover:bg-gray-600"
//             );
//           });

//           // Select the clicked button
//           button.classList.add(
//             "selected",
//             "bg-blue-500",
//             "text-white",
//             "border-blue-500"
//           );
//           button.classList.remove(
//             "bg-white",
//             "dark:bg-gray-700",
//             "text-gray-700",
//             "dark:text-gray-300",
//             "border-gray-300",
//             "dark:border-gray-600",
//             "hover:bg-gray-50",
//             "dark:hover:bg-gray-600"
//           );

//           console.log("Fire service type selected:", value);
//         });
//       });
//     }

//     /* Multi-select building type setup (commented out for later use)
//     setupBuildingTypeButtons() {
//       const buttons = this.container.querySelectorAll(".building-type-btn");

//       buttons.forEach((button) => {
//         button.addEventListener("click", () => {
//           const value = button.getAttribute("data-value");

//           // Toggle selection state
//           if (button.classList.contains("selected")) {
//             // Deselect
//             button.classList.remove(
//               "selected",
//               "bg-blue-500",
//               "text-white",
//               "border-blue-500"
//             );
//             button.classList.add(
//               "bg-white",
//               "dark:bg-gray-700",
//               "text-gray-700",
//               "dark:text-gray-300",
//               "border-gray-300",
//               "dark:border-gray-600",
//               "hover:bg-gray-50",
//               "dark:hover:bg-gray-600"
//             );
//           } else {
//             // Select
//             button.classList.add(
//               "selected",
//               "bg-blue-500",
//               "text-white",
//               "border-blue-500"
//             );
//             button.classList.remove(
//               "bg-white",
//               "dark:bg-gray-700",
//               "text-gray-700",
//               "dark:text-gray-300",
//               "border-gray-300",
//               "dark:border-gray-600",
//               "hover:bg-gray-50",
//               "dark:hover:bg-gray-600"
//             );
//           }

//           console.log(
//             "Building type toggled:",
//             value,
//             button.classList.contains("selected")
//           );
//         });
//       });
//     }
//     */

//     setupConsultingServices() {
//       const buttons = this.container.querySelectorAll(
//         ".consulting-service-btn"
//       );

//       buttons.forEach((button) => {
//         button.addEventListener("click", () => {
//           const value = button.getAttribute("data-value");

//           // Toggle selection state (multi-select behavior)
//           if (button.classList.contains("selected")) {
//             // Deselect
//             button.classList.remove(
//               "selected",
//               "bg-blue-500",
//               "text-white",
//               "border-blue-500"
//             );
//             button.classList.add(
//               "bg-white",
//               "dark:bg-gray-700",
//               "text-gray-700",
//               "dark:text-gray-300",
//               "border-gray-300",
//               "dark:border-gray-600",
//               "hover:bg-gray-50",
//               "dark:hover:bg-gray-600"
//             );
//           } else {
//             // Select
//             button.classList.add(
//               "selected",
//               "bg-blue-500",
//               "text-white",
//               "border-blue-500"
//             );
//             button.classList.remove(
//               "bg-white",
//               "dark:bg-gray-700",
//               "text-gray-700",
//               "dark:text-gray-300",
//               "border-gray-300",
//               "dark:border-gray-600",
//               "hover:bg-gray-50",
//               "dark:hover:bg-gray-600"
//             );
//           }

//           console.log(
//             "Consulting service toggled:",
//             value,
//             button.classList.contains("selected")
//           );
//         });
//       });
//     }

//     setupFireSafetyServices() {
//       const buttons = this.container.querySelectorAll(
//         ".fire-safety-service-btn"
//       );

//       buttons.forEach((button) => {
//         button.addEventListener("click", () => {
//           const value = button.getAttribute("data-value");

//           // Toggle selection state (multi-select behavior)
//           if (button.classList.contains("selected")) {
//             // Deselect
//             button.classList.remove(
//               "selected",
//               "bg-blue-500",
//               "text-white",
//               "border-blue-500"
//             );
//             button.classList.add(
//               "bg-white",
//               "dark:bg-gray-700",
//               "text-gray-700",
//               "dark:text-gray-300",
//               "border-gray-300",
//               "dark:border-gray-600",
//               "hover:bg-gray-50",
//               "dark:hover:bg-gray-600"
//             );
//           } else {
//             // Select
//             button.classList.add(
//               "selected",
//               "bg-blue-500",
//               "text-white",
//               "border-blue-500"
//             );
//             button.classList.remove(
//               "bg-white",
//               "dark:bg-gray-700",
//               "text-gray-700",
//               "dark:text-gray-300",
//               "border-gray-300",
//               "dark:border-gray-600",
//               "hover:bg-gray-50",
//               "dark:hover:bg-gray-600"
//             );
//           }

//           console.log(
//             "Fire safety service toggled:",
//             value,
//             button.classList.contains("selected")
//           );
//         });
//       });
//     }

//     setupEscapeKeyHandler() {
//       // Create bound handler function so we can remove it later if needed
//       this.handleEscapeKey = (e) => {
//         // Check if ESC key was pressed
//         if (e.key === "Escape" || e.keyCode === 27) {
//           // Check if we're currently in scrape mode
//           if (this.overlay && this.overlay.style.pointerEvents === "auto") {
//             console.log("ESC pressed - exiting scrape mode");

//             // Find the currently focused input
//             const focusedInput = document.activeElement;
//             if (
//               focusedInput &&
//               (focusedInput.hasAttribute("data-field") ||
//                 focusedInput.hasAttribute("data-image-id"))
//             ) {
//               // Blur the focused input (this will trigger the blur handler)
//               focusedInput.blur();
//             }

//             // Reset scrape state immediately
//             this.resetSelectionState();

//             // Add visual feedback that scrape mode was exited
//             this.showEscapeFeedback();

//             // Prevent default ESC behavior
//             e.preventDefault();
//           }
//         }
//       };

//       // Add event listener to document
//       document.addEventListener("keydown", this.handleEscapeKey);

//       console.log("ESC key handler setup for scrape mode exit");
//     }

//     showEscapeFeedback() {
//       // Add a subtle flash to the overlay to indicate scrape mode exit
//       if (this.overlay) {
//         const ctx = this.overlay.getContext("2d");

//         // Save current overlay state
//         const imageData = ctx.getImageData(
//           0,
//           0,
//           this.overlay.width,
//           this.overlay.height
//         );

//         // Flash with a semi-transparent overlay
//         ctx.fillStyle = "rgba(59, 130, 246, 0.1)"; // Blue flash
//         ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);

//         // Restore original state after a brief moment
//         setTimeout(() => {
//           if (this.overlay) {
//             ctx.putImageData(imageData, 0, 0);
//           }
//         }, 150);
//       }

//       // Also show a small toast-like message
//       this.showToastMessage("Scrape mode exited (ESC)", "info");
//     }

//     showToastMessage(message, type = "info") {
//       // Create a temporary toast message
//       const toast = document.createElement("div");
//       toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 transform translate-x-full opacity-0`;

//       // Style based on type
//       if (type === "info") {
//         toast.className += " bg-blue-500 text-white";
//       }

//       toast.textContent = message;
//       document.body.appendChild(toast);

//       // Animate in
//       setTimeout(() => {
//         toast.style.transform = "translateX(0)";
//         toast.style.opacity = "1";
//       }, 10);

//       // Animate out and remove
//       setTimeout(() => {
//         toast.style.transform = "translateX(full)";
//         toast.style.opacity = "0";
//         setTimeout(() => {
//           if (toast.parentNode) {
//             toast.parentNode.removeChild(toast);
//           }
//         }, 300);
//       }, 2000);
//     }

//     // Clean up method (call when PDFScraper is destroyed)
//     cleanup() {
//       if (this.handleEscapeKey) {
//         document.removeEventListener("keydown", this.handleEscapeKey);
//       }
//     }

//     setupSingleInputListener(input) {
//       // Add focus listener to automatically start scraping mode
//       input.addEventListener("focus", () => {
//         const field = input.getAttribute("data-field");
//         const inputId = input.getAttribute("id");
//         const imageId = input.getAttribute("data-image-id");

//         console.log(
//           "Input focused:",
//           field || `image-title-${imageId}`,
//           inputId || imageId
//         );

//         // Clear any pending blur timeouts to prevent interference
//         if (this.blurTimeout) {
//           clearTimeout(this.blurTimeout);
//           this.blurTimeout = null;
//         }

//         // For image title inputs, set up special OCR mode
//         if (imageId) {
//           this.startImageTitleScraping(imageId);
//         } else if (field && inputId) {
//           // Use the same logic as the + button click for form fields
//           this.startScraping(field, inputId);
//         }
//       });

//       // Add blur listener to stop scraping mode when focus is lost
//       input.addEventListener("blur", () => {
//         console.log("Input blurred");

//         // Store timeout reference so focus can cancel it
//         this.blurTimeout = setTimeout(() => {
//           // Only reset if we're not currently in the middle of a selection
//           if (!this.isSelecting) {
//             console.log("Resetting scraping mode after blur");
//             this.overlay.style.cursor = "default";
//             this.overlay.style.pointerEvents = "none";
//             this.targetInputId = null;
//           }
//           this.blurTimeout = null;
//         }, 200);
//       });

//       // Update accordion title when address field changes
//       if (input.getAttribute("id") === "address-input") {
//         input.addEventListener("input", function (e) {
//           try {
//             var targetEl = e && e.target ? e.target : null;
//             var value = targetEl && targetEl.value ? targetEl.value : "";
//             var cleaned =
//               window.currentPDFScraper &&
//               window.currentPDFScraper.cleanAddressForTitle
//                 ? window.currentPDFScraper.cleanAddressForTitle(value)
//                 : value;
//             var titleEl = document.getElementById(
//               "project-title-" +
//                 (window.currentPDFScraper
//                   ? window.currentPDFScraper.projectId
//                   : "")
//             );
//             if (titleEl) {
//               titleEl.textContent = cleaned || value || "Project";
//             }
//           } catch (err) {
//             console.warn(
//               "Failed to update accordion title from address input",
//               err
//             );
//           }
//         });

//         // Live update accordion title for address field
//         if (
//           input &&
//           input.getAttribute &&
//           input.getAttribute("id") === "address-input"
//         ) {
//           input.addEventListener("input", () => {
//             try {
//               var value = input.value || "";
//               var cleaned = this.cleanAddressForTitle
//                 ? this.cleanAddressForTitle(value)
//                 : value;
//               var titleEl = document.getElementById(
//                 "project-title-" + this.projectId
//               );
//               if (titleEl) {
//                 titleEl.textContent = cleaned || value || "Project";
//               }
//             } catch (err) {
//               console.warn(
//                 "Failed to update accordion title from address input",
//                 err
//               );
//             }
//           });
//         }
//       }
//     }

//     // updateScrapeButton removed - now handled by CSS pseudo-elements

//     addImageToGallery(blob) {
//       const imageId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//       const imageUrl = URL.createObjectURL(blob);

//       // Store image data
//       const imageData = {
//         id: imageId,
//         blob: blob,
//         url: imageUrl,
//         title: `Image ${this.selectedImages.length + 1}`,
//       };
//       this.selectedImages.push(imageData);

//       // Add to gallery UI
//       const imagesList = this.container.querySelector("#images-list");
//       if (imagesList) {
//         const imageItem = document.createElement("div");
//         imageItem.className =
//           "flex gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800";
//         imageItem.innerHTML = `
//           <img src="${imageUrl}" alt="Selected image" class="w-20 h-20 object-cover rounded border">
//           <div class="flex-1 space-y-2">
//             <div class="relative scrape-input-container">
//               <input
//                 type="text"
//                 value="${imageData.title}"
//                 data-image-id="${imageId}"
//                 class="scrape-input w-full !pl-3 !pr-10 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 placeholder="Enter image title..."
//               >
//             </div>
//             <div class="flex gap-2">
//               <button
//                 onclick="window.currentPDFScraper.downloadImage('${imageId}')"
//                 class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
//                 Download
//               </button>
//               <button
//                 onclick="window.currentPDFScraper.removeImage('${imageId}')"
//                 class="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
//                 Remove
//               </button>
//             </div>
//           </div>
//         `;
//         imagesList.appendChild(imageItem);

//         // Setup title input listener for value changes
//         const titleInput = imageItem.querySelector(
//           `input[data-image-id="${imageId}"]`
//         );
//         titleInput.addEventListener("input", (e) => {
//           const image = this.selectedImages.find((img) => img.id === imageId);
//           if (image) {
//             image.title = e.target.value;
//           }
//         });

//         // Setup scraping listeners for the new input
//         this.setupSingleInputListener(titleInput);
//       }

//       console.log(
//         `Added image ${imageId} to gallery. Total images: ${this.selectedImages.length}`
//       );
//     }

//     downloadImage(imageId) {
//       const image = this.selectedImages.find((img) => img.id === imageId);
//       if (image) {
//         const link = document.createElement("a");
//         link.href = image.url;
//         link.download = `${image.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
//         link.click();
//       }
//     }

//     removeImage(imageId) {
//       // Remove from array
//       this.selectedImages = this.selectedImages.filter(
//         (img) => img.id !== imageId
//       );

//       // Remove from UI
//       const imageItem = this.container
//         .querySelector(`input[data-image-id="${imageId}"]`)
//         ?.closest(".flex");
//       if (imageItem) {
//         // Cleanup blob URL
//         const image = this.selectedImages.find((img) => img.id === imageId);
//         if (image) {
//           URL.revokeObjectURL(image.url);
//         }
//         imageItem.remove();
//       }

//       console.log(
//         `Removed image ${imageId}. Remaining images: ${this.selectedImages.length}`
//       );
//     }

//     async saveProjectData() {
//       console.log("Saving complete project data...");

//       // Collect all form data
//       const unitsSlider = this.container.querySelector("#units-slider");
//       const selectedBuildingType =
//         this.container
//           .querySelector(".building-type-radio.selected")
//           ?.getAttribute("data-value") || "";
//       const selectedFireServiceType =
//         this.container
//           .querySelector(".fire-service-radio.selected")
//           ?.getAttribute("data-value") || "";
//       const selectedConsultingServices = Array.from(
//         this.container.querySelectorAll(".consulting-service-btn.selected")
//       ).map((btn) => btn.getAttribute("data-value"));

//       console.log("Consulting services selection:", {
//         buttonsFound: this.container.querySelectorAll(
//           ".consulting-service-btn.selected"
//         ).length,
//         selectedValues: selectedConsultingServices,
//         allConsultingButtons: Array.from(
//           this.container.querySelectorAll(".consulting-service-btn")
//         ).map((btn) => ({
//           text: btn.textContent?.trim(),
//           hasSelected: btn.classList.contains("selected"),
//           hasBgBlue: btn.classList.contains("bg-blue-500"),
//           dataValue: btn.getAttribute("data-value"),
//         })),
//       });
//       const selectedFireSafetyServices = Array.from(
//         this.container.querySelectorAll(".fire-safety-service-btn.selected")
//       ).map((btn) => btn.getAttribute("data-value"));

//       // Get owner data based on toggle selection and user role
//       const isClient = this.currentUserProfile?.role === "Client";
//       const isExistingUser = isClient
//         ? false
//         : this.container.querySelector("#owner-type-toggle")?.checked || false;
//       let ownerData = {};

//       if (!isExistingUser) {
//         // New user data (or client user)
//         ownerData = {
//           owner_type: isClient ? "current_user" : "new",
//           owner_name:
//             this.container.querySelector("#owner-name-input")?.value || "",
//           owner_first_name:
//             this.container.querySelector("#owner-first-name-input")?.value ||
//             "",
//           owner_last_name:
//             this.container.querySelector("#owner-last-name-input")?.value || "",
//           owner_email:
//             this.container.querySelector("#owner-email-input")?.value || "",
//           owner_phone:
//             this.container.querySelector("#owner-phone-input")?.value || "",
//           owner: this.container.querySelector("#owner-name-input")?.value || "", // Legacy compatibility
//         };

//         // For client users, also include the user ID for direct association
//         if (isClient && this.currentUserProfile) {
//           ownerData.owner_user_id = this.currentUserProfile.id;
//         }
//       } else {
//         // Existing user data (only for non-client users)
//         const selectedUserId =
//           this.container.querySelector("#existing-user-id")?.value || "";
//         const selectedUserName =
//           this.container.querySelector("#existing-user-search")?.value || "";

//         ownerData = {
//           owner_type: "existing",
//           existing_user_id: selectedUserId,
//           owner: selectedUserName, // Legacy compatibility
//         };
//       }

//       const formData = {
//         address: this.container.querySelector("#address-input")?.value || "",
//         ...ownerData,
//         architect:
//           this.container.querySelector("#architect-input")?.value || "",
//         squareFootage:
//           this.container.querySelector("#square-foot-input")?.value || "",
//         units: unitsSlider?.getAttribute("data-current-value") || "1",
//         buildingType: selectedBuildingType,
//         fireServiceType: selectedFireServiceType,
//         consultingServices: selectedConsultingServices,
//         fireSafetyServices: selectedFireSafetyServices,
//         sprinkler:
//           this.container.querySelector("#sprinkler-toggle")?.checked || false,
//         alarm: this.container.querySelector("#alarm-toggle")?.checked || false,
//         images: this.selectedImages.map((img) => ({
//           title: img.title,
//           blob: img.blob,
//         })),
//       };

//       console.log("Project data to save:", formData);

//       // Show saving state
//       const saveBtn = this.container.querySelector("#save-project");
//       if (saveBtn) {
//         const originalText = saveBtn.textContent;
//         saveBtn.textContent = "Saving...";
//         saveBtn.disabled = true;

//         try {
//           console.log("Starting project save...");
//           console.log("Project ID:", this.projectId);
//           console.log("Form data:", formData);

//           // Check if we have a project ID to update
//           if (!this.projectId) {
//             console.error("No project ID found");
//             throw new Error("No project ID found. Please upload a PDF first.");
//           }

//           // Clean address for title (remove state and zip code)
//           console.log("Cleaning address:", formData.address);
//           const cleanedTitle = this.cleanAddressForTitle(formData.address);
//           console.log("Cleaned title:", cleanedTitle);

//           // Prepare metadata to store as JSON (use formData directly)
//           const projectMetadata = {
//             ...formData,
//             // Remove images from metadata since they're handled separately
//             images: undefined,
//           };

//           console.log("Project metadata:", projectMetadata);

//           // Safely stringify metadata
//           let metadataString;
//           try {
//             metadataString = JSON.stringify(projectMetadata);
//             console.log("Metadata JSON string length:", metadataString.length);
//           } catch (jsonError) {
//             console.error("Error stringifying metadata:", jsonError);
//             throw new Error("Error preparing project data for storage");
//           }

//           // Validate and prepare square footage (PostgreSQL integer max: 2,147,483,647)
//           let squareFootage = parseInt(formData.squareFootage) || 0;
//           const MAX_INTEGER = 2147483647;

//           if (squareFootage > MAX_INTEGER) {
//             console.warn(
//               `Square footage ${squareFootage} exceeds database limit. Setting to maximum allowed value.`
//             );
//             squareFootage = MAX_INTEGER;

//             // Show warning to user
//             alert(
//               `Warning: Square footage value is too large (max: ${MAX_INTEGER.toLocaleString()}). Value has been adjusted.`
//             );
//           }

//           if (squareFootage < 0) {
//             console.warn(
//               `Square footage ${squareFootage} is negative. Setting to 0.`
//             );
//             squareFootage = 0;
//           }

//           // Prepare update data
//           const updateData = {
//             title: cleanedTitle || formData.address || "Project",
//             address: formData.address || "",
//             description: metadataString,
//             sq_ft: squareFootage,
//             new_construction: formData.buildingType === "New Construction",
//             // Add button group fields with correct database column names
//             building: formData.buildingType || null,
//             project: formData.consultingServices
//               ? JSON.stringify(formData.consultingServices)
//               : null,
//             service: formData.fireServiceType || null,
//             requested_docs: formData.fireSafetyServices
//               ? JSON.stringify(formData.fireSafetyServices)
//               : null,
//             status: 0,
//           };

//           console.log("Button group data being saved:", {
//             buildingType: formData.buildingType,
//             consultingServices: formData.consultingServices,
//             fireServiceType: formData.fireServiceType,
//             fireSafetyServices: formData.fireSafetyServices,
//             projectField: formData.consultingServices?.join(", ") || null,
//           });

//           console.log("Update data:", updateData);

//           // Check if supabase client exists
//           if (!this.supabase) {
//             console.error("Supabase client not found");
//             throw new Error("Database connection not available");
//           }

//           // Update the existing project with all metadata
//           console.log("Executing database update...");
//           const { data: updatedProject, error: updateError } =
//             await this.supabase
//               .from("projects")
//               .update(updateData)
//               .eq("id", this.projectId)
//               .select()
//               .single();

//           if (updateError) {
//             console.error("Database update error:", updateError);
//             throw new Error(`Database error: ${updateError.message}`);
//           }

//           console.log("Project updated successfully:", updatedProject);

//           // Update save button to show success
//           saveBtn.textContent = "Saved!";
//           saveBtn.disabled = false;
//           saveBtn.className = saveBtn.className
//             .replace("bg-green-500", "bg-green-600")
//             .replace("hover:bg-green-600", "hover:bg-green-700");
//           console.log("Save button updated to 'Saved!'");

//           // Show a toast notification
//           this.showSaveSuccessToast();

//           // Refresh project list
//           if (window.projectsList && window.projectsList.loadProjects) {
//             window.projectsList.loadProjects();
//           }

//           // Exit "new project" mode by showing success message and resetting
//           setTimeout(() => {
//             this.resetForNewProject();
//           }, 1000);
//         } catch (error) {
//           console.error("Error saving project data:", error);
//           console.error("Error details:", {
//             message: error.message,
//             stack: error.stack,
//             projectId: this.projectId,
//             formData: formData,
//           });

//           saveBtn.textContent = "Error saving";
//           setTimeout(() => {
//             saveBtn.textContent = originalText;
//             saveBtn.disabled = false;
//           }, 2000);

//           // Show more detailed error message
//           const errorMessage = error.message || "Unknown error occurred";
//           alert(
//             `Error saving project: ${errorMessage}\n\nCheck browser console for details.`
//           );
//         }
//       }
//     }

//     cleanAddressForTitle(address) {
//       try {
//         if (!address || typeof address !== "string") {
//           console.log(
//             "Invalid address provided to cleanAddressForTitle:",
//             address
//           );
//           return "";
//         }

//         // Remove state and zip code from address
//         // Common formats: "123 Main St, City, State 12345" or "123 Main St, City, ST 12345-1234"
//         // Strategy: Remove everything after the second comma, or remove state/zip patterns

//         let cleanedAddress = address.trim();

//         // Method 1: Remove everything after the second comma
//         const commaCount = (cleanedAddress.match(/,/g) || []).length;
//         if (commaCount >= 2) {
//           const parts = cleanedAddress.split(",");
//           cleanedAddress = parts.slice(0, 2).join(",").trim();
//         }

//         // Method 2: Remove common state/zip patterns at the end
//         // Remove patterns like "CA 12345", "California 12345-1234", etc.
//         cleanedAddress = cleanedAddress.replace(
//           /,?\s*[A-Z]{2}\s+\d{5}(-\d{4})?$/i,
//           ""
//         );
//         cleanedAddress = cleanedAddress.replace(
//           /,?\s*[A-Za-z\s]+\s+\d{5}(-\d{4})?$/i,
//           ""
//         );

//         // Remove trailing comma and spaces
//         cleanedAddress = cleanedAddress.replace(/,\s*$/, "").trim();

//         return cleanedAddress;
//       } catch (error) {
//         console.error(
//           "Error in cleanAddressForTitle:",
//           error,
//           "Address:",
//           address
//         );
//         return address || ""; // Return original address or empty string as fallback
//       }
//     }

//     populateFormFromProject(project) {
//       console.log("Populating form with project data:", project);

//       try {
//         // Parse metadata from description field (stored as JSON)
//         let metadata = {};
//         if (project.description) {
//           try {
//             metadata = JSON.parse(project.description);
//             console.log("Successfully parsed metadata:", metadata);
//           } catch (e) {
//             console.warn("Could not parse project metadata:", e);
//             console.log("Raw description:", project.description);
//             metadata = {};
//           }
//         } else {
//           console.log("No description field found in project");
//         }

//         // Populate basic form fields
//         if (project.address) {
//           const addressInput = this.container.querySelector("#address-input");
//           if (addressInput) {
//             addressInput.value = project.address;
//             console.log("Set address to:", project.address);
//           } else {
//             console.warn("Address input not found");
//           }
//         }

//         // Populate owner fields based on type
//         console.log("Owner type from metadata:", metadata.owner_type);
//         if (metadata.owner_type === "existing" && metadata.existing_user_id) {
//           console.log("Setting up existing user mode");
//           // Set existing user toggle
//           const ownerTypeToggle =
//             this.container.querySelector("#owner-type-toggle");
//           if (ownerTypeToggle) {
//             ownerTypeToggle.checked = true;
//             this.updateOwnerInputs(true); // Show existing user inputs
//             console.log("Set owner type toggle to existing user");
//           } else {
//             console.warn("Owner type toggle not found");
//           }

//           // Set the selected user in search input
//           const existingUserSearch = this.container.querySelector(
//             "#existing-user-search"
//           );
//           const existingUserId =
//             this.container.querySelector("#existing-user-id");

//           if (existingUserSearch && existingUserId) {
//             // We need to find the user name by ID
//             if (this.availableUsers) {
//               const user = this.availableUsers.find(
//                 (u) => u.id === metadata.existing_user_id
//               );
//               if (user) {
//                 existingUserSearch.value = user.name;
//                 existingUserId.value = user.id;
//               }
//             }
//           }
//         } else {
//           console.log("Setting up new user mode");
//           // Set new user toggle (default state)
//           const ownerTypeToggle =
//             this.container.querySelector("#owner-type-toggle");
//           if (ownerTypeToggle) {
//             ownerTypeToggle.checked = false;
//             this.updateOwnerInputs(false); // Show new user inputs
//             console.log("Set owner type toggle to new user");
//           } else {
//             console.warn("Owner type toggle not found");
//           }

//           // Populate new user fields
//           if (metadata.owner_name) {
//             const ownerNameInput =
//               this.container.querySelector("#owner-name-input");
//             if (ownerNameInput) {
//               ownerNameInput.value = metadata.owner_name;
//               console.log("Set owner name to:", metadata.owner_name);
//             } else {
//               console.warn("Owner name input not found");
//             }
//           }

//           if (metadata.owner_email) {
//             const ownerEmailInput =
//               this.container.querySelector("#owner-email-input");
//             if (ownerEmailInput) {
//               ownerEmailInput.value = metadata.owner_email;
//               console.log("Set owner email to:", metadata.owner_email);
//             } else {
//               console.warn("Owner email input not found");
//             }
//           }

//           if (metadata.owner_phone) {
//             const ownerPhoneInput =
//               this.container.querySelector("#owner-phone-input");
//             if (ownerPhoneInput) {
//               ownerPhoneInput.value = metadata.owner_phone;
//               console.log("Set owner phone to:", metadata.owner_phone);
//             } else {
//               console.warn("Owner phone input not found");
//             }
//           }
//         }

//         // Legacy compatibility - populate hidden owner input
//         if (metadata.owner) {
//           const ownerInput = this.container.querySelector("#owner-input");
//           if (ownerInput) ownerInput.value = metadata.owner;
//         }

//         // Also populate the visible owner input field for backward compatibility
//         if (metadata.owner_name) {
//           const ownerInput = this.container.querySelector("#owner-input");
//           if (ownerInput) ownerInput.value = metadata.owner_name;
//         }

//         if (metadata.architect) {
//           const architectInput =
//             this.container.querySelector("#architect-input");
//           if (architectInput) {
//             architectInput.value = metadata.architect;
//             console.log("Set architect to:", metadata.architect);
//           } else {
//             console.warn("Architect input not found");
//           }
//         }

//         if (metadata.squareFootage) {
//           const sqFtInput = this.container.querySelector("#square-foot-input");
//           if (sqFtInput) {
//             sqFtInput.value = metadata.squareFootage;
//             console.log("Set square footage to:", metadata.squareFootage);
//           } else {
//             console.warn("Square footage input not found");
//           }
//         } else if (project.sq_ft) {
//           const sqFtInput = this.container.querySelector("#square-foot-input");
//           if (sqFtInput) {
//             sqFtInput.value = project.sq_ft.toString();
//             console.log("Set square footage to:", project.sq_ft);
//           } else {
//             console.warn("Square footage input not found");
//           }
//         }

//         // Populate units slider
//         if (metadata.units) {
//           const unitsSlider = this.container.querySelector("#units-slider");
//           const unitsValue = this.container.querySelector("#units-value");
//           console.log("Populating units slider with:", metadata.units);
//           if (unitsSlider) {
//             const unitsIndex = parseInt(metadata.units) - 1;
//             unitsSlider.value = unitsIndex.toString();
//             unitsSlider.setAttribute("data-current-value", metadata.units);
//             console.log("Set units slider value to:", unitsIndex);
//           } else {
//             console.warn("Units slider not found");
//           }
//           if (unitsValue) {
//             unitsValue.textContent = metadata.units;
//             console.log("Set units value text to:", metadata.units);
//           } else {
//             console.warn("Units value display not found");
//           }
//         }

//         // Populate building type selection
//         if (metadata.buildingType) {
//           const buildingTypeBtn = this.container.querySelector(
//             `.building-type-radio[data-value="${metadata.buildingType}"]`
//           );
//           if (buildingTypeBtn) {
//             this.selectButton(buildingTypeBtn);
//           }
//         }

//         // Populate fire service type selection
//         if (metadata.fireServiceType) {
//           const fireServiceBtn = this.container.querySelector(
//             `.fire-service-radio[data-value="${metadata.fireServiceType}"]`
//           );
//           if (fireServiceBtn) {
//             this.selectButton(fireServiceBtn);
//           }
//         }

//         // Populate consulting services (multi-select)
//         if (
//           metadata.consultingServices &&
//           Array.isArray(metadata.consultingServices)
//         ) {
//           metadata.consultingServices.forEach((service) => {
//             const serviceBtn = this.container.querySelector(
//               `.consulting-service-btn[data-value="${service}"]`
//             );
//             if (serviceBtn) {
//               this.selectButton(serviceBtn);
//             }
//           });
//         }

//         // Populate fire safety services (multi-select)
//         if (
//           metadata.fireSafetyServices &&
//           Array.isArray(metadata.fireSafetyServices)
//         ) {
//           metadata.fireSafetyServices.forEach((service) => {
//             const serviceBtn = this.container.querySelector(
//               `.fire-safety-service-btn[data-value="${service}"]`
//             );
//             if (serviceBtn) {
//               this.selectButton(serviceBtn);
//             }
//           });
//         }

//         // Populate toggles
//         if (metadata.sprinkler !== undefined) {
//           const sprinklerToggle =
//             this.container.querySelector("#sprinkler-toggle");
//           if (sprinklerToggle) sprinklerToggle.checked = metadata.sprinkler;
//         }

//         if (metadata.alarm !== undefined) {
//           const alarmToggle = this.container.querySelector("#alarm-toggle");
//           if (alarmToggle) alarmToggle.checked = metadata.alarm;
//         }

//         console.log("Form populated successfully");
//       } catch (error) {
//         console.error("Error populating form:", error);
//       }
//     }

//     selectButton(button) {
//       // Helper method to select a button with proper styling
//       button.classList.add(
//         "selected",
//         "bg-blue-500",
//         "text-white",
//         "border-blue-500"
//       );
//       button.classList.remove(
//         "bg-white",
//         "dark:bg-gray-700",
//         "text-gray-700",
//         "dark:text-gray-300",
//         "border-gray-300",
//         "dark:border-gray-600",
//         "hover:bg-gray-50",
//         "dark:hover:bg-gray-600"
//       );
//     }

//     clearProjectData() {
//       console.log("Clearing all project data...");

//       // Clear form inputs
//       const inputs = this.container.querySelectorAll(
//         "#address-input, #owner-input, #architect-input, #square-foot-input"
//       );
//       inputs.forEach((input) => {
//         if (input) input.value = "";
//       });

//       // Clear toggles
//       const sprinklerToggle = this.container.querySelector("#sprinkler-toggle");
//       const alarmToggle = this.container.querySelector("#alarm-toggle");
//       if (sprinklerToggle) sprinklerToggle.checked = false;
//       if (alarmToggle) alarmToggle.checked = false;

//       // Reset units slider
//       const unitsSlider = this.container.querySelector("#units-slider");
//       const unitsValue = this.container.querySelector("#units-value");
//       if (unitsSlider) {
//         unitsSlider.value = "0";
//         unitsSlider.setAttribute("data-current-value", "1");
//       }
//       if (unitsValue) {
//         unitsValue.textContent = "1";
//       }

//       // Clear building type selection
//       const buildingTypeButtons = this.container.querySelectorAll(
//         ".building-type-radio"
//       );
//       buildingTypeButtons.forEach((button) => {
//         button.classList.remove(
//           "selected",
//           "bg-blue-500",
//           "text-white",
//           "border-blue-500"
//         );
//         button.classList.add(
//           "bg-white",
//           "dark:bg-gray-700",
//           "text-gray-700",
//           "dark:text-gray-300",
//           "border-gray-300",
//           "dark:border-gray-600",
//           "hover:bg-gray-50",
//           "dark:hover:bg-gray-600"
//         );
//       });

//       // Clear fire service type selection
//       const fireServiceTypeButtons = this.container.querySelectorAll(
//         ".fire-service-radio"
//       );
//       fireServiceTypeButtons.forEach((button) => {
//         button.classList.remove(
//           "selected",
//           "bg-blue-500",
//           "text-white",
//           "border-blue-500"
//         );
//         button.classList.add(
//           "bg-white",
//           "dark:bg-gray-700",
//           "text-gray-700",
//           "dark:text-gray-300",
//           "border-gray-300",
//           "dark:border-gray-600",
//           "hover:bg-gray-50",
//           "dark:hover:bg-gray-600"
//         );
//       });

//       // Clear consulting services selections
//       const consultingServiceButtons = this.container.querySelectorAll(
//         ".consulting-service-btn"
//       );
//       consultingServiceButtons.forEach((button) => {
//         button.classList.remove(
//           "selected",
//           "bg-blue-500",
//           "text-white",
//           "border-blue-500"
//         );
//         button.classList.add(
//           "bg-white",
//           "dark:bg-gray-700",
//           "text-gray-700",
//           "dark:text-gray-300",
//           "border-gray-300",
//           "dark:border-gray-600",
//           "hover:bg-gray-50",
//           "dark:hover:bg-gray-600"
//         );
//       });

//       // Clear fire safety services selections
//       const fireSafetyServiceButtons = this.container.querySelectorAll(
//         ".fire-safety-service-btn"
//       );
//       fireSafetyServiceButtons.forEach((button) => {
//         button.classList.remove(
//           "selected",
//           "bg-blue-500",
//           "text-white",
//           "border-blue-500"
//         );
//         button.classList.add(
//           "bg-white",
//           "dark:bg-gray-700",
//           "text-gray-700",
//           "dark:text-gray-300",
//           "border-gray-300",
//           "dark:border-gray-600",
//           "hover:bg-gray-50",
//           "dark:hover:bg-gray-600"
//         );
//       });

//       // Clear all images
//       this.selectedImages.forEach((img) => {
//         URL.revokeObjectURL(img.url);
//       });
//       this.selectedImages = [];

//       // Clear image gallery
//       const imagesList = this.container.querySelector("#images-list");
//       if (imagesList) {
//         imagesList.innerHTML = "";
//       }

//       // Hide image gallery if empty
//       const galleryContainer =
//         this.container.querySelector("#images-container");
//       if (galleryContainer) {
//         galleryContainer.classList.add("hidden");
//       }

//       console.log("Project data cleared");
//     }

//     resetForNewProject() {
//       console.log("Resetting for new project...");

//       // Show success message briefly
//       const successMessage = document.createElement("div");
//       successMessage.className =
//         "text-center py-8 text-green-600 dark:text-green-400 font-medium";
//       successMessage.innerHTML = `
//         <div class="mb-4">
//           <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
//           </svg>
//         </div>
//         <p class="text-lg">Project Saved Successfully!</p>
//         <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">You can now upload a new PDF to start another project.</p>
//       `;

//       this.container.innerHTML = "";
//       this.container.appendChild(successMessage);

//       // After showing success message, reset to uploader
//       setTimeout(() => {
//         // Clear all project data first
//         this.clearProjectData();

//         // Reset project ID and other state
//         this.projectId = null;
//         this.uploadedFile = null;
//         this.publicUrl = null;

//         // Clear global references to prevent auto-loading
//         window.currentPDFScraper = null;

//         // Mark that we want a fresh start (to override auto-loading)
//         window.forceNewProject = true;

//         // Restore layout: show projects list, restore original widths
//         if (window.toggleLayoutForPDF) {
//           window.toggleLayoutForPDF(false);
//         }

//         // Clear the entire container and show uploader again
//         this.container.innerHTML = "";

//         try {
//           // Create new uploader instance
//           const uploader = new PDFUploader(this.container);

//           console.log("Reset complete - ready for new project");
//         } catch (error) {
//           console.error("Error creating new uploader:", error);
//           // Fallback: reload the page
//           window.location.reload();
//         }
//       }, 2000);
//     }
//   }

//   // Initialize the uploader when the DOM is loaded
//   document.addEventListener("DOMContentLoaded", async () => {
//     const container = document.getElementById("new-project-upload");
//     if (container) {
//       // Check if there's already a PDF file for this project
//       // Reuse existing supabase client if available, otherwise create new one
//       let supabase;
//       if (window.supabaseClient) {
//         supabase = window.supabaseClient;
//       } else {
//         supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
//         window.supabaseClient = supabase; // Store for reuse
//       }

//       // Set up session if tokens are available
//       if (window.SUPABASE_ACCESS_TOKEN && window.SUPABASE_REFRESH_TOKEN) {
//         try {
//           console.log("Setting up client-side session...");
//           const { data, error } = await supabase.auth.setSession({
//             access_token: window.SUPABASE_ACCESS_TOKEN,
//             refresh_token: window.SUPABASE_REFRESH_TOKEN,
//           });
//           console.log("Session setup result:", { data, error });
//         } catch (error) {
//           console.error("Error setting up session:", error);
//         }
//       } else {
//         console.log("No tokens available for client-side auth");
//       }

//       // Get current user
//       const {
//         data: { user },
//         error: userError,
//       } = await supabase.auth.getUser();

//       console.log("Client-side user check:", { user, userError });

//       if (user && !userError) {
//         // Check if we're forcing a new project (after save)
//         if (window.forceNewProject) {
//           console.log("Forcing new project - skipping existing project check");
//           window.forceNewProject = false; // Reset the flag
//           new PDFUploader(container);
//           return;
//         }

//         // Default behavior: Always start fresh with uploader
//         console.log("Starting fresh with new project uploader");
//         new PDFUploader(container);
//         window.currentPDFScraper = null; // Clear any existing scraper reference

//         // Optional: Add a "Load Previous Project" button for users who want to continue existing work
//         // const loadPreviousBtn = document.createElement("div");
//         // loadPreviousBtn.className = "mt-4 text-center";
//         // loadPreviousBtn.innerHTML = `
//         //   <button
//         //     id="load-previous-project"
//         //     class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
//         //   >
//         //     Load Previous Project
//         //   </button>
//         // `;
//         // container.appendChild(loadPreviousBtn);

//         // Add click handler for loading previous project
//         // const loadBtn = loadPreviousBtn.querySelector("#load-previous-project");
//         // loadBtn?.addEventListener("click", async () => {
//         //   console.log("Loading previous project...");
//         //   loadBtn.textContent = "Loading...";

//         //   try {
//         //     // Query for the most recent project
//         //     const { data: files, error: filesError } = await supabase
//         //       .from("files")
//         //       .select(
//         //         "id, author_id, project_id, file_type, status, file_path, name"
//         //       )
//         //       .eq("author_id", user.id)
//         //       .eq("file_type", "application/pdf")
//         //       .eq("status", "active")
//         //       .order("uploaded_at", { ascending: false })
//         //       .limit(1);

//         //     if (files && files.length > 0 && !filesError) {
//         //       const file = files[0];

//         //       if (!file.project_id) {
//         //         throw new Error("No valid project found");
//         //       }

//         //       // Get the project data
//         //       const { data: project, error: projectError } = await supabase
//         //         .from("projects")
//         //         .select("*")
//         //         .eq("id", file.project_id)
//         //         .single();

//         //       if (project && !projectError) {
//         //         // Get the public URL for the file
//         //         const {
//         //           data: { publicUrl },
//         //         } = supabase.storage
//         //           .from("project-documents")
//         //           .getPublicUrl(file.file_path);

//         //         console.log("Loading existing PDF:", publicUrl);

//         //         // Clear container and load existing project
//         //         container.innerHTML = "";

//         //         // Create PDF viewer with existing file
//         //         new PDFViewer(container, null, publicUrl, project.id);
//         //         const scraper = new PDFScraper(container);

//         //         // Set the project ID so saving works correctly
//         //         scraper.projectId = project.id;

//         //         // Populate form with existing project data
//         //         scraper.populateFormFromProject(project);

//         //         window.currentPDFScraper = scraper;
//         //       } else {
//         //         throw new Error("Error loading project data");
//         //       }
//         //     } else {
//         //       throw new Error("No previous projects found");
//         //     }
//         //   } catch (error) {
//         //     console.error("Error loading previous project:", error);
//         //     loadBtn.textContent = "No previous project found";
//         //     setTimeout(() => {
//         //       loadPreviousBtn.remove();
//         //     }, 2000);
//         //   }
//         // });
//       } else {
//         // No user or error, show uploader
//         console.log("User error:", userError);
//         new PDFUploader(container);
//       }
//     }
//   });

// <script define:vars={{ role, isAuth }}>
//   console.log("🏠 [INDEX] Script initialization started...");
//   console.log("🏠 [INDEX] Auth state:", { role, isAuth });

//   // Pass auth state and role to global scope for use in the main script
//   // this isbt user any more?
//   // window.USER_ROLE = role || "Client";
//   window.IS_AUTH = !!isAuth;

//   console.log("🏠 [INDEX] Global auth state set:", { IS_AUTH: window.IS_AUTH });
// </script>

// <script>
//   console.log("🏠 [INDEX] Main script execution started...");

//   // Import necessary functions and types
//   import {
//     PROJECT_STATUS_LABELS,
//     PROJECT_STATUS_DATA,
//     loadProjectStatuses,
//     getStatusData,
//     formatTimeSinceUpdate,
//     showNotification,
//     type ProjectStatusCode,
//   } from "../lib/global-services";

//   // Import form generation function
//   // Form generation removed - now using dedicated form-test page
//   // import Tooltip from "./Tooltip.astro";
//   import { StatusQuerySystem } from "../lib/status-query-system";

//   console.log("🏠 [INDEX] Imports completed successfully");

//   // Extend window interface for USER_ROLE
//   declare global {
//     interface Window {
//       USER_ROLE: string;
//     }
//   }

//   // Projects List Management Class
//   class ProjectsList {
//     private currentProjectId: string | null = null;
//     private currentProjectStatus: number | null = null;
//     private staffUsers: any[] = [];
//     private projects: any[] = [];
//     private currentUserRole: string = window.USER_ROLE || "Client"; // Add user role

//     constructor() {
//       console.log("🏠 [INDEX] ProjectsList constructor called");
//       this.setupAutoSave();
//       this.setupAssignmentHandlers();
//       this.setupRefreshButton();
//       this.exposeGlobalMethods();
//       this.initializeProjectStatuses().catch(console.error);
//       // Load staff users first, then projects
//       this.initializeData();
//       // Apply role-based UI changes
//     }

//     // Initialize data in the correct order
//     async initializeData() {
//       console.log("🏠 [INDEX] initializeData called, auth state:", { IS_AUTH: (window as any).IS_AUTH });

//       if (!(window as any).IS_AUTH) {
//         console.log("🏠 [INDEX] Skipping project/staff loading because user is not authenticated (initializeData)");
//         return;
//       }

//       console.log("🏠 [INDEX] User authenticated, loading data...");
//       await this.loadStaffUsers();
//       await this.loadProjects();
//     }

//     // Apply role-based UI changes (kept for future use; avatar visibility handled inline in markup)

//     // Function to automatically load projects
//     async loadProjects() {
//       console.log("🏠 [INDEX] loadProjects called");

//       try {
//         if (!(window as any).IS_AUTH) {
//           console.log("🏠 [INDEX] Skipping projects loading because user is not authenticated (loadProjects)");
//           return;
//         }

//         console.log("🏠 [INDEX] Fetching projects from API...");
//         const response = await fetch("/api/get-user-projects");
//         console.log("🏠 [INDEX] Projects API response status:", response.status);

//         const result = await response.json();
//         console.log("🏠 [INDEX] Projects API result:", {
//           success: result.success,
//           hasProjects: !!result.projects,
//           projectCount: result.projects?.length || 0,
//           authenticated: result.authenticated,
//           demo: result.demo,
//           error: result.error || null
//         });

//         if (result.success && result.projects) {
//           console.log("🏠 [INDEX] Displaying projects...");
//           this.displayUserProjects(result.projects);

//           // Only show success toast for authenticated users
//           if (result.authenticated && !result.demo) {
//             console.log("🏠 [INDEX] Showing success notification");
//             showNotification({
//               type: "success",
//               title: "Projects Loaded",
//               message: `Found ${result.projects.length} project(s)`,
//               duration: 3000,
//             });
//           }

//           console.log(`🏠 [INDEX] Successfully loaded ${result.projects.length} projects`);
//         } else {
//           console.error("🏠 [INDEX] Failed to load projects:", result.error);
//           showNotification({
//             type: "error",
//             title: "Failed to Load Projects",
//             message: result.error || "Could not fetch your projects",
//             duration: 5000,
//           });
//         }
//       } catch (error) {
//         console.error("🏠 [INDEX] Error loading projects:", error);
//         showNotification({
//           type: "error",
//           title: "Failed to Load Projects",
//           message: "Could not connect to server",
//           duration: 5000,
//         });
//       }
//     }

//     // Function to load staff users from API
//     async loadStaffUsers() {
//       console.log("🏠 [INDEX] loadStaffUsers called");

//       try {
//         // Skip data loading when not authenticated to avoid flashing auth form and content together
//         if (!(window as any).IS_AUTH) {
//           console.log("🏠 [INDEX] Skipping staff loading because user is not authenticated");
//           return;
//         }

//         console.log("🏠 [INDEX] Fetching staff users from API...");
//         const response = await fetch("/api/get-staff-users");
//         console.log("🏠 [INDEX] Staff users API response status:", response.status);

//         const result = await response.json();
//         console.log("🏠 [INDEX] Staff users API result:", {
//           success: result.success,
//           hasStaffUsers: !!result.staffUsers,
//           staffCount: result.staffUsers?.length || 0,
//           error: result.error || null
//         });

//         if (result.success) {
//           this.staffUsers = result.staffUsers || [];
//           console.log(
//             `Loaded ${this.staffUsers.length} staff users:`,
//             this.staffUsers
//           );
//         } else {
//           console.error("Failed to load staff users:", result.error);
//           console.log("Full error response:", result);
//           this.staffUsers = [];
//         }
//       } catch (error) {
//         console.error("Error loading staff users:", error);
//         this.staffUsers = [];
//       }
//     }

//     // Function to setup refresh button event listener
//     private setupRefreshButton() {
//       // Use event delegation since the button might not exist yet
//       document.addEventListener("click", async (e) => {
//         const target = e.target as HTMLElement;
//         if (
//           target.id === "refresh-staff-btn" ||
//           target.closest("#refresh-staff-btn")
//         ) {
//           e.preventDefault();
//           await this.refreshStaffUsers();
//         }

//         if (
//           target.id === "debug-staff-btn" ||
//           target.closest("#debug-staff-btn")
//         ) {
//           e.preventDefault();
//           await this.debugStaffUsers();
//         }

//         if (target.id === "test-db-btn" || target.closest("#test-db-btn")) {
//           e.preventDefault();
//           await this.testDatabase();
//         }
//       });
//     }

//     // Function to debug staff users
//     async debugStaffUsers() {
//       try {
//         console.log("Debugging staff users...");
//         const response = await fetch("/api/debug-staff-users");
//         const result = await response.json();

//         console.log("Debug response:", result);

//         if (result.success) {
//           showNotification({
//             type: "info",
//             title: "Debug Info",
//             message: `Check console for detailed debug information`,
//             duration: 5000,
//           });
//         } else {
//           showNotification({
//             type: "error",
//             title: "Debug Failed",
//             message: result.error || "Could not get debug info",
//             duration: 5000,
//           });
//         }
//       } catch (error) {
//         console.error("Error debugging staff users:", error);
//         showNotification({
//           type: "error",
//           title: "Debug Error",
//           message: "Could not connect to debug endpoint",
//           duration: 5000,
//         });
//       }
//     }

//     // Function to test database queries
//     async testDatabase() {
//       try {
//         console.log("Testing database queries...");
//         const response = await fetch("/api/test-database");
//         const result = await response.json();

//         console.log("Database test response:", result);

//         if (result.success) {
//           showNotification({
//             type: "info",
//             title: "Database Test",
//             message: `Check console for database test results`,
//             duration: 5000,
//           });
//         } else {
//           showNotification({
//             type: "error",
//             title: "Database Test Failed",
//             message: result.error || "Could not test database",
//             duration: 5000,
//           });
//         }
//       } catch (error) {
//         console.error("Error testing database:", error);
//         showNotification({
//           type: "error",
//           title: "Database Test Error",
//           message: "Could not connect to test endpoint",
//           duration: 5000,
//         });
//       }
//     }

//     // Function to refresh staff users and update all dropdowns
//     async refreshStaffUsers() {
//       console.log("Refreshing staff users...");
//       await this.loadStaffUsers();

//       // Re-populate all staff assignment dropdowns with updated data
//       const staffSelects = document.querySelectorAll(
//         ".staff-assignment-select"
//       );
//       staffSelects.forEach((select) => {
//         const selectElement = select as HTMLSelectElement;
//         const projectId = selectElement.dataset.projectId;
//         const currentValue = selectElement.value;

//         // Clear and repopulate options
//         selectElement.innerHTML = '<option value="">Unassigned</option>';

//         this.staffUsers.forEach((staff) => {
//           const option = document.createElement("option");
//           option.value = staff.id;
//           option.textContent = staff.name;

//           // Restore previous selection if it still exists
//           if (staff.id === currentValue) {
//             option.selected = true;
//           }

//           selectElement.appendChild(option);
//         });
//       });

//       showNotification({
//         type: "success",
//         title: "Staff List Updated",
//         message: `Refreshed staff list - found ${this.staffUsers.length} staff members`,
//         duration: 3000,
//       });
//     }

//     // Function to populate staff assignment dropdowns
//     private populateStaffAssignments(projects: any[]) {
//       if (this.currentUserRole === "Client") return;
//       projects.forEach((project) => {
//         const selectElement = document.getElementById(
//           `staff-assignment-${project.id}`
//         ) as HTMLSelectElement;
//         if (!selectElement) return;

//         // Clear existing options except "Unassigned"
//         selectElement.innerHTML = '<option value="">Unassigned</option>';

//         // Add staff users as options
//         this.staffUsers.forEach((staff) => {
//           const option = document.createElement("option");
//           option.value = staff.id;
//           option.textContent = staff.name;

//           // Select current assignment if it matches
//           if (project.assigned_to_id === staff.id) {
//             option.selected = true;
//           }

//           selectElement.appendChild(option);
//         });

//         // Update the assigned user span (only for non-Client users)
//         if (this.currentUserRole !== "Client") {
//           const assignedUserSpan = document.getElementById(
//             `assigned-user-${project.id}`
//           );
//           if (assignedUserSpan) {
//             if (project.assigned_to_id) {
//               const assignedStaff = this.staffUsers.find(
//                 (s) => s.id === project.assigned_to_id
//               );
//               if (assignedStaff) {
//                 assignedUserSpan.textContent = assignedStaff.name;
//                 assignedUserSpan.className =
//                   "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white";
//               } else {
//                 assignedUserSpan.textContent = "Loading...";
//                 assignedUserSpan.className =
//                   "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white";
//               }
//             } else {
//               assignedUserSpan.textContent = "Unassigned";
//               assignedUserSpan.className =
//                 "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white";
//             }
//           }
//         }
//       });
//     }

//     // Function to handle staff assignment changes
//     private setupAssignmentHandlers() {
//       if (this.currentUserRole === "Client") return;
//       document.addEventListener("change", async (e) => {
//         const target = e.target as HTMLSelectElement;
//         if (!target.classList.contains("staff-assignment-select")) return;

//         const projectId = target.dataset.projectId;
//         const assignedToId = target.value || null;

//         if (!projectId) return;

//         try {
//           const response = await fetch("/api/assign-project", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               projectId,
//               assignedToId,
//             }),
//           });

//           const result = await response.json();

//           if (result.success) {
//             const assignedName = assignedToId
//               ? this.staffUsers.find((s) => s.id === assignedToId)?.name ||
//                 "Unknown"
//               : "Unassigned";

//             // Update the assigned user span (only for non-Client users)
//             if (this.currentUserRole !== "Client") {
//               const assignedUserSpan = document.getElementById(
//                 `assigned-user-${projectId}`
//               );
//               if (assignedUserSpan) {
//                 assignedUserSpan.textContent = assignedName;
//                 if (assignedToId) {
//                   assignedUserSpan.className =
//                     "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white";
//                 } else {
//                   assignedUserSpan.className =
//                     "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white";
//                 }
//               }
//             }

//             showNotification({
//               type: "success",
//               title: "Assignment Updated",
//               message: `Project ${projectId} assigned to ${assignedName}`,
//               duration: 3000,
//             });

//             console.log("Assignment updated:", result);
//           } else {
//             showNotification({
//               type: "error",
//               title: "Assignment Failed",
//               message: result.error || "Could not update assignment",
//               duration: 5000,
//             });

//             // Reset dropdown to previous value on error
//             target.selectedIndex = 0;
//           }
//         } catch (error) {
//           console.error("Error updating assignment:", error);
//           showNotification({
//             type: "error",
//             title: "Assignment Error",
//             message: "Could not connect to server",
//             duration: 5000,
//           });

//           // Reset dropdown to previous value on error
//           target.selectedIndex = 0;
//         }
//       });
//     }

//     // Function to display user projects in the projects list
//     displayUserProjects(projects: any[]) {
//     // Store projects data for use in other methods
//     this.projects = projects;
//       // Find or create the projects list container
//       let projectsList = document.getElementById("projects-list");

//       if (!projectsList) {
//         // Create the container if it doesn't exist
//         const projectListContainer = document.querySelector(
//           "[data-project-list-container]"
//         );
//         if (projectListContainer) {
//           projectListContainer.innerHTML = `
//             <div id="projects-list">
//               <!-- Search Filter for Projects -->
//               <div class="mb-4 relative">
//                 <input
//                   type="text"
//                   id="project-search-input-main"
//                   placeholder="Search your projects..."
//                   class="w-full pr-10 px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                 />
//                 <button
//                   id="clear-search-btn-main"
//                   class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors hidden"
//                   title="Clear search"
//                 >
//                   <i class="bx bx-x text-lg"></i>
//                 </button>
//               </div>
//             </div>
//           `;
//           projectsList = document.getElementById("projects-list");
//         }
//       }

//       if (!projectsList) return;

//       // Preserve the search input if it exists, or create one
//       const existingSearchInput = projectsList.querySelector(
//         "#project-search-input-main"
//       ) || projectsList.querySelector("#project-search-input") || projectsList.querySelector("#project-search");

//       const searchInputHTML = existingSearchInput
//         ? existingSearchInput.outerHTML
//         : `
//           <!-- Search Filter for Projects -->
//           <div class="mb-4 relative">
//             <input
//               type="text"
//               id="project-search-input-dynamic"
//               placeholder="Search your projects..."
//               class="w-full pr-10 px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//             />
//             <button
//               id="clear-search-btn-dynamic"
//               class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors hidden"
//               title="Clear search"
//             >
//               <i class="bx bx-x text-lg"></i>
//             </button>
//           </div>`;

//       if (projects.length === 0) {
//         projectsList.innerHTML = `
//           ${searchInputHTML}
//           <div class="p-4 text-center text-gray-500 dark:text-gray-400">
//             <p>No projects found</p>
//             <p class="text-sm mt-1">Create a test project to see it listed here</p>
//           </div>
//         `;
//         return;
//       }

//       // Sort projects by update time (most recent first)
//       const sortedProjects = [...projects].sort((a, b) => {
//         const timeA = new Date(a.updated_at || a.created).getTime();
//         const timeB = new Date(b.updated_at || b.created).getTime();
//         return timeB - timeA; // Descending order (newest first)
//       });

//       // Generate accordion HTML for projects
//       const accordionId = "projects-accordion";
//       projectsList.innerHTML = `
//         ${searchInputHTML}
//         <div id="${accordionId}" data-accordion="collapse">
//           ${sortedProjects
//             .map((project, index) => {
//               // Calculate time since last update
//               const timeSinceUpdate = formatTimeSinceUpdate(
//                 project.updated_at || project.created
//               );

//               const isFirst = index === 0;
//               const isLast = index === sortedProjects.length - 1;
//               const projectTitle =
//                 project.address || project.title || `Project ${project.id}`;

//               const projectDescription =
//                 project.description || "Project created from PDF upload";

//               return `
//                 <!-- Accordion Item ${index} -->
//                 <div data-project-id="${project.id}" data-project-status="${project.status || 10}">
//                   <!-- Accordion Header -->
//                   <div class="accordion-header">
//                     <button
//                       class="relative flex items-center justify-between w-full p-5 font-medium rtl:text-right text-gray-500 border ${isLast ? "" : "border-b-0"} ${isFirst ? "rounded-t-xl" : ""} border-gray-200 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3"
//                       data-accordion-target="#accordion-collapse-body-${project.id}"
//                       aria-expanded="false"
//                       aria-controls="accordion-collapse-body-${project.id}"
//                       type="button"
//                     >
//                       <!-- Project Owner Avatar with Tooltip (hidden for Client users) -->
//                       <div class="project-owner-avatar rounded-lg border size-9 flex items-center justify-center border-gray-600 dark:border-gray-500 dark:bg-gray-800 overflow-hidden text-white dark:text-gray-300 bg-gray-700"
//                            ${this.currentUserRole === "Client" ? 'style="display:none"' : ''}
//                            title="${project.author_name || "Unknown Owner"}${project.author_email ? ` - ${project.author_email}` : ""}${project.owner ? ` (${project.owner})` : ""}">
//                         ${
//                           project.author_id
//                             ? `<div class="w-full h-full flex items-center justify-center bg-blue-500 text-white">
//                               <i class="bx bx-user bx-sm"></i>
//                             </div>`
//                             : '<i class="bx bx-file-blank"></i>'
//                         }
//                       </div>

//                       <!-- Project Info -->
//                       <div class="pl-4 flex flex-col justify-start flex-1 text-left">
//                         <h2 id="project-title-${project.id}" class="font-medium text-base text-gray-800 dark:text-gray-200" data-search-text>
//                           ${projectTitle}
//                         </h2>

//                         <div class="flex items-center gap-2 mt-1">

//                           <!-- Status badge -->
//                           <span id="project-status-label-${project.id}" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-600 text-white"  data-search-text>
//                             ${PROJECT_STATUS_LABELS[(project.status || 10) as unknown as ProjectStatusCode] || "Unknown"}
//                           </span>
//                           <!-- Assigned user name (hidden for Client users) -->
//                           ${
//                             this.currentUserRole !== "Client" ? (
//                               project.assigned_to_id && project.assigned_to_name
//                                 ? `<span id="assigned-user-${project.id}" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white" data-search-text>
//                               ${project.assigned_to_name}
//                             </span>`
//                                 : project.assigned_to_id
//                                   ? `<span id="assigned-user-${project.id}" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">
//                               Loading...
//                             </span>`
//                                   : `<span id="assigned-user-${project.id}" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">
//                               Unassigned
//                             </span>`
//                             ) : ""
//                           }
//                                 <i class="bx bx-time"></i>${timeSinceUpdate}

//                         </div>
//                       </div>

//                       <!-- Accordion Arrow -->
//                       <svg
//                         data-accordion-icon
//                         class="w-3 h-3 rotate-180 shrink-0"
//                         aria-hidden="true"
//                         xmlns="http://www.w3.org/2000/svg"
//                         fill="none"
//                         viewBox="0 0 10 6"
//                       >
//                         <path
//                           stroke="currentColor"
//                           stroke-linecap="round"
//                           stroke-linejoin="round"
//                           stroke-width="2"
//                           d="M9 5 5 1 1 5"></path>
//                       </svg>
//                     </button>
//                   </div>

//                   <!-- Accordion Body -->
//                   <div
//                     id="accordion-collapse-body-${project.id}"
//                     class="hidden"
//                     aria-labelledby="accordion-collapse-heading-${project.id}"
//                   >
//                                       <div class="p-5 border ${isLast ? "rounded-b-xl border-t-0" : "border-b-0"} border-gray-200 dark:border-gray-700 dark:bg-gray-900">
//                       <!-- Project Form removed - now using dedicated form-test page -->
//                       <div class="text-center py-8">
//                         <p class="text-gray-500 dark:text-gray-400 mb-4">
//                           Project form has been moved to a dedicated test page for better development.
//                         </p>
//                         <a
//                           href={/form/`${project.id}`}
//                           class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
//                         >
//                           <i class="bx bx-edit mr-2"></i>
//                           Edit Project Form
//                         </a>
//                       </div>

//                     </div>
//                   </div>
//                 </div>
//               `;
//             })
//             .join("")}
//         </div>
//       `;

//       // Initialize accordion functionality
//       setTimeout(() => {
//         this.initializeAccordion(accordionId);
//                   // Form generation removed - now using dedicated form-test page
//         this.populateStaffAssignments(sortedProjects);

//         // Re-initialize search filter functionality after projects are loaded
//         this.initializeTextFilter(accordionId);

//         // Initialize button groups AFTER form containers are populated
//         console.log("Initializing button groups after form population");

//         // Debug: Check if form containers were populated
//         const formContainers = document.querySelectorAll(
//           ".project-form-container"
//         );
//         console.log(`Found ${formContainers.length} form containers`);
//         formContainers.forEach((container, index) => {
//           console.log(`Form container ${index}:`, {
//             hasContent: container.innerHTML.length > 0,
//             contentLength: container.innerHTML.length,
//             hasButtons: container.querySelectorAll("button").length,
//           });
//         });

//         this.initializeButtonGroups(accordionId);

//         // Load media files and invoice links for each project
//         sortedProjects.forEach((project) => {
//           setTimeout(() => {
//             this.loadProjectFiles(project.id.toString());
//             this.loadProjectInvoices(project.id.toString());
//           }, 200); // Small delay to ensure DOM is ready
//         });
//       }, 100);

//       // Show the project filter after projects are loaded
//       if ((window as any).projectFilter) {
//         (window as any).projectFilter.show();
//         (window as any).projectFilter.updateCountBubbles();
//         (window as any).projectFilter.updateProjectCount();
//       }

//       // Initialize text filter functionality
//       this.initializeTextFilter(accordionId);

//       // Re-initialize search filter in ProjectsNav if it exists
//       if ((window as any).projectSearchFilter) {
//         // Add a small delay to ensure DOM is updated
//         setTimeout(() => {
//           (window as any).projectSearchFilter.setupEventListeners();
//         }, 200);
//       }
//     }

//     // Function to initialize accordion functionality
//     private initializeAccordion(accordionId: string) {
//       const accordionElement = document.getElementById(accordionId);
//       if (!accordionElement) return;

//       // Find all accordion buttons
//       const buttons = accordionElement.querySelectorAll(
//         "[data-accordion-target]"
//       );

//       buttons.forEach((button) => {
//         button.addEventListener("click", function (this: HTMLElement) {
//           const targetId = this.getAttribute("data-accordion-target");
//           const targetElement = document.querySelector(targetId as string);
//           const icon = this.querySelector("[data-accordion-icon]");

//           if (!targetElement) return;

//           // Check if this accordion is currently open
//           const isOpen = !targetElement.classList.contains("hidden");

//           if (isOpen) {
//             // Close this accordion
//             targetElement.classList.add("hidden");
//             this.setAttribute("aria-expanded", "false");
//             // Remove sticky class from header
//             const header = this.closest(".accordion-header");
//             if (header) {
//               header.classList.remove(
//                 "sticky",
//                 "top-16",
//                 "z-20",
//                 "bg-white",
//                 "dark:bg-gray-800"
//               );
//             }
//             if (icon) {
//               icon.classList.add("rotate-180");
//             }
//           } else {
//             // Close all other accordions first (optional - remove if you want multiple open)
//             buttons.forEach((otherButton) => {
//               if (otherButton !== this) {
//                 const otherTargetId = otherButton.getAttribute(
//                   "data-accordion-target"
//                 );
//                 const otherTarget = document.querySelector(
//                   otherTargetId as string
//                 );
//                 const otherIcon = otherButton.querySelector(
//                   "[data-accordion-icon]"
//                 );

//                 if (otherTarget && !otherTarget.classList.contains("hidden")) {
//                   otherTarget.classList.add("hidden");
//                   (otherButton as HTMLElement).setAttribute(
//                     "aria-expanded",
//                     "false"
//                   );
//                   // Remove sticky class from other headers
//                   const otherHeader = otherButton.closest(".accordion-header");
//                   if (otherHeader) {
//                     otherHeader.classList.remove(
//                       "sticky",
//                       "top-16",
//                       "z-20",
//                       "bg-white",
//                       "dark:bg-gray-800"
//                     );
//                   }
//                   if (otherIcon) {
//                     otherIcon.classList.add("rotate-180");
//                   }
//                 }
//               }
//             });

//             // Open this accordion
//             targetElement.classList.remove("hidden");
//             this.setAttribute("aria-expanded", "true");
//             // Add sticky class to header when opened
//             const header = this.closest(".accordion-header");
//             if (header) {
//               header.classList.add(
//                 "sticky",
//                 "top-16",
//                 "z-20",
//                 "bg-white",
//                 "dark:bg-gray-800"
//               );
//             }
//             if (icon) {
//               icon.classList.remove("rotate-180");
//             }
//           }
//         });
//       });

//       console.log(`Initialized accordion with ${buttons.length} items`);
//     }

//     // Function to initialize text filter functionality
//     private initializeTextFilter(accordionId: string) {
//       const searchInput = document.getElementById(
//         "project-search-input"
//       ) as HTMLInputElement;
//       const accordionElement = document.getElementById(accordionId);
//       const clearButton = document.getElementById(
//         "clear-search-btn"
//       ) as HTMLButtonElement;

//       if (!searchInput || !accordionElement) return;

//       let debounceTimer: ReturnType<typeof setTimeout>;

//       // Show/hide clear button based on input value
//       const updateClearButton = () => {
//         if (clearButton) {
//           if (searchInput.value.trim() !== "") {
//             clearButton.classList.remove("hidden");
//           } else {
//             clearButton.classList.add("hidden");
//           }
//         }
//       };

//       // Clear button click handler
//       if (clearButton) {
//         clearButton.addEventListener("click", () => {
//           searchInput.value = "";
//           this.filterAccordionItems(accordionId, "");
//           updateClearButton();
//           searchInput.focus();
//         });
//       }

//       searchInput.addEventListener("input", (e) => {
//         clearTimeout(debounceTimer);

//         debounceTimer = setTimeout(() => {
//           const searchTerm = (e.target as HTMLInputElement).value
//             .trim()
//             .toLowerCase();

//           // Filter immediately on any input
//           this.filterAccordionItems(accordionId, searchTerm);
//           updateClearButton();
//         }, 300); // Small debounce delay for better performance
//       });

//       // Initial state
//       updateClearButton();

//       console.log("Initialized text filter for accordion");
//     }

//     // Function to filter accordion items based on search term
//     private filterAccordionItems(accordionId: string, searchTerm: string) {
//       const accordionElement = document.getElementById(accordionId);
//       if (!accordionElement) return;

//       const accordionItems = accordionElement.querySelectorAll(
//         "[data-project-status]"
//       );
//       let visibleCount = 0;

//       accordionItems.forEach((item) => {
//         const htmlItem = item as HTMLElement;

//         if (searchTerm === "") {
//           // When search is empty, restore visibility based on current status filter
//           this.applyStatusFilter(htmlItem);
//           if (htmlItem.style.display !== "none") {
//             visibleCount++;
//           }
//         } else {
//           // First check if item should be visible based on status filter
//           const shouldBeVisibleByStatus =
//             this.isVisibleByStatusFilter(htmlItem);

//           if (!shouldBeVisibleByStatus) {
//             // If hidden by status filter, keep it hidden regardless of search
//             htmlItem.style.display = "none";
//           } else {
//             // Only search within items that pass the status filter
//             const textElements =
//               htmlItem.querySelectorAll("[data-search-text]");
//             let textContent = "";
//             textElements.forEach((el) => {
//               textContent += " " + (el.textContent || "").toLowerCase();
//             });

//             // Check if the search term is found in the text content
//             if (textContent.includes(searchTerm)) {
//               htmlItem.style.display = "block";
//               visibleCount++;
//             } else {
//               htmlItem.style.display = "none";
//             }
//           }
//         }
//       });

//       // Update the search input placeholder with results count
//       const searchInput = document.getElementById(
//         "project-search-input"
//       ) as HTMLInputElement;
//       if (searchInput && searchTerm !== "") {
//         searchInput.placeholder = `Showing ${visibleCount} of ${accordionItems.length} projects`;
//       } else if (searchInput) {
//         searchInput.placeholder = "Search your projects...";
//       }

//       console.log(
//         `Text filter applied: "${searchTerm}" - ${visibleCount}/${accordionItems.length} items visible`
//       );
//     }

//     // Function to load a project from the list
//     loadProject(projectId: string, status: number) {
//       this.currentProjectId = projectId;
//       this.currentProjectStatus = status;

//       // Call updateProjectButtons if it exists globally
//       if ((window as any).updateProjectButtons) {
//         (window as any).updateProjectButtons();
//       }

//       showNotification({
//         type: "info",
//         title: "Project Loaded",
//         message: `Project ${projectId} is now active`,
//         duration: 3000,
//       });

//       // Log event if available
//       if ((window as any).logEvent) {
//         (window as any).logEvent("project:loaded", { projectId, status });
//       }
//     }

//     // Function to view project details (placeholder for future implementation)
//     viewProjectDetails(projectId: string) {
//       showNotification({
//         type: "info",
//         title: "Project Details",
//         message: `Viewing details for project ${projectId}`,
//         duration: 3000,
//       });

//       // Log event if available
//       if ((window as any).logEvent) {
//         (window as any).logEvent("project:details-viewed", { projectId });
//       }
//     }

//     // Function to reset project form to original values
//     resetProjectForm(projectId: string) {
//       const projectContainer = document.querySelector(
//         `[data-project-id="${projectId}"]`
//       ) as HTMLElement;
//       if (!projectContainer) return;

//       const form = projectContainer.querySelector('form') as HTMLFormElement;
//       if (!form) return;

//       // Find the original project data and repopulate
//       showNotification({
//         type: "info",
//         title: "Form Reset",
//         message: `Form reset to original values for project ${projectId}`,
//         duration: 2000,
//       });

//       // Log event if available
//       if ((window as any).logEvent) {
//         (window as any).logEvent("project:form-reset", { projectId });
//       }
//     }

//     // Form generation removed - now using dedicated form-test page

//     // Function to load project statuses from database
//     private async initializeProjectStatuses() {
//       try {
//         await loadProjectStatuses();
//         console.log("Project statuses loaded successfully");
//       } catch (error) {
//         console.error("Failed to load project statuses:", error);
//       }
//     }

//     // Function to handle estimate button clicks
//     private async handleEstimateClick(
//       projectId: string,
//       projectData: any,
//       isEditMode: boolean = false
//     ) {
//       try {
//         // Check if an invoice already exists for this project
//         const invoicesResponse = await fetch("/api/list-invoices");
//         const invoicesData = await invoicesResponse.json();
//         const existingInvoice = invoicesData.invoices?.find(
//           (invoice: any) =>
//             invoice.project_id.toString() === projectId.toString()
//         );

//         if (isEditMode || existingInvoice) {
//           // Edit mode or invoice exists - go to edit
//           if (existingInvoice) {
//             console.log("Editing existing invoice:", existingInvoice.id);

//             showNotification({
//               type: "success",
//               title: "Opening Invoice",
//               message: `Opening invoice ${existingInvoice.invoice_number} for editing`,
//               duration: 3000,
//             });

//             // Redirect to edit existing invoice
//             setTimeout(() => {
//               window.location.href = `/invoice/${existingInvoice.id}`;
//             }, 500);
//             return;
//           } else {
//             // Edit mode but no invoice exists - show error
//             showNotification({
//               type: "error",
//               title: "No Invoice Found",
//               message:
//                 "No invoice exists for this project yet. Use 'Build Estimate' first.",
//               duration: 5000,
//             });
//             return;
//           }
//         }

//         // Create mode - create new invoice
//         console.log("Creating new invoice for project:", projectId);

//         const response = await fetch("/api/create-invoice", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             projectId,
//             projectData,
//           }),
//         });

//         const result = await response.json();

//         if (result.success) {
//           // Update project status to 20 (Estimate Created)
//           try {
//             const statusResponse = await fetch("/api/update-project-status", {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//               body: JSON.stringify({
//                 projectId,
//                 status: 20,
//               }),
//             });

//             if (!statusResponse.ok) {
//               console.warn(
//                 "Failed to update project status:",
//                 await statusResponse.text()
//               );
//             } else {
//               console.log("Project status updated to 20");
//               // Update the status query system
//               StatusQuerySystem.getInstance().updateProjectStatus(
//                 projectId,
//                 20
//               );
//             }
//           } catch (statusError) {
//             console.warn("Error updating project status:", statusError);
//           }

//           // Refresh invoice links for this project
//           setTimeout(() => {
//             this.loadProjectInvoices(projectId);
//           }, 500);

//           showNotification({
//             type: "success",
//             title: "Invoice Created",
//             message: `Invoice ${result.invoice.invoice_number} created successfully. Click the invoice link to view it.`,
//             duration: 5000,
//           });

//           // Redirect to invoice page after a short delay to prevent page refresh interference
//           setTimeout(() => {
//             window.location.href = `/invoice/${result.invoice.id}`;
//           }, 1000);
//         } else {
//           throw new Error(result.error || "Failed to create invoice");
//         }
//       } catch (error) {
//         console.error("Error creating invoice:", error);
//         const errorMessage =
//           error instanceof Error ? error.message : "Failed to create invoice";
//         showNotification({
//           type: "error",
//           title: "Invoice Creation Failed",
//           message: errorMessage,
//           duration: 5000,
//         });
//       }
//     }

//     // Function to handle client email notifications
//     private async clientEmailHandler(projectId: string, authorEmail: string) {
//       console.log(
//         `Client email handler called for project ${projectId} and email ${authorEmail}`
//       );

//       // Debug: Log the email data
//       console.log("Email data:", {
//         projectId,
//         authorEmail,
//         hasEmail: !!authorEmail,
//         emailLength: authorEmail?.length,
//       });

//       try {
//         // Call the API endpoint to send magic link
//         const response = await fetch("/api/send-magic-link", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             projectId: projectId,
//             authorEmail: authorEmail,
//           }),
//         });

//         const result = await response.json();

//         if (!response.ok || !result.success) {
//           throw new Error(result.error || "Failed to send magic link");
//         }

//         showNotification({
//           type: "success",
//           title: "Magic Link Sent",
//           message: `Login link sent to ${authorEmail}`,
//           duration: 3000,
//         });

//         console.log("Magic link sent successfully:", result);
//       } catch (error) {
//         console.error("Failed to send magic link:", error);
//         showNotification({
//           type: "error",
//           title: "Failed to Send Link",
//           message: "Could not send magic link. Please try again.",
//           duration: 3000,
//         });
//       }
//     }

//     // Function to handle auto-save functionality
//     private setupAutoSave() {

//       // Debounce function to prevent too many API calls
//       const debounce = (func: Function, wait: number) => {
//         let timeout: NodeJS.Timeout;
//         return function executedFunction(...args: any[]) {
//           const later = () => {
//             clearTimeout(timeout);
//             func(...args);
//           };
//           clearTimeout(timeout);
//           timeout = setTimeout(later, wait);
//         };
//       };

//       // Auto-save function with debounced toast
//       let saveToastTimeout: NodeJS.Timeout | undefined;
//       const autoSaveProject = debounce(
//         async (projectId: string, form: HTMLFormElement) => {
//           try {
//             // Clear any existing toast timeout
//             if (saveToastTimeout) {
//               clearTimeout(saveToastTimeout);
//             }

//             // Collect form data
//             const formData = new FormData(form);
//             const projectData: any = {};

//             for (const [key, value] of formData.entries()) {
//               if (key === "new_construction") {
//                 projectData[key] = true;
//               } else if (
//                 key === "sq_ft" ||
//                 key === "units" ||
//                 key === "status"
//               ) {
//                 projectData[key] = parseInt(value as string) || 0;
//               } else {
//                 projectData[key] = value;
//               }
//             }

//             // Handle unchecked checkbox
//             if (!formData.has("new_construction")) {
//               projectData.new_construction = false;
//             }

//             // Units value is now handled by the UnitSlider component

//             // Collect button group data
//             const buttonGroups = [
//               "building",
//               "project",
//               "service",
//               "requested_docs",
//             ];

//             buttonGroups.forEach((groupName) => {
//               const groupButtons = form.querySelectorAll(
//                 `[data-group="${groupName}"]`
//               );
//               const groupType =
//                 groupButtons.length > 0
//                   ? (groupButtons[0] as HTMLElement).dataset.type
//                   : null;

//               if (groupType === "radio") {
//                 const selectedButton = Array.from(groupButtons).find((btn) =>
//                   btn.classList.contains("bg-blue-500")
//                 );
//                 if (selectedButton) {
//                   projectData[groupName] = (
//                     selectedButton as HTMLElement
//                   ).dataset.value;
//                 }
//               } else if (groupType === "multi-select") {
//                 const selectedButtons = Array.from(groupButtons).filter((btn) =>
//                   btn.classList.contains("bg-blue-500")
//                 );
//                 if (selectedButtons.length > 0) {
//                   projectData[groupName] = selectedButtons.map(
//                     (btn) => (btn as HTMLElement).dataset.value
//                   );
//                 }
//               }
//             });

//             // Make API call to update project
//             const requestPayload = {
//               projectId,
//               ...projectData,
//             };

//             const response = await fetch("/api/update-project-status", {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//               body: JSON.stringify(requestPayload),
//             });

//             if (!response.ok) {
//               const errorText = await response.text();
//               console.error("Auto-save API Error:", errorText);
//               throw new Error(`Auto-save failed: ${errorText}`);
//             }

//             const result = await response.json();
//             console.log("Auto-save successful:", result);

//             // Show success toast after 500ms delay
//             saveToastTimeout = setTimeout(() => {
//               showNotification({
//                 type: "success",
//                 title: "Changes Saved",
//                 message: "Your project changes have been saved automatically",
//                 duration: 3000,
//               });
//             }, 500);

//             // Log event if available
//             if ((window as any).logEvent) {
//               (window as any).logEvent("project:auto-saved", {
//                 projectId,
//                 changes: projectData,
//               });
//             }
//           } catch (error: unknown) {
//             console.error("Auto-save error:", error);

//             // Show error toast immediately
//             showNotification({
//               type: "error",
//               title: "Save Failed",
//               message: "Could not save changes. Please try again.",
//               duration: 5000,
//             });
//           }
//         },
//         1000
//       ); // 1 second debounce

//       // Listen for form changes
//       document.addEventListener("input", (e) => {
//         const target = e.target as HTMLElement;
//         const form = target.closest("form[data-project-id]") as HTMLFormElement;
//         if (!form) return;

//         const projectId = form.dataset.projectId;
//         if (!projectId) return;

//         // Trigger auto-save
//         autoSaveProject(projectId, form);
//       });

//       // Listen for button group changes
//       document.addEventListener("click", (e) => {
//         const button = (e.target as HTMLElement).closest(
//           ".building-type-radio, .consulting-service-btn, .fire-service-radio, .fire-safety-service-btn"
//         );
//         if (!button) return;

//         const form = button.closest("form[data-project-id]") as HTMLFormElement;
//         if (!form) return;

//         const projectId = form.dataset.projectId;
//         if (!projectId) return;

//         // Trigger auto-save
//         autoSaveProject(projectId, form);
//       });

//       // Unit slider changes are now handled by the UnitSlider component

//       // Handle estimate button clicks (both create and edit)
//       document.addEventListener("click", (e) => {
//         console.log("Click event detected:", e.target);
//         const buildTarget = (e.target as HTMLElement).closest(
//           ".estimate-btn, [data-template-type='estimate']"
//         );
//         const editTarget = (e.target as HTMLElement).closest(
//           ".edit-estimate-btn, [data-template-type='edit-estimate']"
//         );

//         const target = buildTarget || editTarget;
//         console.log("Estimate button target:", target);

//         if (target) {
//           console.log("Estimate button found, preventing default");
//           e.preventDefault();
//           e.stopPropagation();
//           const projectId = (target as HTMLElement).dataset.projectId;
//           const projectData = JSON.parse(
//             (target as HTMLElement).dataset.projectData || "{}"
//           );
//           const isEditMode =
//             target.classList.contains("edit-estimate-btn") ||
//             (target as HTMLElement).dataset.templateType === "edit-estimate";

//           console.log(
//             "Project ID:",
//             projectId,
//             "Project Data:",
//             projectData,
//             "Edit Mode:",
//             isEditMode
//           );

//           if (projectId) {
//             console.log("Calling handleEstimateClick");
//             this.handleEstimateClick(projectId, projectData, isEditMode);
//           }
//         }
//       });

//       // Handle project status change
//       document.addEventListener("change", async (e) => {
//         const target = e.target as HTMLSelectElement;
//         if (!target.classList.contains("project-status-select")) return;

//         const projectId = target.dataset.projectId;
//         const newStatus = parseInt(target.value, 10);
//         if (!projectId || Number.isNaN(newStatus)) return;

//         // Debugger: break right before the status change API call (dev only)
//         if (import.meta.env.DEV) {
//           console.log("[DEBUG] About to change project status", {
//             projectId,
//             newStatus,
//             selectEl: target,
//           });
//           debugger;
//         }

//         try {
//           const res = await fetch("/api/update-project-status", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ projectId, status: newStatus }),
//           });

//           if (!res.ok) {
//             console.error("Failed to update project status", await res.text());
//             showNotification({
//               type: "error",
//               title: "Update Failed",
//               message: "Could not update project status.",
//               duration: 2500,
//             });
//             return;
//           }

//           // Update numeric and label displays
//           const numEl = document.getElementById(`project-status-${projectId}`);
//           if (numEl) numEl.textContent = String(newStatus);
//           const labelEl = document.getElementById(
//             `project-status-label-${projectId}`
//           );
//           if (labelEl) {
//             const label =
//               PROJECT_STATUS_LABELS[
//                 newStatus as unknown as ProjectStatusCode
//               ] || "Unknown";
//             labelEl.textContent = label;
//           }

//           // Update visibility rules
//           StatusQuerySystem.getInstance().updateProjectStatus(
//             projectId,
//             newStatus
//           );

//           showNotification({
//             type: "success",
//             title: "Status Updated",
//             message: `Project moved to ${newStatus}`,
//             duration: 2000,
//           });

//           // Check notification settings and send emails
//           const projectsList = (window as any).projectsList;
//           if (projectsList && projectsList.handleStatusChangeNotifications) {
//             await projectsList.handleStatusChangeNotifications(projectId, newStatus);
//           }
//         } catch (err) {
//           console.error("Status change error", err);
//         }
//       });

//       // Handle status refresh button clicks
//       document.addEventListener("click", (e) => {
//         const target = (e.target as HTMLElement).closest(
//           ".status-refresh-btn"
//         ) as HTMLElement;
//         if (target) {
//           e.preventDefault();
//           const projectId = target.dataset.projectId;
//           const newStatus = parseInt(target.dataset.status || "20");
//           if (import.meta.env.DEV) {
//             console.log("[DEBUG] Status refresh button clicked", {
//               projectId,
//               newStatus,
//               button: target,
//             });
//             debugger;
//           }
//           if (projectId) {
//             StatusQuerySystem.getInstance().updateProjectStatus(
//               projectId,
//               newStatus
//             );
//           }
//           showNotification({
//             type: "success",
//             title: "Status Updated",
//             message: `Project status updated to ${newStatus}`,
//             duration: 2000,
//           });
//         }
//       });
//     }

//     // Function to initialize button group functionality
//     private initializeButtonGroups(accordionId: string) {
//       const accordionElement = document.getElementById(accordionId);
//       if (!accordionElement) {
//         console.error("Accordion element not found:", accordionId);
//         return;
//       }

//       // Check how many buttons we found
//       const allButtons = accordionElement.querySelectorAll(
//         ".building-type-radio, .consulting-service-btn, .fire-service-radio, .fire-safety-service-btn"
//       );
//       // console.log(`Found ${allButtons.length} form buttons in accordion`);

//       // Log details about each button found (debug)
//       // allButtons.forEach((button, index) => {
//       //   const htmlButton = button as HTMLElement;
//       //   console.log(`Button ${index}:`, {
//       //     value: htmlButton.dataset.value,
//       //     group: htmlButton.dataset.group,
//       //     type: htmlButton.dataset.type,
//       //     classes: htmlButton.className,
//       //     text: htmlButton.textContent?.trim(),
//       //   });
//       // });

//       // Handle button group clicks
//       accordionElement.addEventListener("click", (e) => {
//         const button = (e.target as HTMLElement).closest(
//           ".building-type-radio, .consulting-service-btn, .fire-service-radio, .fire-safety-service-btn"
//         );

//         // Only proceed if we found a matching button
//         if (!button) {
//           return;
//         }

//         e.preventDefault();

//         const value = (button as HTMLElement).dataset.value;
//         const group = (button as HTMLElement).dataset.group;
//         const type = (button as HTMLElement).dataset.type;

//         if (!value || !group || !type) {
//           return;
//         }

//         if (type === "radio") {
//           // Single select - clear all other buttons in this group
//           const groupButtons = accordionElement.querySelectorAll(
//             `[data-group="${group}"]`
//           );
//           groupButtons.forEach((btn) => {
//             btn.classList.remove(
//               "bg-blue-500",
//               "text-white",
//               "border-blue-500"
//             );
//             btn.classList.add(
//               "bg-white",
//               "dark:bg-gray-700",
//               "text-gray-700",
//               "dark:text-gray-300",
//               "border-gray-300",
//               "dark:border-gray-600"
//             );
//           });

//           // Set this button as selected
//           button.classList.add("bg-blue-500", "text-white", "border-blue-500");
//           button.classList.remove(
//             "bg-white",
//             "dark:bg-gray-700",
//             "text-gray-700",
//             "dark:text-gray-300",
//             "border-gray-300",
//             "dark:border-gray-600"
//           );

//           // Store the value for form submission
//           (button as any)._selectedValue = value;
//         } else if (type === "multi-select") {
//           // Multi-select - toggle this button's selection
//           const isSelected = button.classList.contains("bg-blue-500");

//           if (isSelected) {
//             // Deselect
//             button.classList.remove(
//               "bg-blue-500",
//               "text-white",
//               "border-blue-500"
//             );
//             button.classList.add(
//               "bg-white",
//               "dark:bg-gray-700",
//               "text-gray-700",
//               "dark:text-gray-300",
//               "border-gray-300",
//               "dark:border-gray-600"
//             );
//             (button as any)._selectedValue = null;
//           } else {
//             // Select
//             button.classList.add(
//               "bg-blue-500",
//               "text-white",
//               "border-blue-500"
//             );
//             button.classList.remove(
//               "bg-white",
//               "dark:bg-gray-700",
//               "text-gray-700",
//               "dark:text-gray-300",
//               "border-gray-300",
//               "dark:border-gray-600"
//             );
//             (button as any)._selectedValue = value;
//           }
//         }

//         console.log(`Button ${type} selection changed:`, {
//           group,
//           value,
//           selected: button.classList.contains("bg-blue-500"),
//         });

//         // Add visual feedback
//         (button as HTMLElement).style.transform = "scale(1.05)";
//         setTimeout(() => {
//           (button as HTMLElement).style.transform = "";
//         }, 150);
//       });
//     }

//     // Helper method to check if item should be visible based on current status filter
//     isVisibleByStatusFilter(htmlItem: HTMLElement): boolean {
//       // Get current status filter from global projectFilter instance
//       const currentFilter =
//         (window as any).projectFilter?.currentFilter || "all";
//       const projectStatus = htmlItem.dataset.projectStatus;

//       return currentFilter === "all" || projectStatus === currentFilter;
//     }

//     // Helper method to apply status filter to an item
//     applyStatusFilter(htmlItem: HTMLElement): void {
//       if (this.isVisibleByStatusFilter(htmlItem)) {
//         htmlItem.style.display = "block";
//       } else {
//         htmlItem.style.display = "none";
//       }
//     }

//     // Delete project method
//     async deleteProject(projectId: string) {
//       if (
//         !confirm(
//           "Are you sure you want to delete this project? This action cannot be undone."
//         )
//       ) {
//         return;
//       }

//       try {
//         // Show loading state
//         const deleteButton = document.querySelector(
//           `button[onclick*="deleteProject('${projectId}')"]`
//         ) as HTMLButtonElement;
//         if (deleteButton) {
//           deleteButton.disabled = true;
//           deleteButton.innerHTML =
//             '<i class="bx bx-loader-alt bx-spin mr-1"></i>Deleting...';
//         }

//         // Call the delete project API
//         const response = await fetch(`/api/delete-project`, {
//           method: "DELETE",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ projectId }),
//         });

//         if (!response.ok) {
//           throw new Error(`Failed to delete project: ${response.statusText}`);
//         }

//         // Remove the project from the UI
//         const projectElement = document.querySelector(
//           `[data-project-id="${projectId}"]`
//         );
//         if (projectElement) {
//           projectElement.remove();
//         }

//         // Show success notification
//         if ((window as any).globalServices) {
//           (window as any).globalServices.showNotification({
//             type: "success",
//             title: "Project Deleted",
//             message: "Project has been successfully deleted.",
//             duration: 3000,
//           });
//         }

//         // Refresh the projects list by reloading from server
//         await this.loadProjects();
//       } catch (error: unknown) {
//         console.error("Error deleting project:", error);

//         // Show error notification
//         if ((window as any).globalServices) {
//           (window as any).globalServices.showNotification({
//             type: "error",
//             title: "Delete Failed",
//             message:
//               error instanceof Error
//                 ? error.message
//                 : "Failed to delete project. Please try again.",
//             duration: 5000,
//           });
//         }

//         // Reset button state
//         const deleteButton = document.querySelector(
//           `button[onclick*="deleteProject('${projectId}')"]`
//         ) as HTMLButtonElement;
//         if (deleteButton) {
//           deleteButton.disabled = false;
//           deleteButton.innerHTML =
//             '<i class="bx bx-trash mr-1"></i>Delete Project';
//         }
//       }
//     }

//     // Load project files method
//     async loadProjectFiles(projectId: string) {
//       try {
//         const mediaContainer = document.getElementById(
//           `media-links-${projectId}`
//         );
//         if (!mediaContainer) {
//           console.error(`Media container not found for project ${projectId}`);
//           return;
//         }

//         // Show loading state
//         mediaContainer.innerHTML =
//           '<div class="text-xs text-gray-500 dark:text-gray-400 italic">Loading media...</div>';

//         // Call the API to get project files
//         const response = await fetch("/api/get-project-files", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ projectId }),
//         });

//         if (!response.ok) {
//           throw new Error(
//             `Failed to fetch project files: ${response.statusText}`
//           );
//         }

//         const data = await response.json();
//         const files = data.files || [];

//         if (files.length === 0) {
//           mediaContainer.innerHTML =
//             '<div class="text-xs text-gray-500 dark:text-gray-400 italic">No media files attached</div>';
//           return;
//         }

//         // Generate HTML for media links
//         const mediaLinksHTML = files
//           .map((file: any) => {
//             const fileName = file.file_name || file.name || "Unknown file";
//             const fileSize = file.file_size
//               ? this.formatFileSize(file.file_size)
//               : "";
//                     const uploadDate = file.uploaded_at
//               ? this.formatTimestamp(file.uploaded_at)
//               : "";
//             const fileType = file.file_type || "application/pdf";

//             // Determine icon based on file type
//             let iconClass = "bx bx-file-pdf text-red-500";
//             if (fileType.includes("image")) {
//               iconClass = "bx bx-image text-green-500";
//             } else if (
//               fileType.includes("document") ||
//               fileType.includes("word")
//             ) {
//               iconClass = "bx bx-file-doc text-blue-500";
//             } else if (
//               fileType.includes("spreadsheet") ||
//               fileType.includes("excel")
//             ) {
//               iconClass = "bx bx-file-spreadsheet text-green-600";
//             }

//             return `
//             <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border">
//               <div class="flex items-center flex-1 min-w-0">
//                 <i class="${iconClass} mr-2 flex-shrink-0"></i>
//                 <div class="flex-1 min-w-0">
//                   <div class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title="${fileName}">
//                     ${fileName}
//                   </div>
//                   <div class="text-xs text-gray-500 dark:text-gray-400">
//                     ${fileSize}${uploadDate ? ` • ${uploadDate}` : ""}
//                   </div>
//                 </div>
//               </div>
//               <div class="flex items-center gap-2 ml-2">
//                 ${
//                   file.public_url
//                     ? `
//                 <a
//                   href="${file.public_url}"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
//                   title="View file"
//                 >
//                   <i class="bx bx-external-link mr-1"></i>
//                   View
//                 </a>
//                 <a
//                   href="${file.public_url}"
//                   download="${fileName}"
//                   class="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
//                   title="Download file"
//                 >
//                   <i class="bx bx-download mr-1"></i>
//                   Download
//                 </a>
//                 <button
//                   onclick="window.projectsList.deleteMediaFile('${file.id}', '${fileName}', '${projectId}')"
//                   class="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
//                   title="Delete file"
//                 >
//                   <i class="bx bx-trash mr-1"></i>
//                   Delete
//                 </button>
//                 `
//                     : `
//                 <span class="text-xs text-gray-500 dark:text-gray-400 italic">File not accessible</span>
//                 `
//                 }
//               </div>
//             </div>
//           `;
//           })
//           .join("");

//         mediaContainer.innerHTML = mediaLinksHTML;
//       } catch (error) {
//         console.error("Error loading project files:", error);
//         const mediaContainer = document.getElementById(
//           `media-links-${projectId}`
//         );
//         if (mediaContainer) {
//           mediaContainer.innerHTML =
//             '<div class="text-xs text-red-500 dark:text-red-400 italic">Error loading media files</div>';
//         }
//       }
//     }

//     // Helper method to format file size
//     private formatFileSize(bytes: number): string {
//       if (bytes === 0) return "0 Bytes";
//       const k = 1024;
//       const sizes = ["Bytes", "KB", "MB", "GB"];
//       const i = Math.floor(Math.log(bytes) / Math.log(k));
//       return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
//     }

//     // Helper method to format timestamps with timezone
//     private formatTimestamp(timestamp: string): string {
//       // Configure your timezone here - change this to your local timezone
//       const APP_TIMEZONE = "America/New_York"; // Examples: "America/Chicago", "America/Los_Angeles", "Europe/London", etc.

//       const date = new Date(timestamp);
//       const dateStr = date.toLocaleDateString("en-US", {timeZone: APP_TIMEZONE});
//       const timeStr = date.toLocaleTimeString("en-US", {
//         timeZone: APP_TIMEZONE,
//         hour: '2-digit',
//         minute:'2-digit',
//         timeZoneName: 'short'
//       });

//       return `${dateStr} ${timeStr}`;
//     }

//     // Delete media file method
//     async deleteMediaFile(fileId: string, fileName: string, projectId: string) {
//       // Show confirmation dialog
//       const confirmed = confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`);
//       if (!confirmed) {
//         return;
//       }

//       // Find and disable the delete button to prevent double-clicks
//       const deleteButton = document.querySelector(`button[onclick*="${fileId}"]`) as HTMLButtonElement;
//       if (deleteButton) {
//         deleteButton.disabled = true;
//         deleteButton.innerHTML = '<i class="bx bx-loader-alt animate-spin mr-1"></i>Deleting...';
//       }

//       try {
//         // Call delete API
//         const response = await fetch("/api/delete-media-file", {
//           method: "DELETE",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ fileId }),
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.error || `Failed to delete file: ${response.statusText}`);
//         }

//         const result = await response.json();
//         console.log("File deleted successfully:", result);

//         // Refresh the media files list
//         await this.loadProjectFiles(projectId);

//         // Show success notification
//         showNotification({
//           type: "success",
//           title: "File Deleted",
//           message: `"${fileName}" has been deleted successfully.`,
//           duration: 3000,
//         });

//       } catch (error) {
//         console.error("Error deleting media file:", error);

//         // Re-enable the button if there was an error
//         if (deleteButton) {
//           deleteButton.disabled = false;
//           deleteButton.innerHTML = '<i class="bx bx-trash mr-1"></i>Delete';
//         }

//         // Show error notification
//         showNotification({
//           type: "error",
//           title: "Delete Failed",
//           message: `Failed to delete "${fileName}". Please try again.`,
//           duration: 5000,
//         });
//       }
//     }

//     // Load project invoices method
//     async loadProjectInvoices(projectId: string) {
//       try {
//         const invoiceContainer = document.getElementById(
//           `invoice-link-${projectId}`
//         );
//         if (!invoiceContainer) {
//           console.error(`Invoice container not found for project ${projectId}`);
//           return;
//         }

//         // Call the API to get all invoices and filter by project
//         const response = await fetch("/api/list-invoices");
//         if (!response.ok) {
//           throw new Error(`Failed to fetch invoices: ${response.statusText}`);
//         }

//         const data = await response.json();
//         const allInvoices = data.invoices || [];

//         // Filter invoices for this project
//         const projectInvoices = allInvoices.filter(
//           (invoice: any) =>
//             invoice.project_id.toString() === projectId.toString()
//         );

//         if (projectInvoices.length === 0) {
//           invoiceContainer.classList.add("hidden");
//           return;
//         }

//         // Generate HTML for invoice links
//         const invoiceLinksHTML = projectInvoices
//           .map((invoice: any) => {
//             const statusColor =
//               invoice.status === "paid"
//                 ? "bg-green-500"
//                 : invoice.status === "sent"
//                   ? "bg-blue-500"
//                   : "bg-gray-500";

//             return `
//               <a
//                 href="/invoice/${invoice.id}"
//                 target="_blank"
//                 class="inline-flex items-center px-3 py-1 text-xs font-medium text-white ${statusColor} rounded-lg hover:opacity-80 transition-opacity mr-2 mb-2"
//                 title="Invoice ${invoice.invoice_number} - ${invoice.status}"
//               >
//                 <i class="bx bx-receipt mr-1"></i>
//                 ${invoice.invoice_number}
//               </a>
//             `;
//           })
//           .join("");

//         invoiceContainer.innerHTML = invoiceLinksHTML;
//         invoiceContainer.classList.remove("hidden");

//         // Link the Edit Estimate button directly to the latest invoice
//         const projectContainer = document.querySelector(
//           `[data-project-id="${projectId}"]`
//         ) as HTMLElement;
//         const editBtn = projectContainer?.querySelector(
//           '.edit-estimate-btn'
//         ) as HTMLElement | null;
//         if (editBtn) {
//           // sort invoices by created_at descending if present, else use array order
//           const latest = projectInvoices[0];
//           if (latest?.id) {
//             editBtn.addEventListener(
//               "click",
//               (e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 window.location.href = `/invoice/${latest.id}`;
//               },
//               { once: true }
//             );
//           }
//         }
//       } catch (error) {
//         console.error("Error loading project invoices:", error);
//       }
//     }

//     // Media upload methods
//     async handleMediaDrop(event: DragEvent, projectId: string) {
//       event.preventDefault();
//       const files = event.dataTransfer?.files;
//       if (files && files.length > 0) {
//         await this.uploadMediaFiles(Array.from(files), projectId);
//       }
//     }

//     handleMediaDragOver(event: DragEvent) {
//       event.preventDefault();
//       const dropzone = event.currentTarget as HTMLElement;
//       dropzone.classList.add(
//         "border-blue-500",
//         "bg-blue-50",
//         "dark:bg-blue-900/20"
//       );
//     }

//     handleMediaDragLeave(event: DragEvent) {
//       event.preventDefault();
//       const dropzone = event.currentTarget as HTMLElement;
//       dropzone.classList.remove(
//         "border-blue-500",
//         "bg-blue-50",
//         "dark:bg-blue-900/20"
//       );
//     }

//     async handleMediaFileSelect(event: Event, projectId: string) {
//       const input = event.target as HTMLInputElement;
//       const files = input.files;
//       if (files && files.length > 0) {
//         await this.uploadMediaFiles(Array.from(files), projectId);
//         // Reset the input
//         input.value = "";
//       }
//     }

//     async uploadMediaFiles(files: File[], projectId: string) {
//       console.log(
//         `Uploading ${files.length} media files for project ${projectId}`
//       );

//       const progressContainer = document.getElementById(
//         `media-upload-progress-${projectId}`
//       );
//       const progressBar = document.getElementById(
//         `media-upload-bar-${projectId}`
//       );

//       if (progressContainer && progressBar) {
//         progressContainer.classList.remove("hidden");
//       }

//       try {
//         for (let i = 0; i < files.length; i++) {
//           const file = files[i];

//           // Update progress
//           if (progressBar) {
//             const progress = ((i + 1) / files.length) * 100;
//             progressBar.style.width = `${progress}%`;
//           }

//           // Check file size (10MB limit)
//           if (file.size > 10 * 1024 * 1024) {
//             console.warn(
//               `File ${file.name} is too large (${this.formatFileSize(file.size)})`
//             );
//             continue;
//           }

//           // Create FormData for upload
//           const formData = new FormData();
//           formData.append("file", file);
//           formData.append("projectId", projectId);
//           formData.append("fileType", "media");

//           // Upload file
//           const response = await fetch("/api/upload", {
//             method: "POST",
//             body: formData,
//           });

//           if (!response.ok) {
//             throw new Error(
//               `Upload failed for ${file.name}: ${response.statusText}`
//             );
//           }

//           const result = await response.json();
//           console.log(`Uploaded ${file.name}:`, result);
//         }

//         // Hide progress bar
//         if (progressContainer) {
//           progressContainer.classList.add("hidden");
//           progressBar!.style.width = "0%";
//         }

//         // Refresh media files list
//         await this.loadProjectFiles(projectId);

//         // Show success message
//         showNotification({
//           type: "success",
//           title: "Upload Complete",
//           message: `Successfully uploaded ${files.length} file(s)`,
//           duration: 3000,
//         });
//       } catch (error) {
//         console.error("Error uploading media files:", error);

//         // Hide progress bar
//         if (progressContainer) {
//           progressContainer.classList.add("hidden");
//           progressBar!.style.width = "0%";
//         }

//         // Show error message
//         showNotification({
//           type: "error",
//           title: "Upload Failed",
//           message: "Failed to upload one or more files. Please try again.",
//           duration: 5000,
//         });
//       }
//     }

//     // Generate user avatar with Google profile image or fallback
//     private generateUserAvatar(
//       userName: string | null,
//       userId: string | null,
//       avatarUrl: string | null = null
//     ): string {
//       if (!userId) {
//         return '<i class="bx bx-file-blank"></i>';
//       }

//       // For client users, skip avatars entirely to prevent 429 errors
//       if (this.currentUserRole === "Client") {
//         return this.generateInitialsAvatar(userName, userId);
//       }

//       if (avatarUrl) {
//         return `
//           <img
//             src="${avatarUrl}"
//             alt="${userName || "User"} avatar"
//             class="h-full w-full object-cover"
//             loading="lazy"
//             onerror="this.handleAvatarError(this)"
//           />
//           <i class="bx bx-user bx-sm" style="display:none;"></i>
//         `;
//       } else {
//         return this.generateInitialsAvatar(userName, userId);
//       }
//     }

//     // Generate initials-based avatar
//     private generateInitialsAvatar(userName: string | null, userId: string | null): string {
//       if (userName) {
//         // Generate initials from name
//         const initials = userName
//           .split(" ")
//           .map((word) => word.charAt(0).toUpperCase())
//           .join("")
//           .slice(0, 2);

//         const colors = [
//           "bg-blue-500",
//           "bg-green-500",
//           "bg-purple-500",
//           "bg-pink-500",
//           "bg-indigo-500",
//           "bg-yellow-500",
//           "bg-red-500",
//           "bg-teal-500",
//           "bg-orange-500",
//           "bg-cyan-500",
//           "bg-lime-500",
//           "bg-emerald-500",
//         ];

//         const colorIndex = userId
//           ? parseInt(userId.replace(/[^0-9]/g, "")) % colors.length
//           : userName.length % colors.length;
//         const bgColor = colors[colorIndex];

//         return `
//           <div class="w-full h-full flex items-center justify-center ${bgColor} text-white font-semibold text-sm">
//             ${initials}
//           </div>
//         `;
//       } else {
//         // Fallback to user icon with color based on userId
//         const colors = [
//           "bg-blue-500",
//           "bg-green-500",
//           "bg-purple-500",
//           "bg-pink-500",
//           "bg-indigo-500",
//           "bg-yellow-500",
//           "bg-red-500",
//           "bg-teal-500",
//           "bg-orange-500",
//           "bg-cyan-500",
//           "bg-lime-500",
//           "bg-emerald-500",
//         ];

//         const colorIndex = userId
//           ? parseInt(userId.replace(/[^0-9]/g, "")) % colors.length
//           : 0;
//         const bgColor = colors[colorIndex];

//         return `
//           <div class="w-full h-full flex items-center justify-center ${bgColor} text-white">
//             <i class="bx bx-user bx-sm"></i>
//           </div>
//         `;
//       }
//     }

//     // Handle avatar loading errors (prevent 429 rate limiting)
//     handleAvatarError(imgElement: HTMLImageElement) {
//       console.log("Avatar failed to load, falling back to icon");
//       imgElement.style.display = 'none';
//       const fallbackIcon = imgElement.nextElementSibling as HTMLElement;
//       if (fallbackIcon) {
//         fallbackIcon.style.display = 'block';
//       }

//       // Add a class to prevent retrying this avatar
//       imgElement.classList.add('avatar-failed');
//     }

//     // Expose methods globally for external access
//     private exposeGlobalMethods() {
//       // Create global instance
//       (window as any).projectsList = this;

//       // Expose individual methods for backward compatibility
//       (window as any).displayUserProjects = this.displayUserProjects.bind(this);
//       (window as any).loadProject = this.loadProject.bind(this);
//       (window as any).viewProjectDetails = this.viewProjectDetails.bind(this);
//       (window as any).resetProjectForm = this.resetProjectForm.bind(this);
//       (window as any).refreshStaffUsers = this.refreshStaffUsers.bind(this);
//       (window as any).deleteProject = this.deleteProject.bind(this);
//       (window as any).clientEmailHandler = this.clientEmailHandler.bind(this);
//       (window as any).loadProjectFiles = this.loadProjectFiles.bind(this);
//       (window as any).loadProjectInvoices = this.loadProjectInvoices.bind(this);

//       // Expose media upload methods
//       (window as any).handleMediaDrop = this.handleMediaDrop.bind(this);
//       (window as any).handleMediaDragOver = this.handleMediaDragOver.bind(this);
//       (window as any).handleMediaDragLeave =
//         this.handleMediaDragLeave.bind(this);
//       (window as any).handleMediaFileSelect =
//         this.handleMediaFileSelect.bind(this);
//     }

//     // Handle status change notifications
//     async handleStatusChangeNotifications(projectId: string, newStatus: number) {
//       try {
//         console.log(`Checking notifications for project ${projectId}, status ${newStatus}`);

//         // Check who should be notified for this status
//         const notificationResponse = await fetch("/api/check-notifications", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ projectId }),
//         });

//         if (!notificationResponse.ok) {
//           console.error("Failed to check notifications");
//           return;
//         }

//         const notificationData = await notificationResponse.json();
//         console.log("Notification data:", notificationData);

//         if (!notificationData.success || !notificationData.notify || notificationData.notify.length === 0) {
//           console.log("No notifications configured for this status");
//           return;
//         }

//         // Get project details for email content
//         const project = this.projects.find((p: any) => p.id.toString() === projectId);
//         if (!project) {
//           console.error("Project not found");
//           return;
//         }

//         // Get status information
//         const statusLabel = PROJECT_STATUS_LABELS[newStatus as ProjectStatusCode] || `Status ${newStatus}`;
//         const statusData = (window as any).PROJECT_STATUS_DATA?.[newStatus];

//         // Send notifications to each target type
//         for (const target of notificationData.notify) {
//           await this.sendStatusNotification(project, newStatus, statusLabel, statusData, target);
//         }

//       } catch (error) {
//         console.error("Error handling status change notifications:", error);
//       }
//     }

//     // Send notification to specific target (admin, client, staff)
//     async sendStatusNotification(project: any, newStatus: number, statusLabel: string, statusData: any, target: string) {
//       try {
//         let recipients: string[] = [];
//         let recipientType = target;

//         // Determine recipients based on target type
//         if (target === "client") {
//           // Send to project owner/author
//           // Check multiple possible email fields
//           const clientEmail = project.author_email || project.owner_email || project.email;
//           if (clientEmail) {
//             recipients = [clientEmail];
//           } else {
//             console.log("No client email found for project:", {
//               author_email: project.author_email,
//               owner_email: project.owner_email,
//               email: project.email,
//               owner: project.owner,
//               project: project
//             });
//             return;
//           }
//         } else if (target === "admin") {
//           // Send to all admin users
//           const adminUsers = this.staffUsers.filter(user => user.role === "Admin");
//           recipients = adminUsers.map(user => user.email).filter(email => email);
//         } else if (target === "staff") {
//           // Send to project author (creator)
//           if (project.author_id) {
//             const authorStaff = this.staffUsers.find(s => s.id === project.author_id);
//             if (authorStaff && authorStaff.email) {
//               recipients = [authorStaff.email];
//             }
//           }
//         }

//         if (recipients.length === 0) {
//           console.log(`No recipients found for target type: ${target}`);
//           return;
//         }

//         // Use the new sendReactEmail function for styled notifications
//         await (window as any).globalServices.sendReactEmail({
//           to: recipients,
//           type: "project-notification",
//           recipientName: target === "client" ? (project.owner || "Client") : "Team Member",
//           projectTitle: project.title || project.address || `Project ${project.id}`,
//           projectId: project.id.toString(),
//           statusMessage: statusData?.email_content || `Your project status has been updated to "${statusLabel}".`,
//           actionRequired: false,
//           actionUrl: `${window.location.origin}/project/${project.id}/view`,
//           actionText: "View Project",
//         });

//         console.log(`Status notification sent to ${recipients.join(", ")} for ${target}`);

//       } catch (error) {
//         console.error(`Error sending ${target} notification:`, error);

//         // Show error toast
//         showNotification({
//           type: "error",
//           title: "Notification Failed",
//           message: `Failed to send ${target} notification`,
//           duration: 5000,
//         });
//       }
//     }
//   }

//   // Initialize the projects list when DOM is loaded (single instance)
//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", () => {
//       (window as any).projectsList = new ProjectsList();
//     });
//   } else {
//     (window as any).projectsList = new ProjectsList();
//   }
// </script>

// <script>
//   import {
//     PROJECT_STATUS,
//     PROJECT_STATUS_LABELS,
//     loadProjectStatuses,
//     type ProjectStatusCode,
//   } from "../lib/global-services";

//   // Type definitions
//   declare global {
//     interface Window {
//       projectFilter: ProjectFilter;
//     }
//   }

//   class ProjectFilter {
//     private buttonsContainer: HTMLElement | null;
//     public currentFilter: string;

//     constructor() {
//       this.buttonsContainer = document.getElementById("status-filter-buttons");
//       this.currentFilter = "all";

//       this.initializeFilter();
//     }

//     async initializeFilter() {
//       // Load project statuses first
//       await loadProjectStatuses();

//       // Then setup the filter buttons
//       this.setupFilterButtons();
//       this.setupEventListeners();
//     }

//     setupFilterButtons() {
//       if (!this.buttonsContainer) return;

//       // Check if status labels are loaded
//       const statusEntries = Object.entries(PROJECT_STATUS_LABELS);

//       if (statusEntries.length === 0) {
//         // If no status labels loaded, show loading state
//         this.buttonsContainer.innerHTML = `
//           <button
//             data-status="all"
//             data-count="0"
//             class="filter-btn selected px-3 py-2 text-xs font-medium rounded-full border transition-colors relative
//                    bg-blue-500 text-white border-blue-500"
//           >
//             All Projects
//             <span class="ml-1 text-xs opacity-60">all</span>
//           </button>
//           <div class="px-3 py-2 text-xs text-gray-500">
//             Loading status filters...
//           </div>
//         `;
//         return;
//       }

//       // Generate filter buttons for each status
//       const statusButtons = statusEntries
//         .map(
//           ([statusCode, label]) => `
//           <button
//             data-status="${statusCode}"
//             data-count="0"
//             class="filter-btn px-3 py-2 text-xs font-medium rounded-full border transition-colors relative
//                    bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
//                    border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
//           >
//             ${label}
//             <span class="ml-1 text-xs opacity-60">${statusCode}</span>
//           </button>
//         `
//         )
//         .join("");

//       // Insert status buttons after the "All Projects" button
//       this.buttonsContainer.innerHTML = `
//         <button
//           data-status="all"
//           data-count="0"
//           class="filter-btn selected px-3 py-2 text-xs font-medium rounded-full border transition-colors relative
//                  bg-blue-500 text-white border-blue-500"
//         >
//           All Projects
//           <span class="ml-1 text-xs opacity-60">all</span>
//         </button>
//         ${statusButtons}
//       `;
//     }

//     setupEventListeners() {
//       if (!this.buttonsContainer) return;

//       this.buttonsContainer.addEventListener("click", (event: Event) => {
//         const button = (event.target as HTMLElement).closest(
//           ".filter-btn"
//         ) as HTMLButtonElement;
//         if (!button) return;

//         const status = button.dataset.status;
//         if (status) {
//           this.setActiveFilter(status);
//           this.filterProjects(status);
//         }
//            button.scrollIntoView({
//         behavior: "smooth", // Deslizamiento suave
//         block: "nearest", // Mantiene la posición vertical
//         inline: "center", // Centra horizontalmente
//       });
//       });
//     }

//     setActiveFilter(status: string) {
//       // Update visual state of buttons
//       const buttons = this.buttonsContainer?.querySelectorAll(".filter-btn");

//       buttons?.forEach((btn) => {
//         const htmlBtn = btn as HTMLButtonElement;

//         if (htmlBtn.dataset.status === status) {
//           // Selected state
//           htmlBtn.classList.remove(
//             "bg-white",
//             "dark:bg-gray-700",
//             "text-gray-700",
//             "dark:text-gray-300",
//             "border-gray-300",
//             "dark:border-gray-600",
//             "hover:bg-gray-50",
//             "dark:hover:bg-gray-600"
//           );
//           htmlBtn.classList.add(
//             "selected",
//             "bg-blue-500",
//             "text-white",
//             "border-blue-500"
//           );
//         } else {
//           // Unselected state
//           htmlBtn.classList.remove(
//             "selected",
//             "bg-blue-500",
//             "text-white",
//             "border-blue-500"
//           );
//           htmlBtn.classList.add(
//             "bg-white",
//             "dark:bg-gray-700",
//             "text-gray-700",
//             "dark:text-gray-300",
//             "border-gray-300",
//             "dark:border-gray-600",
//             "hover:bg-gray-50",
//             "dark:hover:bg-gray-600"
//           );
//         }
//       });

//       this.currentFilter = status;
//     }

//     filterProjects(status: string) {
//       const projectsList = document.getElementById("projects-list");
//       if (!projectsList) return;

//       const projectItems = projectsList.querySelectorAll(
//         "[data-project-status]"
//       );

//       projectItems.forEach((item) => {
//         const htmlItem = item as HTMLElement;
//         const projectStatus = htmlItem.dataset.projectStatus;

//         if (status === "all" || projectStatus === status) {
//           htmlItem.style.display = "block";
//         } else {
//           htmlItem.style.display = "none";
//         }
//       });

//       // Update visible count
//       this.updateProjectCount();

//       // Re-apply any active search filter to respect the new status filter
//       this.reapplySearchFilter();
//     }

//     updateProjectCount() {
//       const projectsList = document.getElementById("projects-list");
//       if (!projectsList) return;

//       const visibleItems = projectsList.querySelectorAll(
//         '[data-project-status]:not([style*="display: none"])'
//       );
//       const totalItems = projectsList.querySelectorAll("[data-project-status]");

//       // Update count bubbles for each status
//       this.updateCountBubbles();

//       // Create or update count display just after the buttons
//       let countDisplay = document.getElementById("filter-count");
//       if (!countDisplay) {
//         countDisplay = document.createElement("p");
//         countDisplay.id = "filter-count";
//         countDisplay.className = "text-sm text-gray-600 dark:text-gray-400 mt-2";
//         if (this.buttonsContainer && this.buttonsContainer.parentElement) {
//           this.buttonsContainer.parentElement.insertBefore(
//             countDisplay,
//             this.buttonsContainer.nextSibling
//           );
//         }
//       }

//       const filterText =
//         this.currentFilter === "all"
//           ? "All"
//           : PROJECT_STATUS_LABELS[
//               this.currentFilter as unknown as ProjectStatusCode
//             ] || "Unknown";
//       countDisplay.textContent = `Showing ${visibleItems.length} of ${totalItems.length} projects (${filterText})`;
//     }

//     updateCountBubbles() {
//       const projectsList = document.getElementById("projects-list");
//       if (!projectsList || !this.buttonsContainer) return;

//       const allProjects = projectsList.querySelectorAll(
//         "[data-project-status]"
//       );
//       const statusCounts: Record<string, number> = {};

//       // Count projects by status
//       allProjects.forEach((project) => {
//         const htmlProject = project as HTMLElement;
//         const status = htmlProject.dataset.projectStatus || "10";
//         statusCounts[status] = (statusCounts[status] || 0) + 1;
//       });

//       // Update each filter button's data-count attribute
//       const filterButtons =
//         this.buttonsContainer.querySelectorAll(".filter-btn");
//       filterButtons.forEach((button) => {
//         const htmlButton = button as HTMLButtonElement;
//         const status = htmlButton.dataset.status;

//         if (status) {
//           let count = 0;

//           if (status === "all") {
//             // Count all projects for "All Projects" button
//             count = allProjects.length;
//           } else {
//             // Count projects with specific status
//             count = statusCounts[status] || 0;
//           }

//           // Update data-count attribute (CSS will handle showing/hiding)
//           htmlButton.dataset.count = count.toString();
//         }
//       });
//     }

//     show() {}
//     hide() {}

//     reset() {
//       this.setActiveFilter("all");
//       this.filterProjects("all");
//     }

//     // Re-apply any active search filter when status filter changes
//     reapplySearchFilter() {
//               const searchInput = document.getElementById("project-search-input-main") as HTMLInputElement ||
//                            document.getElementById("project-search-input-dynamic") as HTMLInputElement;
//       if (searchInput && searchInput.value.trim() !== "") {
//         // There's an active search, re-apply it with the new status filter
//         const searchTerm = searchInput.value.trim().toLowerCase();
//         (window as any).projectSearchFilter?.filterProjects(searchTerm, "projects-list");
//       }
//     }
//   }

//   // Search Filter Class for Text-based Filtering
//   class ProjectSearchFilter {
//     private searchInputAdmin: HTMLInputElement | null;
//     private searchInputClient: HTMLInputElement | null;
//     private searchInputNew: HTMLInputElement | null;

//     constructor() {
//               this.searchInputAdmin = document.getElementById("project-search-input-main") as HTMLInputElement ||
//                                document.getElementById("project-search-input-dynamic") as HTMLInputElement;
//         this.searchInputClient = document.getElementById("project-search-input-client") as HTMLInputElement;
//               this.searchInputNew = document.getElementById("project-search") as HTMLInputElement; // Dashboard.astro search input
//       this.setupEventListeners();
//     }

//     setupEventListeners() {
//       if (this.searchInputAdmin) {
//         this.setupSearchInput(this.searchInputAdmin, "projects-list");
//       }
//       if (this.searchInputClient) {
//         this.setupSearchInput(this.searchInputClient, "client-projects-container");
//       }
//               // Note: Dashboard.astro search is handled by the global ProjectSearchFilter
//       // and will be set up when the component loads
//     }

//     setupSearchInput(searchInput: HTMLInputElement, containerId: string) {
//       let debounceTimer: ReturnType<typeof setTimeout>;
//       let clearButtonId: string;

//       // Determine clear button ID based on container and search input ID
//       if (containerId === "projects-list") {
//         clearButtonId = searchInput.id === "project-search-input-main" ? "clear-search-btn-main" :
//                        searchInput.id === "project-search-input-dynamic" ? "clear-search-btn-dynamic" : "clear-search-btn-new";
//       } else {
//         clearButtonId = "clear-search-btn-client";
//       }

//       const clearButton = document.getElementById(clearButtonId) as HTMLButtonElement;

//       // Show/hide clear button based on input value
//       const updateClearButton = () => {
//         if (clearButton) {
//           if (searchInput.value.trim() !== "") {
//             clearButton.classList.remove("hidden");
//           } else {
//             clearButton.classList.add("hidden");
//           }
//         }
//       };

//       // Clear button click handler
//       if (clearButton) {
//         clearButton.addEventListener("click", () => {
//           searchInput.value = "";
//           this.filterProjects("", containerId);
//           updateClearButton();
//           searchInput.focus();
//         });
//       }

//       searchInput.addEventListener("input", (e) => {
//         clearTimeout(debounceTimer);

//         debounceTimer = setTimeout(() => {
//           const searchTerm = (e.target as HTMLInputElement).value
//             .trim()
//             .toLowerCase();

//           this.filterProjects(searchTerm, containerId);
//           updateClearButton();
//         }, 300);
//       });

//       // Initial state
//       updateClearButton();
//     }

//     filterProjects(searchTerm: string, containerId: string) {
//       const container = document.getElementById(containerId);
//       if (!container) return;

//       // Look for projects in various possible containers
//       let projectItems: NodeListOf<Element> | Element[] = container.querySelectorAll("[data-project-status]");

//       // If no projects found, try looking in nested accordions or lists
//       if (projectItems.length === 0) {
//         const hasSearchText = container.querySelectorAll("[data-search-text]").length > 0;
//         if (hasSearchText) {
//           projectItems = Array.from(container.querySelectorAll("*")).filter(el => el.closest("[data-search-text]"));
//         } else {
//           projectItems = container.querySelectorAll(".project-item, .accordion-item, [class*='project']");
//         }
//       }

//       let visibleCount = 0;

//       projectItems.forEach((item) => {
//         const htmlItem = item as HTMLElement;

//         if (searchTerm === "") {
//           // When search is empty, restore visibility based on current status filter
//           this.applyStatusFilter(htmlItem);
//           if (htmlItem.style.display !== "none") {
//             visibleCount++;
//           }
//         } else {
//           // First check if item should be visible based on status filter
//           const shouldBeVisibleByStatus = this.isVisibleByStatusFilter(htmlItem);

//           if (!shouldBeVisibleByStatus) {
//             // If hidden by status filter, keep it hidden regardless of search
//             htmlItem.style.display = "none";
//           } else {
//             // Only search within items that pass the status filter
//             let textContent = "";

//             // Try data-search-text elements first
//             const searchTextElements = htmlItem.querySelectorAll("[data-search-text]");
//             if (searchTextElements.length > 0) {
//               searchTextElements.forEach((el) => {
//                 textContent += " " + (el.textContent || "").toLowerCase();
//               });
//             } else {
//               // Fallback to all text content
//               textContent = (htmlItem.textContent || "").toLowerCase();
//             }

//             if (textContent.includes(searchTerm)) {
//               htmlItem.style.display = "block";
//               visibleCount++;
//             } else {
//               htmlItem.style.display = "none";
//             }
//           }
//         }
//       });

//       // Update placeholder with results count
//       const searchInput = containerId === "projects-list" ? this.searchInputAdmin : this.searchInputClient;
//       if (searchInput && searchTerm !== "") {
//         searchInput.placeholder = `Showing ${visibleCount} of ${projectItems.length} projects`;
//       } else if (searchInput) {
//         searchInput.placeholder = "Search your projects...";
//       }

//       console.log(`Search filter applied in ${containerId}: "${searchTerm}" - ${visibleCount}/${projectItems.length} items visible`);
//     }

//     reset() {
//       if (this.searchInputAdmin) {
//         this.searchInputAdmin.value = "";
//         this.filterProjects("", "projects-list");
//       }
//       if (this.searchInputClient) {
//         this.searchInputClient.value = "";
//         this.filterProjects("", "client-projects-container");
//       }
//     }

//     // Helper method to check if item should be visible based on current status filter
//     isVisibleByStatusFilter(htmlItem: HTMLElement): boolean {
//       // Get current status filter from global projectFilter instance
//       const currentFilter = window.projectFilter?.currentFilter || "all";
//       const projectStatus = htmlItem.dataset.projectStatus;

//       return currentFilter === "all" || projectStatus === currentFilter;
//     }

//     // Helper method to apply status filter to an item
//     applyStatusFilter(htmlItem: HTMLElement): void {
//       if (this.isVisibleByStatusFilter(htmlItem)) {
//         htmlItem.style.display = "block";
//       } else {
//         htmlItem.style.display = "none";
//       }
//     }
//   }

//   // Global instances
//   const projectFilter = new ProjectFilter();
//   const projectSearchFilter = new ProjectSearchFilter();

//   // Make them globally accessible
//   window.projectFilter = projectFilter;
//   (window as any).projectSearchFilter = projectSearchFilter;
// </script>

// <script>
//   import {
//     globalServices,
//     PROJECT_STATUS,
//     PROJECT_STATUS_LABELS,
//     sendEmail,
//     sendReactEmail,
//     updateProjectStatus,
//     showNotification,
//     uploadFiles,
//     createTestProject,
//     useGlobalEvents,
//     formatTimeSinceUpdate,
//     type ProjectStatusCode,
//   } from "../lib/global-services";

//   // Current project ID and status - will be set when creating or selecting a project
//   let currentProjectId: string | null = null;
//   let currentProjectStatus: number | null = null;

//   // Set up event logging
//   const eventLog = document.getElementById("event-log")!;
//   const { on } = useGlobalEvents();

//   function logEvent(type: string, data: any) {
//     const timestamp = new Date().toLocaleTimeString();
//     const logEntry = document.createElement("div");
//     logEntry.className = "mb-1 p-2 bg-white dark:bg-gray-800 rounded text-xs";
//     logEntry.innerHTML = `
//       <span class="font-mono text-blue-600 dark:text-blue-400">[${timestamp}]</span>
//       <span class="font-medium">${type}</span>
//       <span class="text-gray-500">:</span>
//       <span>${JSON.stringify(data, null, 2).substring(0, 100)}...</span>
//     `;
//     eventLog.appendChild(logEntry);
//     eventLog.scrollTop = eventLog.scrollHeight;
//   }

//   // Listen to all global events
//   const eventTypes = [
//     "email:sending",
//     "email:sent",
//     "email:error",
//     "project:status-updating",
//     "project:status-updated",
//     "project:status-error",
//     "files:uploading",
//     "files:uploaded",
//     "files:error",
//     "notification:show",
//     "notification:hide",
//   ];

//   eventTypes.forEach((eventType) => {
//     on(eventType, (data) => logEvent(eventType, data));
//   });

//   // Email functions
//   document
//     .getElementById("send-welcome-email")
//     ?.addEventListener("click", async () => {
//       try {
//         await sendEmail({
//           to: "user@example.com",
//           type: "welcome",
//           variables: { name: "John Doe" },
//         });
//       } catch (error) {
//         console.error("Failed to send welcome email:", error);

//         // Show helpful error message
//         showNotification({
//           type: "error",
//           title: "Email Configuration Required",
//           message:
//             "Please configure EMAIL_PROVIDER and EMAIL_API_KEY environment variables. Check the console for details.",
//           duration: 10000,
//         });
//       }
//     });

//   document
//     .getElementById("send-notification-email")
//     ?.addEventListener("click", async () => {
//       try {
//         await sendEmail({
//           to: "user@example.com",
//           type: "notification",
//           variables: {
//             title: "Project Update",
//             message: "Your project status has been updated successfully.",
//           },
//         });
//       } catch (error) {
//         console.error("Failed to send notification email:", error);

//         showNotification({
//           type: "error",
//           title: "Email Configuration Required",
//           message: "Please set up Resend or SendGrid API credentials.",
//           duration: 8000,
//         });
//       }
//     });

//   document
//     .getElementById("send-custom-email")
//     ?.addEventListener("click", async () => {
//       try {
//         await sendEmail({
//           to: "user@example.com",
//           type: "custom",
//           subject: "Custom Email Subject",
//           html: "<h1>Hello!</h1><p>This is a custom email with <strong>HTML content</strong>.</p>",
//           text: "Hello! This is a custom email with plain text content.",
//         });
//       } catch (error) {
//         console.error("Failed to send custom email:", error);

//         showNotification({
//           type: "error",
//           title: "Email Configuration Required",
//           message:
//             "Please configure your email provider in environment variables.",
//           duration: 8000,
//         });
//       }
//     });

//   // React Email functions
//   document
//     .getElementById("send-react-welcome")
//     ?.addEventListener("click", async () => {
//       try {
//         await sendReactEmail({
//           to: "user@example.com",
//           type: "welcome",
//           name: "John Doe",
//           appName: "CAPCo Demo",
//         });
//       } catch (error) {
//         console.error("Failed to send React welcome email:", error);
//         showNotification({
//           type: "error",
//           title: "Email Configuration Required",
//           message:
//             "Please configure EMAIL_PROVIDER and EMAIL_API_KEY environment variables.",
//           duration: 8000,
//         });
//       }
//     });

//   document
//     .getElementById("send-react-notification")
//     ?.addEventListener("click", async () => {
//       try {
//         await sendReactEmail({
//           to: "client@example.com",
//           type: "project-notification",
//           recipientName: "Jane Smith",
//           projectTitle: "Fire Protection System - Building A",
//           projectId: "PROJ-2024-001",
//           statusMessage:
//             "Your project status has been updated to 'In Review'. Please check the latest changes and provide feedback.",
//           actionRequired: true,
//           actionUrl: "https://yourapp.com/projects/123",
//           actionText: "Review Project",
//         });
//       } catch (error) {
//         console.error("Failed to send React project notification:", error);
//         showNotification({
//           type: "error",
//           title: "Email Configuration Required",
//           message: "Please set up Resend or SendGrid API credentials.",
//           duration: 8000,
//         });
//       }
//     });

//   document
//     .getElementById("send-react-test")
//     ?.addEventListener("click", async () => {
//       try {
//         await sendReactEmail({
//           to: "test@example.com",
//           type: "test",
//         });
//       } catch (error) {
//         console.error("Failed to send React test email:", error);
//         showNotification({
//           type: "error",
//           title: "Email Configuration Required",
//           message:
//             "Please configure your email provider in environment variables.",
//           duration: 8000,
//         });
//       }
//     });

//   // Helper function to enable/disable project buttons
//   function updateProjectButtons(projectId: string | null = currentProjectId) {
//     const projectIdSpan = document.getElementById("current-project-id");
//     const statusButtons = document.querySelectorAll(
//       ".status-btn"
//     ) as NodeListOf<HTMLButtonElement>;

//     if (projectId && projectIdSpan) {
//       projectIdSpan.textContent = projectId;
//       statusButtons.forEach((btn) => (btn.disabled = false));
//     } else if (projectIdSpan) {
//       projectIdSpan.textContent = "None";
//       statusButtons.forEach((btn) => (btn.disabled = true));
//     }

//     // Update current status display
//     const statusSpan = document.getElementById("current-project-status");
//     if (statusSpan && currentProjectStatus !== null) {
//       statusSpan.textContent = globalServices.getStatusLabel(
//         currentProjectStatus as any
//       );
//     } else if (statusSpan) {
//       statusSpan.textContent = "-";
//     }
//   }

//   // Create test project function
//   document
//     .getElementById("create-test-project")
//     ?.addEventListener("click", async () => {
//       try {
//         const project = await createTestProject();
//         currentProjectId = project.id.toString();
//         currentProjectStatus = project.status || PROJECT_STATUS.SPECS_RECEIVED;
//         updateProjectButtons();
//         logEvent("project:created", { projectId: project.id });
//       } catch (error) {
//         console.error("Failed to create test project:", error);
//       }
//     });

//   // Project status functions
//   // Unified status change handler
//   async function handleStatusChange(
//     newStatus: number,
//     action: string,
//     label: string
//   ) {
//     if (!currentProjectId) {
//       showNotification({
//         type: "warning",
//         title: "No Project Selected",
//         message: "Please create a test project first.",
//         duration: 3000,
//       });
//       return;
//     }

//     try {
//       // Base update data
//       const updateData: any = {
//         projectId: currentProjectId,
//         status: newStatus,
//         project: {
//           updatedAt: new Date().toISOString(),
//           action: action,
//           previousStatus: currentProjectStatus,
//         },
//       };

//       // Add action-specific data and trigger related processes
//       switch (action) {
//         case "proposal_generation":
//           updateData.project = {
//             ...updateData.project,
//             startedAt: new Date().toISOString(),
//           };
//           // Trigger proposal generation process
//           logEvent(
//             `Starting proposal generation for project ${currentProjectId}`,
//             { action, newStatus }
//           );
//           break;

//         case "proposal_shipped":
//           updateData.project = {
//             ...updateData.project,
//             shippedAt: new Date().toISOString(),
//             shippedBy: "admin@example.com",
//           };
//           // Send email to client about proposal
//           await sendClientNotificationEmail(
//             currentProjectId,
//             "proposal_shipped"
//           );
//           logEvent(`Proposal shipped for project ${currentProjectId}`, {
//             action,
//             newStatus,
//           });
//           break;

//         case "proposal_approved":
//           updateData.project = {
//             ...updateData.project,
//             approvedAt: new Date().toISOString(),
//           };
//           // Send confirmation email
//           await sendClientNotificationEmail(
//             currentProjectId,
//             "proposal_approved"
//           );
//           logEvent(`Proposal approved for project ${currentProjectId}`, {
//             action,
//             newStatus,
//           });
//           break;

//         case "deposit_invoice_generation":
//           updateData.project = {
//             ...updateData.project,
//             invoiceGenerationStarted: new Date().toISOString(),
//           };
//           // Generate deposit invoice
//           await generateInvoice(currentProjectId, "deposit");
//           logEvent(
//             `Generating deposit invoice for project ${currentProjectId}`,
//             { action, newStatus }
//           );
//           break;

//         case "project_complete":
//           updateData.project = {
//             ...updateData.project,
//             completedAt: new Date().toISOString(),
//             finalNotes: "Project completed successfully",
//           };
//           // Send completion emails to both client and admin
//           await sendClientNotificationEmail(
//             currentProjectId,
//             "project_complete"
//           );
//           await sendAdminNotificationEmail(
//             currentProjectId,
//             "project_complete"
//           );
//           logEvent(`Project ${currentProjectId} marked as complete`, {
//             action,
//             newStatus,
//           });
//           break;

//         default:
//           logEvent(`Status updated for project ${currentProjectId}`, {
//             action,
//             newStatus,
//           });
//       }

//       // Update the project status
//       await updateProjectStatus(updateData);

//       // Update current status for UI
//       currentProjectStatus = newStatus;
//       updateProjectButtons();

//       showNotification({
//         type: "success",
//         title: "Status Updated",
//         message: `${label} completed successfully`,
//         duration: 3000,
//       });
//     } catch (error: unknown) {
//       console.error(`Failed to ${action}:`, error);
//       showNotification({
//         type: "error",
//         title: "Status Update Failed",
//         message:
//           (error as Error)?.message || `Failed to ${label.toLowerCase()}`,
//         duration: 5000,
//       });
//     }
//   }

//   // Helper functions for different actions
//   async function sendClientNotificationEmail(
//     projectId: string,
//     eventType: string
//   ) {
//     try {
//       const emailTypes: Record<string, string> = {
//         proposal_shipped: "notification",
//         proposal_approved: "notification",
//         project_complete: "notification",
//       };

//       if (emailTypes[eventType]) {
//         await sendEmail({
//           type: emailTypes[eventType] as any,
//           to: "client@example.com", // Replace with actual client email
//           subject: `Project ${projectId} Update: ${eventType.replace("_", " ")}`,
//           variables: { projectId, eventType },
//         });
//         logEvent(`Client notification email sent`, { projectId, eventType });
//       }
//     } catch (error: unknown) {
//       console.error("Failed to send client email:", error);
//     }
//   }

//   async function sendAdminNotificationEmail(
//     projectId: string,
//     eventType: string
//   ) {
//     try {
//       await sendEmail({
//         type: "notification",
//         to: "admin@example.com",
//         subject: `Admin Notification: Project ${projectId} - ${eventType.replace("_", " ")}`,
//         variables: { projectId, eventType, isAdminNotification: "true" },
//       });
//       logEvent(`Admin notification email sent`, { projectId, eventType });
//     } catch (error) {
//       console.error("Failed to send admin email:", error);
//     }
//   }

//   async function generateInvoice(projectId: string, invoiceType: string) {
//     try {
//       // Mock invoice generation - replace with actual invoice API
//       const invoiceData = {
//         projectId,
//         type: invoiceType,
//         generatedAt: new Date().toISOString(),
//         amount: invoiceType === "deposit" ? 1500 : 3500,
//       };

//       logEvent(`${invoiceType} invoice generated`, invoiceData);

//       showNotification({
//         type: "info",
//         title: "Invoice Generated",
//         message: `${invoiceType} invoice has been generated for project ${projectId}`,
//         duration: 4000,
//       });
//     } catch (error: unknown) {
//       console.error("Failed to generate invoice:", error);
//     }
//   }

//   // Add event listeners to all status buttons
//   document.addEventListener("click", (event) => {
//     const target = event.target as HTMLElement;
//     if (target.classList.contains("status-btn")) {
//       const newStatus = parseInt(target.dataset.newStatus || "0");
//       const action = target.dataset.action || "";
//       const label = target.dataset.label || "";

//       handleStatusChange(newStatus, action, label);
//     }
//   });

//   // Notification functions
//   document.getElementById("show-success")?.addEventListener("click", () => {
//     showNotification({
//       type: "success",
//       title: "Success!",
//       message: "This is a success notification with auto-hide.",
//       duration: 3000,
//     });
//   });

//   document.getElementById("show-error")?.addEventListener("click", () => {
//     showNotification({
//       type: "error",
//       title: "Error Occurred",
//       message:
//         "This is an error notification that stays until manually closed.",
//       duration: 0, // Stays until manually closed
//     });
//   });

//   document.getElementById("show-warning")?.addEventListener("click", () => {
//     showNotification({
//       type: "warning",
//       title: "Warning",
//       message: "This is a warning notification with actions.",
//       duration: 8000,
//       actions: [
//         {
//           label: "Retry",
//           action: () => console.log("Retry clicked"),
//         },
//         {
//           label: "Cancel",
//           action: () => console.log("Cancel clicked"),
//         },
//       ],
//     });
//   });

//   document.getElementById("show-info")?.addEventListener("click", () => {
//     showNotification({
//       type: "info",
//       title: "Information",
//       message: "This is an informational notification.",
//       duration: 5000,
//     });
//   });

//   // File upload functions
//   // document
//   //   .getElementById("upload-files")
//   //   ?.addEventListener("click", async () => {
//   //     const fileInput = document.getElementById(
//   //       "file-upload"
//   //     ) as HTMLInputElement;
//   //     const files = fileInput.files;

//   //     if (!files || files.length === 0) {
//   //       showNotification({
//   //         type: "warning",
//   //         title: "No Files Selected",
//   //         message: "Please select files to upload.",
//   //         duration: 3000,
//   //       });
//   //       return;
//   //     }

//   //     try {
//   //       await uploadFiles(files, currentProjectId || undefined);
//   //       fileInput.value = ""; // Clear the input
//   //     } catch (error) {
//   //       console.error("Failed to upload files:", error);
//   //     }
//   //   });

//   // Projects are now loaded by ProjectsList component automatically
//   // No need to auto-load here to prevent duplicate notifications

//   // Get user projects function
//   document
//     .getElementById("get-user-projects-btn")
//     ?.addEventListener("click", async () => {
//       try {
//         const projects = await globalServices.getUserProjects();
//         displayUserProjects(projects);
//         logEvent("projects:fetched", { count: projects.length });

//         showNotification({
//           type: "success",
//           title: "Projects Loaded",
//           message: `Found ${projects.length} project(s)`,
//           duration: 3000,
//         });
//       } catch (error: unknown) {
//         console.error("Failed to fetch user projects:", error);
//         showNotification({
//           type: "error",
//           title: "Failed to Load Projects",
//           message: (error as Error)?.message || "Could not fetch your projects",
//           duration: 0, // Errors stay until manually dismissed
//         });
//       }
//     });

//   // Function to display user projects in the projects list
//   function displayUserProjects(projects: any[]) {
//     // Delegate to the ProjectsList component
//     if (
//       (window as any).projectsList &&
//       (window as any).projectsList.displayUserProjects
//     ) {
//       (window as any).projectsList.displayUserProjects(projects);
//     } else {
//       console.warn("ProjectsList component not available");
//     }
//   }

//   // Project-related functions now handled by ProjectsList component
//   // These are set up automatically when ProjectsList component initializes

//   // Function to initialize button group functionality
//   function initializeButtonGroups(accordionId: string) {
//     const accordionElement = document.getElementById(accordionId);
//     if (!accordionElement) return;

//     // Handle button group clicks
//     accordionElement.addEventListener("click", (e) => {
//       const button = (e.target as HTMLElement).closest(
//         ".building-type-radio, .consulting-service-btn, .fire-service-radio, .fire-safety-service-btn"
//       );
//       if (!button) return;

//       e.preventDefault();

//       const value = (button as HTMLElement).dataset.value;
//       const group = (button as HTMLElement).dataset.group;
//       const type = (button as HTMLElement).dataset.type;

//       if (!value || !group || !type) return;

//       if (type === "radio") {
//         // Single select - clear all other buttons in this group
//         const groupButtons = accordionElement.querySelectorAll(
//           `[data-group="${group}"]`
//         );
//         groupButtons.forEach((btn) => {
//           btn.classList.remove("bg-blue-500", "text-white", "border-blue-500");
//           btn.classList.add(
//             "bg-white",
//             "dark:bg-gray-700",
//             "text-gray-700",
//             "dark:text-gray-300",
//             "border-gray-300",
//             "dark:border-gray-600"
//           );
//         });

//         // Set this button as selected
//         button.classList.add("bg-blue-500", "text-white", "border-blue-500");
//         button.classList.remove(
//           "bg-white",
//           "dark:bg-gray-700",
//           "text-gray-700",
//           "dark:text-gray-300",
//           "border-gray-300",
//           "dark:border-gray-600"
//         );

//         // Store the value for form submission
//         (button as any)._selectedValue = value;
//       } else if (type === "multi-select") {
//         // Multi-select - toggle this button
//         const isSelected = button.classList.contains("bg-blue-500");

//         if (isSelected) {
//           // Deselect
//           button.classList.remove(
//             "bg-blue-500",
//             "text-white",
//             "border-blue-500"
//           );
//           button.classList.add(
//             "bg-white",
//             "dark:bg-gray-700",
//             "text-gray-700",
//             "dark:text-gray-300",
//             "border-gray-300",
//             "dark:border-gray-600"
//           );
//           (button as any)._selectedValue = null;
//         } else {
//           // Select
//           button.classList.add("bg-blue-500", "text-white", "border-blue-500");
//           button.classList.remove(
//             "bg-white",
//             "dark:bg-gray-700",
//             "text-gray-700",
//             "dark:text-gray-300",
//             "border-gray-300",
//             "dark:border-gray-600"
//           );
//           (button as any)._selectedValue = value;
//         }
//       }
//     });

//     console.log("Initialized button groups for accordion");
//   }

//   // Helper function to convert units value to slider position
//   function getSliderValue(units: number): number {
//     const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50];
//     const index = values.indexOf(units);
//     return index >= 0 ? index : 0;
//   }

//   // resetProjectForm function now handled by ProjectsList component

//   // Function to handle form submission - REMOVED (duplicate of ProjectList.astro)
//   // Form submission is now handled by ProjectList.astro component

//   // Initialize form handlers - REMOVED (handled by ProjectList.astro)

//   // populateFormContainers function now handled by ProjectsList component

//   // Make generateCompleteFormHTML available globally for template use
//   (window as any).generateCompleteFormHTML = function (
//     index: number,
//     projectData: any
//   ) {
//     // Project form fields configuration (inline for template access)
//     const coreFieldsHTML = `
//       <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div class="relative">
//           <label for="address-${index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address / Title *</label>
//           <input type="text" id="address-${index}" name="address" value="${projectData.address || projectData.title || ""}"
//             class="w-full py-2 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//             placeholder="Address / Title *" required>
//         </div>
//         <div class="relative">
//           <label for="owner-${index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner *</label>
//           <input type="text" id="owner-${index}" name="owner" value="${projectData.owner || ""}"
//             class="w-full py-2 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//             placeholder="Owner *" required>
//         </div>
//         <div class="relative">
//           <label for="architect-${index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Architect</label>
//           <input type="text" id="architect-${index}" name="architect" value="${projectData.architect || ""}"
//             class="w-full py-2 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//             placeholder="Architect">
//         </div>
//         <div class="relative">
//           <label for="sq-ft-${index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Square Footage *</label>
//           <input type="number" id="sq-ft-${index}" name="sq_ft" value="${projectData.sq_ft || ""}"
//             class="w-full py-2 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//             placeholder="Gross Square Footage (GFA) *" min="0" max="50000" step="1" required>
//         </div>
//       </div>
//     `;

//     const descriptionHTML = `
//       <div class="relative">
//         <label for="description-${index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
//         <textarea id="description-${index}" name="description" rows="3"
//           class="w-full py-2 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
//           placeholder="Project description...">${projectData.description || ""}</textarea>
//       </div>
//     `;

//     const sliderValue = getSliderValue(projectData.units || 1);
//     const constructionAndUnitsHTML = `
//       <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div>
//           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Construction Type</label>
//           <div class="flex gap-4">
//             <label class="inline-flex items-center cursor-pointer">
//               <input type="checkbox" id="new-construction-${index}" name="new_construction" ${projectData.new_construction ? "checked" : ""} class="sr-only peer">
//               <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
//               <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">New Construction</span>
//             </label>
//           </div>
//         </div>
//         <div>
//           <label for="units-slider-${index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//             Units: <span id="units-value-${index}" class="font-semibold text-blue-600 dark:text-blue-400">${projectData.units || 1}</span>
//           </label>
//           <div class="relative">
//             <input type="range" id="units-slider-${index}" name="units" min="0" max="14" value="${sliderValue}"
//               class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 units-range-slider relative z-10"
//               data-values="1,2,3,4,5,6,7,8,9,10,15,20,30,40,50" data-project-index="${index}">
//             <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
//               <span>1</span><span>5</span><span>10</span><span>30</span><span>50</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     `;

//     // Button groups
//     const buttonGroupsHTML = [
//       {
//         name: "building",
//         label: "Building",
//         type: "radio",
//         cssClass: "building-type-radio",
//         options: [
//           "Residential",
//           "Mixed use",
//           "Mercantile",
//           "Commercial",
//           "Storage",
//           "Warehouse",
//           "Institutional",
//         ],
//       },
//       {
//         name: "project",
//         label: "Project",
//         type: "multi-select",
//         cssClass: "consulting-service-btn",
//         options: [
//           "Sprinkler",
//           "Alarm",
//           "Mechanical",
//           "Electrical",
//           "Plumbing",
//           "Civil engineering",
//           "Other",
//         ],
//       },
//       {
//         name: "service",
//         label: "Supply / Service",
//         type: "radio",
//         cssClass: "fire-service-radio",
//         options: [
//           "Pump & Tank",
//           "2' copper",
//           "4' Ductile",
//           "6' Ductile",
//           "Unknown",
//         ],
//       },
//       {
//         name: "requested_docs",
//         label: "Reports Required",
//         type: "multi-select",
//         cssClass: "fire-safety-service-btn",
//         options: ["Sprinkler", "Alarm", "NFPA 241", "IEBC", "IBC"],
//       },
//     ]
//       .map((group) => {
//         const selectedValues = projectData[group.name]
//           ? Array.isArray(projectData[group.name])
//             ? projectData[group.name]
//             : [projectData[group.name]]
//           : [];

//         return `
//         <div class="space-y-3">
//           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">${group.label}</label>
//           <div class="flex flex-wrap gap-2">
//             ${group.options
//               .map((option) => {
//                 const isSelected = selectedValues.includes(option);
//                 return `
//                 <button type="button"
//                   class="${group.cssClass} px-3 py-2 text-sm rounded-full border transition-colors ${isSelected ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}"
//                   data-value="${option}" data-group="${group.name}" data-type="${group.type}">
//                   ${option}
//                 </button>
//               `;
//               })
//               .join("")}
//           </div>
//         </div>
//       `;
//       })
//       .join("");

//     return (
//       coreFieldsHTML +
//       descriptionHTML +
//       constructionAndUnitsHTML +
//       buttonGroupsHTML
//     );
//   };

//   // Clear log function
//   document.getElementById("clear-log")?.addEventListener("click", () => {
//     eventLog.innerHTML = "<p>Events will appear here...</p>";
//   });

//   // Check email configuration on load
//   async function checkEmailConfiguration() {
//     const configStatus = document.getElementById("config-status");
//     if (!configStatus) return;

//     try {
//       const response = await fetch("/api/send-email");
//       const result = await response.json();

//       if (result.configured && result.verification === "OK") {
//         // Email is properly configured
//         configStatus.className =
//           "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4";
//         configStatus.innerHTML = `
//           <h4 class="font-medium text-green-800 dark:text-green-200 mb-2">
//             ✅ Email Configuration Active
//           </h4>
//           <p class="text-sm text-green-700 dark:text-green-300">
//             Email service is configured and ready. All email functions should work!
//           </p>
//         `;
//       } else {
//         throw new Error("Email not configured");
//       }
//     } catch (error) {
//       // Keep the existing warning banner
//       console.log("Email configuration check failed:", error);
//     }
//   }

//   // PDF Generation Handler
//   function handlePDFGeneration(
//     projectId: string,
//     templateType: string,
//     projectData: any
//   ) {
//     const templateUrl = buildTemplateUrl(templateType, projectId, projectData);

//     // Open template page for signature collection and PDF generation
//     const signatureWindow = window.open(
//       templateUrl,
//       "pdf-signature",
//       "width=1200,height=800,scrollbars=yes,resizable=yes"
//     );

//     if (!signatureWindow) {
//       if ((window as any).globalServices) {
//         (window as any).globalServices.showNotification({
//           type: "error",
//           title: "Popup Blocked",
//           message: "Please allow popups to generate PDF documents.",
//           duration: 0,
//         });
//       }
//       return;
//     }

//     if ((window as any).globalServices) {
//       (window as any).globalServices.showNotification({
//         type: "info",
//         title: "PDF Generation",
//         message:
//           "Please complete signatures in the new window to generate PDF.",
//         duration: 5000,
//       });
//     }
//   }

//   function buildTemplateUrl(
//     templateType: string,
//     projectId: string,
//     projectData: any
//   ) {
//     const baseUrl = new URL(`/pdf/${templateType}`, window.location.origin);

//     if (projectId) {
//       baseUrl.searchParams.set("projectId", projectId);
//     }

//     // Add project data as URL parameters
//     Object.entries(projectData).forEach(([key, value]) => {
//       if (value !== undefined && value !== null) {
//         baseUrl.searchParams.set(key, String(value));
//       }
//     });

//     return baseUrl.toString();
//   }

//   // Initialize configuration check
//   document.addEventListener("DOMContentLoaded", () => {
//     checkEmailConfiguration();

//     // Set up PDF generation event listener
//     document.addEventListener("click", (event) => {
//       const btn = (event.target as HTMLElement)?.closest(
//         ".pdf-generate-btn"
//       ) as HTMLElement;
//       if (btn) {
//         event.preventDefault();
//         const projectId = btn.dataset.projectId || "";
//         const templateType = btn.dataset.templateType || "project-agreement";
//         const projectData = JSON.parse(btn.dataset.projectData || "{}");

//         if (projectId) {
//           handlePDFGeneration(projectId, templateType, projectData);
//         }
//       }
//     });
//   });
// </script>

// <script>
//   // Custom validation tooltip system
//   class ValidationTooltip {
//     constructor() {
//       this.init();
//     }

//     init() {
//       // Disable native validation UI
//       document.addEventListener(
//         "invalid",
//         (e) => {
//           e.preventDefault();
//           this.showTooltip(e.target as HTMLElement);
//         },
//         true
//       );

//       // Hide tooltip on input
//       document.addEventListener(
//         "input",
//         (e) => {
//           this.hideTooltip(e.target as HTMLElement);
//         },
//         true
//       );

//       // Hide tooltip on focus out
//       document.addEventListener(
//         "blur",
//         (e) => {
//           setTimeout(() => this.hideTooltip(e.target as HTMLElement), 100);
//         },
//         true
//       );

//       // Handle form submit
//       document.addEventListener("submit", (e) => {
//         const form = e.target as HTMLFormElement;
//         if (form && typeof form.querySelector === "function") {
//           const firstInvalid = form.querySelector(":invalid") as HTMLElement;
//           if (firstInvalid) {
//             e.preventDefault();
//             this.showTooltip(firstInvalid);
//             firstInvalid.focus();
//           }
//         }
//       });
//     }

//     showTooltip(element: HTMLElement) {
//       // Remove existing tooltip
//       this.hideTooltip(element);

//       // Get validation message
//       const inputElement = element as HTMLInputElement;
//       const message = inputElement.validationMessage;
//       if (!message) return;

//       // Create tooltip
//       const tooltip = document.createElement("div");
//       tooltip.className = "validation-tooltip show";
//       tooltip.textContent = message;
//       tooltip.setAttribute("data-validation-tooltip", "");

//       // Position tooltip relative to element
//       element.style.position = "relative";
//       const parentElement = element.parentNode as HTMLElement;
//       if (parentElement && parentElement.style) {
//         parentElement.style.position = "relative";
//         parentElement.appendChild(tooltip);
//       }

//       // Focus the invalid element
//       element.focus();
//     }

//     hideTooltip(element: HTMLElement) {
//       if (!element || !element.parentNode) return;

//       const parentElement = element.parentNode as HTMLElement;
//       if (parentElement && typeof parentElement.querySelector === "function") {
//         const existingTooltip = parentElement.querySelector(
//           "[data-validation-tooltip]"
//         );
//         if (existingTooltip) {
//           existingTooltip.classList.remove("show");
//           setTimeout(() => {
//             if (existingTooltip.parentNode) {
//               existingTooltip.parentNode.removeChild(existingTooltip);
//             }
//           }, 200);
//         }
//       }
//     }
//   }

//   // Initialize when DOM is ready
//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", () => {
//       new ValidationTooltip();
//     });
//   } else {
//     new ValidationTooltip();
//   }
// </script>
