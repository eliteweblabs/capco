# Inline Scripts and SSR Production Build

## Problem

On the **live (production)** site, component-level `<script is:inline>` blocks were not appearing in the HTML. On **local dev**, a script tag appeared right after the component (e.g. theme toggle). After deployment, view-source showed no script after the theme toggle button—so the script never ran and the feature broke.

This affected multiple components that rely on their own inline or bundled script.

## Root cause

With `output: "server"` (SSR), Astro’s production build does **not** emit component-level inline scripts in the same way as dev. Scripts that live inside child components (e.g. `ThemeToggle.astro`, `Navbar.astro`) may be bundled or omitted instead of being inlined in the HTML. So:

- **Dev:** Component scripts are injected (e.g. right after the component).
- **Production:** Those same scripts may be in a separate bundle (e.g. `/_astro/...js`) or not emitted at all. If the bundle fails to load (404, network, base path), every component that depended on it breaks.

## Fix pattern

**Put critical inline scripts in the root layout (App.astro), not in child components.**

- Scripts that are **in App.astro** with `is:inline` are part of the layout output and **are** present in the HTML on every page in production.
- Scripts that are **in a component** (e.g. ThemeToggle, Navbar) may not be inlined in production.

## What we did

- **Theme toggle:** The logic was moved from `ThemeToggle.astro` into `App.astro` as an `is:inline` script. `ThemeToggle.astro` is now markup-only (the button); the behavior lives in the layout so it is always emitted.

## For other broken components

If a component’s behavior breaks on live but works locally and its script is not in view-source:

1. Move the script (as `is:inline`) into **App.astro** near the other inline scripts, and have it target the component by `id` or `data-*` (same as theme toggle).
2. Or ensure the component’s script is loaded via a **layout-level** bundled script (e.g. imported in App.astro) so it’s in a chunk that is always requested and served.

## Verify after deploy

1. View page source on the live site.
2. Search for `theme-toggle` or the script’s behavior; the inline script should appear in the HTML.
3. Confirm the script runs (e.g. theme toggle works).
