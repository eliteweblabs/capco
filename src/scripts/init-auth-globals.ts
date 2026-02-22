/**
 * Expose auth/profile helpers on window so inline scripts (UserDropdown, PhoneAndSMS)
 * can use them without importing. Prevents 404s when SPA merges HTML and browser
 * tries to resolve raw import paths like /lib/page-size-plugin.
 */
import { initPageSizeToggle } from "../lib/page-size-plugin";
import { validatePhone, formatPhoneAsYouType } from "../lib/phone-validation";

if (typeof window !== "undefined" && (window as any).__traceLog) (window as any).__traceLog("init-auth-globals.ts running");
(window as any).initPageSizeToggle = initPageSizeToggle;
(window as any).validatePhone = validatePhone;
(window as any).formatPhoneAsYouType = formatPhoneAsYouType;
