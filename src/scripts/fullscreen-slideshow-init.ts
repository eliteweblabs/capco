/**
 * Initialize FullScreenSlideshow - separate module to avoid import/define:vars conflicts
 * Reads config from data attributes on .fullscreen-slideshow elements
 */
import Swiper from "swiper";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

function initOne(root: HTMLElement) {
  if ((root as any).__swiperInitialized) return;
  (root as any).__swiperInitialized = true;

  const swiperEl = root.querySelector(".swiper-fullscreen");
  if (!swiperEl) return;

  const autoplayMs = parseInt(root.dataset.autoplayMs || "0", 10);
  const showNav = root.dataset.showNav !== "false";
  const showPagination = root.dataset.showPagination !== "false";

  const modules = [];
  if (showNav) modules.push(Navigation);
  if (showPagination) modules.push(Pagination);
  if (autoplayMs > 0) modules.push(Autoplay);

  new Swiper(swiperEl, {
    modules,
    loop: true,
    grabCursor: true,
    speed: 600,
    ...(autoplayMs > 0
      ? { autoplay: { delay: autoplayMs, disableOnInteraction: false } }
      : {}),
    ...(showPagination
      ? {
          pagination: {
            el: swiperEl.querySelector(".swiper-pagination-fullscreen"),
            clickable: true,
          },
        }
      : {}),
    ...(showNav
      ? {
          navigation: {
            nextEl: swiperEl.querySelector(".swiper-button-next"),
            prevEl: swiperEl.querySelector(".swiper-button-prev"),
          },
        }
      : {}),
    keyboard: { enabled: true },
  });
}

export function initFullScreenSlideshows() {
  document.querySelectorAll<HTMLElement>(".fullscreen-slideshow").forEach(initOne);
}
