# Astro 4 Downgrade

## Why

Astro 5 production build generated empty chunks for many component scripts, breaking features (theme toggle, forms, dropdowns, etc.) in production while working in dev. Downgraded to Astro 4.15.12 to avoid this.

## Versions (pinned)

| Package           | Version   |
|------------------|-----------|
| astro            | 4.15.12   |
| @astrojs/node    | 8.3.4     |
| @astrojs/react   | ^3.6.0    |
| @astrojs/check   | ^0.8.3    |
| @astrojs/tailwind| ^5.1.1    |

## Install

Use `--legacy-peer-deps` because @astrojs/react 3.x expects @types/react ^18 while this project uses React 19:

```bash
npm install --legacy-peer-deps
```

Or add to `.npmrc`:
```
legacy-peer-deps=true
```

## Config changes

- **Removed** `experimental.preserveScriptOrder` (Astro 5.5+ only)
- **Build target** set to `es2022` (top-level await in deps requires it; previously es2018 for iOS 12)

## If you upgrade back to Astro 5

1. Restore astro ^5.x, @astrojs/node ^9.x, @astrojs/react ^4.x, @astrojs/check ^0.9.x
2. Add back `experimental.preserveScriptOrder: true`
3. Consider `target: "es2018"` again if supporting very old Safari
4. Expect empty-chunk warnings; use inline scripts or external .ts for critical behavior (see ASTRO5-EMPTY-CHUNKS-FORMS.md)
