/** @type {import("prettier").Config} */
export default {
  plugins: [
    "prettier-plugin-astro",
    "prettier-plugin-tailwindcss", // must be last
  ],
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  printWidth: 100,
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
        plugins: ["prettier-plugin-astro"],
      },
    },
    {
      files: "*.css",
      options: {
        plugins: ["prettier-plugin-tailwindcss"],
      },
    },
    // Attribute alphabetical order only for standalone HTML (organize-attributes breaks Astro/MD)
    {
      files: "*.html",
      options: {
        plugins: [
          "prettier-plugin-organize-attributes",
          "prettier-plugin-tailwindcss",
        ],
        attributeGroups: ["$DEFAULT"],
        attributeSort: "ASC",
      },
    },
  ],
};
