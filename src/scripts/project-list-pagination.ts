/**
 * Client-side pagination for #project-list-tbody rows.
 * Works with ?status= filter (URL) and optional #project-nav tab clicks.
 */

const PAGE_SIZE = 20;

function readFilter(): string {
  const p = new URLSearchParams(window.location.search).get("status");
  return p && p.trim() !== "" ? p.trim() : "all";
}

function readPage(): number {
  const raw = parseInt(new URLSearchParams(window.location.search).get("page") || "1", 10);
  return Number.isFinite(raw) && raw >= 1 ? raw : 1;
}

function pageRangeItems(current: number, total: number): Array<number | "ellipsis"> {
  const delta = 2;
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

function setUrlPage(page: number) {
  const url = new URL(window.location.href);
  if (page <= 1) url.searchParams.delete("page");
  else url.searchParams.set("page", String(page));
  window.history.replaceState({}, "", url.toString());
}

const basePageBtnClass =
  "project-list-page-btn flex items-center justify-center border border-gray-300 bg-white px-3 py-2 text-sm leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white";
const currentPageBtnClass =
  "project-list-page-btn z-10 flex items-center justify-center border border-primary-300 bg-primary-50 px-3 py-2 text-sm leading-tight text-primary-600 hover:bg-primary-100 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white";

function buildPaginationNav(
  ul: HTMLElement,
  current: number,
  totalPages: number,
  onSelect: (page: number) => void
) {
  ul.replaceChildren();

  const prevLi = document.createElement("li");
  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = `ml-0 flex h-full items-center justify-center rounded-l-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`;
  prevBtn.innerHTML =
    '<span class="sr-only">Previous</span><svg class="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
  prevBtn.disabled = current <= 1;
  prevBtn.addEventListener("click", () => onSelect(current - 1));
  prevLi.appendChild(prevBtn);
  ul.appendChild(prevLi);

  const items = totalPages <= 1 ? [1] : pageRangeItems(current, totalPages);

  for (const item of items) {
    const li = document.createElement("li");
    if (item === "ellipsis") {
      const span = document.createElement("span");
      span.className = `${basePageBtnClass} cursor-default`;
      span.textContent = "…";
      li.appendChild(span);
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(item);
      btn.setAttribute("aria-label", `Page ${item}`);
      if (item === current) {
        btn.className = currentPageBtnClass;
        btn.setAttribute("aria-current", "page");
      } else {
        btn.className = basePageBtnClass;
      }
      btn.addEventListener("click", () => onSelect(item));
      li.appendChild(btn);
    }
    ul.appendChild(li);
  }

  const nextLi = document.createElement("li");
  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = `flex h-full items-center justify-center rounded-r-lg border border-gray-300 bg-white px-3 py-1.5 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`;
  nextBtn.innerHTML =
    '<span class="sr-only">Next</span><svg class="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>';
  nextBtn.disabled = current >= totalPages;
  nextBtn.addEventListener("click", () => onSelect(current + 1));
  nextLi.appendChild(nextBtn);
  ul.appendChild(nextLi);
}

export function applyProjectListPagination(): void {
  const tbody = document.getElementById("project-list-tbody");
  const rangeEl = document.getElementById("project-list-pagination-range");
  const ul = document.getElementById("project-list-pagination-pages") as HTMLElement | null;

  if (!tbody || !rangeEl || !ul) return;

  const filter = readFilter();
  let page = readPage();

  const rows = [...tbody.querySelectorAll<HTMLElement>("tr[data-project-id]")];
  const matching: HTMLElement[] = [];
  for (const tr of rows) {
    const slug = tr.getAttribute("data-project-status") || "";
    if (filter === "all" || slug === filter) matching.push(tr);
  }

  const total = matching.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;

  const start = (page - 1) * PAGE_SIZE;
  const startUi = total === 0 ? 0 : start + 1;
  const endUi = Math.min(start + PAGE_SIZE, total);

  const params = new URLSearchParams(window.location.search);
  const requestedRaw = params.get("page");
  const requested = requestedRaw ? parseInt(requestedRaw, 10) : 1;
  const normalizedRequested = Number.isFinite(requested) && requested >= 1 ? requested : 1;
  if (normalizedRequested !== page) {
    setUrlPage(page);
  }

  const matchingSet = new Set(matching);
  for (const tr of rows) {
    if (!matchingSet.has(tr)) tr.style.display = "none";
  }
  matching.forEach((tr, idx) => {
    tr.style.display = idx >= start && idx < start + PAGE_SIZE ? "" : "none";
  });

  rangeEl.textContent = total === 0 ? `Showing 0 of 0` : `Showing ${startUi}-${endUi} of ${total}`;

  buildPaginationNav(ul, page, totalPages, (nextPage) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    setUrlPage(clamped);
    applyProjectListPagination();
    document.getElementById("project-list")?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  });
}

declare global {
  interface Window {
    applyProjectListPagination?: () => void;
  }
}

export function initProjectListPagination(): void {
  window.applyProjectListPagination = applyProjectListPagination;
  applyProjectListPagination();

  window.addEventListener("popstate", () => applyProjectListPagination());

  window.addEventListener("project-list:apply-pagination", () => applyProjectListPagination());
}
