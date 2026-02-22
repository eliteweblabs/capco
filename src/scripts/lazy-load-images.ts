/**
 * Global Lazy Loading Utility for Images
 * Astro-native IntersectionObserver-based lazy loading
 * Zero dependencies, works with any img element that has:
 * - class="lazyload"
 * - data-src="actual-image-url"
 */

if (typeof window !== "undefined" && (window as any).__jsOrderLog) (window as any).__jsOrderLog("lazy-load-images");

export function initLazyLoading() {
  if (typeof window === "undefined") return;

  const lazyImages = document.querySelectorAll("img.lazyload");

  if (!lazyImages.length) return;

  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.getAttribute("data-src");

            if (src) {
              img.src = src;
              const srcset = img.getAttribute("data-srcset");
              if (srcset) {
                img.srcset = srcset;
              }
              img.classList.add("lazyloading");

              img.onload = () => {
                img.classList.remove("lazyload", "lazyloading", "blur-sm");
                img.classList.add("lazyloaded");
              };

              img.onerror = () => {
                img.classList.remove("lazyload", "lazyloading");
                img.classList.add("lazyerror");
              };
            }

            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: "50px 0px", // Start loading 50px before visible
        threshold: 0.01,
      }
    );

    lazyImages.forEach((img) => imageObserver.observe(img));
  } else {
    // Fallback for older browsers - load all images immediately
    lazyImages.forEach((img) => {
      const el = img as HTMLImageElement;
      const src = el.getAttribute("data-src");
      if (src) {
        el.src = src;
        const srcset = el.getAttribute("data-srcset");
        if (srcset) el.srcset = srcset;
      }
    });
  }
}

// Auto-initialize on DOMContentLoaded
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLazyLoading);
  } else {
    // DOM already loaded
    initLazyLoading();
  }
}
