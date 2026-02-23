/**
 * Standalone entry bundling hold-progress, scroll-animations, lazy-load-images, project-item-handlers.
 * Pre-bundled to avoid Astro chunk 500 and "Cannot use import statement outside a module" errors.
 * Each module auto-initializes on import (DOMContentLoaded or immediately if already loaded).
 */
import "../scripts/hold-progress-init";
import "../scripts/scroll-animations";
import "../scripts/lazy-load-images";
import "../scripts/project-item-handlers";
