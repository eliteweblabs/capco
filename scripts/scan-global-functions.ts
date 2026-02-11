#!/usr/bin/env -S npx tsx
/**
 * Scans the codebase for (window as any).name = and window.name = assignments,
 * extracts JSDoc when available, and outputs JSON for the global-functions admin page.
 * Run: npm run generate-global-functions (or via predev)
 */
import * as fs from "fs";
import * as path from "path";

const SRC = path.join(process.cwd(), "src");

interface GlobalFunction {
  name: string;
  file: string;
  line: number;
  description?: string;
  params?: string[];
  returns?: string;
}

// Manual docs for functions where JSDoc is elsewhere or complex
const MANUAL_DOCS: Record<string, Partial<GlobalFunction>> = {
  lockBodyScroll: { description: "Prevents body scroll (overflow: hidden). Use for modals.", params: [], returns: "void" },
  unlockBodyScroll: { description: "Restores body scroll. Call when closing modals.", params: [], returns: "void" },
  isSafariIOS: { description: "Detects iOS Safari (not Chrome/Firefox on iOS).", params: [], returns: "boolean" },
  isSafari: { description: "Detects Safari browser (any platform).", params: [], returns: "boolean" },
  isSafariBeta: { description: "Detects Safari beta versions 18–30 on iOS.", params: [], returns: "boolean" },
  isSafari18OrLater: { description: "Detects Safari 18+.", params: [], returns: "boolean" },
  isMobile: { description: "Viewport ≤767px (BREAKPOINTS.MOBILE_MAX). Matches @media (max-width: 767px).", params: [], returns: "boolean" },
  isTablet: { description: "Viewport 768–1023px.", params: [], returns: "boolean" },
  isDesktop: { description: "Viewport ≥1024px.", params: [], returns: "boolean" },
  getViewportSize: { description: "Returns 'mobile' | 'tablet' | 'desktop'.", params: [], returns: "string" },
  scrollToTopOnMobile: { description: "Scrolls to top (smooth) only when viewport is mobile.", params: [], returns: "void" },
  scrollToTop: { description: "Scrolls to top of page.", params: ["behavior?: 'smooth' | 'instant' | 'auto'"], returns: "void" },
  debounce: { description: "Returns debounced function. Limits execution rate.", params: ["func: Function", "wait: number (ms)"], returns: "Function" },
  throttle: { description: "Returns throttled function. Limits execution rate.", params: ["func: Function", "limit: number (ms)"], returns: "Function" },
  truncateString: { description: "Truncates string with optional suffix.", params: ["str: string", "maxLength?: number", "suffix?: string"], returns: "string" },
  fixSafariViewport: { description: "Applies --vh CSS var for iOS Safari viewport.", params: [], returns: "void" },
  immediateSafariViewportFix: { description: "Initial viewport height fix for iOS Safari.", params: [], returns: "void" },
  setupViewportHandling: { description: "Calls immediateSafariViewportFix.", params: [], returns: "void" },
  ensureViewportBounds: { description: "Clamps viewport height between min and max.", params: ["minHeight?: number", "maxHeight?: number"], returns: "void" },
  getOverscrollPercent: { description: "Returns scroll % (0–100 normal, >100 overscroll bottom, <0 overscroll top).", params: [], returns: "number" },
  setupOverscrollStart: { description: "Calls callback when overscroll starts (at top/bottom boundary). Returns unsubscribe.", params: ["callback: (percent, source) => void"], returns: "() => void" },
  validateEmail: { description: "Validates email. Returns null if valid, error string if invalid.", params: ["email: string"], returns: "string | null" },
  handleUrlNotification: { description: "Shows notification from URL params (error/success).", params: ["type: 'error' | 'success'", "param: string"], returns: "void" },
  processUrlNotifications: { description: "Processes URL hash/query for notifications on load.", params: [], returns: "void" },
  hideNotification: { description: "Hides current notification.", params: [], returns: "void" },
  hideOnFormFocus: { description: "Hides element when user focuses an input. Optional mobileOnly.", params: ["elementSelector: string", "mobileOnly?: boolean"], returns: "void" },
  initInputWithIcon: { description: "Initializes input-with-icon components.", params: ["root?: Document | Element"], returns: "void" },
  focusFirstInputIn: { description: "Focuses first focusable input in container.", params: ["container: HTMLElement"], returns: "boolean" },
  showModal: { description: "Opens modal with title, body, buttons. Options: id, title, body, onConfirm, onCancel, size, etc.", params: ["options: object"], returns: "void" },
  hideModal: { description: "Closes modal by id.", params: ["modalId: string", "resetZIndex?: boolean"], returns: "void" },
  removeModal: { description: "Removes modal from DOM.", params: ["modalId: string"], returns: "void" },
  camelToProper: { description: "Converts camelCase to Proper Case.", params: ["str: string"], returns: "string" },
  createButtonPartial: { description: "Creates Button partial via X-headers. For server-side rendering.", params: ["config: object"], returns: "Promise<HTMLElement | null>" },
  getProject: { description: "Fetches project by ID.", params: ["projectId: string | number"], returns: "Promise<any>" },
  deleteProject: { description: "Deletes project.", params: ["projectId: any"], returns: "Promise<void>" },
  updateStatus: { description: "Updates project status.", params: ["projectId", "statusId", "..."], returns: "Promise<void>" },
  updateCountBubble: { description: "Updates count bubble styling.", params: ["selector", "count", "preset?"], returns: "void" },
  unslugify: { description: "Converts slug to readable text.", params: ["slug: string"], returns: "string" },
};

function extractJSDoc(lines: string[], startIndex: number): { description?: string; params?: string[]; returns?: string } | null {
  const result: { description?: string; params?: string[]; returns?: string } = {};
  let inBlock = false;
  const block: string[] = [];

  for (let i = startIndex; i >= 0; i--) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "/**") {
      inBlock = true;
      block.unshift(trimmed);
      break;
    }
    if (trimmed.startsWith("*") && (trimmed.endsWith("*/") || trimmed === "*")) {
      block.unshift(line);
      if (trimmed.endsWith("*/")) break;
      continue;
    }
    if (block.length > 0) break; // non-comment line
  }

  if (block.length === 0) return null;

  const full = block.join("\n");
  const descMatch = full.match(/\/\*\*\s*\n\s*\*\s*([^*]+)/);
  if (descMatch) result.description = descMatch[1].trim();

  const paramMatches = full.matchAll(/\*\s*@param\s+(\w+)\s*(?:-\s*)?([^*\n]+)/g);
  result.params = [...paramMatches].map((m) => `${m[1]}: ${m[2].trim()}`);

  const returnsMatch = full.match(/\*\s*@returns?\s+([^*\n]+)/);
  if (returnsMatch) result.returns = returnsMatch[1].trim();

  return Object.keys(result).length > 0 ? result : null;
}

function scanFile(filePath: string): GlobalFunction[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const results: GlobalFunction[] = [];
  const seen = new Set<string>();

  // Match (window as any).name = or window.name =
  const assignRe = /(?:\(window\s+as\s+any\)|window)\.(\w+)\s*=/g;
  let m: RegExpExecArray | null;
  while ((m = assignRe.exec(content)) !== null) {
    const name = m[1];
    if (seen.has(name)) continue;
    seen.add(name);

    const lineNum = content.substring(0, m.index).split("\n").length;
    const lineIndex = lineNum - 1;

    const manual = MANUAL_DOCS[name];
    const jsdoc = extractJSDoc(lines, lineIndex - 1);

    results.push({
      name,
      file: path.relative(process.cwd(), filePath),
      line: lineNum,
      ...(manual || {}),
      ...(jsdoc || {}),
    });
  }

  return results;
}

function walkDir(dir: string, ext: string[], files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!e.name.startsWith(".") && e.name !== "node_modules") walkDir(full, ext, files);
    } else if (ext.some((x) => e.name.endsWith(x))) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  const files = walkDir(SRC, [".ts", ".astro", ".js"]);
  const all: GlobalFunction[] = [];
  const byName = new Map<string, GlobalFunction>();

  for (const f of files) {
    try {
      const found = scanFile(f);
      for (const fn of found) {
        if (!byName.has(fn.name) || fn.file.includes("app-globals")) {
          byName.set(fn.name, fn);
        }
      }
    } catch (e) {
      console.warn("[scan-global-functions] Skip", f, (e as Error).message);
    }
  }

  const sorted = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));

  const outDir = path.join(SRC, "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "global-functions.generated.json");
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), functions: sorted }, null, 2));
  console.log(`[scan-global-functions] Wrote ${sorted.length} functions to ${outPath}`);
}

main();
