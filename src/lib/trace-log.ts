/**
 * TraceLog - toggleable entry/exit/error function tracing.
 *
 * Client-side usage:
 *   TraceLog.enable();
 *   const ctx = TraceLog.start("media.delete", { fileId });
 *   try { ...; TraceLog.end(ctx, { ok: true }); } catch (error) { TraceLog.error(ctx, error); }
 *
 * Wrap usage:
 *   const wrapped = TraceLog.wrap(asyncFn, { name: "media.delete" });
 */

const TRACE_STORAGE_KEY = "traceLog";
const TRACE_PERSIST_KEY = "traceLogPersist";
const TRACE_SAMPLE_RATE_KEY = "traceLogSampleRate";
const TRACE_HEADER_ID = "x-trace-id";
const TRACE_HEADER_NAME = "x-trace-name";

export interface TraceContext {
  id: string;
  name: string;
  startedAt: number;
}

export interface TraceHeaders {
  "x-trace-id": string;
  "x-trace-name": string;
}

export interface TraceInitOptions {
  isDev?: boolean;
  hostname?: string;
  autoEnable?: boolean;
  persist?: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeJson(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function shouldEnableFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const u = new URL(window.location.href);
  const trace = u.searchParams.get("trace");
  return trace === "1" || trace === "true" || trace === "on";
}

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (shouldEnableFromUrl()) return true;
  return localStorage.getItem(TRACE_STORAGE_KEY) === "1";
}

function shouldPersist(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(TRACE_PERSIST_KEY);
  if (raw === null) return false;
  return raw === "1";
}

function getSampleRate(): number {
  if (typeof window === "undefined") return 1;
  const raw = localStorage.getItem(TRACE_SAMPLE_RATE_KEY);
  if (!raw) return 1;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return 1;
  return Math.max(0, Math.min(1, parsed));
}

function shouldSample(): boolean {
  const sampleRate = getSampleRate();
  return sampleRate >= 1 || Math.random() < sampleRate;
}

function isLocalHostname(hostname: string): boolean {
  if (!hostname) return false;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

async function persistTrace(event: {
  phase: "start" | "end" | "error";
  traceId: string;
  name: string;
  durationMs?: number;
  payload?: unknown;
}): Promise<void> {
  if (typeof window === "undefined" || !shouldPersist()) return;
  try {
    await fetch("/api/log/trace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // Non-critical: tracing should never break UX.
  }
}

export const TraceLog = {
  enabled(): boolean {
    return isEnabled();
  },

  enable(persist = false): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TRACE_STORAGE_KEY, "1");
    localStorage.setItem(TRACE_PERSIST_KEY, persist ? "1" : "0");
    console.log(`[TRACE] enabled (persist=${persist})`);
  },

  disable(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TRACE_STORAGE_KEY);
    console.log("[TRACE] disabled");
  },

  setSampleRate(rate: number): void {
    if (typeof window === "undefined") return;
    const clamped = Math.max(0, Math.min(1, rate));
    localStorage.setItem(TRACE_SAMPLE_RATE_KEY, String(clamped));
    console.log(`[TRACE] sample rate=${clamped}`);
  },

  initForEnvironment(options: TraceInitOptions = {}): void {
    if (typeof window === "undefined") return;
    if (isEnabled()) return; // Respect explicit opt-in (URL/localStorage).

    const hostname = options.hostname || window.location.hostname || "";
    const shouldEnable =
      options.autoEnable !== undefined
        ? options.autoEnable
        : Boolean(options.isDev) || isLocalHostname(hostname);

    if (!shouldEnable) return;

    const persist = options.persist ?? false;
    localStorage.setItem(TRACE_STORAGE_KEY, "1");
    if (localStorage.getItem(TRACE_PERSIST_KEY) === null) {
      localStorage.setItem(TRACE_PERSIST_KEY, persist ? "1" : "0");
    }
    console.log(`[TRACE] auto-enabled (persist=${persist}, host=${hostname || "unknown"})`);
  },

  createTraceHeaders(name: string, traceId?: string): TraceHeaders {
    const id = traceId || makeId();
    return {
      [TRACE_HEADER_ID]: id,
      [TRACE_HEADER_NAME]: name,
    };
  },

  getTraceHeadersFromResponse(response: Response): {
    traceId: string | null;
    traceName: string | null;
  } {
    return {
      traceId: response.headers.get(TRACE_HEADER_ID),
      traceName: response.headers.get(TRACE_HEADER_NAME),
    };
  },

  start(name: string, payload?: unknown): TraceContext {
    const ctx: TraceContext = {
      id: makeId(),
      name,
      startedAt: performance.now(),
    };
    if (!isEnabled() || !shouldSample()) return ctx;
    console.log(`[TRACE][start] ${name} (${ctx.id})`, payload ?? "");
    void persistTrace({
      phase: "start",
      traceId: ctx.id,
      name,
      payload: safeJson(payload),
    });
    return ctx;
  },

  end(ctx: TraceContext, payload?: unknown): void {
    if (!isEnabled()) return;
    const durationMs = Math.max(0, Math.round(performance.now() - ctx.startedAt));
    console.log(`[TRACE][end] ${ctx.name} (${ctx.id}) ${durationMs}ms`, payload ?? "");
    void persistTrace({
      phase: "end",
      traceId: ctx.id,
      name: ctx.name,
      durationMs,
      payload: safeJson(payload),
    });
  },

  error(ctx: TraceContext, error: unknown, payload?: unknown): void {
    if (!isEnabled()) return;
    const durationMs = Math.max(0, Math.round(performance.now() - ctx.startedAt));
    const errorText = error instanceof Error ? error.message : String(error);
    console.error(
      `[TRACE][error] ${ctx.name} (${ctx.id}) ${durationMs}ms`,
      errorText,
      payload ?? ""
    );
    void persistTrace({
      phase: "error",
      traceId: ctx.id,
      name: ctx.name,
      durationMs,
      payload: safeJson({
        error: errorText,
        ...(payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {}),
      }),
    });
  },

  wrap<T extends (...args: any[]) => any>(fn: T, opts?: { name?: string }): T {
    const name = opts?.name || fn.name || "anonymous";
    return function (this: unknown, ...args: unknown[]) {
      const ctx = TraceLog.start(name, { args });
      try {
        const result = fn.apply(this, args);
        if (result && typeof (result as Promise<unknown>).then === "function") {
          return (result as Promise<unknown>)
            .then((resolved) => {
              TraceLog.end(ctx, { resolved: true });
              return resolved;
            })
            .catch((error) => {
              TraceLog.error(ctx, error);
              throw error;
            }) as ReturnType<T>;
        }
        TraceLog.end(ctx, { resolved: true });
        return result;
      } catch (error) {
        TraceLog.error(ctx, error);
        throw error;
      }
    } as T;
  },

  readIncomingTraceHeaders(headers: Headers): { traceId: string | null; traceName: string | null } {
    return {
      traceId: headers.get(TRACE_HEADER_ID),
      traceName: headers.get(TRACE_HEADER_NAME),
    };
  },

  nowIso,
};
