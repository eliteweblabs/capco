/**
 * Initialize drag-and-drop reorder for AccordionDataTable rows.
 * Reads config from [data-accordion-reorder-init] elements (hidden divs).
 */

function initAccordionReorder() {
  const initEls = document.querySelectorAll("[data-accordion-reorder-init]");
  initEls.forEach((el) => {
    const tableId = el.getAttribute("data-table-id");
    const triggerClass = el.getAttribute("data-trigger-class") || "accordion-trigger";
    const detailClass = el.getAttribute("data-detail-class") || "accordion-detail";
    const reorderCallbackName = el.getAttribute("data-reorder-callback");
    if (!tableId || !reorderCallbackName) return;

    const tbody = document.getElementById(tableId + "-tbody");
    if (!tbody) return;

    const cb = (window as unknown as Record<string, unknown>)[reorderCallbackName];
    if (typeof cb !== "function") return;

    const getTriggerRows = () =>
      Array.from(tbody.querySelectorAll<HTMLElement>("tr." + triggerClass + "[data-reorder-id]"));

    getTriggerRows().forEach((row, index) => {
      const detailRow = row.nextElementSibling;
      const isDetailRow =
        detailRow &&
        (detailRow.classList.contains(detailClass) || detailRow.hasAttribute("data-slot"));
      let draggedEl: HTMLElement | null = null;
      let draggedDetail: Element | null = null;
      let draggedIdx = -1;

      row.addEventListener("dragstart", (e) => {
        draggedEl = row;
        draggedDetail = isDetailRow ? detailRow : null;
        draggedIdx = index;
        row.classList.add("opacity-50");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", row.getAttribute("data-reorder-id") || "");
        }
      });

      row.addEventListener("dragend", () => {
        if (draggedEl) draggedEl.classList.remove("opacity-50");
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
            display_order: i,
          }))
          .filter((o) => o.id);
        try {
          await (cb as (order: { id: string | null; display_order: number }[]) => unknown)(order);
        } catch (err) {
          console.error("Reorder failed:", err);
        }
        draggedEl = null;
        draggedDetail = null;
      });
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAccordionReorder);
} else {
  initAccordionReorder();
}
