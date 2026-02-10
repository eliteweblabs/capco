/** @type {import('tailwindcss').Config} */

// Tailwind Configuration
// Colors and fonts are now managed via CMS global settings and injected as CSS variables at runtime
// This config uses CSS variables so values can be updated dynamically from the database
// See: src/components/common/App.astro for dynamic color/font injection

export default {
  content: ["./src/**/*.{astro,js,ts,jsx,tsx,vue,svelte}", "./node_modules/flowbite/**/*.js"],
  darkMode: "class", // Esto permite usar 'dark:' en clases
  safelist: [
    // Button size classes from button-styles.ts (dynamic strings can be missed by content scanner)
    "px-3.5",
    "py-2.5",
    // Button outline variant hover classes (ensure they're always generated)
    "hover:bg-primary-500",
    "hover:bg-primary-600",
    "hover:bg-primary-400",
    "hover:text-white",
    "dark:hover:bg-primary-400",
    "dark:hover:text-white",
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
    // Layout classes (including conditional centerContent in App.astro)
    "overscroll-y-contain",
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
        // #### Headings, Call-to-actions, Header Navigation
        // Use CSS variables so fonts can be updated dynamically from database
        sans: ['var(--font-family, "Outfit Variable")', "var(--font-family-secondary, sans-serif)"],
        // #### Secondary font only (use with font-secondary class)
        secondary: ["var(--font-family-secondary, sans-serif)"],
        // #### Body
        // "serif": ['"Open Sans"', "serif"], // Otra fuente para el cuerpo
      },

      fontSize: {
        // #### Body Copy
        body: "14px",
      },
      zIndex: {
        "-1": "-1",
        1: "1",
        50: "50",
        100: "100",
        200: "200",
        300: "300",
        400: "400",
        500: "500",
        600: "600",
        700: "700",
        800: "800",
        900: "900",
        1000: "1000",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      colors: {
        // Text Colors
        black: "#171717", // Default text (black)
        white: "#ffffff", // Default text (white for dark mode)
        gray: {
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
        // Brand Colors - Use CSS variables so they can be updated dynamically from database
        // These CSS variables are set in colors.css and can be overridden at runtime
        primary: {
          DEFAULT: "var(--color-primary-500)",
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
          950: "var(--color-primary-950)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary-500)",
          50: "var(--color-secondary-50)",
          100: "var(--color-secondary-100)",
          200: "var(--color-secondary-200)",
          300: "var(--color-secondary-300)",
          400: "var(--color-secondary-400)",
          500: "var(--color-secondary-500)",
          600: "var(--color-secondary-600)",
          700: "var(--color-secondary-700)",
          800: "var(--color-secondary-800)",
          900: "var(--color-secondary-900)",
          950: "var(--color-secondary-950)",
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
        "btn-gradient":
          "linear-gradient(to right, var(--color-primary-500), var(--color-primary-700))", // Gradient for buttons - uses CSS variables for dynamic updates
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
        // Custom shadow utilities with primary color using color-mix for opacity
        ".shadow-primary-sm": {
          "box-shadow": "0 1px 2px 0 color-mix(in srgb, var(--color-primary-500) 5%, transparent)",
        },
        ".shadow-primary": {
          "box-shadow":
            "0 1px 3px 0 color-mix(in srgb, var(--color-primary-500) 10%, transparent), 0 1px 2px -1px color-mix(in srgb, var(--color-primary-500) 10%, transparent)",
        },
        ".shadow-primary-md": {
          "box-shadow":
            "0 4px 6px -1px color-mix(in srgb, var(--color-primary-500) 10%, transparent), 0 2px 4px -2px color-mix(in srgb, var(--color-primary-500) 10%, transparent)",
        },
        ".shadow-primary-lg": {
          "box-shadow":
            "0 10px 15px -3px color-mix(in srgb, var(--color-primary-500) 10%, transparent), 0 4px 6px -4px color-mix(in srgb, var(--color-primary-500) 10%, transparent)",
        },
        ".shadow-primary-xl": {
          "box-shadow":
            "0 20px 25px -5px color-mix(in srgb, var(--color-primary-500) 10%, transparent), 0 8px 10px -6px color-mix(in srgb, var(--color-primary-500) 10%, transparent)",
        },
        ".shadow-primary-2xl": {
          "box-shadow":
            "0 25px 50px -12px color-mix(in srgb, var(--color-primary-500) 25%, transparent)",
        },
        // Inner shadow variants (equal on all sides)
        ".shadow-primary-inner-sm": {
          "box-shadow":
            "inset 0 0 3px 0 color-mix(in srgb, var(--color-primary-500) 7%, transparent)",
        },
        ".shadow-primary-inner": {
          "box-shadow":
            "inset 0 0 4px 0 color-mix(in srgb, var(--color-primary-500) 13%, transparent)",
        },
        ".shadow-primary-inner-md": {
          "box-shadow":
            "inset 0 0 8px 0 color-mix(in srgb, var(--color-primary-500) 13%, transparent)",
        },
        ".shadow-primary-inner-lg": {
          "box-shadow":
            "inset 0 0 20px 0 color-mix(in srgb, var(--color-primary-500) 13%, transparent)",
        },
        ".shadow-primary-inner-xl": {
          "box-shadow":
            "inset 0 0 32px 0 color-mix(in srgb, var(--color-primary-500) 13%, transparent)",
        },
        ".shadow-primary-inner-2xl": {
          "box-shadow":
            "inset 0 0 65px 0 color-mix(in srgb, var(--color-primary-500) 32%, transparent)",
        },
      });
    },
  ],
};
