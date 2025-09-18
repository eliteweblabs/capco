/** @type {import("prettier").Config} */
export default {
  plugins: ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  printWidth: 100,
  overrides: [
    {
      files: "*.astro, *.css, *.js, *.ts, *.json, *.md",
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
  ],
};
