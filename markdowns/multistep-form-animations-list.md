# MultiStepForm – All animations (CSS + JS)

## CSS (MultiStepForm.astro)

| What | Where | Effect |
|------|--------|--------|
| **Progress bar** | Progress bar container | `transition-opacity duration-300` |
| **Step indicator dots** | `.step-indicator` | `transition-all duration-300` |
| **Step progress line** | `.step-progress-line` | `transition-all duration-500 ease-out` |
| **Title scroll fade** | `.title-scroll-fade-top` | `transition: opacity 0.3s ease` |
| **Content reveal (typewriter)** | `.step-content` inputs/buttons | `transition: opacity 0.4s ease-out, transform 0.4s ease-out` — from `translateY(20px)` to `0` when `.typewriter-complete` |
| **Focus shadow** | `input/textarea/select` | `transition: box-shadow 250ms ease-in-out` |
| **initial-load** | `.step-content.active.initial-load` | `animation: none` (disables slide) |
| **sliding-in-from-above** | `.step-content.active.sliding-in-from-above` | **`animation: slideFromAboveTypewriter 600ms ease-out forwards`** ← can fight with wrapper scroll on Back |
| **slideToTypewriterPosition** | (commented out) | Was: from `translateY(60vh)` to `0` |
| **slideOutUpTypewriter** | (keyframes only, not applied) | — |
| **slideOutDownTypewriter** | (keyframes only, not applied) | — |
| **slideFromAboveTypewriter** | Used by `.sliding-in-from-above` | from `translateY(-40vh)` to `0` |
| **Step indicator pulse** | `.step-indicator.active` | `animation: pulse 2s infinite` |
| **Icon swap (valid)** | `.icon-valid` when `.is-valid` | `animation: iconSwapIn 300ms ease-out` (scale 0→1.2→1, rotate -90deg→0) |

## CSS (global.css)

| What | Where | Effect |
|------|--------|--------|
| **slideOutDown** | Animated placeholders (and refresh-manager) | translateY(0)→(20px), opacity 1→0 |
| **slideInDown** | Animated placeholders (and refresh-manager) | translateY(-20px)→0, opacity 0→1 |

## JS (MultiStepForm.astro)

| What | When | Effect |
|------|------|--------|
| **Staggered content reveal** | On `typewriter-complete` | Sets `transitionDelay = index * 0.1s` on inputs/buttons, adds `.typewriter-complete` |
| **Placeholder rotation** | `rotatePlaceholders()` every 2s | Inline `span.style.animation = "slideOutDown 400ms..."` then `"slideInDown 400ms..."` |
| **Placeholder reset** | `resetPlaceholderAnimation()` | Inline `span.style.animation = "slideInDown 400ms..."` |
| **Icon opacity** | Input-with-icon focus/blur | `svgElement.style.transition = "opacity 0.3s ease"` |

## JS (multi-step-form-handler.ts)

| What | When | Effect |
|------|------|--------|
| **Wrapper scroll** | After step change (next/back) | `stepsWrapper.scrollTo({ behavior: "smooth" })` |
| **Back: add sliding-in-from-above** | When `direction === "backward"` | Adds class that runs **slideFromAboveTypewriter** (600ms) on the target step |

---

## Likely cause of bounce on Back

On **Back**, two things run at once:

1. **Handler:** scrolls the wrapper so the previous step’s bottom lines up with the wrapper bottom (`scrollTo` with `behavior: "smooth"`).
2. **CSS:** `.sliding-in-from-above` runs **slideFromAboveTypewriter** (step moves from `translateY(-40vh)` to `0` over 600ms).

So the step is both **scrolled into place** and **transformed**. That can feel like a bounce or double motion. Fix: **stop adding `sliding-in-from-above` on backward** and rely only on the wrapper scroll.
