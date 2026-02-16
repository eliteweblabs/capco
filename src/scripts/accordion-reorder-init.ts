/**
 * Initialize drag-and-drop reorder for AccordionDataTable rows.
 * Reads config from [data-accordion-reorder-init] elements (hidden divs).
 */

const LOG = "[AccordionReorder]";

function initAccordionReorder(): boolean {
  let allOk = true;
  const initEls = document.querySelectorAll(
    "[data-accordion-reorder-init]:not([data-accordion-reorder-inited])"
  );
  console.log(LOG, "initAccordionReorder run, initEls:", initEls.length);

  initEls.forEach((el) => {
    const tableId = el.getAttribute("data-table-id");
    const triggerClass = el.getAttribute("data-trigger-class") || "accordion-trigger";
    const detailClass = el.getAttribute("data-detail-class") || "accordion-detail";
    const reorderCallbackName = el.getAttribute("data-reorder-callback");
    console.log(LOG, "tableId:", tableId, "triggerClass:", triggerClass, "callback:", reorderCallbackName);

    if (!tableId || !reorderCallbackName) {
      console.warn(LOG, "missing tableId or callback, skipping");
      return;
    }

    const tbody = document.getElementById(tableId + "-tbody");
    if (!tbody) {
      console.warn(LOG, "tbody not found for id:", tableId + "-tbody");
      return;
    }

    const cb = (window as unknown as Record<string, unknown>)[reorderCallbackName];
    if (typeof cb !== "function") {
      console.warn(LOG, "callback not found on window:", reorderCallbackName, "available:", Object.keys(window).filter((k) => k.includes("Reorder") || k.includes("handle")));
      allOk = false;
      return;
    }
    el.setAttribute("data-accordion-reorder-inited", "true");

    // Support multiple classes: "accordion-trigger user-row" -> "tr.accordion-trigger.user-row"
    const triggerClassSel = triggerClass.trim().split(/\s+/).filter(Boolean).join(".");
    const getTriggerRows = () =>
      Array.from(tbody.querySelectorAll<HTMLElement>("tr." + triggerClassSel + "[data-reorder-id]"));

    const rows = getTriggerRows();
    console.log(LOG, "attaching to", rows.length, "rows for table", tableId);

    let draggedEl: HTMLElement | null = null;
    let draggedDetail: Element | null = null;
    let draggedIdx = -1;

    rows.forEach((row, index) => {
      const detailRow = row.nextElementSibling;
      const isDetailRow =
        detailRow &&
        (detailRow.classList.contains(detailClass) || detailRow.hasAttribute("data-slot"));

      row.addEventListener("dragstart", (e) => {
        console.log(LOG, "dragstart", tableId, "row", index, "id:", row.getAttribute("data-reorder-id"));
        (window as { refreshManager?: { setDragInProgress: (v: boolean) => void } }).refreshManager?.setDragInProgress?.(true);
        draggedEl = row;
        draggedDetail = isDetailRow ? detailRow : null;
        draggedIdx = index;
        row.classList.add("opacity-50", "cursor-grabbing");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", row.getAttribute("data-reorder-id") || "");
        }
      });

      row.addEventListener("dragend", () => {
        (window as { refreshManager?: { setDragInProgress: (v: boolean) => void } }).refreshManager?.setDragInProgress?.(false);
        if (draggedEl) draggedEl.classList.remove("opacity-50", "cursor-grabbing");
        getTriggerRows().forEach((r) => r.classList.remove("border-t-2", "border-primary-500"));
        draggedEl = null;
        draggedDetail = null;
      });

      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        if (draggedEl && row !== draggedEl) row.classList.add("border-t-2", "border-primary-500");
      });

      row.addEventListener("dragleave", () => {
        row.classList.remove("border-t-2", "border-primary-500");
      });

      row.addEventListener("drop", async (e) => {
        console.log(LOG, "drop", tableId, "targetIdx:", getTriggerRows().indexOf(row));
        e.preventDefault();
        row.classList.remove("border-t-2", "border-primary-500");
        if (!draggedEl || draggedEl === row) return;
        const targetIdx = getTriggerRows().indexOf(row);
        if (draggedIdx === targetIdx) return;
        if (draggedDetail) tbody.insertBefore(draggedDetail, row);
        tbody.insertBefore(draggedEl, draggedDetail || row);
        const order = getTriggerRows()
          .map((r, i) => ({
            id: r.getAttribute("data-reorder-id"),
            displayOrder: i,
          }))
          .filter((o) => o.id);
        try {
          await (cb as (order: { id: string | null; displayOrder: number }[]) => unknown)(order);
        } catch (err) {
          console.error("Reorder failed:", err);
        }
        draggedEl = null;
        draggedDetail = null;
      });
    });
  });
  return allOk;
}

let retryCount = 0;
const MAX_RETRIES = 20;

function run() {
  console.log(LOG, "run() called, readyState:", document.readyState, "retryCount:", retryCount);
  const ok = initAccordionReorder();
  if (!ok && retryCount < MAX_RETRIES) {
    retryCount++;
    console.log(LOG, "retrying in 50ms, retryCount:", retryCount);
    requestAnimationFrame(() => setTimeout(run, 50));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", run);
} else {
  run();
}
document.addEventListener("astro:page-load", run);
