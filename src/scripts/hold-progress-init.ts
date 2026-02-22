/**
 * Generic hold-to-activate: any element with data-hold="<ms>" shows a progress bar
 * and only fires on completion (touch: hold; click: blocked until hold completes).
 * Uses CSS var --hold-progress (0–1) and a child .hold-progress for the bar.
 * On complete: buttons trigger click; others dispatch "holdcomplete" for listeners.
 */
if (typeof window !== "undefined" && (window as any).__traceLog) (window as any).__traceLog("hold-progress-init.ts running");
function initHoldProgress() {
  const isTouchDevice = () => window.matchMedia("(hover: none)").matches;
  if (!isTouchDevice()) return;

  const TEXT_READY = "press for 3s";

  function initElement(el: HTMLElement) {
    if (el.getAttribute("data-hold-inited") === "true") return;
    el.setAttribute("data-hold-inited", "true");

    const holdMs = parseInt(el.getAttribute("data-hold") ?? "3000", 10) || 3000;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    let startTime = 0;

    const reset = () => {
      if (holdTimer) clearTimeout(holdTimer);
      if (progressInterval) clearInterval(progressInterval);
      holdTimer = null;
      progressInterval = null;
      el.style.setProperty("--hold-progress", "0");
    };

    const triggerClick =
      el.tagName === "BUTTON" ||
      el.tagName === "A" ||
      el.getAttribute("data-hold-trigger-click") === "true";

    const complete = () => {
      reset();
      el.style.setProperty("--hold-progress", "1");
      if (triggerClick) {
        el.setAttribute("data-hold-allowed", "true");
        (el as HTMLButtonElement).click();
        el.removeAttribute("data-hold-allowed");
      } else {
        el.dispatchEvent(
          new CustomEvent("holdcomplete", { bubbles: true, detail: { target: el } })
        );
      }
    };

    const startHold = () => {
      if ((el as HTMLButtonElement).disabled) return;
      startTime = Date.now();
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / holdMs, 1);
        el.style.setProperty("--hold-progress", String(progress));
      }, 50);
      holdTimer = setTimeout(complete, holdMs);
    };

    if (triggerClick) {
      el.addEventListener("click", (e) => {
        if (el.getAttribute("data-hold-allowed") !== "true") {
          e.preventDefault();
          e.stopPropagation();
          const form = el.closest("form");
          if (form && (window as any).showMultiStepFormValidationErrors) {
            (window as any).showMultiStepFormValidationErrors(form);
          }
        }
      }, true);
    }

    el.addEventListener("touchstart", startHold, { passive: true });
    el.addEventListener("touchend", reset, { passive: true });
    el.addEventListener("touchcancel", reset, { passive: true });

    const labelEl = el.querySelector(".hold-button-text");
    const form = el.closest("form");
    if (labelEl && form) {
      const invalidText = labelEl.textContent?.trim() || "submit";
      const updateLabel = () => {
        labelEl.textContent = form.checkValidity() ? TEXT_READY : invalidText;
      };
      form.addEventListener("input", updateLabel);
      form.addEventListener("change", updateLabel);
      updateLabel();
    }
  }

  document.querySelectorAll<HTMLElement>("[data-hold]").forEach(initElement);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.hasAttribute?.("data-hold")) initElement(node);
          node.querySelectorAll?.<HTMLElement>("[data-hold]").forEach(initElement);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHoldProgress);
  } else {
    initHoldProgress();
  }
}
