# Custom classes that could use Tailwind

Audit of custom CSS classes that have Tailwind equivalents or could be expressed via Tailwind (theme/plugin). Use this as a refactor checklist.

---

## 1. `src/styles/global.css`

### Easy Tailwind equivalents (replace class + remove CSS)

| Custom class | Tailwind equivalent | Notes |
|--------------|--------------------|--------|
| `.bg-transparent` | `bg-transparent` | Tailwind built-in. Remove custom rule. |
| `.no-scrollbar` | `scrollbar-hide` | **Done:** all usages now use `scrollbar-hide`; `.no-scrollbar` block removed from global.css. |
| `.input-wrapper` (layout only) | `inline-block relative` | If you only need positioning, use these utilities. Keep the class if it’s used for JS selectors or more complex styling. |

### Theme/plugin candidates (need Tailwind config)

These use CSS variables and dark mode. You can either keep them as custom classes or add Tailwind theme values that use the same vars.

| Custom class | Tailwind approach |
|--------------|--------------------|
| `.color-background` | Add to theme: `background: { DEFAULT: 'rgb(var(--color-background))', dark: 'rgb(var(--color-background-dark))' }` then use `bg-background` + `dark:bg-background-dark`, or a single utility that uses the var (e.g. plugin adding `bg-page`). |
| `.color-background-20` / `-50` / `-80` | Same idea with opacity: e.g. `bg-background/20`, `bg-background/50`, `bg-background/80` if `background` is in theme with the right var. |
| `.color-border` | Add border color in theme from `var(--color-border)` / `var(--color-border-dark)` and use `border-border` (or similar name) with `dark:border-border-dark`. |

**Recommendation:**  
- **Do now:** Replace `no-scrollbar` → `scrollbar-hide` everywhere and remove `.no-scrollbar` from global.css (plugin already exists).  
- **Do now:** Remove `.bg-transparent` from global.css and use `bg-transparent` in markup (or rely on Tailwind’s default).  
- **Later (optional):** Move `color-background` / `color-border` into Tailwind theme so you use e.g. `bg-page`, `border-page` and drop the custom classes.

---

## 2. `src/styles/colors.css`

These are semantic utilities using the same CSS variables. They can be mirrored in Tailwind theme so you use utilities instead of custom classes.

| Custom class | Tailwind equivalent (after adding to theme) |
|--------------|--------------------------------------------|
| `.bg-global` | `bg-[var(--color-background)]` or theme `bg-background` |
| `.bg-global-secondary` | `bg-[var(--color-background-secondary)]` or theme |
| `.bg-global-tertiary` | `bg-[var(--color-background-tertiary)]` or theme |
| `.bg-global-card` | `bg-[var(--color-background-card)]` or theme |
| `.text-global-primary` | `text-[var(--color-text-primary)]` or theme |
| `.text-global-secondary` | `text-[var(--color-text-secondary)]` or theme |
| `.text-global-muted` | `text-[var(--color-text-muted)]` or theme |
| `.text-global-inverse` | `text-[var(--color-text-inverse)]` or theme |
| `.border-global-primary` | `border-[var(--color-border-primary)]` or theme |
| `.border-global-secondary` | `border-[var(--color-border-secondary)]` or theme |
| `.border-global-muted` | `border-[var(--color-border-muted)]` or theme |
| `.icon-global-primary` | `text-[var(--color-icon-primary)]` or theme |
| `.icon-global-secondary` | `text-[var(--color-icon-secondary)]` or theme |
| `.icon-global-muted` | `text-[var(--color-icon-muted)]` or theme |
| `.bg-primary` | Tailwind already has `bg-primary` (uses `var(--color-primary-500)`). Could remove from colors.css if redundant. |
| `.bg-primary-light` | `bg-primary-100` (already in theme) |
| `.bg-primary-dark` | `bg-primary-700` (already in theme) |
| `.text-primary` | `text-primary` (already in theme) |
| `.text-primary-light` | `text-primary-300` |
| `.text-primary-dark` | `text-primary-700` |
| `.border-primary` | `border-primary` (already in theme) |
| `.hover-bg-primary:hover` | `hover:bg-primary-600` |
| `.hover-text-primary:hover` | `hover:text-primary-600` |
| `.hover-border-primary:hover` | `hover:border-primary-600` |

If you extend `tailwind.config.mjs` with a `background`, `border`, `text` (and optionally `icon`) palette that point at these CSS variables, you can use only Tailwind classes and eventually remove the custom color utilities from colors.css.

---

## 3. `src/components/booth/css/main.css`

Many of these are one-to-one Tailwind utilities. Replacing them would let you delete large parts of this file (or the whole file if the booth is refactored to Tailwind).

### Layout / display

| Custom class | Tailwind equivalent |
|--------------|----------------------|
| `.clickable` | `cursor-pointer` |
| `.hide` | `hidden` or `!hidden` (Tailwind uses `display: none`; use `!hidden` if you need `!important`) |
| `.text-center` | `text-center` |
| `.text-left` | `text-left` |
| `.text-right` | `text-right` |
| `.text-upper` | `uppercase` |
| `.bg-cover` | `bg-cover` (Tailwind: `background-size: cover`) |
| `.w100` | `w-full` |
| `.h25` | `h-[25px]` |
| `.p-rel` | `relative` |
| `.p-abs` | `absolute` |
| `.p-0-0` | `top-0 left-0` |
| `.p-abs-full` | `absolute inset-0` |
| `.z-1` | `z-[1]` or add `zIndex: { 1: '1' }` in theme (you already have `zIndex.1`) |
| `.z-10` | `z-10` |
| `.z-20` | `z-20` |
| `.z-30` | `z-30` |
| `.z-100` | `z-100` (you have this in tailwind.config) |
| `.m-0` | `m-0` |
| `.m-15` | `m-[15px]` |
| `.m-t-15` | `mt-[15px]` |
| `.m-tl-15` | `mt-[15px] ml-[15px]` |
| `.pad-15` | `p-[15px]` |

### Flexbox

| Custom class | Tailwind equivalent |
|--------------|----------------------|
| `.flex-v` | `flex flex-col` |
| `.flex-h` | `flex flex-row` |
| `.flex-1` | `flex-1` |
| `.flex-100` | `flex-[100%]` or `min-w-0 flex-1` as needed |
| `.flex-a-start` | `items-start` |
| `.flex-a-center` | `items-center` |
| `.flex-a-stretch` | `items-stretch` |
| `.flex-a-end` | `items-end` |
| `.flex-j-start` | `justify-start` |
| `.flex-j-center` | `justify-center` |
| `.flex-j-between` | `justify-between` |
| `.flex-j-around` | `justify-around` |
| `.flex-j-end` | `justify-end` |
| `.flex-wrap` | `flex-wrap` |
| `.flex-wrap-phone` | `flex-wrap` inside `max-sm:` (or custom breakpoint 560px) |
| `.flex-h-desktop` | `flex flex-col sm:flex-row` (if 560px ≈ `sm`) |
| `.hide-phone` | `hidden sm:block` (or custom breakpoint) |
| `.only-desktop` | `hidden sm:block` |
| `.only-phone` | `block sm:hidden` |
| `.hide-tablet` | `hidden md:block` (or custom 740px breakpoint) |
| `.flex-wrap-tablet` | `flex-wrap` at tablet breakpoint |

### Other booth classes

- `.dark-bg` → `bg-[#1f1f1f]` or a theme color.
- `.separator` / `.separator-2` → `h-[15px]` / `h-[30px]`.
- `.ca-section` → Tailwind: `box-border pr-[15px] pl-[15px] w-full max-w-[1110px]` (or add a container utility).

The rest of `main.css` (buttons, inputs, accordion, toast, gallery, video, etc.) are component-level styles. Those can stay as custom classes or be gradually reimplemented with Tailwind + components.

---

## 4. Summary – quick wins

1. ~~**Replace `no-scrollbar` with `scrollbar-hide`**~~ **Done.**
2. ~~**Remove `.bg-transparent`** from `global.css`~~ **Done.** (Markup already uses Tailwind’s `bg-transparent` where needed.)
3. **Booth:** When touching booth UI, prefer Tailwind utilities (e.g. `flex flex-col`, `items-center`, `justify-between`, `relative`, `absolute inset-0`, `cursor-pointer`, `uppercase`, `w-full`, `hidden`, `z-10`, etc.) instead of the custom classes in `main.css`. You can then remove those rules from `main.css` over time.
4. **Semantic colors:** If you want one system, extend the Tailwind theme with the same CSS variables used in `colors.css` and use Tailwind classes instead of `.bg-global`, `.text-global-primary`, etc.

---

## 5. Files using `no-scrollbar` (for swap to `scrollbar-hide`) — DONE

- `src/components/ui/App.astro`
- `src/components/ui/Aside.astro`
- `src/components/common/NotificationsModal.astro`
- `src/components/form/MultiStepForm.astro`
- `src/pages/api/global/global-classes.ts`
- `src/components/common/SlidingTabs.astro`
- `src/components/blocks/GalleryBlock.astro`
- `src/pages/admin/settings.astro`
- `src/scripts/inline-address-search.ts`
- `src/components/project/Dashboard.astro`
- `src/pages/project/__dashboard.astro`

After replacing, remove the “HIDE SCROLLBARS” block for `.no-scrollbar` in `src/styles/global.css` (lines ~1086–1096).
