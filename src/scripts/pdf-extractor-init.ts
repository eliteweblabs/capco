document.addEventListener("DOMContentLoaded", function () {
  const formForPDF = document.querySelector("form[data-project-id]");
  if (formForPDF) {
    const currentRoleForPDF = formForPDF.getAttribute("data-current-role");
    if (currentRoleForPDF === "Admin" || currentRoleForPDF === "Staff") {
      const dropzone = document.getElementById("project-form-pdf-dropzone");
      const dropzoneContainer = document.getElementById("project-form-pdf-dropzone-container");
      const viewerSection = document.getElementById("project-form-pdf-viewer-section");
      const pdfViewer = document.getElementById("project-form-pdf-viewer");
      const selectionHint = document.getElementById("project-form-pdf-selection-hint");
      const formWrapper = document.getElementById("project-form-wrapper");
      const pdfWrapper = document.getElementById("project-form-pdf-wrapper");
      const closeBtn = document.getElementById("project-form-pdf-close-btn");
      const pdfHeader = document.getElementById("project-form-pdf-header");
      const guidedInterface = document.getElementById("project-form-pdf-guided-interface");
      const currentFieldInput = document.getElementById(
        "project-form-pdf-current-field-input"
      ) as HTMLInputElement;
      const setFieldBtn = document.getElementById("project-form-pdf-set-field-btn");

      if (
        !dropzone ||
        !dropzoneContainer ||
        !viewerSection ||
        !pdfViewer ||
        !formWrapper ||
        !pdfWrapper ||
        !closeBtn ||
        !pdfHeader ||
        !guidedInterface ||
        !currentFieldInput ||
        !setFieldBtn
      )
        return;

      let pdfFile: File | null = null;
      let pdfDoc: any = null;
      let currentPage = 1;
      let totalPages = 1;
      let pdfCanvas: HTMLCanvasElement | null = null;
      let pdfOverlay: HTMLCanvasElement | null = null;
      let isSelecting = false;
      let startX = 0,
        startY = 0,
        endX = 0,
        endY = 0;
      let focusedInput: HTMLInputElement | HTMLTextAreaElement | null = null;
      let pageScales: { [key: number]: number } = {};
      let wheelHandler: ((e: WheelEvent) => void) | null = null;
      let wheelHandlerElement: HTMLElement | null = null;
      let scrollAccumulator = 0; // Accumulate scroll distance before changing pages

      // Guided field filling state
      let currentFieldIndex = 0;
      let fieldsToFill: Array<{
        name: string;
        label: string;
        formFieldName: string;
        fieldType?: string;
      }> = [];
      let currentOCRResult: string | null = null;

      // Build fieldsToFill array from form elements with data-scrap attribute
      function buildFieldsToFill() {
        if (!formForPDF) {
          console.warn("Form not found, cannot build fields list");
          return;
        }

        fieldsToFill = [];
        // Only select fields with data-scrap="true" attribute
        const formElements = formForPDF.querySelectorAll("[data-scrap='true']");

        // First, collect address field separately to ensure it's first
        let addressField: {
          name: string;
          label: string;
          formFieldName: string;
          fieldType?: string;
        } | null = null;
        const otherFields: Array<{
          name: string;
          label: string;
          formFieldName: string;
          fieldType?: string;
        }> = [];

        formElements.forEach((element) => {
          const input = element as HTMLInputElement | HTMLTextAreaElement;
          const name = input.name;
          const id = input.id;

          // Skip if no name or already processed
          if (!name || fieldsToFill.some((f) => f.formFieldName === name)) {
            return;
          }

          // For address field (can be hidden input or address-value)
          if (name === "address" || id === "address-value") {
            // Use address as the field name - only add once
            if (!addressField) {
              const fieldData = {
                name: "address",
                label: "Select Address",
                formFieldName: "address",
                fieldType: "input",
              };
              addressField = fieldData;
            }
            return;
          }

          // Get label for this field
          const labelElement =
            formForPDF.querySelector(`label[for="${id}"]`) ||
            formForPDF.querySelector(`label:has([name="${name}"])`);
          let label =
            "Select " + (name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, " $1"));

          if (labelElement) {
            const labelText = labelElement.textContent?.trim();
            if (labelText) {
              // Remove asterisk and clean up
              label = "Select " + labelText.replace(/\s*\*\s*$/, "").trim();
            }
          }

          const fieldData = {
            name: name,
            label: label,
            formFieldName: name,
            fieldType: input.tagName.toLowerCase(),
          };

          otherFields.push(fieldData);
        });

        // Build final array with address first
        if (addressField) {
          fieldsToFill.push(addressField);
        }
        fieldsToFill.push(...otherFields);

        console.log("📋 [PDF-GUIDED] Built fields to fill:", fieldsToFill);
      }

      // Listen for file upload
      dropzone.addEventListener("dropzone-files-selected", (e: any) => {
        const { files } = e.detail;
        if (files && files.length > 0) {
          pdfFile = files[0] as File;
          if (pdfFile) {
            // Hide dropzone and header, show viewer and guided interface
            dropzoneContainer.classList.add("hidden");
            pdfHeader.classList.add("hidden");
            guidedInterface.classList.remove("hidden");

            // Build fields list from form and initialize with first field
            buildFieldsToFill();
            currentFieldIndex = 0;
            initializeCurrentField();

            loadPDF(pdfFile);
          }
        }
      });

      // Handle close button click
      closeBtn.addEventListener("click", () => {
        // Remove wheel event listener
        if (wheelHandler && wheelHandlerElement) {
          wheelHandlerElement.removeEventListener("wheel", wheelHandler);
          wheelHandler = null;
          wheelHandlerElement = null;
        }

        // Clear PDF
        pdfFile = null;
        pdfDoc = null;
        pdfCanvas = null;
        pdfOverlay = null;
        currentPage = 1;
        totalPages = 1;
        pageScales = {};
        focusedInput = null;
        scrollAccumulator = 0;

        // Clear viewer
        if (pdfViewer) {
          pdfViewer.innerHTML =
            '<div class="text-center text-gray-500 dark:text-gray-400 py-8"><p>PDF will appear here</p></div>';
        }

        // Hide viewer, show dropzone and header, hide guided interface
        viewerSection.classList.add("hidden");
        viewerSection.classList.remove("flex", "flex-col", "h-full");
        dropzoneContainer.classList.remove("hidden");
        pdfHeader.classList.remove("hidden");
        guidedInterface.classList.add("hidden");

        // Reset guided interface
        currentFieldIndex = 0;
        currentOCRResult = null;
        if (currentFieldInput) {
          currentFieldInput.value = "";
        }
        if (setFieldBtn) {
          setFieldBtn.classList.add("hidden");
          setFieldBtn.textContent = "Set Address";
        }

        disableSelectionMode();
      });

      dropzone.addEventListener("dropzone-error", (e: any) => {
        const { error } = e.detail;
        console.error("PDF upload error:", error);
        if (window.showNotice) {
          window.showNotice("error", "Upload Error", error);
        }
      });

      // Track focused input fields
      let isSelectingOnPDF = false; // Flag to prevent blur from collapsing during selection

      const formInputs = formForPDF.querySelectorAll(
        "input[type='text'], input[type='number'], textarea"
      );
      formInputs.forEach((input) => {
        input.addEventListener("focus", () => {
          focusedInput = input as HTMLInputElement | HTMLTextAreaElement;
          const inputElement = input as HTMLInputElement | HTMLTextAreaElement;
          console.log("🎯 [PDF-SELECTOR] Input focused:", inputElement.id || inputElement.name, {
            pdfFile: !!pdfFile,
            viewerVisible: viewerSection && !viewerSection.classList.contains("hidden"),
            pdfOverlay: !!pdfOverlay,
          });
          if (pdfFile && viewerSection && !viewerSection.classList.contains("hidden")) {
            // PDF is uploaded and visible - switch to PDF tab
            console.log("📐 [PDF-SELECTOR] Switching to PDF tab...");
            switchToPDFTab();
            if (pdfOverlay) {
              enableSelectionMode();
            }
          } else {
            console.log("📐 [PDF-SELECTOR] Not switching - conditions not met");
          }
        });

        input.addEventListener("blur", (e) => {
          // Don't collapse on blur - PDF stays expanded until form submission or doc deletion
          // Just clear the focused input reference but keep PDF expanded
          if (!isSelectingOnPDF) {
            // Only clear the focused input, but don't collapse
            setTimeout(() => {
              if (focusedInput === input && !isSelectingOnPDF) {
                focusedInput = null;
                disableSelectionMode();
                // PDF area stays expanded
              }
            }, 100);
          }
        });
      });

      function switchToPDFTab() {
        // Switch to PDF tab using Flowbite tabs
        const pdfTabButton = document.getElementById("pdf-tab");
        if (pdfTabButton) {
          pdfTabButton.click();
        }
      }

      function initializeCurrentField() {
        if (!currentFieldInput || !setFieldBtn) return;

        if (currentFieldIndex >= fieldsToFill.length) {
          // All fields filled, could show completion message
          return;
        }

        const currentField = fieldsToFill[currentFieldIndex];
        currentFieldInput.placeholder = currentField.label;
        currentFieldInput.value = "";
        setFieldBtn.classList.add("hidden");
        currentOCRResult = null;

        // Update set button text
        setFieldBtn.textContent = `Set ${currentField.label.replace("Select ", "")}`;

        // Re-enable selection mode for the next field
        setTimeout(() => {
          enableSelectionMode();
        }, 100);
      }

      // Add focus event listener to current field input to enable selection mode
      if (currentFieldInput) {
        currentFieldInput.addEventListener("focus", () => {
          console.log("🎯 [PDF-GUIDED] Current field input focused, enabling selection mode");
          enableSelectionMode();
        });
      }

      function handleSetField() {
        if (
          !currentOCRResult ||
          !formForPDF ||
          !currentFieldInput ||
          !setFieldBtn
        )
          return;

        const currentField = fieldsToFill[currentFieldIndex];

        // Handle address field specially (it uses SlotMachineModal component)
        if (currentField.formFieldName === "address") {
          // Address field uses SlotMachineModal with a hidden input
          const addressHiddenInput = document.getElementById("address-value") as HTMLInputElement;
          const addressFormInput = formForPDF.querySelector(
            'input[name="address"]'
          ) as HTMLInputElement;
          const addressButton = document.getElementById("address") as HTMLElement;

          // Update hidden input (used by SlotMachineModal)
          if (addressHiddenInput) {
            addressHiddenInput.value = currentOCRResult;
            // Trigger both input and change events
            addressHiddenInput.dispatchEvent(new Event("input", { bubbles: true }));
            addressHiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
            // Also set the value attribute directly to trigger MutationObserver
            addressHiddenInput.setAttribute("value", currentOCRResult);
          }

          // Update form input if it exists
          if (addressFormInput) {
            addressFormInput.value = currentOCRResult;
            addressFormInput.dispatchEvent(new Event("input", { bubbles: true }));
            addressFormInput.dispatchEvent(new Event("change", { bubbles: true }));
          }

          // Manually update button text immediately (in case MutationObserver hasn't fired yet)
          if (addressButton) {
            const buttonTextSpan = addressButton.querySelector(".button-text") as HTMLElement;
            if (buttonTextSpan) {
              buttonTextSpan.textContent = currentOCRResult;
              console.log(
                "✅ [PDF-GUIDED] Address button text updated directly:",
                currentOCRResult
              );
            } else {
              // Fallback: find any text span
              const textSpans = Array.from(addressButton.querySelectorAll("span")).filter(
                (span) =>
                  !span.classList.contains("icon") &&
                  !span.className.includes("icon") &&
                  !span.querySelector("svg")
              );
              if (textSpans.length > 0) {
                textSpans[0].textContent = currentOCRResult;
              }
            }
          }

          console.log("✅ [PDF-GUIDED] Address field updated:", currentOCRResult);
        } else {
          // Regular form field
          const formField = formForPDF.querySelector(`[name="${currentField.formFieldName}"]`) as
            | HTMLInputElement
            | HTMLTextAreaElement;

          if (formField) {
            formField.value = currentOCRResult;
            // Trigger input and change events to update form state
            formField.dispatchEvent(new Event("input", { bubbles: true }));
            formField.dispatchEvent(new Event("change", { bubbles: true }));
          } else {
            console.warn(`Field not found: ${currentField.formFieldName}`);
          }
        }

        // Show success feedback
        if (window.showNotice) {
          window.showNotice(
            "success",
            "Field Updated",
            `${currentField.label.replace("Select ", "")} has been updated in the form.`
          );
        }

        // Optionally switch to form tab to show the update (briefly, then back to PDF tab)
        const formTabButton = document.getElementById("form-tab");
        if (formTabButton) {
          // Switch to form tab to show update
          formTabButton.click();

          // After a brief moment, switch back to PDF tab for next field
          setTimeout(() => {
            const pdfTabButton = document.getElementById("pdf-tab");
            if (pdfTabButton && currentFieldIndex < fieldsToFill.length - 1) {
              pdfTabButton.click();
            }
          }, 1500);
        }

        // Move to next field
        currentFieldIndex++;
        if (currentFieldIndex < fieldsToFill.length) {
          // Small delay before initializing next field to allow tab switch
          setTimeout(() => {
            initializeCurrentField();
            // Ensure selection mode is enabled after switching back to PDF tab
            const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
            if (isGuidedMode) {
              enableSelectionMode();
            }
          }, 100);
        } else {
          // All fields filled
          currentFieldInput.placeholder = "All fields completed!";
          currentFieldInput.value = "";
          setFieldBtn.classList.add("hidden");

          if (window.showNotice) {
            window.showNotice(
              "success",
              "All Fields Complete",
              "All form fields have been filled from the PDF."
            );
          }
        }
      }

      // Set button click handler
      if (setFieldBtn) {
        setFieldBtn.addEventListener("click", handleSetField);
      }

      function enableSelectionMode() {
        const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
        if (pdfOverlay && selectionHint) {
          pdfOverlay.style.pointerEvents = "auto";
          pdfOverlay.style.cursor = "crosshair";
          // Show hint only in regular mode, not in guided mode
          if (!isGuidedMode) {
            selectionHint.classList.remove("hidden");
          }
        }
      }

      function disableSelectionMode() {
        if (pdfOverlay && selectionHint) {
          pdfOverlay.style.pointerEvents = "none";
          pdfOverlay.style.cursor = "default";
          selectionHint.classList.add("hidden");
          clearSelection();
        }
      }

      function clearSelection() {
        if (pdfOverlay) {
          const ctx = pdfOverlay.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, pdfOverlay.width, pdfOverlay.height);
          }
        }
        isSelecting = false;
        dashOffset = 0;
        if (selectionAnimationFrame) {
          cancelAnimationFrame(selectionAnimationFrame);
          selectionAnimationFrame = null;
        }
      }

      async function loadPDF(file: File) {
        if (!file || !pdfViewer) return;

        // Show viewer (dropzone should already be hidden)
        viewerSection?.classList.remove("hidden");
        viewerSection?.classList.add("flex", "flex-col", "h-full");
        pdfViewer.innerHTML =
          '<div class="text-center text-gray-500 dark:text-gray-400 py-8"><p>Loading PDF...</p></div>';

        try {
          // Wait for PDF.js to load
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            await loadPDFJS();
          }

          const fileReader = new FileReader();
          fileReader.onload = async function (e: any) {
            try {
              const typedarray = new Uint8Array(e.target.result);
              const loadedPdfjsLib = (window as any).pdfjsLib;
              if (!loadedPdfjsLib) {
                throw new Error("PDF.js library not loaded");
              }
              pdfDoc = await loadedPdfjsLib.getDocument({ data: typedarray }).promise;
              const numPages = pdfDoc.numPages;
              totalPages = numPages;

              // Display first page
              await renderPDFPage(1, numPages);

              // Setup wheel event listener for page navigation
              setupWheelNavigation();
            } catch (error: any) {
              console.error("Error loading PDF:", error);
              if (pdfViewer) {
                pdfViewer.innerHTML = `<div class="text-center text-red-500 py-8"><p>Error: ${error.message}</p></div>`;
              }
            }
          };
          fileReader.readAsArrayBuffer(file);
        } catch (error: any) {
          console.error("Error processing PDF:", error);
          if (pdfViewer) {
            pdfViewer.innerHTML = `<div class="text-center text-red-500 py-8"><p>Error: ${error.message}</p></div>`;
          }
        }
      }

      async function renderPDFPage(pageNum: number, totalPagesParam?: number) {
        if (!pdfDoc || !pdfViewer) return;

        try {
          const page = await pdfDoc.getPage(pageNum);
          currentPage = pageNum;
          if (totalPagesParam) {
            totalPages = totalPagesParam;
          }

          // Calculate scale for maximum resolution
          // Use device pixel ratio for high-DPI displays, and scale up significantly
          const devicePixelRatio = window.devicePixelRatio || 1;
          const maxScale = 3.0; // Maximum scale multiplier for high resolution
          const baseScale = 2.0; // Base high-resolution scale

          // Use the higher of: device pixel ratio * base scale, or max scale
          const highResScale = Math.min(devicePixelRatio * baseScale, maxScale);

          // Get viewport at high resolution
          const viewport = page.getViewport({ scale: highResScale });
          pageScales[pageNum] = highResScale;

          // Calculate display scale to fit container (for CSS sizing)
          const container = pdfViewer;
          // Get actual available width (accounting for padding)
          const containerWidth = container ? Math.max(container.clientWidth - 32, 200) : 400;
          const defaultViewport = page.getViewport({ scale: 1.0 });
          const displayScale = containerWidth / defaultViewport.width;

          // Create page container
          const pageContainer = document.createElement("div");
          pageContainer.className = "relative mb-4 w-full";
          pageContainer.id = `pdf-page-${pageNum}`;

          // Create canvas for PDF at high resolution
          pdfCanvas = document.createElement("canvas");
          pdfCanvas.height = viewport.height;
          pdfCanvas.width = viewport.width;

          // Set CSS size to be fully responsive (but canvas is rendered at high resolution)
          pdfCanvas.style.width = "100%";
          pdfCanvas.style.height = "auto";
          pdfCanvas.style.display = "block";
          pdfCanvas.style.maxWidth = "100%";

          // Store the aspect ratio for responsive resizing
          const aspectRatio = viewport.width / viewport.height;
          pdfCanvas.dataset.aspectRatio = aspectRatio.toString();

          // Enable high-DPI rendering
          const context = pdfCanvas.getContext("2d", { alpha: false });
          if (!context) {
            throw new Error("Could not get canvas context");
          }

          // Scale context for high-DPI displays
          context.scale(1, 1);

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          // Create overlay canvas for selection (match PDF canvas size)
          pdfOverlay = document.createElement("canvas");
          pdfOverlay.height = viewport.height;
          pdfOverlay.width = viewport.width;
          pdfOverlay.style.position = "absolute";
          pdfOverlay.style.top = "0";
          pdfOverlay.style.left = "0";
          pdfOverlay.style.width = "100%";
          pdfOverlay.style.height = "auto";
          pdfOverlay.style.maxWidth = "100%";
          pdfOverlay.style.pointerEvents = "none";
          pdfOverlay.style.cursor = "default";

          // Create wrapper
          const wrapper = document.createElement("div");
          wrapper.className = "relative w-full";
          wrapper.style.position = "relative";
          wrapper.style.width = "100%";
          wrapper.appendChild(pdfCanvas);
          wrapper.appendChild(pdfOverlay);

          pageContainer.appendChild(wrapper);

          // Setup wheel navigation on the wrapper (re-attach on each page render)
          setupWheelNavigationOnElement(wrapper);

          // Add page navigation if multiple pages (below canvas)
          if (totalPages > 1) {
            const navDiv = document.createElement("div");
            navDiv.className =
              "flex items-center justify-between mt-2 text-sm text-gray-600 dark:text-gray-400";
            const prevDisabled = pageNum === 1 ? "disabled" : "";
            const nextDisabled = pageNum === totalPages ? "disabled" : "";
            navDiv.innerHTML = `
            <button id="pdf-prev-page" class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600" ${prevDisabled}>Previous</button>
            <span>Page ${pageNum} of ${totalPages}</span>
            <button id="pdf-next-page" class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600" ${nextDisabled}>Next</button>
          `;
            // Append after wrapper instead of inserting before
            pageContainer.appendChild(navDiv);

            // Navigation handlers
            const prevBtn = navDiv.querySelector("#pdf-prev-page");
            const nextBtn = navDiv.querySelector("#pdf-next-page");
            prevBtn?.addEventListener("click", () => {
              if (currentPage > 1) renderPDFPage(currentPage - 1);
            });
            nextBtn?.addEventListener("click", () => {
              if (currentPage < totalPages) renderPDFPage(currentPage + 1);
            });
          }

          pdfViewer.innerHTML = "";
          pdfViewer.appendChild(pageContainer);

          // Setup overlay event listeners
          setupOverlayListeners();

          // Enable selection mode if in guided interface mode
          const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
          if (isGuidedMode && pdfOverlay) {
            enableSelectionMode();
          }

          // Update navigation buttons state
          updateNavigationButtons();
        } catch (error: any) {
          console.error("Error rendering PDF page:", error);
          pdfViewer.innerHTML = `<div class="text-center text-red-500 py-8"><p>Error rendering page: ${error.message}</p></div>`;
        }
      }

      // Handle window resize for responsive canvas
      let resizeTimeout: number | null = null;
      const handleResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
          // Canvas will automatically resize via CSS (width: 100%)
          // The overlay will also resize automatically
          // No need to re-render, CSS handles the scaling
        }, 250);
      };
      window.addEventListener("resize", handleResize);

      function setupOverlayListeners() {
        if (!pdfOverlay) return;

        pdfOverlay.addEventListener("mousedown", (e: MouseEvent) => {
          // Allow selection if guided interface is active OR if there's a focused input
          const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
          if (
            (!focusedInput && !isGuidedMode) ||
            !pdfOverlay ||
            pdfOverlay.style.pointerEvents !== "auto"
          )
            return;
          isSelecting = true;
          isSelectingOnPDF = true; // Set flag to prevent blur from collapsing
          e.preventDefault(); // Prevent input blur
          const rect = pdfOverlay.getBoundingClientRect();
          startX = e.clientX - rect.left;
          startY = e.clientY - rect.top;
        });

        pdfOverlay.addEventListener("mousemove", (e: MouseEvent) => {
          const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
          if (!isSelecting || (!focusedInput && !isGuidedMode) || !pdfOverlay) return;
          e.preventDefault(); // Prevent text selection
          const rect = pdfOverlay.getBoundingClientRect();
          endX = e.clientX - rect.left;
          endY = e.clientY - rect.top;
          drawSelection();
        });

        let ocrProcessing = false; // Flag to prevent duplicate OCR calls

        pdfOverlay.addEventListener("mouseup", async (e: MouseEvent) => {
          const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");

          // Only process if we were selecting and not already processing
          if (!isSelecting || ocrProcessing) return;

          // Check if we have valid conditions (either focused input or guided mode)
          if (!focusedInput && !isGuidedMode) {
            isSelecting = false;
            return;
          }

          // Ensure we have valid selection coordinates
          if (Math.abs(endX - startX) < 5 && Math.abs(endY - startY) < 5) {
            // Selection too small, might be just a click
            isSelecting = false;
            clearSelection();
            return;
          }

          isSelecting = false;
          ocrProcessing = true; // Set flag to prevent duplicate processing
          e.preventDefault(); // Prevent any default behavior
          e.stopPropagation(); // Stop event from bubbling to document

          // In guided mode, we don't need a focused input - use null
          // In regular mode, capture the focused input at selection time
          const selectedInput = isGuidedMode ? null : focusedInput;

          console.log("🖱️ [PDF-SELECTOR] Mouseup detected on overlay, starting OCR", {
            isGuidedMode,
            hasSelectedInput: !!selectedInput,
            selectionSize: { w: Math.abs(endX - startX), h: Math.abs(endY - startY) },
          });

          // Keep flag set during OCR processing
          await cropAndOCR(selectedInput);

          // Clear processing flag
          ocrProcessing = false;

          // Clear flag after OCR completes
          setTimeout(() => {
            isSelectingOnPDF = false;
            // Re-focus the original input if it still exists (only in regular mode)
            if (
              selectedInput &&
              document.contains(selectedInput) &&
              document.activeElement !== selectedInput
            ) {
              selectedInput.focus();
            }
          }, 100);
        });

        // Handle mouse leave to reset selection state
        pdfOverlay.addEventListener("mouseleave", () => {
          if (isSelecting) {
            isSelecting = false;
            clearSelection();
          }
        });

        // Document-level mouseup listener as fallback (in case mouse is released outside overlay)
        const handleDocumentMouseUp = async (e: MouseEvent) => {
          // Only process if we were selecting, not already processing, and overlay mouseup didn't fire
          if (!isSelecting || ocrProcessing) return;

          const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
          if (!focusedInput && !isGuidedMode) {
            isSelecting = false;
            return;
          }

          // Update end coordinates based on overlay position
          if (pdfOverlay) {
            const rect = pdfOverlay.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Check if mouse is within overlay bounds
            if (
              mouseX >= rect.left &&
              mouseX <= rect.right &&
              mouseY >= rect.top &&
              mouseY <= rect.bottom
            ) {
              endX = mouseX - rect.left;
              endY = mouseY - rect.top;
            }
          }

          // Ensure we have valid selection
          if (Math.abs(endX - startX) < 5 && Math.abs(endY - startY) < 5) {
            isSelecting = false;
            clearSelection();
            return;
          }

          isSelecting = false;
          ocrProcessing = true; // Set flag to prevent duplicate processing
          const selectedInput = isGuidedMode ? null : focusedInput;
          console.log("🖱️ [PDF-SELECTOR] Document mouseup fallback triggered, starting OCR");
          await cropAndOCR(selectedInput);
          ocrProcessing = false; // Clear flag
        };

        // Add document listener when selection starts
        pdfOverlay.addEventListener("mousedown", () => {
          document.addEventListener("mouseup", handleDocumentMouseUp, { once: true });
        });
      }

      function setupWheelNavigation() {
        if (!viewerSection || !pdfViewer || totalPages <= 1) return;
        // This is called once after PDF loads - the actual listener is attached to the wrapper in renderPDFPage
      }

      function setupWheelNavigationOnElement(element: HTMLElement) {
        if (!element || totalPages <= 1) return;

        // Remove existing wheel handler from previous element if any
        if (wheelHandler && wheelHandlerElement) {
          wheelHandlerElement.removeEventListener("wheel", wheelHandler);
          wheelHandlerElement = null;
        }

        // Create new wheel handler if it doesn't exist
        if (!wheelHandler) {
          wheelHandler = (e: WheelEvent) => {
            // Always handle wheel events when cursor is over canvas (for multi-page PDFs)
            // Prevent default scrolling behavior
            e.preventDefault();
            e.stopPropagation();

            // Determine scroll direction and accumulate scroll distance
            const deltaY = e.deltaY;
            const scrollThreshold = 150; // Minimum scroll distance required to change page (increased for less sensitivity)

            // Track scroll direction: positive = down, negative = up
            // Accumulate scroll distance in the current direction
            if (
              (deltaY > 0 && scrollAccumulator >= 0) ||
              (deltaY < 0 && scrollAccumulator <= 0)
            ) {
              // Same direction - accumulate
              scrollAccumulator += deltaY;
            } else {
              // Direction changed - reset and start new accumulation
              scrollAccumulator = deltaY;
            }

            // Only change page if threshold is reached in the current direction
            if (Math.abs(scrollAccumulator) >= scrollThreshold) {
              // Scroll down (positive deltaY) = next page
              // Scroll up (negative deltaY) = previous page
              if (scrollAccumulator > 0 && currentPage < totalPages) {
                // Next page
                scrollAccumulator = 0; // Reset after page change
                renderPDFPage(currentPage + 1);
              } else if (scrollAccumulator < 0 && currentPage > 1) {
                // Previous page
                scrollAccumulator = 0; // Reset after page change
                renderPDFPage(currentPage - 1);
              }
            }
          };
        }

        // Add wheel event listener to the element (wrapper containing canvas)
        element.addEventListener("wheel", wheelHandler, { passive: false });
        wheelHandlerElement = element;
      }

      function updateNavigationButtons() {
        if (totalPages <= 1) return;

        const prevBtn = document.querySelector("#pdf-prev-page") as HTMLButtonElement;
        const nextBtn = document.querySelector("#pdf-next-page") as HTMLButtonElement;
        const pageInfo = document
          .querySelector("#project-form-pdf-viewer")
          ?.querySelector("span");

        if (prevBtn) {
          prevBtn.disabled = currentPage === 1;
        }
        if (nextBtn) {
          nextBtn.disabled = currentPage === totalPages;
        }
        if (pageInfo) {
          pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }
      }

      let selectionAnimationFrame: number | null = null;
      let dashOffset = 0;

      function drawSelection() {
        if (!pdfOverlay) return;
        const ctx = pdfOverlay.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, pdfOverlay.width, pdfOverlay.height);

        const overlayRect = pdfOverlay.getBoundingClientRect();
        const scaleX = pdfOverlay.width / overlayRect.width;
        const scaleY = pdfOverlay.height / overlayRect.height;

        const x = Math.min(startX, endX) * scaleX;
        const y = Math.min(startY, endY) * scaleY;
        const w = Math.abs(endX - startX) * scaleX;
        const h = Math.abs(endY - startY) * scaleY;

        // Animated dashed stroke
        ctx.strokeStyle = "#3b82f6"; // Blue color
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = -dashOffset;
        ctx.strokeRect(x, y, w, h);

        // Fill with semi-transparent blue
        ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
        ctx.fillRect(x, y, w, h);

        // Animate the dash offset
        if (selectionAnimationFrame) {
          cancelAnimationFrame(selectionAnimationFrame);
        }
        selectionAnimationFrame = requestAnimationFrame(() => {
          dashOffset += 2;
          if (dashOffset > 15) dashOffset = 0;
          // Redraw if still selecting
          if (isSelecting) {
            drawSelection();
          }
        });
      }

      // Reconstruct text with line breaks from OCR word positions
      function reconstructTextWithLineBreaks(lines: any[], fallbackText: string): string {
        if (!lines || lines.length === 0) return fallbackText;

        const reconstructedLines: string[] = [];

        for (const line of lines) {
          if (line.Words && Array.isArray(line.Words)) {
            const words = line.Words.map((w: any) => w.WordText || "")
              .filter((w: string) => w.trim())
              .join(" ");

            if (words.trim()) {
              reconstructedLines.push(words);
            }
          }
        }

        // If we have 2 or more lines, add a space at the end of each line (except the last)
        // Then join with newlines, preserving structure
        if (reconstructedLines.length > 1) {
          const linesWithSpaces = reconstructedLines.map((line, index) => {
            // Add space at end of each line except the last one
            return index < reconstructedLines.length - 1 ? line + " " : line;
          });
          return linesWithSpaces.join("\n");
        }

        // Single line or no lines - return as is
        return reconstructedLines.length > 0 ? reconstructedLines.join("\n") : fallbackText;
      }

      // Convert ALL CAPS text to proper capitalization
      function normalizeCapitalization(text: string): string {
        if (!text) return text;

        // Check if text is mostly uppercase (more than 80% uppercase letters)
        const upperCount = (text.match(/[A-Z]/g) || []).length;
        const letterCount = (text.match(/[A-Za-z]/g) || []).length;
        const isAllCaps = letterCount > 0 && upperCount / letterCount > 0.8;

        if (!isAllCaps) return text; // Return as-is if not all caps

        // Convert to title case (capitalize first letter of each word, rest lowercase)
        return text
          .toLowerCase()
          .split(/\b/)
          .map((word, index) => {
            // Don't capitalize common small words unless they're first
            const smallWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in'];
            if (index > 0 && smallWords.includes(word.toLowerCase().trim())) {
              return word.toLowerCase();
            }
            // Capitalize first letter of each word
            if (word.match(/^[a-z]/)) {
              return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
          })
          .join('');
      }

      // Format extracted text based on field type
      function formatExtractedText(
        text: string,
        input: HTMLInputElement | HTMLTextAreaElement | null
      ): string {
        if (!text || !input) return text;

        // First normalize capitalization for ALL CAPS text
        text = normalizeCapitalization(text);

        const fieldName = (input.name || input.id || "").toLowerCase();
        const inputType = input.type?.toLowerCase() || "";
        const isTextarea = input.tagName.toLowerCase() === "textarea";

        // For textarea fields, preserve line breaks
        if (isTextarea) {
          // Clean up excessive whitespace but preserve line breaks
          return text
            .replace(/[ \t]+/g, " ") // Replace multiple spaces/tabs with single space
            .replace(/\n[ \t]+/g, "\n") // Remove leading spaces on new lines
            .replace(/[ \t]+\n/g, "\n") // Remove trailing spaces before newlines
            .replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with double newline
            .replace(/^\s+|\s+$/g, ""); // Trim leading/trailing whitespace
        }

        // For single-line inputs, remove line breaks but preserve other formatting
        // Email field formatting
        if (fieldName.includes("email") || inputType === "email") {
          // Remove line breaks first, then process
          const singleLine = text.replace(/\n/g, " ").replace(/\s+/g, " ");
          // Extract email using regex
          const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
          const emails = singleLine.match(emailRegex);
          if (emails && emails.length > 0) {
            return emails[0].trim();
          }
          // If no email found, try to clean up common OCR errors
          const cleaned = singleLine.replace(/\s+/g, "").replace(/[^\w@.-]/g, "");
          if (cleaned.includes("@") && cleaned.includes(".")) {
            return cleaned;
          }
          return singleLine.trim();
        }

        // Phone field formatting
        if (fieldName.includes("phone") || fieldName.includes("tel")) {
          // Remove line breaks first
          const singleLine = text.replace(/\n/g, " ").replace(/\s+/g, " ");
          // Extract phone numbers
          const phonePatterns = [
            /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
            /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
            /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g,
          ];

          for (const pattern of phonePatterns) {
            const matches = singleLine.match(pattern);
            if (matches && matches.length > 0) {
              // Format as (XXX) XXX-XXXX
              const digits = matches[0].replace(/\D/g, "");
              if (digits.length === 10) {
                return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
              } else if (digits.length === 11 && digits[0] === "1") {
                return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
              }
              return matches[0].trim();
            }
          }
          return singleLine.trim();
        }

        // Date field formatting
        if (
          fieldName.includes("date") ||
          fieldName.includes("commencement") ||
          fieldName.includes("completion")
        ) {
          // Remove line breaks first
          const singleLine = text.replace(/\n/g, " ").replace(/\s+/g, " ");
          // Extract dates
          const datePatterns = [
            /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,
            /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi,
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
            /\b\d{4}[-./]\d{1,2}[-./]\d{1,2}\b/g,
          ];

          for (const pattern of datePatterns) {
            const matches = singleLine.match(pattern);
            if (matches && matches.length > 0) {
              return matches[0].trim();
            }
          }
          return singleLine.trim();
        }

        // Number fields (square footage, etc.)
        if (
          inputType === "number" ||
          fieldName.includes("sqft") ||
          fieldName.includes("sq_ft") ||
          fieldName.includes("square")
        ) {
          // Remove line breaks and extract numbers only
          const singleLine = text.replace(/\n/g, " ");
          const numbers = singleLine.replace(/[^\d]/g, "");
          return numbers || singleLine.trim();
        }

        // Address field
        if (fieldName.includes("address")) {
          // Replace line breaks with spaces, then clean up
          return text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        }

        // Default: for single-line inputs, replace line breaks with spaces
        // For textarea, this shouldn't be reached, but handle it anyway
        if (!isTextarea) {
          return text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        }

        // Fallback for textarea (shouldn't reach here, but preserve line breaks)
        return text.replace(/^\s+|\s+$/g, "");
      }

      // Helper function to compress and resize image for OCR
      function compressImageForOCR(
        canvas: HTMLCanvasElement,
        maxDimension: number = 2000
      ): Promise<Blob> {
        return new Promise((resolve, reject) => {
          const originalWidth = canvas.width;
          const originalHeight = canvas.height;

          // Calculate new dimensions while maintaining aspect ratio
          let newWidth = originalWidth;
          let newHeight = originalHeight;

          if (originalWidth > maxDimension || originalHeight > maxDimension) {
            const ratio = Math.min(maxDimension / originalWidth, maxDimension / originalHeight);
            newWidth = Math.floor(originalWidth * ratio);
            newHeight = Math.floor(originalHeight * ratio);
          }

          // If no resizing needed and dimensions are reasonable, use original
          if (
            newWidth === originalWidth &&
            newHeight === originalHeight &&
            originalWidth * originalHeight < 4000000
          ) {
            // Use JPEG with quality for smaller file size (OCR doesn't need PNG's lossless quality)
            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Failed to create blob"));
              },
              "image/jpeg",
              0.85
            );
            return;
          }

          // Create resized canvas
          const resizedCanvas = document.createElement("canvas");
          resizedCanvas.width = newWidth;
          resizedCanvas.height = newHeight;
          const resizedCtx = resizedCanvas.getContext("2d");

          if (!resizedCtx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Use high-quality image scaling
          resizedCtx.imageSmoothingEnabled = true;
          resizedCtx.imageSmoothingQuality = "high";

          // Draw resized image
          resizedCtx.drawImage(
            canvas,
            0,
            0,
            originalWidth,
            originalHeight,
            0,
            0,
            newWidth,
            newHeight
          );

          // Convert to JPEG blob with quality (smaller than PNG, sufficient for OCR)
          resizedCanvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to create blob"));
            },
            "image/jpeg",
            0.85
          );
        });
      }

      async function cropAndOCR(
        targetInput: HTMLInputElement | HTMLTextAreaElement | null = null
      ) {
        // Use the provided target input, or fall back to current focusedInput
        const inputToUse = targetInput || focusedInput;

        // Check if we're in guided mode (input can be null in guided mode)
        const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");

        // In guided mode, we don't need an input. In regular mode, we do.
        if (!pdfCanvas || !pdfOverlay || (!inputToUse && !isGuidedMode)) {
          console.warn("cropAndOCR: Missing required elements", {
            hasPdfCanvas: !!pdfCanvas,
            hasPdfOverlay: !!pdfOverlay,
            hasInput: !!inputToUse,
            isGuidedMode,
          });
          isSelectingOnPDF = false;
          return;
        }

        // Calculate scale between overlay display size and actual canvas resolution
        const overlayRect = pdfOverlay.getBoundingClientRect();
        const scaleX = pdfCanvas.width / overlayRect.width;
        const scaleY = pdfCanvas.height / overlayRect.height;

        // Convert selection coordinates from overlay display space to canvas pixel space
        const sx = Math.min(startX, endX) * scaleX;
        const sy = Math.min(startY, endY) * scaleY;
        const sw = Math.abs(endX - startX) * scaleX;
        const sh = Math.abs(endY - startY) * scaleY;

        // Ensure minimum size for OCR (at least 10x10 pixels)
        if (sw < 10 || sh < 10) {
          if (window.showNotice) {
            window.showNotice(
              "error",
              "Selection Too Small",
              "Please select a larger area for OCR."
            );
          }
          return;
        }

        // Create temporary canvas for cropped region
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = sw;
        tempCanvas.height = sh;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx || !pdfCanvas) return;
        tempCtx.drawImage(pdfCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

        // Compress and optimize image before OCR (max 2000px dimension, JPEG quality 0.85)
        try {
          const optimizedBlob = await compressImageForOCR(tempCanvas, 2000);

          // Process OCR with optimized image and the captured input reference
          processOCRRequest(optimizedBlob, inputToUse);
        } catch (error: any) {
          console.error("Image compression error:", error);
          // Fallback to original blob if compression fails
          tempCanvas.toBlob((blob) => {
            if (blob) processOCRRequest(blob, inputToUse);
          }, "image/png");
        }
      }

      async function processOCRRequest(
        blob: Blob,
        targetInput: HTMLInputElement | HTMLTextAreaElement | null = null
      ) {
        if (!blob) return;

        // Use the provided target input, or fall back to current focusedInput
        const inputToUse = targetInput || focusedInput;

        // Check if we're in guided mode
        const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");

        // In guided mode, we don't need an input. In regular mode, we do.
        if (!inputToUse && !isGuidedMode) {
          console.warn("No target input available for OCR result and not in guided mode");
          return;
        }

        // If we have an input, verify it still exists in the DOM
        if (inputToUse && !document.contains(inputToUse)) {
          console.warn("Target input no longer exists in DOM");
          return;
        }

        try {
          // Show loading state (only if we have an input, not in guided mode)
          if (
            inputToUse &&
            (inputToUse instanceof HTMLInputElement || inputToUse instanceof HTMLTextAreaElement)
          ) {
            // Store original value and placeholder
            const originalValue = inputToUse.value;
            const originalPlaceholder = inputToUse.placeholder;

            // Set loading state without disabling (disabling can break layout)
            inputToUse.placeholder = "Extracting text...";
            inputToUse.style.opacity = "0.7";
            inputToUse.style.cursor = "wait";

            // Store original values for restoration
            (inputToUse as any).__originalValue = originalValue;
            (inputToUse as any).__originalPlaceholder = originalPlaceholder;
          } else if (isGuidedMode && currentFieldInput) {
            // In guided mode, show loading state on the guided input
            currentFieldInput.placeholder = "Extracting text...";
            currentFieldInput.style.opacity = "0.7";
            currentFieldInput.style.cursor = "wait";
          }

          const formData = new FormData();
          // Use appropriate file extension based on blob type
          const fileExtension = blob.type === "image/jpeg" ? "jpg" : "png";
          formData.append("file", blob, `selection.${fileExtension}`);
          formData.append("language", "eng");
          formData.append("isOverlayRequired", "true"); // Get line structure for better line break detection
          formData.append("OCREngine", "2");
          formData.append("detectOrientation", "true"); // Better for preserving structure

          const response = await fetch("https://api.ocr.space/parse/image", {
            method: "POST",
            headers: {
              apikey: "K81932338788957",
            },
            body: formData,
          });

          const data = await response.json();

          if (data.IsErroredOnProcessing) {
            throw new Error(data.ErrorMessage || "OCR processing failed");
          }

          if (data.ParsedResults && data.ParsedResults[0] && data.ParsedResults[0].ParsedText) {
            let extractedText = data.ParsedResults[0].ParsedText;

            // Preserve line breaks from OCR - OCR.space preserves line breaks in ParsedText
            // Only trim leading/trailing whitespace, preserve internal line breaks
            extractedText = extractedText.replace(/^\s+|\s+$/g, "");

            // If we have WordsOverlay data, use it to better detect line breaks
            const result = data.ParsedResults[0];
            if (result.WordsOverlay && result.WordsOverlay.Lines) {
              // Reconstruct text with proper line breaks from word positions
              extractedText = reconstructTextWithLineBreaks(
                result.WordsOverlay.Lines,
                extractedText
              );
            } else {
              // If no WordsOverlay, process ParsedText directly
              // Add space at end of each line when there are 2+ lines
              const lines = extractedText.split("\n");
              if (lines.length > 1) {
                extractedText = lines
                  .map((line: string, index: number) => {
                    // Add space at end of each line except the last one
                    return index < lines.length - 1 ? line.trim() + " " : line.trim();
                  })
                  .join("\n");
              }
            }

            // Check if we're using guided interface
            if (guidedInterface && !guidedInterface.classList.contains("hidden")) {
              // Normalize capitalization for ALL CAPS text
              extractedText = normalizeCapitalization(extractedText);
              
              // Populate the guided interface input (always overwrite)
              currentOCRResult = extractedText;
              if (currentFieldInput) {
                currentFieldInput.value = extractedText;
                // Trigger input event for any listeners
                currentFieldInput.dispatchEvent(new Event("input", { bubbles: true }));
              }
              if (setFieldBtn) {
                setFieldBtn.classList.remove("hidden");
              }

              // Clear selection
              clearSelection();
              
              // Keep selection mode enabled for re-selection if needed
              setTimeout(() => {
                enableSelectionMode();
              }, 200);

              // Show success feedback
              if (window.showNotice) {
                window.showNotice(
                  "success",
                  "Text Extracted",
                  `Text extracted. Click "Set ${fieldsToFill[currentFieldIndex]?.label.replace("Select ", "")}" to apply it, or select again to replace.`
                );
              }
            } else {
              // Original behavior: populate form field directly
              // Format text based on field type (preserves line breaks for textarea)
              extractedText = formatExtractedText(extractedText, inputToUse);

              // Verify input still exists before populating
              if (!document.contains(inputToUse)) {
                console.warn("Target input removed from DOM before OCR completed");
                return;
              }

              // Populate the target input
              if (
                inputToUse instanceof HTMLInputElement ||
                inputToUse instanceof HTMLTextAreaElement
              ) {
                // Restore original styling
                inputToUse.style.opacity = "1";
                inputToUse.style.cursor = "";

                // Restore placeholder if no text was extracted
                if (extractedText) {
                  inputToUse.value = extractedText;
                  if ((inputToUse as any).__originalPlaceholder) {
                    inputToUse.placeholder = (inputToUse as any).__originalPlaceholder;
                  }
                } else {
                  // Restore original value if extraction failed
                  if ((inputToUse as any).__originalValue !== undefined) {
                    inputToUse.value = (inputToUse as any).__originalValue;
                  }
                  if ((inputToUse as any).__originalPlaceholder) {
                    inputToUse.placeholder = (inputToUse as any).__originalPlaceholder;
                  }
                }

                // Clean up stored values
                delete (inputToUse as any).__originalValue;
                delete (inputToUse as any).__originalPlaceholder;

                // Trigger input event for form validation
                inputToUse.dispatchEvent(new Event("input", { bubbles: true }));
                inputToUse.dispatchEvent(new Event("change", { bubbles: true }));
              }

              // Clear selection
              clearSelection();

              // Check if we're in guided mode
              const isGuidedMode =
                guidedInterface && !guidedInterface.classList.contains("hidden");

              // In guided mode, keep selection enabled for next field
              // In regular mode, disable selection
              if (isGuidedMode) {
                // Re-enable selection mode after a brief delay for next field
                setTimeout(() => {
                  enableSelectionMode();
                }, 200);
              } else {
                disableSelectionMode();
              }

              // Show success feedback
              if (window.showNotice) {
                window.showNotice(
                  "success",
                  "Text Extracted",
                  `Extracted text has been filled into the field.`
                );
              }
            }
          } else {
            throw new Error("No text found in selected region");
          }
        } catch (error: any) {
          console.error("OCR error:", error);

          // Check if we're in guided mode
          const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");

          // Verify input still exists before restoring
          if (inputToUse && document.contains(inputToUse)) {
            if (
              inputToUse instanceof HTMLInputElement ||
              inputToUse instanceof HTMLTextAreaElement
            ) {
              // Restore original styling and value
              inputToUse.style.opacity = "1";
              inputToUse.style.cursor = "";

              // Restore original value if stored
              if ((inputToUse as any).__originalValue !== undefined) {
                inputToUse.value = (inputToUse as any).__originalValue;
              } else {
                inputToUse.value = "";
              }

              // Restore placeholder
              if ((inputToUse as any).__originalPlaceholder) {
                inputToUse.placeholder = (inputToUse as any).__originalPlaceholder;
              }

              // Clean up stored values
              delete (inputToUse as any).__originalValue;
              delete (inputToUse as any).__originalPlaceholder;
            }
          } else if (isGuidedMode && currentFieldInput) {
            // In guided mode, restore the guided input
            currentFieldInput.style.opacity = "1";
            currentFieldInput.style.cursor = "";
            const currentField = fieldsToFill[currentFieldIndex];
            currentFieldInput.placeholder = currentField ? currentField.label : "Select text from PDF...";

            // Re-enable selection mode for retry
            setTimeout(() => {
              enableSelectionMode();
            }, 200);
          }

          if (window.showNotice) {
            window.showNotice("error", "OCR Error", error.message || "Failed to extract text");
          }
        } finally {
          isSelectingOnPDF = false;
        }
      }

      async function loadPDFJS() {
        return new Promise((resolve) => {
          const pdfjsLib = (window as any).pdfjsLib;
          if (pdfjsLib) {
            resolve(pdfjsLib);
            return;
          }

          // Load PDF.js if not already loaded
          const script = document.createElement("script");
          script.src = "/js/pdf.min.js";
          script.onload = () => {
            const workerScript = document.createElement("script");
            workerScript.src = "/js/pdf.worker.min.js";
            workerScript.defer = true;
            document.head.appendChild(workerScript);

            const loadedPdfjsLib = (window as any).pdfjsLib;
            if (loadedPdfjsLib) {
              loadedPdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.js";
            }
            resolve(loadedPdfjsLib);
          };
          document.head.appendChild(script);
        });
      }
    }
  }
  });
