/**
 * Global scroll lock utility for modals
 * Prevents background page scrolling when modals are open
 */

let scrollLockCount = 0;
let originalScrollY = 0;

export function lockBodyScroll(): void {
  scrollLockCount++;

  if (scrollLockCount === 1) {
    // Only lock on first modal
    const body = document.body;
    originalScrollY = window.scrollY;

    // Store current scroll position
    body.style.top = `-${originalScrollY}px`;
    body.classList.add("modal-open");

    // console.log("🔒 [SCROLL-LOCK] Body scroll locked at position:", originalScrollY);
  } else {
    // console.log("🔒 [SCROLL-LOCK] Additional modal opened, scroll already locked");
  }
}

export function unlockBodyScroll(): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);

  if (scrollLockCount === 0) {
    // Only unlock when all modals are closed
    const body = document.body;

    // Remove the lock class
    body.classList.remove("modal-open");

    // Restore scroll position
    if (originalScrollY !== undefined) {
      body.style.top = "";
      window.scrollTo(0, originalScrollY);
    }

    // console.log("🔓 [SCROLL-LOCK] Body scroll unlocked, restored to position:", originalScrollY);
  } else {
    // console.log("🔓 [SCROLL-LOCK] Modal closed, but other modals still open");
  }
}

export function forceUnlockBodyScroll(): void {
  // Force unlock regardless of count (useful for cleanup)
  scrollLockCount = 0;
  const body = document.body;

  body.classList.remove("modal-open");
  body.style.top = "";

  // console.log("🔓 [SCROLL-LOCK] Force unlocked body scroll");
}

// Auto-cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", forceUnlockBodyScroll);
}
