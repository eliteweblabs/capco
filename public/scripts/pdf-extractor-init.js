(() => {
  // src/scripts/pdf-extractor-init.ts
  document.addEventListener("DOMContentLoaded", function() {
    const formForPDF = document.querySelector("form[data-project-id]");
    if (formForPDF) {
      const currentRoleForPDF = formForPDF.getAttribute("data-current-role");
      if (currentRoleForPDF === "Admin" || currentRoleForPDF === "Staff") {
        let buildFieldsToFill = function() {
          if (!formForPDF) {
            console.warn("Form not found, cannot build fields list");
            return;
          }
          fieldsToFill = [];
          const formElements = formForPDF.querySelectorAll("[data-scrap='true']");
          let addressField = null;
          const otherFields = [];
          formElements.forEach((element) => {
            const input = element;
            const name = input.name;
            const id = input.id;
            if (!name || fieldsToFill.some((f) => f.formFieldName === name)) {
              return;
            }
            if (name === "address" || id === "address-value") {
              if (!addressField) {
                const fieldData2 = {
                  name: "address",
                  label: "Select Address",
                  formFieldName: "address",
                  fieldType: "input"
                };
                addressField = fieldData2;
              }
              return;
            }
            const labelElement = formForPDF.querySelector(`label[for="${id}"]`) || formForPDF.querySelector(`label:has([name="${name}"])`);
            let label = "Select " + (name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, " $1"));
            if (labelElement) {
              const labelText = labelElement.textContent?.trim();
              if (labelText) {
                label = "Select " + labelText.replace(/\s*\*\s*$/, "").trim();
              }
            }
            const fieldData = {
              name,
              label,
              formFieldName: name,
              fieldType: input.tagName.toLowerCase()
            };
            otherFields.push(fieldData);
          });
          if (addressField) {
            fieldsToFill.push(addressField);
          }
          fieldsToFill.push(...otherFields);
          console.log("\u{1F4CB} [PDF-GUIDED] Built fields to fill:", fieldsToFill);
        }, switchToPDFTab = function() {
          const pdfTabButton = document.getElementById("pdf-tab");
          if (pdfTabButton) {
            pdfTabButton.click();
          }
        }, initializeCurrentField = function() {
          if (!currentFieldInput || !setFieldBtn) return;
          if (currentFieldIndex >= fieldsToFill.length) {
            return;
          }
          const currentField = fieldsToFill[currentFieldIndex];
          currentFieldInput.placeholder = currentField.label;
          currentFieldInput.value = "";
          setFieldBtn.classList.add("hidden");
          currentOCRResult = null;
          setFieldBtn.textContent = `Set ${currentField.label.replace("Select ", "")}`;
          setTimeout(() => {
            enableSelectionMode();
          }, 100);
        }, handleSetField = function() {
          if (!currentOCRResult || !formForPDF || !currentFieldInput || !setFieldBtn)
            return;
          const currentField = fieldsToFill[currentFieldIndex];
          if (currentField.formFieldName === "address") {
            const addressHiddenInput = document.getElementById("address-value");
            const addressFormInput = formForPDF.querySelector(
              'input[name="address"]'
            );
            const addressButton = document.getElementById("address");
            if (addressHiddenInput) {
              addressHiddenInput.value = currentOCRResult;
              addressHiddenInput.dispatchEvent(new Event("input", { bubbles: true }));
              addressHiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
              addressHiddenInput.setAttribute("value", currentOCRResult);
            }
            if (addressFormInput) {
              addressFormInput.value = currentOCRResult;
              addressFormInput.dispatchEvent(new Event("input", { bubbles: true }));
              addressFormInput.dispatchEvent(new Event("change", { bubbles: true }));
            }
            if (addressButton) {
              const buttonTextSpan = addressButton.querySelector(".button-text");
              if (buttonTextSpan) {
                buttonTextSpan.textContent = currentOCRResult;
                console.log(
                  "\u2705 [PDF-GUIDED] Address button text updated directly:",
                  currentOCRResult
                );
              } else {
                const textSpans = Array.from(addressButton.querySelectorAll("span")).filter(
                  (span) => !span.classList.contains("icon") && !span.className.includes("icon") && !span.querySelector("svg")
                );
                if (textSpans.length > 0) {
                  textSpans[0].textContent = currentOCRResult;
                }
              }
            }
            console.log("\u2705 [PDF-GUIDED] Address field updated:", currentOCRResult);
          } else {
            const formField = formForPDF.querySelector(`[name="${currentField.formFieldName}"]`);
            if (formField) {
              formField.value = currentOCRResult;
              formField.dispatchEvent(new Event("input", { bubbles: true }));
              formField.dispatchEvent(new Event("change", { bubbles: true }));
            } else {
              console.warn(`Field not found: ${currentField.formFieldName}`);
            }
          }
          if (window.showNotice) {
            window.showNotice(
              "success",
              "Field Updated",
              `${currentField.label.replace("Select ", "")} has been updated in the form.`
            );
          }
          const formTabButton = document.getElementById("form-tab");
          if (formTabButton) {
            formTabButton.click();
            setTimeout(() => {
              const pdfTabButton = document.getElementById("pdf-tab");
              if (pdfTabButton && currentFieldIndex < fieldsToFill.length - 1) {
                pdfTabButton.click();
              }
            }, 1500);
          }
          currentFieldIndex++;
          if (currentFieldIndex < fieldsToFill.length) {
            setTimeout(() => {
              initializeCurrentField();
              const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
              if (isGuidedMode) {
                enableSelectionMode();
              }
            }, 100);
          } else {
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
        }, enableSelectionMode = function() {
          const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
          if (pdfOverlay && selectionHint) {
            pdfOverlay.style.pointerEvents = "auto";
            pdfOverlay.style.cursor = "crosshair";
            if (!isGuidedMode) {
              selectionHint.classList.remove("hidden");
            }
          }
        }, disableSelectionMode = function() {
          if (pdfOverlay && selectionHint) {
            pdfOverlay.style.pointerEvents = "none";
            pdfOverlay.style.cursor = "default";
            selectionHint.classList.add("hidden");
            clearSelection();
          }
        }, clearSelection = function() {
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
        }, setupOverlayListeners = function() {
          if (!pdfOverlay) return;
          pdfOverlay.addEventListener("mousedown", (e) => {
            const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
            if (!focusedInput && !isGuidedMode || !pdfOverlay || pdfOverlay.style.pointerEvents !== "auto")
              return;
            isSelecting = true;
            isSelectingOnPDF = true;
            e.preventDefault();
            const rect = pdfOverlay.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
          });
          pdfOverlay.addEventListener("mousemove", (e) => {
            const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
            if (!isSelecting || !focusedInput && !isGuidedMode || !pdfOverlay) return;
            e.preventDefault();
            const rect = pdfOverlay.getBoundingClientRect();
            endX = e.clientX - rect.left;
            endY = e.clientY - rect.top;
            drawSelection();
          });
          let ocrProcessing = false;
          pdfOverlay.addEventListener("mouseup", async (e) => {
            const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
            if (!isSelecting || ocrProcessing) return;
            if (!focusedInput && !isGuidedMode) {
              isSelecting = false;
              return;
            }
            if (Math.abs(endX - startX) < 5 && Math.abs(endY - startY) < 5) {
              isSelecting = false;
              clearSelection();
              return;
            }
            isSelecting = false;
            ocrProcessing = true;
            e.preventDefault();
            e.stopPropagation();
            const selectedInput = isGuidedMode ? null : focusedInput;
            console.log("\u{1F5B1}\uFE0F [PDF-SELECTOR] Mouseup detected on overlay, starting OCR", {
              isGuidedMode,
              hasSelectedInput: !!selectedInput,
              selectionSize: { w: Math.abs(endX - startX), h: Math.abs(endY - startY) }
            });
            await cropAndOCR(selectedInput);
            ocrProcessing = false;
            setTimeout(() => {
              isSelectingOnPDF = false;
              if (selectedInput && document.contains(selectedInput) && document.activeElement !== selectedInput) {
                selectedInput.focus();
              }
            }, 100);
          });
          pdfOverlay.addEventListener("mouseleave", () => {
            if (isSelecting) {
              isSelecting = false;
              clearSelection();
            }
          });
          const handleDocumentMouseUp = async (e) => {
            if (!isSelecting || ocrProcessing) return;
            const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
            if (!focusedInput && !isGuidedMode) {
              isSelecting = false;
              return;
            }
            if (pdfOverlay) {
              const rect = pdfOverlay.getBoundingClientRect();
              const mouseX = e.clientX;
              const mouseY = e.clientY;
              if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) {
                endX = mouseX - rect.left;
                endY = mouseY - rect.top;
              }
            }
            if (Math.abs(endX - startX) < 5 && Math.abs(endY - startY) < 5) {
              isSelecting = false;
              clearSelection();
              return;
            }
            isSelecting = false;
            ocrProcessing = true;
            const selectedInput = isGuidedMode ? null : focusedInput;
            console.log("\u{1F5B1}\uFE0F [PDF-SELECTOR] Document mouseup fallback triggered, starting OCR");
            await cropAndOCR(selectedInput);
            ocrProcessing = false;
          };
          pdfOverlay.addEventListener("mousedown", () => {
            document.addEventListener("mouseup", handleDocumentMouseUp, { once: true });
          });
        }, setupWheelNavigation = function() {
          if (!viewerSection || !pdfViewer || totalPages <= 1) return;
        }, setupWheelNavigationOnElement = function(element) {
          if (!element || totalPages <= 1) return;
          if (wheelHandler && wheelHandlerElement) {
            wheelHandlerElement.removeEventListener("wheel", wheelHandler);
            wheelHandlerElement = null;
          }
          if (!wheelHandler) {
            wheelHandler = (e) => {
              e.preventDefault();
              e.stopPropagation();
              const deltaY = e.deltaY;
              const scrollThreshold = 150;
              if (deltaY > 0 && scrollAccumulator >= 0 || deltaY < 0 && scrollAccumulator <= 0) {
                scrollAccumulator += deltaY;
              } else {
                scrollAccumulator = deltaY;
              }
              if (Math.abs(scrollAccumulator) >= scrollThreshold) {
                if (scrollAccumulator > 0 && currentPage < totalPages) {
                  scrollAccumulator = 0;
                  renderPDFPage(currentPage + 1);
                } else if (scrollAccumulator < 0 && currentPage > 1) {
                  scrollAccumulator = 0;
                  renderPDFPage(currentPage - 1);
                }
              }
            };
          }
          element.addEventListener("wheel", wheelHandler, { passive: false });
          wheelHandlerElement = element;
        }, updateNavigationButtons = function() {
          if (totalPages <= 1) return;
          const prevBtn = document.querySelector("#pdf-prev-page");
          const nextBtn = document.querySelector("#pdf-next-page");
          const pageInfo = document.querySelector("#project-form-pdf-viewer")?.querySelector("span");
          if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
          }
          if (nextBtn) {
            nextBtn.disabled = currentPage === totalPages;
          }
          if (pageInfo) {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
          }
        }, drawSelection = function() {
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
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 5]);
          ctx.lineDashOffset = -dashOffset;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
          ctx.fillRect(x, y, w, h);
          if (selectionAnimationFrame) {
            cancelAnimationFrame(selectionAnimationFrame);
          }
          selectionAnimationFrame = requestAnimationFrame(() => {
            dashOffset += 2;
            if (dashOffset > 15) dashOffset = 0;
            if (isSelecting) {
              drawSelection();
            }
          });
        }, reconstructTextWithLineBreaks = function(lines, fallbackText) {
          if (!lines || lines.length === 0) return fallbackText;
          const reconstructedLines = [];
          for (const line of lines) {
            if (line.Words && Array.isArray(line.Words)) {
              const words = line.Words.map((w) => w.WordText || "").filter((w) => w.trim()).join(" ");
              if (words.trim()) {
                reconstructedLines.push(words);
              }
            }
          }
          if (reconstructedLines.length > 1) {
            const linesWithSpaces = reconstructedLines.map((line, index) => {
              return index < reconstructedLines.length - 1 ? line + " " : line;
            });
            return linesWithSpaces.join("\n");
          }
          return reconstructedLines.length > 0 ? reconstructedLines.join("\n") : fallbackText;
        }, normalizeCapitalization = function(text) {
          if (!text) return text;
          const upperCount = (text.match(/[A-Z]/g) || []).length;
          const letterCount = (text.match(/[A-Za-z]/g) || []).length;
          const isAllCaps = letterCount > 0 && upperCount / letterCount > 0.8;
          if (!isAllCaps) return text;
          return text.toLowerCase().split(/\b/).map((word, index) => {
            const smallWords = ["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "from", "by", "of", "in"];
            if (index > 0 && smallWords.includes(word.toLowerCase().trim())) {
              return word.toLowerCase();
            }
            if (word.match(/^[a-z]/)) {
              return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
          }).join("");
        }, formatExtractedText = function(text, input) {
          if (!text || !input) return text;
          text = normalizeCapitalization(text);
          const fieldName = (input.name || input.id || "").toLowerCase();
          const inputType = input.type?.toLowerCase() || "";
          const isTextarea = input.tagName.toLowerCase() === "textarea";
          if (isTextarea) {
            return text.replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/^\s+|\s+$/g, "");
          }
          if (fieldName.includes("email") || inputType === "email") {
            const singleLine = text.replace(/\n/g, " ").replace(/\s+/g, " ");
            const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            const emails = singleLine.match(emailRegex);
            if (emails && emails.length > 0) {
              return emails[0].trim();
            }
            const cleaned = singleLine.replace(/\s+/g, "").replace(/[^\w@.-]/g, "");
            if (cleaned.includes("@") && cleaned.includes(".")) {
              return cleaned;
            }
            return singleLine.trim();
          }
          if (fieldName.includes("phone") || fieldName.includes("tel")) {
            const singleLine = text.replace(/\n/g, " ").replace(/\s+/g, " ");
            const phonePatterns = [
              /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
              /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
              /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g
            ];
            for (const pattern of phonePatterns) {
              const matches = singleLine.match(pattern);
              if (matches && matches.length > 0) {
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
          if (fieldName.includes("date") || fieldName.includes("commencement") || fieldName.includes("completion")) {
            const singleLine = text.replace(/\n/g, " ").replace(/\s+/g, " ");
            const datePatterns = [
              /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,
              /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi,
              /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
              /\b\d{4}[-./]\d{1,2}[-./]\d{1,2}\b/g
            ];
            for (const pattern of datePatterns) {
              const matches = singleLine.match(pattern);
              if (matches && matches.length > 0) {
                return matches[0].trim();
              }
            }
            return singleLine.trim();
          }
          if (inputType === "number" || fieldName.includes("sqft") || fieldName.includes("sq_ft") || fieldName.includes("square")) {
            const singleLine = text.replace(/\n/g, " ");
            const numbers = singleLine.replace(/[^\d]/g, "");
            return numbers || singleLine.trim();
          }
          if (fieldName.includes("address")) {
            return text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
          }
          if (!isTextarea) {
            return text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
          }
          return text.replace(/^\s+|\s+$/g, "");
        }, compressImageForOCR = function(canvas, maxDimension = 2e3) {
          return new Promise((resolve, reject) => {
            const originalWidth = canvas.width;
            const originalHeight = canvas.height;
            let newWidth = originalWidth;
            let newHeight = originalHeight;
            if (originalWidth > maxDimension || originalHeight > maxDimension) {
              const ratio = Math.min(maxDimension / originalWidth, maxDimension / originalHeight);
              newWidth = Math.floor(originalWidth * ratio);
              newHeight = Math.floor(originalHeight * ratio);
            }
            if (newWidth === originalWidth && newHeight === originalHeight && originalWidth * originalHeight < 4e6) {
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
            const resizedCanvas = document.createElement("canvas");
            resizedCanvas.width = newWidth;
            resizedCanvas.height = newHeight;
            const resizedCtx = resizedCanvas.getContext("2d");
            if (!resizedCtx) {
              reject(new Error("Could not get canvas context"));
              return;
            }
            resizedCtx.imageSmoothingEnabled = true;
            resizedCtx.imageSmoothingQuality = "high";
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
            resizedCanvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Failed to create blob"));
              },
              "image/jpeg",
              0.85
            );
          });
        };
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
        );
        const setFieldBtn = document.getElementById("project-form-pdf-set-field-btn");
        if (!dropzone || !dropzoneContainer || !viewerSection || !pdfViewer || !formWrapper || !pdfWrapper || !closeBtn || !pdfHeader || !guidedInterface || !currentFieldInput || !setFieldBtn)
          return;
        let pdfFile = null;
        let pdfDoc = null;
        let currentPage = 1;
        let totalPages = 1;
        let pdfCanvas = null;
        let pdfOverlay = null;
        let isSelecting = false;
        let startX = 0, startY = 0, endX = 0, endY = 0;
        let focusedInput = null;
        let pageScales = {};
        let wheelHandler = null;
        let wheelHandlerElement = null;
        let scrollAccumulator = 0;
        let currentFieldIndex = 0;
        let fieldsToFill = [];
        let currentOCRResult = null;
        dropzone.addEventListener("dropzone-files-selected", (e) => {
          const { files } = e.detail;
          if (files && files.length > 0) {
            pdfFile = files[0];
            if (pdfFile) {
              dropzoneContainer.classList.add("hidden");
              pdfHeader.classList.add("hidden");
              guidedInterface.classList.remove("hidden");
              buildFieldsToFill();
              currentFieldIndex = 0;
              initializeCurrentField();
              loadPDF(pdfFile);
            }
          }
        });
        closeBtn.addEventListener("click", () => {
          if (wheelHandler && wheelHandlerElement) {
            wheelHandlerElement.removeEventListener("wheel", wheelHandler);
            wheelHandler = null;
            wheelHandlerElement = null;
          }
          pdfFile = null;
          pdfDoc = null;
          pdfCanvas = null;
          pdfOverlay = null;
          currentPage = 1;
          totalPages = 1;
          pageScales = {};
          focusedInput = null;
          scrollAccumulator = 0;
          if (pdfViewer) {
            pdfViewer.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-8"><p>PDF will appear here</p></div>';
          }
          viewerSection.classList.add("hidden");
          viewerSection.classList.remove("flex", "flex-col", "h-full");
          dropzoneContainer.classList.remove("hidden");
          pdfHeader.classList.remove("hidden");
          guidedInterface.classList.add("hidden");
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
        dropzone.addEventListener("dropzone-error", (e) => {
          const { error } = e.detail;
          console.error("PDF upload error:", error);
          if (window.showNotice) {
            window.showNotice("error", "Upload Error", error);
          }
        });
        let isSelectingOnPDF = false;
        const formInputs = formForPDF.querySelectorAll(
          "input[type='text'], input[type='number'], textarea"
        );
        formInputs.forEach((input) => {
          input.addEventListener("focus", () => {
            focusedInput = input;
            const inputElement = input;
            console.log("\u{1F3AF} [PDF-SELECTOR] Input focused:", inputElement.id || inputElement.name, {
              pdfFile: !!pdfFile,
              viewerVisible: viewerSection && !viewerSection.classList.contains("hidden"),
              pdfOverlay: !!pdfOverlay
            });
            if (pdfFile && viewerSection && !viewerSection.classList.contains("hidden")) {
              console.log("\u{1F4D0} [PDF-SELECTOR] Switching to PDF tab...");
              switchToPDFTab();
              if (pdfOverlay) {
                enableSelectionMode();
              }
            } else {
              console.log("\u{1F4D0} [PDF-SELECTOR] Not switching - conditions not met");
            }
          });
          input.addEventListener("blur", (e) => {
            if (!isSelectingOnPDF) {
              setTimeout(() => {
                if (focusedInput === input && !isSelectingOnPDF) {
                  focusedInput = null;
                  disableSelectionMode();
                }
              }, 100);
            }
          });
        });
        if (currentFieldInput) {
          currentFieldInput.addEventListener("focus", () => {
            console.log("\u{1F3AF} [PDF-GUIDED] Current field input focused, enabling selection mode");
            enableSelectionMode();
          });
        }
        if (setFieldBtn) {
          setFieldBtn.addEventListener("click", handleSetField);
        }
        async function loadPDF(file) {
          if (!file || !pdfViewer) return;
          viewerSection?.classList.remove("hidden");
          viewerSection?.classList.add("flex", "flex-col", "h-full");
          pdfViewer.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-8"><p>Loading PDF...</p></div>';
          try {
            const pdfjsLib = window.pdfjsLib;
            if (!pdfjsLib) {
              await loadPDFJS();
            }
            const fileReader = new FileReader();
            fileReader.onload = async function(e) {
              try {
                const typedarray = new Uint8Array(e.target.result);
                const loadedPdfjsLib = window.pdfjsLib;
                if (!loadedPdfjsLib) {
                  throw new Error("PDF.js library not loaded");
                }
                pdfDoc = await loadedPdfjsLib.getDocument({ data: typedarray }).promise;
                const numPages = pdfDoc.numPages;
                totalPages = numPages;
                await renderPDFPage(1, numPages);
                setupWheelNavigation();
              } catch (error) {
                console.error("Error loading PDF:", error);
                if (pdfViewer) {
                  pdfViewer.innerHTML = `<div class="text-center text-red-500 py-8"><p>Error: ${error.message}</p></div>`;
                }
              }
            };
            fileReader.readAsArrayBuffer(file);
          } catch (error) {
            console.error("Error processing PDF:", error);
            if (pdfViewer) {
              pdfViewer.innerHTML = `<div class="text-center text-red-500 py-8"><p>Error: ${error.message}</p></div>`;
            }
          }
        }
        async function renderPDFPage(pageNum, totalPagesParam) {
          if (!pdfDoc || !pdfViewer) return;
          try {
            const page = await pdfDoc.getPage(pageNum);
            currentPage = pageNum;
            if (totalPagesParam) {
              totalPages = totalPagesParam;
            }
            const devicePixelRatio = window.devicePixelRatio || 1;
            const maxScale = 3;
            const baseScale = 2;
            const highResScale = Math.min(devicePixelRatio * baseScale, maxScale);
            const viewport = page.getViewport({ scale: highResScale });
            pageScales[pageNum] = highResScale;
            const container = pdfViewer;
            const containerWidth = container ? Math.max(container.clientWidth - 32, 200) : 400;
            const defaultViewport = page.getViewport({ scale: 1 });
            const displayScale = containerWidth / defaultViewport.width;
            const pageContainer = document.createElement("div");
            pageContainer.className = "relative mb-4 w-full";
            pageContainer.id = `pdf-page-${pageNum}`;
            pdfCanvas = document.createElement("canvas");
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;
            pdfCanvas.style.width = "100%";
            pdfCanvas.style.height = "auto";
            pdfCanvas.style.display = "block";
            pdfCanvas.style.maxWidth = "100%";
            const aspectRatio = viewport.width / viewport.height;
            pdfCanvas.dataset.aspectRatio = aspectRatio.toString();
            const context = pdfCanvas.getContext("2d", { alpha: false });
            if (!context) {
              throw new Error("Could not get canvas context");
            }
            context.scale(1, 1);
            await page.render({
              canvasContext: context,
              viewport
            }).promise;
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
            const wrapper = document.createElement("div");
            wrapper.className = "relative w-full";
            wrapper.style.position = "relative";
            wrapper.style.width = "100%";
            wrapper.appendChild(pdfCanvas);
            wrapper.appendChild(pdfOverlay);
            pageContainer.appendChild(wrapper);
            setupWheelNavigationOnElement(wrapper);
            if (totalPages > 1) {
              const navDiv = document.createElement("div");
              navDiv.className = "flex items-center justify-between mt-2 text-sm text-gray-600 dark:text-gray-400";
              const prevDisabled = pageNum === 1 ? "disabled" : "";
              const nextDisabled = pageNum === totalPages ? "disabled" : "";
              navDiv.innerHTML = `
            <button id="pdf-prev-page" class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600" ${prevDisabled}>Previous</button>
            <span>Page ${pageNum} of ${totalPages}</span>
            <button id="pdf-next-page" class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600" ${nextDisabled}>Next</button>
          `;
              pageContainer.appendChild(navDiv);
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
            setupOverlayListeners();
            const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
            if (isGuidedMode && pdfOverlay) {
              enableSelectionMode();
            }
            updateNavigationButtons();
          } catch (error) {
            console.error("Error rendering PDF page:", error);
            pdfViewer.innerHTML = `<div class="text-center text-red-500 py-8"><p>Error rendering page: ${error.message}</p></div>`;
          }
        }
        let resizeTimeout = null;
        const handleResize = () => {
          if (resizeTimeout) clearTimeout(resizeTimeout);
          resizeTimeout = window.setTimeout(() => {
          }, 250);
        };
        window.addEventListener("resize", handleResize);
        let selectionAnimationFrame = null;
        let dashOffset = 0;
        async function cropAndOCR(targetInput = null) {
          const inputToUse = targetInput || focusedInput;
          const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
          if (!pdfCanvas || !pdfOverlay || !inputToUse && !isGuidedMode) {
            console.warn("cropAndOCR: Missing required elements", {
              hasPdfCanvas: !!pdfCanvas,
              hasPdfOverlay: !!pdfOverlay,
              hasInput: !!inputToUse,
              isGuidedMode
            });
            isSelectingOnPDF = false;
            return;
          }
          const overlayRect = pdfOverlay.getBoundingClientRect();
          const scaleX = pdfCanvas.width / overlayRect.width;
          const scaleY = pdfCanvas.height / overlayRect.height;
          const sx = Math.min(startX, endX) * scaleX;
          const sy = Math.min(startY, endY) * scaleY;
          const sw = Math.abs(endX - startX) * scaleX;
          const sh = Math.abs(endY - startY) * scaleY;
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
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = sw;
          tempCanvas.height = sh;
          const tempCtx = tempCanvas.getContext("2d");
          if (!tempCtx || !pdfCanvas) return;
          tempCtx.drawImage(pdfCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
          try {
            const optimizedBlob = await compressImageForOCR(tempCanvas, 2e3);
            processOCRRequest(optimizedBlob, inputToUse);
          } catch (error) {
            console.error("Image compression error:", error);
            tempCanvas.toBlob((blob) => {
              if (blob) processOCRRequest(blob, inputToUse);
            }, "image/png");
          }
        }
        async function processOCRRequest(blob, targetInput = null) {
          if (!blob) return;
          const inputToUse = targetInput || focusedInput;
          const isGuidedMode = guidedInterface && !guidedInterface.classList.contains("hidden");
          if (!inputToUse && !isGuidedMode) {
            console.warn("No target input available for OCR result and not in guided mode");
            return;
          }
          if (inputToUse && !document.contains(inputToUse)) {
            console.warn("Target input no longer exists in DOM");
            return;
          }
          try {
            if (inputToUse && (inputToUse instanceof HTMLInputElement || inputToUse instanceof HTMLTextAreaElement)) {
              const originalValue = inputToUse.value;
              const originalPlaceholder = inputToUse.placeholder;
              inputToUse.placeholder = "Extracting text...";
              inputToUse.style.opacity = "0.7";
              inputToUse.style.cursor = "wait";
              inputToUse.__originalValue = originalValue;
              inputToUse.__originalPlaceholder = originalPlaceholder;
            } else if (isGuidedMode && currentFieldInput) {
              currentFieldInput.placeholder = "Extracting text...";
              currentFieldInput.style.opacity = "0.7";
              currentFieldInput.style.cursor = "wait";
            }
            const formData = new FormData();
            const fileExtension = blob.type === "image/jpeg" ? "jpg" : "png";
            formData.append("file", blob, `selection.${fileExtension}`);
            formData.append("language", "eng");
            formData.append("isOverlayRequired", "true");
            formData.append("OCREngine", "2");
            formData.append("detectOrientation", "true");
            const response = await fetch("https://api.ocr.space/parse/image", {
              method: "POST",
              headers: {
                apikey: "K81932338788957"
              },
              body: formData
            });
            const data = await response.json();
            if (data.IsErroredOnProcessing) {
              throw new Error(data.ErrorMessage || "OCR processing failed");
            }
            if (data.ParsedResults && data.ParsedResults[0] && data.ParsedResults[0].ParsedText) {
              let extractedText = data.ParsedResults[0].ParsedText;
              extractedText = extractedText.replace(/^\s+|\s+$/g, "");
              const result = data.ParsedResults[0];
              if (result.WordsOverlay && result.WordsOverlay.Lines) {
                extractedText = reconstructTextWithLineBreaks(
                  result.WordsOverlay.Lines,
                  extractedText
                );
              } else {
                const lines = extractedText.split("\n");
                if (lines.length > 1) {
                  extractedText = lines.map((line, index) => {
                    return index < lines.length - 1 ? line.trim() + " " : line.trim();
                  }).join("\n");
                }
              }
              if (guidedInterface && !guidedInterface.classList.contains("hidden")) {
                extractedText = normalizeCapitalization(extractedText);
                currentOCRResult = extractedText;
                if (currentFieldInput) {
                  currentFieldInput.value = extractedText;
                  currentFieldInput.dispatchEvent(new Event("input", { bubbles: true }));
                }
                if (setFieldBtn) {
                  setFieldBtn.classList.remove("hidden");
                }
                clearSelection();
                setTimeout(() => {
                  enableSelectionMode();
                }, 200);
                if (window.showNotice) {
                  window.showNotice(
                    "success",
                    "Text Extracted",
                    `Text extracted. Click "Set ${fieldsToFill[currentFieldIndex]?.label.replace("Select ", "")}" to apply it, or select again to replace.`
                  );
                }
              } else {
                extractedText = formatExtractedText(extractedText, inputToUse);
                if (!document.contains(inputToUse)) {
                  console.warn("Target input removed from DOM before OCR completed");
                  return;
                }
                if (inputToUse instanceof HTMLInputElement || inputToUse instanceof HTMLTextAreaElement) {
                  inputToUse.style.opacity = "1";
                  inputToUse.style.cursor = "";
                  if (extractedText) {
                    inputToUse.value = extractedText;
                    if (inputToUse.__originalPlaceholder) {
                      inputToUse.placeholder = inputToUse.__originalPlaceholder;
                    }
                  } else {
                    if (inputToUse.__originalValue !== void 0) {
                      inputToUse.value = inputToUse.__originalValue;
                    }
                    if (inputToUse.__originalPlaceholder) {
                      inputToUse.placeholder = inputToUse.__originalPlaceholder;
                    }
                  }
                  delete inputToUse.__originalValue;
                  delete inputToUse.__originalPlaceholder;
                  inputToUse.dispatchEvent(new Event("input", { bubbles: true }));
                  inputToUse.dispatchEvent(new Event("change", { bubbles: true }));
                }
                clearSelection();
                const isGuidedMode2 = guidedInterface && !guidedInterface.classList.contains("hidden");
                if (isGuidedMode2) {
                  setTimeout(() => {
                    enableSelectionMode();
                  }, 200);
                } else {
                  disableSelectionMode();
                }
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
          } catch (error) {
            console.error("OCR error:", error);
            const isGuidedMode2 = guidedInterface && !guidedInterface.classList.contains("hidden");
            if (inputToUse && document.contains(inputToUse)) {
              if (inputToUse instanceof HTMLInputElement || inputToUse instanceof HTMLTextAreaElement) {
                inputToUse.style.opacity = "1";
                inputToUse.style.cursor = "";
                if (inputToUse.__originalValue !== void 0) {
                  inputToUse.value = inputToUse.__originalValue;
                } else {
                  inputToUse.value = "";
                }
                if (inputToUse.__originalPlaceholder) {
                  inputToUse.placeholder = inputToUse.__originalPlaceholder;
                }
                delete inputToUse.__originalValue;
                delete inputToUse.__originalPlaceholder;
              }
            } else if (isGuidedMode2 && currentFieldInput) {
              currentFieldInput.style.opacity = "1";
              currentFieldInput.style.cursor = "";
              const currentField = fieldsToFill[currentFieldIndex];
              currentFieldInput.placeholder = currentField ? currentField.label : "Select text from PDF...";
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
            const pdfjsLib = window.pdfjsLib;
            if (pdfjsLib) {
              resolve(pdfjsLib);
              return;
            }
            const script = document.createElement("script");
            script.src = "/js/pdf.min.js";
            script.onload = () => {
              const workerScript = document.createElement("script");
              workerScript.src = "/js/pdf.worker.min.js";
              workerScript.defer = true;
              document.head.appendChild(workerScript);
              const loadedPdfjsLib = window.pdfjsLib;
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
})();
