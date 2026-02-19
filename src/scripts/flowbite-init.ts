/**
 * Flowbite initialization - runs on client only.
 * Replaces CDN script to avoid CSP blocking and ensure consistent version (npm).
 */
import { initFlowbite } from "flowbite";

function run() {
  initFlowbite();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", run);
} else {
  run();
}
