/**
 * Debug Logger – toggleable function-call logging
 *
 * Best practices:
 * - Zero overhead when disabled: single boolean check, no string work
 * - Opt-in: wrap functions you want to log; no global monkey-patching
 * - Multiple activation: URL (?debug=1), localStorage (debug=1), window.__DEBUG
 * - Category filtering: ?debug=multistep,form logs only those categories
 *
 * Usage:
 *   Debug.log("form", "handleSubmit", [formData]);
 *   const wrapped = Debug.wrap(handleClick, { category: "multistep", name: "handleClick" });
 *
 * Enable: ?debug=1 in URL, or localStorage.setItem("debug","1"), or window.__DEBUG = true
 * Filter: ?debug=multistep,form or localStorage.debug = "multistep,form"
 */

const DEBUG_STORAGE_KEY = "debug";

/** Cached enabled state + allowed categories; refreshed on enable/disable/URL change */
let _enabled: boolean | null = null;
let _allowedCategories: Set<string> | null = null; // null = all categories

function _parseSources(): { enabled: boolean; categories: Set<string> | null } {
  if (typeof window === "undefined") return { enabled: false, categories: null };

  const w = window as any;

  // 1. window.__DEBUG – set in console before scripts run
  if (w.__DEBUG === true) {
    return { enabled: true, categories: null };
  }
  if (w.__DEBUG === false) {
    return { enabled: false, categories: null };
  }

  // 2. URL ?debug=1 or ?debug=multistep,form
  const url = new URL(w.location?.href || "", "http://localhost");
  const debugParam = url.searchParams.get("debug");
  if (debugParam !== null) {
    if (debugParam === "" || debugParam === "1" || debugParam === "true") {
      return { enabled: true, categories: null };
    }
    const cats = new Set(
      debugParam
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
    return { enabled: true, categories: cats.size > 0 ? cats : null };
  }

  // 3. localStorage
  try {
    const stored = localStorage.getItem(DEBUG_STORAGE_KEY);
    if (stored === null) return { enabled: false, categories: null };
    if (stored === "" || stored === "1" || stored === "true") {
      return { enabled: true, categories: null };
    }
    const cats = new Set(
      stored
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
    return { enabled: true, categories: cats.size > 0 ? cats : null };
  } catch {
    return { enabled: false, categories: null };
  }
}

function _refreshCache(): void {
  const { enabled, categories } = _parseSources();
  _enabled = enabled;
  _allowedCategories = categories;
}

function _isCategoryAllowed(category: string): boolean {
  if (_allowedCategories === null) return true;
  return _allowedCategories.has(category.toLowerCase());
}

/** Safe stringify for args/results; avoids circular refs and huge output */
function _safeStringify(value: unknown, maxLength = 200): string {
  try {
    if (value === undefined) return "undefined";
    if (value === null) return "null";
    const s =
      typeof value === "function"
        ? `[Function ${(value as Function).name || "anonymous"}]`
        : JSON.stringify(value);
    return s.length > maxLength ? s.slice(0, maxLength) + "…" : s;
  } catch {
    return "[Circular or non-serializable]";
  }
}

export interface DebugLogger {
  /** Check if debug logging is enabled (and optionally if category is allowed) */
  enabled: (category?: string) => boolean;
  /** Turn on debug via localStorage (persists across reloads) */
  enable: (categories?: string[]) => void;
  /** Turn off debug */
  disable: () => void;
  /** Manually log a function call. No-op when disabled or category filtered out. */
  log: (
    category: string,
    fnName: string,
    args?: unknown[],
    result?: unknown,
    durationMs?: number
  ) => void;
  /** Wrap a function to auto-log calls, args, result, and duration */
  wrap: <T extends (...args: any[]) => any>(
    fn: T,
    opts?: { name?: string; category?: string }
  ) => T;
  /** Run a block with a console group when enabled */
  group: <R>(label: string, category: string, fn: () => R) => R;
}

export const Debug: DebugLogger = {
  enabled(category?: string): boolean {
    if (_enabled === null) _refreshCache();
    if (!_enabled) return false;
    if (category === undefined) return true;
    return _isCategoryAllowed(category);
  },

  enable(categories?: string[]): void {
    try {
      if (categories && categories.length > 0) {
        localStorage.setItem(DEBUG_STORAGE_KEY, categories.join(","));
      } else {
        localStorage.setItem(DEBUG_STORAGE_KEY, "1");
      }
      _refreshCache();
      if (typeof window !== "undefined") {
        console.log(`[DEBUG] Enabled${categories?.length ? ` for: ${categories.join(", ")}` : ""}`);
      }
    } catch (e) {
      console.warn("[DEBUG] Could not enable (localStorage):", e);
    }
  },

  disable(): void {
    try {
      localStorage.removeItem(DEBUG_STORAGE_KEY);
      _enabled = false;
      _allowedCategories = null;
      if (typeof window !== "undefined") {
        (window as any).__DEBUG = false;
        console.log("[DEBUG] Disabled");
      }
    } catch (e) {
      console.warn("[DEBUG] Could not disable:", e);
    }
  },

  log(
    category: string,
    fnName: string,
    args?: unknown[],
    result?: unknown,
    durationMs?: number
  ): void {
    if (!Debug.enabled(category)) return;

    const parts: string[] = [`[${category}]`, fnName];
    if (args && args.length > 0) {
      parts.push("args:", args.map((a) => _safeStringify(a)).join(", "));
    }
    if (result !== undefined) {
      parts.push("→", _safeStringify(result));
    }
    if (typeof durationMs === "number") {
      parts.push(`(${durationMs}ms)`);
    }
    console.log(parts.join(" "));
  },

  wrap<T extends (...args: any[]) => any>(fn: T, opts?: { name?: string; category?: string }): T {
    const category = opts?.category ?? "default";
    const name = opts?.name ?? fn.name ?? "anonymous";

    return function (this: unknown, ...args: unknown[]) {
      if (!Debug.enabled(category)) return fn.apply(this, args);

      const start = performance.now();
      let result: unknown;
      try {
        result = fn.apply(this, args);
        if (result && typeof (result as Promise<unknown>).then === "function") {
          (result as Promise<unknown>).then(
            (r) => {
              Debug.log(category, name, args, r, performance.now() - start);
              return r;
            },
            (err) => {
              console.warn(`[${category}] ${name} rejected:`, err);
              throw err;
            }
          );
          return result;
        }
        Debug.log(category, name, args, result, performance.now() - start);
        return result;
      } catch (err) {
        console.warn(`[${category}] ${name} threw:`, err);
        throw err;
      }
    } as T;
  },

  group<R>(label: string, category: string, fn: () => R): R {
    if (!Debug.enabled(category)) return fn();
    console.groupCollapsed(`[${category}] ${label}`);
    try {
      const r = fn();
      console.groupEnd();
      return r;
    } catch (e) {
      console.groupEnd();
      throw e;
    }
  },
};

// ========== Form Failure Log (always-on, monitorable) ==========
// Captures form submit failures and sends to API for persistent storage and admin review.
// Independent of debug toggle – always fires for critical events.

export interface FormFailurePayload {
  formId?: string;
  formAction?: string;
  error: string;
  statusCode?: number;
  context?: Record<string, unknown>;
}

/** Always logs form failure to API and localStorage buffer. Fire-and-forget; never throws. */
export function formFailureLog(payload: FormFailurePayload): void {
  if (typeof window === "undefined") return;

  const entry = {
    ...payload,
    userAgent: navigator.userAgent,
  };

  // Always log to console for dev visibility
  console.error(
    "[FORM-FAILURE]",
    payload.formId || "unknown",
    payload.formAction || "",
    payload.error
  );

  // Buffer in localStorage (survives tab close; can be flushed later or viewed in devtools)
  try {
    const key = "formFailureLogs";
    const buf = JSON.parse(localStorage.getItem(key) || "[]");
    buf.unshift({
      ...entry,
      ts: new Date().toISOString(),
    });
    const trimmed = buf.slice(0, 50);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }

  // Send to API for persistent storage (fire-and-forget)
  try {
    fetch("/api/log/form-failure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch(() => {
      /* API unavailable – already in localStorage */
    });
  } catch {
    /* ignore */
  }
}

// Refresh cache when URL or storage might have changed (e.g. after navigation)
if (typeof window !== "undefined") {
  window.addEventListener("popstate", _refreshCache);
  window.addEventListener("storage", (e) => {
    if (e.key === DEBUG_STORAGE_KEY) _refreshCache();
  });
}
