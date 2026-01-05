/**
 * PDF System Plugin Configuration
 *
 * Copy this file and customize it for your project, or use environment variables
 * to override these defaults. See README.md for setup instructions.
 */

export interface PDFSystemConfig {
  // Storage Settings
  saveHtmlTemplates: boolean;
  templatesDirectory: string;

  // API Endpoints (relative paths)
  api: {
    templates: {
      list: string;
      upsert: string;
      delete: string;
    };
    generate: string;
    upsert: string;
  };

  // Supabase Settings
  supabase: {
    storageBucket: string;
    templatesTable: string;
    jobsTable: string;
  };

  // PDF Generation Settings
  pdf: {
    defaultPageSize: string;
    defaultOrientation: "portrait" | "landscape";
    defaultMargins: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
  };

  // Feature Flags
  features: {
    encryption: boolean;
    htmlPreview: boolean;
    googleContacts: boolean;
    ocr: boolean;
  };
}

/**
 * Default configuration
 * Override with environment variables or custom config
 */
export const defaultConfig: PDFSystemConfig = {
  saveHtmlTemplates: process.env.SAVE_HTML_TEMPLATES === "true" || false,
  templatesDirectory: process.env.PDF_TEMPLATES_DIR || "src/features/pdf-system/templates",

  api: {
    templates: {
      list: "/api/pdf/templates",
      upsert: "/api/pdf/templates/upsert",
      delete: "/api/pdf/templates",
    },
    generate: "/api/pdf/generate",
    upsert: "/api/pdf/upsert",
  },

  supabase: {
    storageBucket: process.env.PDF_STORAGE_BUCKET || "project-media",
    templatesTable: process.env.PDF_TEMPLATES_TABLE || "pdfTemplates",
    jobsTable: process.env.PDF_JOBS_TABLE || "pdfGenerationJobs",
  },

  pdf: {
    defaultPageSize: process.env.PDF_DEFAULT_PAGE_SIZE || "8.5x11",
    defaultOrientation:
      (process.env.PDF_DEFAULT_ORIENTATION as "portrait" | "landscape") || "portrait",
    defaultMargins: {
      top: process.env.PDF_MARGIN_TOP || "1in",
      right: process.env.PDF_MARGIN_RIGHT || "1in",
      bottom: process.env.PDF_MARGIN_BOTTOM || "1in",
      left: process.env.PDF_MARGIN_LEFT || "1in",
    },
  },

  features: {
    encryption: process.env.PDF_ENABLE_ENCRYPTION !== "false",
    htmlPreview: process.env.PDF_ENABLE_HTML_PREVIEW !== "false",
    googleContacts: process.env.PDF_ENABLE_GOOGLE_CONTACTS !== "false",
    ocr: process.env.PDF_ENABLE_OCR !== "false",
  },
};

/**
 * Load configuration from environment variables or custom config
 * Call this function and pass a custom config object to override defaults
 */
export function loadConfig(customConfig?: Partial<PDFSystemConfig>): PDFSystemConfig {
  const envConfig: Partial<PDFSystemConfig> = {
    saveHtmlTemplates: process.env.SAVE_HTML_TEMPLATES === "true" || false,
    templatesDirectory: process.env.PDF_TEMPLATES_DIR || undefined,
    supabase: {
      storageBucket: process.env.PDF_STORAGE_BUCKET || "",
      templatesTable: process.env.PDF_TEMPLATES_TABLE || "",
      jobsTable: process.env.PDF_JOBS_TABLE || "",
    },
    pdf: {
      defaultPageSize: process.env.PDF_DEFAULT_PAGE_SIZE || "",
      defaultOrientation:
        (process.env.PDF_DEFAULT_ORIENTATION as "portrait" | "landscape") || "portrait",
      defaultMargins: {
        top: process.env.PDF_MARGIN_TOP || "",
        right: process.env.PDF_MARGIN_RIGHT || "",
        bottom: process.env.PDF_MARGIN_BOTTOM || "",
        left: process.env.PDF_MARGIN_LEFT || "",
      },
    },
    features: {
      encryption: process.env.PDF_ENABLE_ENCRYPTION !== "false",
      htmlPreview: process.env.PDF_ENABLE_HTML_PREVIEW !== "false",
      googleContacts: process.env.PDF_ENABLE_GOOGLE_CONTACTS !== "false",
      ocr: process.env.PDF_ENABLE_OCR !== "false",
    },
  };

  // Deep merge with custom config taking precedence
  return {
    ...defaultConfig,
    ...deepMerge(envConfig, customConfig || {}),
  };
}

/**
 * Deep merge utility for configuration objects
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key]) && isObject(target[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === "object" && !Array.isArray(item);
}
