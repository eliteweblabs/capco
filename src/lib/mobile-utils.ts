/**
 * Mobile detection utilities
 * Centralized mobile device detection for consistent behavior across the app
 */

/**
 * Check if the current device is mobile (smaller than iPad mini - 768px)
 * @returns boolean - true if mobile device
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

/**
 * Check if the current device is mobile Safari
 * @returns boolean - true if mobile Safari device
 */
export function isMobileSafari(): boolean {
  if (typeof window === "undefined") return false;

  const isMobileDevice = isMobile();
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isMobileSafariDevice =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return isMobileDevice && (isSafari || isMobileSafariDevice);
}

/**
 * Check if the current device is any mobile device (not just Safari)
 * @returns boolean - true if any mobile device
 */
export function isAnyMobile(): boolean {
  if (typeof window === "undefined") return false;

  const isMobileDevice = isMobile();
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return isMobileDevice || isMobileUserAgent;
}

/**
 * Get device info for debugging
 * @returns object with device detection info
 */
export function getDeviceInfo() {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isMobileSafari: false,
      isAnyMobile: false,
      width: 0,
      userAgent: "server",
    };
  }

  return {
    isMobile: isMobile(),
    isMobileSafari: isMobileSafari(),
    isAnyMobile: isAnyMobile(),
    width: window.innerWidth,
    userAgent: navigator.userAgent,
  };
}
