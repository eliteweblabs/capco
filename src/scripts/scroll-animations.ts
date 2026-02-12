/**
 * Scroll Animations Utility
 *
 * Uses Intersection Observer to add blur/scale/fade animations
 * when elements scroll into view.
 *
 * Usage:
 * - Add data-animate="fade-blur-scale" to elements
 * - Add data-animate-stagger to parent for staggered child animations
 * - Add data-animate-delay="200" for custom delays
 * - Add data-animate-duration="slow" for slower animations
 *
 * Animation types:
 * - fade-blur-scale (default): Blur + scale + fade
 * - fade-blur: Blur + fade
 * - fade-scale: Scale + fade
 * - fade-up: Slide up + fade
 * - fade-up-blur: Slide up + blur + fade
 * - fade-left: Slide from left + fade
 * - fade-right: Slide from right + fade
 * - zoom-blur: Large scale + blur
 * - fade: Simple fade only
 */

interface ScrollAnimationOptions {
  /** Threshold for triggering (0-1, default 0.1) */
  threshold?: number;
  /** Root margin for earlier/later triggering */
  rootMargin?: string;
  /** Only animate once (default true) */
  once?: boolean;
}

class ScrollAnimations {
  private observer: IntersectionObserver | null = null;
  private options: ScrollAnimationOptions;
  private initialized = false;

  constructor(options: ScrollAnimationOptions = {}) {
    this.options = {
      threshold: options.threshold ?? 0.1,
      rootMargin: options.rootMargin ?? "0px 0px -50px 0px",
      once: options.once ?? true,
    };
  }

  /**
   * Initialize the scroll animations
   */
  init(): void {
    if (this.initialized) return;

    // Check for reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.showAllElements();
      return;
    }

    this.createObserver();
    this.observeElements();
    this.initialized = true;
  }

  /**
   * Create the Intersection Observer
   */
  private createObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;

            // Add visible class with optional delay
            const delay = element.dataset.animateDelay;
            if (delay) {
              setTimeout(() => {
                element.classList.add("is-visible");
              }, parseInt(delay));
            } else {
              element.classList.add("is-visible");
            }

            // Stop observing if once is true
            if (this.options.once && this.observer) {
              this.observer.unobserve(element);
            }
          } else if (!this.options.once) {
            // Remove visible class if not once-only
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin,
      }
    );
  }

  /**
   * Find and observe all animated elements
   */
  private observeElements(): void {
    if (!this.observer) return;

    // Observe elements with data-animate
    const animatedElements = document.querySelectorAll("[data-animate]");
    animatedElements.forEach((el) => {
      this.observer!.observe(el);
    });

    // Observe stagger containers
    const staggerContainers = document.querySelectorAll("[data-animate-stagger]");
    staggerContainers.forEach((el) => {
      this.observer!.observe(el);
    });
  }

  /**
   * Show all elements immediately (for reduced motion)
   */
  private showAllElements(): void {
    const elements = document.querySelectorAll("[data-animate], [data-animate-stagger]");
    elements.forEach((el) => {
      el.classList.add("is-visible");
    });
  }

  /**
   * Refresh observer for dynamically added elements
   */
  refresh(): void {
    if (this.observer) {
      this.observeElements();
    }
  }

  /**
   * Destroy the observer
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.initialized = false;
    }
  }
}

// Auto-initialize on DOM ready
let scrollAnimationsInstance: ScrollAnimations | null = null;

function initScrollAnimations(options?: ScrollAnimationOptions): ScrollAnimations {
  if (!scrollAnimationsInstance) {
    scrollAnimationsInstance = new ScrollAnimations(options);
  }
  scrollAnimationsInstance.init();
  return scrollAnimationsInstance;
}

// Initialize when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initScrollAnimations());
  } else {
    initScrollAnimations();
  }
}

// SPA disabled: Re-initialize on Astro page transitions (defer so swap paints first)
// document.addEventListener("astro:page-load", () => {
//   requestAnimationFrame(() => {
//     if (scrollAnimationsInstance) {
//       scrollAnimationsInstance.refresh();
//     } else {
//       initScrollAnimations();
//     }
//   });
// });

// Export for manual usage
export { ScrollAnimations, initScrollAnimations };
export default initScrollAnimations;
