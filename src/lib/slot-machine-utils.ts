/**
 * Utility functions for the Slot Machine Picker component
 */

export interface SlotMachineOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SlotMachineConfig {
  id: string;
  title: string;
  options: SlotMachineOption[];
  selectedValue?: string;
  placeholder?: string;
  onSelect?: (value: string, label: string, pickerId: string) => void;
}

/**
 * Show a slot machine picker modal
 */
export function showSlotMachinePicker(
  config: SlotMachineConfig
): Promise<{ value: string; label: string }> {
  return new Promise((resolve) => {
    // Create modal container
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = `
      <div id="${config.id}-modal" class="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" role="dialog" aria-modal="true">
        <div class="modal-content relative">
          <div id="${config.id}-slot-machine" class="slot-machine-picker">
            <div class="slot-machine-header">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${config.title}</h3>
              <button id="${config.id}-close-btn" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close picker">
                <i class="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div class="slot-machine-container">
              <div id="${config.id}-wheel" class="slot-machine-wheel" data-selected-index="${Math.floor(config.options.length / 2)}">
                ${config.options
                  .map(
                    (option, index) => `
                  <div class="slot-machine-item ${option.disabled ? "disabled" : ""} ${option.value === config.selectedValue ? "selected" : ""}" 
                       data-value="${option.value}" data-index="${index}">
                    ${option.label}
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
            
            <div class="slot-machine-footer">
              <button id="${config.id}-cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button id="${config.id}-confirm-btn" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                Select
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .slot-machine-picker {
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        max-width: 24rem;
        margin: 0 auto;
        height: 400px;
        display: flex;
        flex-direction: column;
      }

      .dark .slot-machine-picker {
        background: #1f2937;
      }

      .slot-machine-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .dark .slot-machine-header {
        border-bottom-color: #374151;
      }

      .slot-machine-container {
        flex: 1;
        position: relative;
        overflow: hidden;
        height: 280px;
        min-height: 280px;
      }


      .slot-machine-wheel {
        position: absolute;
        inset: 0;
        overflow-y: auto;
        scroll-behavior: smooth;
        scrollbar-width: none;
        -ms-overflow-style: none;
        height: 100%;
        max-height: 280px;
        padding: 140px 0;
        box-sizing: border-box;
      }

      .slot-machine-wheel::-webkit-scrollbar {
        display: none;
      }

      .slot-machine-item {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 3rem;
        text-align: center;
        color: #111827;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 48px;
        padding: 12px 16px;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      .dark .slot-machine-item {
        color: white;
      }

      .slot-machine-item:hover {
        background: #f9fafb;
      }

      .dark .slot-machine-item:hover {
        background: #374151;
      }

      .slot-machine-item.selected {
        background: #dbeafe;
        color: #1d4ed8;
        border-radius: 8px;
        margin: 0 8px;
        position: relative;
      }

      .dark .slot-machine-item.selected {
        background: rgba(59, 130, 246, 0.1);
        color: #60a5fa;
      }

      .slot-machine-item.selected::after {
        content: "✓";
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-weight: bold;
        font-size: 16px;
      }

      .slot-machine-item.disabled {
        color: #9ca3af;
        cursor: not-allowed;
      }

      .dark .slot-machine-item.disabled {
        color: #6b7280;
      }

      .slot-machine-item.disabled:hover {
        background: transparent;
      }

      .slot-machine-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
      }

      .dark .slot-machine-footer {
        border-top-color: #374151;
      }

      .modal-overlay {
        backdrop-filter: blur(4px);
        animation: modalFadeIn 0.2s ease-out;
        cursor: pointer;
      }

      .modal-content {
        animation: modalSlideIn 0.3s ease-out;
        transform-origin: center;
        cursor: default;
      }

      @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @media (max-width: 640px) {
        .slot-machine-picker {
          max-width: 100%;
          margin: 0 1rem;
          height: 350px;
        }
        
        .slot-machine-container {
          height: 230px;
        }
        
        .slot-machine-item {
          font-size: 1rem;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modalContainer);

    // Initialize the slot machine
    const wheel = document.getElementById(`${config.id}-wheel`);
    const closeBtn = document.getElementById(`${config.id}-close-btn`);
    const cancelBtn = document.getElementById(`${config.id}-cancel-btn`);
    const confirmBtn = document.getElementById(`${config.id}-confirm-btn`);
    const modal = document.getElementById(`${config.id}-modal`);

    let selectedIndex = Math.floor(config.options.length / 2);
    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let velocity = 0;
    let lastY = 0;
    let lastTime = 0;

    // Set initial position
    console.log(
      "🎰 [SLOT-MACHINE] Initial setup - selectedIndex:",
      selectedIndex,
      "options length:",
      config.options.length
    );
    
    // Debug wheel container dimensions
    if (wheel) {
      console.log("🎰 [SLOT-MACHINE] Wheel container dimensions:", {
        scrollHeight: wheel.scrollHeight,
        clientHeight: wheel.clientHeight,
        offsetHeight: wheel.offsetHeight,
        scrollTop: wheel.scrollTop
      });
    }
    
    scrollToIndex(selectedIndex, false);

    // Add event listeners
    closeBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);
    confirmBtn?.addEventListener("click", confirmSelection);

    // Add click listeners to items
    const items = wheel?.querySelectorAll(".slot-machine-item");
    console.log("🎰 [SLOT-MACHINE] Found items:", items?.length);
    items?.forEach((item, index) => {
      console.log(`🎰 [SLOT-MACHINE] Adding click listener to item ${index}:`, item.textContent);
      item.addEventListener("click", () => {
        console.log(`🎰 [SLOT-MACHINE] Item ${index} clicked:`, item.textContent);
        scrollToIndex(index);
      });
    });

    // Close modal when clicking outside
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Keyboard support
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleWheel(-48); // Move up one item
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleWheel(48); // Move down one item
      } else if (e.key === "Enter") {
        e.preventDefault();
        confirmSelection();
      }
    };
    document.addEventListener("keydown", handleKeydown);

    // Mouse wheel support
    wheel?.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleWheel(e.deltaY);
      },
      { passive: false }
    );

    // Touch support
    wheel?.addEventListener("touchstart", (e) => {
      isDragging = true;
      startY = e.touches[0].clientY;
      currentY = startY;
      lastY = startY;
      lastTime = Date.now();
      velocity = 0;
    });

    wheel?.addEventListener("touchmove", (e) => {
      if (!isDragging) return;

      e.preventDefault();
      currentY = e.touches[0].clientY;
      const deltaY = currentY - lastY;
      const deltaTime = Date.now() - lastTime;

      if (deltaTime > 0) {
        velocity = deltaY / deltaTime;
      }

      if (wheel) {
        wheel.scrollTop -= deltaY;
      }
      lastY = currentY;
      lastTime = Date.now();
    });

    wheel?.addEventListener("touchend", () => {
      if (!isDragging) return;
      isDragging = false;
      snapToNearest();
    });

    function handleWheel(deltaY: number) {
      if (!wheel) return;

      console.log(
        "🎰 [SLOT-MACHINE] Wheel event - deltaY:",
        deltaY,
        "current scroll:",
        wheel.scrollTop
      );

      const itemHeight = 48;
      // Make scrolling more responsive - use actual deltaY for better control
      const scrollAmount = deltaY * 0.5;

      wheel.scrollTop += scrollAmount;
      console.log("🎰 [SLOT-MACHINE] New scroll position:", wheel.scrollTop);

      // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        snapToNearest();
      });
    }

    function snapToNearest() {
      if (!wheel) return;

      const itemHeight = 48;
      const padding = 140; // Top padding of the wheel
      const currentScroll = wheel.scrollTop;
      const adjustedScroll = currentScroll - padding;
      const nearestIndex = Math.round(adjustedScroll / itemHeight);

      console.log(
        "🎰 [SLOT-MACHINE] Snap to nearest - currentScroll:",
        currentScroll,
        "adjustedScroll:",
        adjustedScroll,
        "nearestIndex:",
        nearestIndex,
        "difference:",
        Math.abs(adjustedScroll - nearestIndex * itemHeight)
      );

      // Only snap if we're not already at the correct position
      if (Math.abs(adjustedScroll - nearestIndex * itemHeight) > 5) {
        console.log("🎰 [SLOT-MACHINE] Snapping to index:", nearestIndex);
        scrollToIndex(nearestIndex);
      } else {
        console.log("🎰 [SLOT-MACHINE] Already at correct position, no snap needed");
      }
    }

    function scrollToIndex(index: number, smooth = true) {
      if (!wheel || index < 0 || index >= config.options.length) {
        console.log(
          "🎰 [SLOT-MACHINE] Invalid scrollToIndex call - index:",
          index,
          "wheel:",
          !!wheel,
          "options length:",
          config.options.length
        );
        return;
      }

      const itemHeight = 48;
      const padding = 140; // Top padding of the wheel
      const targetScroll = (index * itemHeight) + padding;

      console.log(
        "🎰 [SLOT-MACHINE] Scrolling to index:",
        index,
        "target scroll:",
        targetScroll,
        "current scroll:",
        wheel.scrollTop
      );

      wheel.scrollTop = targetScroll;
      
      // Check if scroll actually changed
      setTimeout(() => {
        console.log("🎰 [SLOT-MACHINE] After scroll (delayed) - new scrollTop:", wheel.scrollTop, "expected:", targetScroll);
      }, 10);
      
      selectedIndex = index;

      console.log(
        "🎰 [SLOT-MACHINE] After scroll - new scrollTop:",
        wheel.scrollTop,
        "selectedIndex:",
        selectedIndex
      );

      updateSelection();
    }

    function updateSelection() {
      const items = wheel?.querySelectorAll(".slot-machine-item");
      console.log(
        "🎰 [SLOT-MACHINE] Updating selection - selectedIndex:",
        selectedIndex,
        "items found:",
        items?.length
      );
      items?.forEach((item, index) => {
        const isSelected = index === selectedIndex;
        item.classList.toggle("selected", isSelected);
        console.log(
          `🎰 [SLOT-MACHINE] Item ${index} (${item.textContent}) - selected:`,
          isSelected
        );
      });
    }

    function getSelectedValue() {
      const selectedItem = wheel?.querySelector(".slot-machine-item.selected");
      return selectedItem?.getAttribute("data-value") || "";
    }

    function getSelectedLabel() {
      const selectedItem = wheel?.querySelector(".slot-machine-item.selected");
      return selectedItem?.textContent || "";
    }

    function confirmSelection() {
      const value = getSelectedValue();
      const label = getSelectedLabel();

      if (config.onSelect) {
        config.onSelect(value, label, config.id);
      }

      resolve({ value, label });
      closeModal();
    }

    function closeModal() {
      document.removeEventListener("keydown", handleKeydown);
      document.head.removeChild(style);
      document.body.removeChild(modalContainer);
      resolve({ value: "", label: "" }); // Return empty on cancel
    }
  });
}

/**
 * Example usage function
 */
export function showStatusPicker(projectId: string, currentStatus: string) {
  const statusOptions = [
    { value: "0", label: "New Project" },
    { value: "10", label: "In Review" },
    { value: "20", label: "Approved" },
    { value: "30", label: "In Progress" },
    { value: "40", label: "Completed" },
    { value: "50", label: "Delivered" },
  ];

  return showSlotMachinePicker({
    id: "status-picker",
    title: "Select Project Status",
    options: statusOptions,
    selectedValue: currentStatus,
    onSelect: (value, label) => {
      console.log("Selected status:", value, label);
      // Handle status change here
    },
  });
}
