/**
 * Console Log Interceptor
 * Globally disables console.log statements in production
 */

/**
 * Disable all console.log statements
 * This preserves console.error, console.warn, etc.
 */
export function disableConsoleLogs(): void {
  if (typeof window !== "undefined") {
    // Browser environment
    console.log = () => {};
  } else {
    // Node.js/server environment
    console.log = () => {};
  }
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
 */
export function setupConsoleInterceptor(): void {
  // Only disable in production
  if (import.meta.env.PROD || process.env.NODE_ENV === "production") {
    disableConsoleLogs();
    console.warn("🔇 Console.log statements disabled in production");
  } else {
    console.log("🔊 Console.log statements enabled in development");
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
