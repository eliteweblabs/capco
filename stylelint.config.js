/**
 * Stylelint config: flag deprecated/non-standard CSS only.
 * Run: npm run lint:css
 *
 * For full style rules (whitespace, hex length, etc.) you could extend
 * "stylelint-config-standard" and fix existing files.
 * To add more deprecated properties, add to property-disallowed-list.
 */
export default {
  files: ["src/**/*.css"],
  ignoreFiles: ["**/node_modules/**", "**/dist/**", "**/_astro/**"],
  rules: {
    "property-disallowed-list": [
      [
        "/-webkit-overflow-scrolling/",
        "/-webkit-tap-highlight-color/",
      ],
      {
        message:
          "Deprecated or non-standard property. Prefer standard alternatives or remove.",
      },
    ],
  },
};
