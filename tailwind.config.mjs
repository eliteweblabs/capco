/** @type {import('tailwindcss').Config} */

export default {
  content: ["./src/**/*.{astro,js,ts,jsx,tsx,vue,svelte}", "./node_modules/flowbite/**/*.js"],
  darkMode: "class", // Esto permite usar 'dark:' en clases
  safelist: [
    // Drawer animation classes
    "translate-x-full",
    "translate-x-0",
    "-translate-x-full",
    // Flowbite drawer classes
    "data-drawer-target",
    "data-drawer-toggle",
    "data-drawer-hide",
    "data-drawer-backdrop",
    "data-drawer-placement",
  ],
  theme: {
    extend: {
      //      ### Fonts
      fontFamily: {
        // #### Headings, Call- to - actions, Header Navigation
        sans: ['"Outfit Variable"', "sans-serif"], // Usando la fuente personalizada
        // #### Body
        // "serif": ['"Open Sans"', "serif"], // Otra fuente para el cuerpo
      },

      fontSize: {
        // #### Body Copy
        body: "14px",
      },
      colors: {
        // Text Colors
        black: "#171717", // Default text (black)
        white: "#fafafa", // Default text (white for dark mode)
        gray: {
          600: "#525252", // Secondary text (gray)
          400: "#a3a3a3", // Secondary text (dark mode)
        },
        // Brand Colors - Our purple theme
        primary: {
          50: "#f3f0ff",
          100: "#e9e3ff",
          200: "#d6ccff",
          300: "#b8a6ff",
          400: "#9375ff",
          500: "#825BDD", // Main primary
          600: "#6b3dd1",
          700: "#5327BA", // Main secondary
          800: "#4520a0",
          900: "#3a1a85",
          950: "#230e5a",
        },
        secondary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },

        // Semantic Colors
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },

        // Neutral Colors
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },

        // Background Colors
        background: {
          light: "#fafafa",
          dark: "#0a0a0a",
          card: "#fafafa",
          "card-dark": "#171717",
        },

        // Text Colors
        text: {
          primary: "#171717",
          "primary-dark": "#fafafa",
          secondary: "#525252",
          "secondary-dark": "#a3a3a3",
          muted: "#737373",
          "muted-dark": "#737373",
        },

        // Border Colors
        border: {
          light: "#e5e5e5",
          dark: "#404040",
          muted: "#f5f5f5",
          "muted-dark": "#262626",
        },

        // Icon Colors
        icon: {
          primary: "#6E6E6E",
          "primary-dark": "#a3a3a3",
          secondary: "#737373",
          "secondary-dark": "#737373",
        },
      },
      backgroundImage: {
        "btn-gradient": "linear-gradient(to right, #825BDD, #5327BA)", // Gradiente para botones
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("flowbite/plugin"),
  ],
};
