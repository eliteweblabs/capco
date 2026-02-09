/**
 * Expose auth/profile helpers on window so inline scripts (UserProfileDropdown, PhoneAndSMS)
 * can use them without importing. Prevents 404s when SPA merges HTML and browser
 * tries to resolve raw import paths like /lib/page-size-plugin.
 */
import { initPageSizeToggle } from "../lib/page-size-plugin";
import { validatePhone, formatPhoneAsYouType } from "../lib/phone-validation";

(window as any).initPageSizeToggle = initPageSizeToggle;
(window as any).validatePhone = validatePhone;
(window as any).formatPhoneAsYouType = formatPhoneAsYouType;
