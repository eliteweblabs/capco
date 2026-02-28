# Project TODO

Items the team intends to work on. When asked "what's in the todo list" or similar, read this file and report its contents.

---

## BannerAlertsLoader scroll/translate UX (mobile)

**Status:** Backlog  
**File:** `src/features/banner-alert/components/BannerAlertsLoader.astro`

**Issue:** During scroll on mobile, both `scrollTop` and `translateY` move content together, which feels unnatural (double movement). The release into normal content scroll also feels like you have to force it.

**Attempted fixes (reverted):**
1. Consume scroll during reveal phase: reset `scrollTop` to 0 so only `translateY` drives content until reveal is complete.
2. Carry-over handoff: when delta would push `translateY` past max, cap it and carry excess into `scrollTop` for smoother transition.

**Outcome:** Reverted; neither approach felt right. Needs a different solution (e.g. wheel/touch event handling, or alternative scroll model).
