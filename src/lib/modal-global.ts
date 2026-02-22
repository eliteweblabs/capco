/**
 * Global Modal System
 * Makes modal functions available globally via window object
 * Similar to showNotice() functionality
 */

import {
  showModal,
  hideModal,
  removeModal,
  setModalOverlayZIndex,
  resetModalOverlayZIndex,
} from "./ux-utils";

// Note: Window interface is declared in App.astro to avoid duplicate declarations

// Make functions globally available
if (typeof window !== "undefined") {
  if ((window as any).__jsOrderLog) (window as any).__jsOrderLog("modal-global");
  window.showModal = showModal;
  window.hideModal = hideModal;
  window.removeModal = removeModal;
  window.setModalOverlayZIndex = setModalOverlayZIndex;
  window.resetModalOverlayZIndex = resetModalOverlayZIndex;
}

export { showModal, hideModal, removeModal, setModalOverlayZIndex, resetModalOverlayZIndex };
