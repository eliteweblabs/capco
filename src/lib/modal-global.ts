/**
 * Global Modal System
 * Makes modal functions available globally via window object
 * Similar to showNotice() functionality
 */

import { showModal, hideModal, removeModal } from "./ux-utils";

// Extend Window interface for TypeScript
declare global {
  interface Window {
    showModal: typeof showModal;
    hideModal: typeof hideModal;
    removeModal: typeof removeModal;
  }
}

// Make functions globally available
if (typeof window !== "undefined") {
  window.showModal = showModal;
  window.hideModal = hideModal;
  window.removeModal = removeModal;
}

export { showModal, hideModal, removeModal };
