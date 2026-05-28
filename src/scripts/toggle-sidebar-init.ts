/**
 * Mobile/desktop sidebar toggle — bundled to public/scripts/toggle-sidebar-init.js.
 * Loaded once from App.astro (not per ToggleSidebar instance) so production does not rely
 * on Astro 5 component script chunks (often empty) or duplicate inline inits.
 */
import { isMobile as isMobileViewport } from "../lib/ux-utils";

declare global {
  interface Window {
    __ensureSidebarInit?: () => boolean;
    __jsOrderLog?: (label: string) => void;
  }
}

if (typeof window !== "undefined" && window.__jsOrderLog) {
  window.__jsOrderLog("toggle-sidebar-init");
}

let sidebarAbortController: AbortController | null = null;

function initSidebar() {
  sidebarAbortController?.abort();
  sidebarAbortController = new AbortController();
  const signal = sidebarAbortController.signal;

  const toggleButtons = Array.from(document.querySelectorAll("[data-sidebar-toggle-button]"));
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("main-content");
  const collapseHideElements = document.querySelectorAll("[data-sidebar-collapse-hide]");
  const collapseShowElements = document.querySelectorAll("[data-sidebar-collapse-show]");
  const collapseIcon = document.querySelector("[data-sidebar-toggle-collapse-icon]");
  const expandIcon = document.querySelector("[data-sidebar-toggle-expand-icon]");

  if (!toggleButtons.length || !sidebar) return;

  const isAuth = toggleButtons[0].getAttribute("data-is-auth") === "true";
  /** matchMedia (max-width: 767px) — must match Tailwind md: / Navbar @media, not innerWidth < 768 */
  const isMobile = () => isMobileViewport();
  let isHovering = false;

  const updateIcons = (isExpanded: boolean) => {
    if (collapseIcon && expandIcon) {
      if (isExpanded) {
        collapseIcon.classList.remove("hidden");
        expandIcon.classList.add("hidden");
      } else {
        collapseIcon.classList.add("hidden");
        expandIcon.classList.remove("hidden");
      }
    }

    const allMenuIcons = document.querySelectorAll(".sidebar-toggle-menu-icon");
    const allCloseIcons = document.querySelectorAll(".sidebar-toggle-close-icon");

    if (isExpanded) {
      allMenuIcons.forEach((el) => {
        el.classList.remove("opacity-100", "rotate-0", "scale-100");
        el.classList.add("opacity-0", "rotate-90", "scale-0");
      });
      allCloseIcons.forEach((el) => {
        el.classList.remove("opacity-0", "-rotate-90", "scale-0");
        el.classList.add("opacity-100", "rotate-0", "scale-100");
      });
    } else {
      allMenuIcons.forEach((el) => {
        el.classList.remove("opacity-0", "rotate-90", "scale-0");
        el.classList.add("opacity-100", "rotate-0", "scale-100");
      });
      allCloseIcons.forEach((el) => {
        el.classList.remove("opacity-100", "rotate-0", "scale-100");
        el.classList.add("opacity-0", "-rotate-90", "scale-0");
      });
    }
  };

  const lockBodyScroll = () => {
    document.body.style.overflow = "hidden";
  };
  const unlockBodyScroll = () => {
    document.body.style.overflow = "";
  };

  const showCollapseElements = () => {
    collapseHideElements.forEach((el) => el.classList.remove("hidden"));
    collapseShowElements.forEach((el) => el.classList.add("hidden"));
    collapseShowElements.forEach((el) => el.classList.remove("flex"));
  };

  const hideCollapseElements = () => {
    collapseHideElements.forEach((el) => el.classList.add("hidden"));
    collapseShowElements.forEach((el) => el.classList.remove("hidden"));
    collapseShowElements.forEach((el) => el.classList.add("flex"));
  };

  const showSidebarMobile = () => {
    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("translate-x-0");
    sidebar.classList.remove("w-16");
    sidebar.classList.add("w-64");
    showCollapseElements();
    lockBodyScroll();
    if (mainContent) {
      mainContent.classList.add("overflow-hidden", "pointer-events-none");
    }
    toggleButtons.forEach((btn) => btn.setAttribute("aria-expanded", "true"));
    updateIcons(true);
  };

  const hideSidebarMobile = () => {
    sidebar.classList.remove("translate-x-0");
    sidebar.classList.add("-translate-x-full");
    unlockBodyScroll();
    if (mainContent) {
      mainContent.classList.remove("overflow-hidden", "pointer-events-none");
    }
    toggleButtons.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    updateIcons(false);
  };

  const SIDEBAR_STORAGE_KEY = "sidebar-expanded";

  const expandSidebarDesktop = () => {
    sidebar.classList.remove("w-16");
    sidebar.classList.add("w-64");
    showCollapseElements();
    if (mainContent) {
      mainContent.style.marginLeft = "16rem";
    }
    toggleButtons.forEach((btn) => btn.setAttribute("aria-expanded", "true"));
    updateIcons(true);
  };

  const collapseSidebarDesktop = () => {
    sidebar.classList.remove("w-64");
    sidebar.classList.add("w-16");
    hideCollapseElements();
    if (mainContent) {
      mainContent.style.marginLeft = "4rem";
    }
    toggleButtons.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    updateIcons(false);
  };

  const handleToggleClick = (e: Event) => {
    e.stopPropagation();
    if (isMobile()) {
      const isHidden = sidebar.classList.contains("-translate-x-full");
      if (isHidden) showSidebarMobile();
      else hideSidebarMobile();
    } else {
      const isCollapsed = sidebar.classList.contains("w-16");
      if (isCollapsed) {
        expandSidebarDesktop();
        try {
          localStorage.setItem(SIDEBAR_STORAGE_KEY, "true");
        } catch {
          /* ignore */
        }
      } else {
        collapseSidebarDesktop();
        try {
          localStorage.setItem(SIDEBAR_STORAGE_KEY, "false");
        } catch {
          /* ignore */
        }
      }
    }
  };

  toggleButtons.forEach((btn) => btn.addEventListener("click", handleToggleClick, { signal }));

  if (isAuth) {
    sidebar.addEventListener(
      "mouseenter",
      () => {
        if (!isMobile() && sidebar.classList.contains("w-16")) {
          isHovering = true;
          expandSidebarDesktop();
        }
      },
      { signal }
    );

    sidebar.addEventListener(
      "mouseleave",
      () => {
        if (!isMobile() && isHovering) {
          isHovering = false;
          collapseSidebarDesktop();
        }
      },
      { signal }
    );
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") {
        if (isMobile() && !sidebar.classList.contains("-translate-x-full")) {
          hideSidebarMobile();
        }
      }
    },
    { signal }
  );

  const isOutsideSidebar = (target: EventTarget | null) =>
    target instanceof Node &&
    !sidebar.contains(target) &&
    !toggleButtons.some((btn) => btn.contains(target));

  document.addEventListener(
    "click",
    (e) => {
      if (
        isMobile() &&
        !sidebar.classList.contains("-translate-x-full") &&
        isOutsideSidebar(e.target)
      ) {
        hideSidebarMobile();
      }
    },
    { signal }
  );

  let tapOutsideTarget: EventTarget | null = null;
  let tapOutsideStartY = 0;
  document.addEventListener(
    "touchstart",
    (e) => {
      if (isMobile() && !sidebar.classList.contains("-translate-x-full")) {
        tapOutsideTarget = e.target;
        tapOutsideStartY = e.touches[0]?.clientY ?? 0;
      } else {
        tapOutsideTarget = null;
      }
    },
    { passive: true, signal }
  );
  document.addEventListener(
    "touchend",
    (e) => {
      if (!tapOutsideTarget || !isMobile() || sidebar.classList.contains("-translate-x-full"))
        return;
      const deltaY = Math.abs((e.changedTouches[0]?.clientY ?? 0) - tapOutsideStartY);
      if (deltaY < 10 && isOutsideSidebar(tapOutsideTarget)) {
        hideSidebarMobile();
      }
      tapOutsideTarget = null;
    },
    { passive: true, signal }
  );

  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;
  let currentTranslateX = 0;

  sidebar.addEventListener(
    "touchstart",
    (e) => {
      if (!isMobile()) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDragging = true;
      sidebar.style.transition = "none";
    },
    { signal }
  );

  sidebar.addEventListener(
    "touchmove",
    (e) => {
      if (!isMobile() || !isDragging) return;
      const touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      const deltaX = touchCurrentX - touchStartX;
      const deltaY = touchCurrentY - touchStartY;
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
        currentTranslateX = deltaX;
        sidebar.style.transform = `translateX(${deltaX}px)`;
      }
    },
    { signal }
  );

  sidebar.addEventListener(
    "touchend",
    () => {
      if (!isMobile() || !isDragging) return;
      isDragging = false;
      sidebar.style.transition = "";
      sidebar.style.transform = "";
      if (currentTranslateX < -100) hideSidebarMobile();
      currentTranslateX = 0;
      touchStartX = 0;
      touchStartY = 0;
    },
    { signal }
  );

  window.addEventListener(
    "resize",
    () => {
      if (!isMobile()) {
        unlockBodyScroll();
        if (mainContent) {
          mainContent.classList.remove("overflow-hidden", "blur-sm", "pointer-events-none");
        }
        if (isAuth) {
          sidebar.classList.remove("-translate-x-full");
          sidebar.classList.add("translate-x-0");
          collapseSidebarDesktop();
        }
      } else {
        if (mainContent) mainContent.style.marginLeft = "";
        hideSidebarMobile();
      }
    },
    { signal }
  );

  if (isMobile()) {
    sidebar.classList.add("-translate-x-full");
  } else if (isAuth) {
    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("translate-x-0");
    try {
      const remembered = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (remembered === "true") expandSidebarDesktop();
      else collapseSidebarDesktop();
    } catch {
      collapseSidebarDesktop();
    }
  }
}

function ensureInit(): boolean {
  const toggleButtons = document.querySelectorAll("[data-sidebar-toggle-button]");
  const sidebar = document.getElementById("sidebar");
  if (toggleButtons.length && sidebar) {
    initSidebar();
    return true;
  }
  return false;
}

window.__ensureSidebarInit = ensureInit;

function runInitWithRetry(retries = 8, delay = 150) {
  if (ensureInit()) return;
  let attempt = 0;
  const id = window.setInterval(() => {
    attempt++;
    if (ensureInit() || attempt >= retries) {
      window.clearInterval(id);
    }
  }, delay);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => runInitWithRetry());
} else {
  runInitWithRetry();
}
