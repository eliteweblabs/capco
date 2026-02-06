/**
 * Console Log Interceptor
 * Globally disables console.log statements in production
 */

/**
 * Disable all console.log statements
 * This preserves console.error, console.warn, etc.
 */
export function disableConsoleLogs(): void {
  // Store original console.log for potential restoration
  const originalLog = console.log;

  // Override console.log with empty function
  console.log = () => {};

  // Also disable console.debug and console.info in production
  console.debug = () => {};
  console.info = () => {};

  // Keep console.error and console.warn intact
  // console.error and console.warn are NOT modified
}

/**
 * Truncate console logs in development to prevent massive logs
 */
export function truncateConsoleLogs(): void {
  const originalLog = console.log;
  const originalDebug = console.debug;
  const originalInfo = console.info;

  const truncateMessage = (
    message: string,
    maxLines: number = 10,
    maxWords: number = 50
  ): string => {
    // First check word count
    const words = message.split(/\s+/);
    if (words.length > maxWords) {
      const firstWords = words.slice(0, maxWords).join(" ");
      const remainingWords = words.length - maxWords;
      return firstWords + ` ... [truncated ${remainingWords} words]`;
    }

    // Then check line count
    const lines = message.split("\n");
    if (lines.length <= maxLines) return message;
    const firstLines = lines.slice(0, maxLines).join("\n");
    const remainingLines = lines.length - maxLines;
    return firstLines + `\n... [truncated ${remainingLines} lines]`;
  };

  console.log = (...args: any[]) => {
    const message = args.join(" ");

    // Filter out image fetch logs
    if (
      message.includes("Fetch finished loading: GET") &&
      (message.includes(".png") ||
        message.includes(".jpg") ||
        message.includes(".jpeg") ||
        message.includes(".gif") ||
        message.includes(".svg") ||
        message.includes(".webp"))
    ) {
      return; // Don't log image fetch messages
    }

    const truncatedArgs = args.map((arg) => {
      if (typeof arg === "string") {
        return truncateMessage(arg);
      }
      if (typeof arg === "object" && arg !== null) {
        try {
          const stringified = JSON.stringify(arg);
          const words = stringified.split(/\s+/);
          if (
            stringified.split("\n").length > 10 ||
            stringified.length > 200 ||
            words.length > 50
          ) {
            return truncateMessage(stringified);
          }
          return arg;
        } catch {
          return arg;
        }
      }
      return arg;
    });
    originalLog(...truncatedArgs);
  };

  console.debug = (...args: any[]) => {
    const truncatedArgs = args.map((arg) => {
      if (typeof arg === "string") {
        return truncateMessage(arg);
      }
      if (typeof arg === "object" && arg !== null) {
        try {
          const stringified = JSON.stringify(arg);
          const words = stringified.split(/\s+/);
          if (
            stringified.split("\n").length > 10 ||
            stringified.length > 200 ||
            words.length > 50
          ) {
            return truncateMessage(stringified);
          }
          return arg;
        } catch {
          return arg;
        }
      }
      return arg;
    });
    originalDebug(...truncatedArgs);
  };

  console.info = (...args: any[]) => {
    const truncatedArgs = args.map((arg) => {
      if (typeof arg === "string") {
        return truncateMessage(arg);
      }
      if (typeof arg === "object" && arg !== null) {
        try {
          const stringified = JSON.stringify(arg);
          const words = stringified.split(/\s+/);
          if (
            stringified.split("\n").length > 10 ||
            stringified.length > 200 ||
            words.length > 50
          ) {
            return truncateMessage(stringified);
          }
          return arg;
        } catch {
          return arg;
        }
      }
      return arg;
    });
    originalInfo(...truncatedArgs);
  };
}

/**
 * Disable all console methods except errors and warnings
 */
export function disableConsoleDebug(): void {
  if (typeof window !== "undefined") {
    // Browser environment
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    // Keep console.error and console.warn
  } else {
    // Node.js/server environment
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    // Keep console.error and console.warn
  }
}

/**
 * Conditional console disabling based on environment
 * Allows certain prefixes to show in production for debugging
 */
export function setupConsoleInterceptor(): void {
  // Check if we're in production
  const isProduction = import.meta.env.PROD || process.env.NODE_ENV === "production";
  const isServer = typeof window === "undefined";

  // Debug logging
  if (!isProduction) {
    console.log(
      `🔍 [CONSOLE-INTERCEPTOR] ${isServer ? "Server" : "Client"}-side environment check:`
    );
    console.log("  - import.meta.env.PROD:", import.meta.env.PROD);
    console.log("  - process.env.NODE_ENV:", process.env.NODE_ENV);
    console.log("  - isProduction:", isProduction);
    console.log("  - isServer:", isServer);
  }

  // Only disable console.log in production (both server and client)
  if (isProduction) {
    // Store original console.log
    const originalLog = console.log;

    // Override with selective filter - allow [---] prefixed logs
    console.log = (...args: any[]) => {
      const message = args.join(" ");

      // Filter out image fetch logs
      if (
        message.includes("Fetch finished loading: GET") &&
        (message.includes(".png") ||
          message.includes(".jpg") ||
          message.includes(".jpeg") ||
          message.includes(".gif") ||
          message.includes(".svg") ||
          message.includes(".webp"))
      ) {
        return; // Don't log image fetch messages
      }

      // Allow logs that contain [---] pattern (e.g., [---VAPI], [---DEBUG], [---ADMIN-VOICE], etc.)
      if (message.includes("[---")) {
        originalLog(...args);
        return;
      }
      // Allow admin voice widget and API logs (server and client)
      if (
        message.includes("[ADMIN-VOICE]") ||
        message.includes("[ADMIN-NEW-SUBMISSIONS]") ||
        message.includes("[ADMIN-CREATE-PROJECT")
      ) {
        originalLog(...args);
        return;
      }
      // Otherwise, suppress the log
    };

    if (isServer) {
      console.warn("🔇 [SERVER] Console.log disabled in production (except [---] prefixed logs)");
    } else {
      console.warn("🔇 [CLIENT] Console.log disabled in production (except [---] prefixed logs)");
    }
  } else {
    // In development, truncate long console logs to prevent terminal clutter
    truncateConsoleLogs();
    if (isServer) {
      console.log("🔊 [SERVER] Console.log statements enabled in development (truncated)");
    } else {
      console.log("🔊 [CLIENT] Console.log statements enabled in development (truncated)");
    }
  }
}

/**
 * Advanced interceptor that can filter by prefix or content
 */
export function createSelectiveConsoleInterceptor(
  options: {
    disableInProduction?: boolean;
    allowPrefixes?: string[];
    blockPrefixes?: string[];
  } = {}
): void {
  const { disableInProduction = true, allowPrefixes = [], blockPrefixes = [] } = options;

  // Only intercept in production if specified
  if (disableInProduction && (import.meta.env.PROD || process.env.NODE_ENV === "production")) {
    const originalLog = console.log;

    console.log = (...args: any[]) => {
      const message = args.join(" ");

      // Filter out image fetch logs
      if (
        message.includes("Fetch finished loading: GET") &&
        (message.includes(".png") ||
          message.includes(".jpg") ||
          message.includes(".jpeg") ||
          message.includes(".gif") ||
          message.includes(".svg") ||
          message.includes(".webp"))
      ) {
        return; // Don't log image fetch messages
      }

      // Allow specific prefixes
      if (allowPrefixes.length > 0) {
        const isAllowed = allowPrefixes.some((prefix) => message.includes(prefix));
        if (isAllowed) {
          originalLog(...args);
          return;
        }
      }

      // Block specific prefixes
      if (blockPrefixes.length > 0) {
        const isBlocked = blockPrefixes.some((prefix) => message.includes(prefix));
        if (isBlocked) {
          return; // Don't log
        }
      }

      // If no specific rules, block all in production
      if (allowPrefixes.length === 0 && blockPrefixes.length === 0) {
        return; // Block all console.logs in production
      }

      // Default: allow the log
      originalLog(...args);
    };
  }
}
