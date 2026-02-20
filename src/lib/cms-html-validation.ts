/**
 * CMS HTML Injection Validation
 *
 * Validates content that gets injected with set:html (customCss, customFooterHtml, etc.)
 * to prevent malformed or dangerous content from breaking the page or enabling XSS.
 *
 * Rejects content containing patterns that could:
 * - Break out of the containing tag (e.g. </style>, </script>)
 * - Corrupt HTML structure (-->, <!--)
 * - Inject scripts (javascript:, <script)
 */

/** Fields that are injected with set:html and require validation */
export const HTML_INJECTED_KEYS = ["customCss", "customFooterHtml", "plausibleTrackingScript"] as const;

/** Patterns that break HTML when injected - key = which field they apply to */
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; name: string; keys: string[] }> = [
  // customCss: breaks out of <style> - rest leaks into HTML
  { pattern: /<\/style>/gi, name: "</style>", keys: ["customCss"] },
  // HTML-injected fields: break page structure or XSS
  { pattern: /<\/script>/gi, name: "</script>", keys: ["customFooterHtml", "plausibleTrackingScript"] },
  { pattern: /-->/g, name: "-->", keys: ["customFooterHtml", "plausibleTrackingScript"] },
  { pattern: /<!--/g, name: "<!--", keys: ["customFooterHtml", "plausibleTrackingScript"] },
  { pattern: /<script\b/gi, name: "<script", keys: ["customFooterHtml", "plausibleTrackingScript"] },
  { pattern: /javascript:/gi, name: "javascript:", keys: ["customFooterHtml", "plausibleTrackingScript"] },
  // JSX/React fragments (from copy-paste) - corrupt output
  { pattern: /\{\s*\/\*/g, name: "{/*", keys: ["customCss", "customFooterHtml", "plausibleTrackingScript"] },
  { pattern: /\*\/\s*\}/g, name: "*/}", keys: ["customCss", "customFooterHtml", "plausibleTrackingScript"] },
];

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ key: string; pattern: string; message: string }>;
}

/**
 * Validate a value destined for set:html injection.
 * Returns validation result with any errors.
 */
export function validateHtmlInjectedContent(
  key: string,
  value: string | null | undefined
): ValidationResult {
  const errors: ValidationResult["errors"] = [];

  if (value == null || typeof value !== "string") {
    return { valid: true, errors: [] };
  }

  const trimmed = value.trim();
  if (!trimmed) return { valid: true, errors };

  for (const { pattern, name, keys } of DANGEROUS_PATTERNS) {
    if (!keys.includes(key)) continue;
    pattern.lastIndex = 0; // Reset for global regex
    if (pattern.test(trimmed)) {
      errors.push({
        key,
        pattern: name,
        message: `Content contains "${name}" which can break the page or cause security issues. Please remove it.`,
      });
      break; // One error per key is enough
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all HTML-injected settings before save.
 * Call this before persisting to database.
 */
export function validateSettingsForHtmlInjection(
  settings: Record<string, unknown>
): ValidationResult {
  const allErrors: ValidationResult["errors"] = [];

  for (const key of HTML_INJECTED_KEYS) {
    const value = settings[key];
    if (value == null) continue;

    const result = validateHtmlInjectedContent(key, value as string);
    if (!result.valid) {
      allErrors.push(...result.errors);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
