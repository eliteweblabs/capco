/** @type {import("prettier").Config} */
export default {
  // Tailwind plugin must be last (https://tailwindcss.com/blog/automatic-class-sorting-with-prettier)
  plugins: ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  tailwindConfig: "./tailwind.config.mjs",
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  printWidth: 100,
  overrides: [
    {
      files: "*.astro",
      options: { parser: "astro" },
    },
    {
      files: "*.css",
      options: { parser: "css" },
    },
    {
      files: "*.html",
      options: {
        parser: "html",
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
