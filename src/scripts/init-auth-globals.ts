/**
 * Superseded by app-globals.ts (initPageSizeToggle, validatePhone, formatPhoneAsYouType).
 * Kept for reference; do not load from App.
 */
import { initPageSizeToggle } from "../lib/page-size-plugin";
import { validatePhone, formatPhoneAsYouType } from "../lib/phone-validation";

if (typeof window !== "undefined" && (window as any).__jsOrderLog) (window as any).__jsOrderLog("init-auth-globals");
(window as any).initPageSizeToggle = initPageSizeToggle;
(window as any).validatePhone = validatePhone;
(window as any).formatPhoneAsYouType = formatPhoneAsYouType;
