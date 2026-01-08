/** @type {import('tailwindcss').Config} */

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Import color generation utility
import { generateColorPalette } from "./color-generator.js";

// Get primary color from environment variable or use default
const primaryColor = process.env.GLOBAL_COLOR_PRIMARY || "#825BDD";

// Get secondary color from environment variable or use default
const secondaryColor = process.env.GLOBAL_COLOR_SECONDARY || "#0ea5e9";

// Get font family from environment variable or use default
const fontFamily = process.env.FONT_FAMILY || "Outfit Variable";
const fontFamilyFallback = process.env.FONT_FAMILY_FALLBACK || "sans-serif";

// Generate complete color palettes automatically from the hex colors
const primaryColorPalette = generateColorPalette(primaryColor);
const secondaryColorPalette = generateColorPalette(secondaryColor);

// Debug: Log what color and font are being used
console.log("🎨 [TAILWIND] GLOBAL_COLOR_PRIMARY from env:", process.env.GLOBAL_COLOR_PRIMARY);
console.log("🎨 [TAILWIND] Using primary color:", primaryColor);
console.log("🎨 [TAILWIND] GLOBAL_COLOR_SECONDARY from env:", process.env.GLOBAL_COLOR_SECONDARY);
console.log("🎨 [TAILWIND] Using secondary color:", secondaryColor);
console.log("🎨 [TAILWIND] Generated primary palette:", primaryColorPalette);
console.log("🎨 [TAILWIND] Generated secondary palette:", secondaryColorPalette);
console.log("🎨 [TAILWIND] FONT_FAMILY from env:", process.env.FONT_FAMILY);
console.log("🎨 [TAILWIND] Using font family:", fontFamily);

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
    // Scroll snap utilities
    "snap-y",
    "snap-y-mandatory",
    "snap-y-proximity",
    "snap-start",
    "snap-end",
    "snap-center",
    "snap-align-none",
    // Sidebar classes
    "sm:ml-64",
    "ml-64",
    "p-4",
    "sm:translate-x-0",
    "translate-x-0",
    "-translate-x-full",
    "transition-transform",
    // Layout classes
    "flex",
    "overflow-hidden",
    "bg-gray-50",
    "pt-16",
    "dark:bg-gray-900",
  ],
  theme: {
    extend: {
      //      ### Fonts
      fontFamily: {
        // #### Headings, Call- to - actions, Header Navigation
        sans: [`"${fontFamily}"`, fontFamilyFallback], // Dynamic font from environment
        // #### Body
        // "serif": ['"Open Sans"', "serif"], // Otra fuente para el cuerpo
      },

      fontSize: {
        // #### Body Copy
        body: "14px",
      },
      zIndex: {
        '-1': '-1',
        '1': '1',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      colors: {
        // Text Colors
        black: "#171717", // Default text (black)
        white: "#ffffff", // Default text (white for dark mode)
        gray: {
          600: "#525252", // Secondary text (gray)
          400: "#a3a3a3", // Secondary text (dark mode)
        },
        // Brand Colors - Automatically generated from GLOBAL_COLOR_PRIMARY and GLOBAL_COLOR_SECONDARY environment variables
        primary: primaryColorPalette,
        secondary: secondaryColorPalette,

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

        // // Background Colors
        // background: {
        //   light: "#fafafa",
        //   dark: "#0a0a0a",
        //   card: "#fafafa",
        //   "card-dark": "#171717",
        // },

        // Text Colors
        // text: {
        //   primary: primaryColorPalette[500], // Use the actual primary color
        //   "primary-dark": "#fafafa",
        //   secondary: "#525252",
        //   "secondary-dark": "#a3a3a3",
        //   muted: "#737373",
        //   "muted-dark": "#737373",
        // },

        // Border Colors
        // border: {
        //   light: "#e5e5e5",
        //   dark: "#404040",
        //   muted: "#f5f5f5",
        //   "muted-dark": "#262626",
        // },

        // Add border support for custom colors
        red: {
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
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
        "btn-gradient": `linear-gradient(to right, ${primaryColorPalette[500]}, ${primaryColorPalette[700]})`, // Gradient for buttons - uses primary color palette
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("flowbite/plugin"),
    // Add scrollbar-hide utility
    function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-hide": {
          /* IE and Edge */
          "-ms-overflow-style": "none",
          /* Firefox */
          "scrollbar-width": "none",
          /* Safari and Chrome */
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      });
    },
  ],
};
