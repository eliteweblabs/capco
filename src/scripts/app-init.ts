/**
 * Pre-bundled entry for theme, notification, typewriter.
 * app-globals and auth-google have Node/import.meta deps - loaded via Astro.
 */
import "./theme-init";
import {
  initializeNotificationCount,
  loadNotificationCount,
  refreshNotificationCount,
  updateNotificationBellCount,
} from "../lib/notification-count-loader";
import {
  initTypewriterTexts,
  triggerActiveStepTypewriter,
  skipActiveTypewriterToEnd,
} from "./typewriter-text";

(window as any).initializeNotificationCount = initializeNotificationCount;
(window as any).updateNotificationBellCount = updateNotificationBellCount;
(window as any).loadNotificationCount = loadNotificationCount;
(window as any).refreshNotificationCount = refreshNotificationCount;
(window as any).initTypewriterTexts = initTypewriterTexts;
(window as any).triggerActiveStepTypewriter = triggerActiveStepTypewriter;
(window as any).skipActiveTypewriterToEnd = skipActiveTypewriterToEnd;
