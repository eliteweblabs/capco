/**
 * Generate colors.css from GLOBAL_COLOR_PRIMARY environment variable
 * Run this before build or when primary color changes
 */

import { generateColorPalette } from "../color-generator.js";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get primary color from environment or use default
const primaryColor = process.env.GLOBAL_COLOR_PRIMARY || "#825BDD";
const secondaryColor = process.env.GLOBAL_COLOR_SECONDARY || "#0ea5e9";

console.log("🎨 Generating colors.css...");
console.log("   Primary Color:", primaryColor);
console.log("   Secondary Color:", secondaryColor);

// Generate color palettes
const primaryPalette = generateColorPalette(primaryColor);
const secondaryPalette = generateColorPalette(secondaryColor);

// Generate CSS content
const cssContent = `/* Global Color System - CSS Custom Properties */
/* Auto-generated from GLOBAL_COLOR_PRIMARY: ${primaryColor} */
/* Last generated: ${new Date().toISOString()} */

:root {
  /* Brand Colors - Primary */
  --color-primary-50: ${primaryPalette[50]};
  --color-primary-100: ${primaryPalette[100]};
  --color-primary-200: ${primaryPalette[200]};
  --color-primary-300: ${primaryPalette[300]};
  --color-primary-400: ${primaryPalette[400]};
  --color-primary-500: ${primaryPalette[500]};
  --color-primary-600: ${primaryPalette[600]};
  --color-primary-700: ${primaryPalette[700]};
  --color-primary-800: ${primaryPalette[800]};
  --color-primary-900: ${primaryPalette[900]};
  --color-primary-950: ${primaryPalette[950]};

  /* Brand Colors - Secondary */
  --color-secondary-50: ${secondaryPalette[50]};
  --color-secondary-100: ${secondaryPalette[100]};
  --color-secondary-200: ${secondaryPalette[200]};
  --color-secondary-300: ${secondaryPalette[300]};
  --color-secondary-400: ${secondaryPalette[400]};
  --color-secondary-500: ${secondaryPalette[500]};
  --color-secondary-600: ${secondaryPalette[600]};
  --color-secondary-700: ${secondaryPalette[700]};
  --color-secondary-800: ${secondaryPalette[800]};
  --color-secondary-900: ${secondaryPalette[900]};
  --color-secondary-950: ${secondaryPalette[950]};

  /* Semantic Colors */
  --color-success-50: #f0fdf4;
  --color-success-100: #dcfce7;
  --color-success-200: #bbf7d0;
  --color-success-300: #86efac;
  --color-success-400: #4ade80;
  --color-success-500: #22c55e;
  --color-success-600: #16a34a;
  --color-success-700: #15803d;
  --color-success-800: #166534;
  --color-success-900: #14532d;
  --color-success-950: #052e16;

  --color-warning-50: #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-200: #fde68a;
  --color-warning-300: #fcd34d;
  --color-warning-400: #fbbf24;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  --color-warning-700: #b45309;
  --color-warning-800: #92400e;
  --color-warning-900: #78350f;
  --color-warning-950: #451a03;

  --color-danger-50: #fef2f2;
  --color-danger-100: #fee2e2;
  --color-danger-200: #fecaca;
  --color-danger-300: #fca5a5;
  --color-danger-400: #f87171;
  --color-danger-500: #ef4444;
  --color-danger-600: #dc2626;
  --color-danger-700: #b91c1c;
  --color-danger-800: #991b1b;
  --color-danger-900: #7f1d1d;
  --color-danger-950: #450a0a;

  /* Neutral Colors */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;
  --color-neutral-950: #0a0a0a;

  /* Light Theme Colors */
  --color-background: #ffffff;
  --color-background-secondary: #fafafa;
  --color-background-tertiary: #f5f5f5;
  --color-background-card: #ffffff;

  --color-text-primary: #171717;
  --color-text-secondary: #525252;
  --color-text-muted: #737373;
  --color-text-inverse: #ffffff;

  --color-border-primary: #e5e5e5;
  --color-border-secondary: #f5f5f5;
  --color-border-muted: #fafafa;

  --color-icon-primary: #6e6e6e;
  --color-icon-secondary: #737373;
  --color-icon-muted: #a3a3a3;
}

/* Dark Theme Colors */
.dark {
  --color-background: #0a0a0a;
  --color-background-secondary: #171717;
  --color-background-tertiary: #262626;
  --color-background-card: #171717;

  --color-text-primary: #fafafa;
  --color-text-secondary: #a3a3a3;
  --color-text-muted: #737373;
  --color-text-inverse: #171717;

  --color-border-primary: #404040;
  --color-border-secondary: #262626;
  --color-border-muted: #171717;

  --color-icon-primary: #a3a3a3;
  --color-icon-secondary: #737373;
  --color-icon-muted: #525252;
}

/* Utility Classes for Global Colors */
.bg-global {
  background-color: var(--color-background);
}

.bg-global-secondary {
  background-color: var(--color-background-secondary);
}

.bg-global-tertiary {
  background-color: var(--color-background-tertiary);
}

.bg-global-card {
  background-color: var(--color-background-card);
}

.text-global-primary {
  color: var(--color-text-primary);
}

.text-global-secondary {
  color: var(--color-text-secondary);
}

.text-global-muted {
  color: var(--color-text-muted);
}

.text-global-inverse {
  color: var(--color-text-inverse);
}

.border-global-primary {
  border-color: var(--color-border-primary);
}

.border-global-secondary {
  border-color: var(--color-border-secondary);
}

.border-global-muted {
  border-color: var(--color-border-muted);
}

.icon-global-primary {
  color: var(--color-icon-primary);
}

.icon-global-secondary {
  color: var(--color-icon-secondary);
}

.icon-global-muted {
  color: var(--color-icon-muted);
}

/* Brand Color Utilities */
.bg-primary {
  background-color: var(--color-primary-500);
}

.bg-primary-light {
  background-color: var(--color-primary-100);
}

.bg-primary-dark {
  background-color: var(--color-primary-700);
}

.text-primary {
  color: var(--color-primary-500);
}

.text-primary-light {
  color: var(--color-primary-300);
}

.text-primary-dark {
  color: var(--color-primary-700);
}

.border-primary {
  border-color: var(--color-primary-500);
}

/* Hover States */
.hover-bg-primary:hover {
  background-color: var(--color-primary-600);
}

.hover-text-primary:hover {
  color: var(--color-primary-600);
}

.hover-border-primary:hover {
  border-color: var(--color-primary-600);
}
`;

// Write to colors.css
const outputPath = join(__dirname, "../src/styles/colors.css");
writeFileSync(outputPath, cssContent, "utf-8");

console.log("✅ colors.css generated successfully!");
console.log("   Output:", outputPath);
