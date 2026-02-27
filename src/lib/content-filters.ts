/**
 * Content filters for CMS-sourced text (title, description, content).
 * Decodes HTML entities so values like "Certifications &amp; Registrations"
 * display as "Certifications & Registrations" instead of literal &amp;.
 */

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#34;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
  "&#x2f;": "/",
};

/**
 * Decode common HTML entities in a string.
 * Safe for titles, descriptions, and HTML content that may be over-encoded by the CMS.
 */
export function decodeHtmlEntities(str: string): string {
  if (typeof str !== "string") return "";
  let out = str;
  for (const [entity, char] of Object.entries(ENTITY_MAP)) {
    out = out.split(entity).join(char);
  }
  // Numeric decimal: &#123;
  out = out.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  );
  // Numeric hex: &#x1F; or &#x1f;
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );
  return out;
}

/**
 * Filter title: decode entities and trim. Use for page/section/block titles.
 */
export function filterTitle(str: string): string {
  return decodeHtmlEntities(str).trim();
}

/**
 * Filter description: decode entities and trim. Use for short descriptions.
 */
export function filterDescription(str: string): string {
  return decodeHtmlEntities(str).trim();
}

/**
 * Filter content: decode entities. Use for HTML/markdown body content from CMS.
 */
export function filterContent(str: string): string {
  return decodeHtmlEntities(str);
}

/** Keys that are short labels (title-style) */
const TITLE_KEYS = new Set(["title", "label", "heading", "subtitle", "eyebrow", "name", "question"]);
/** Keys that are descriptions */
const DESC_KEYS = new Set(["description"]);
/** Keys that are body/long content */
const CONTENT_KEYS = new Set(["content", "text", "answer"]);

/**
 * Recursively filter known text fields in a block props object.
 * Use when building block/section config from CMS so all consumer components get decoded text.
 */
export function filterBlockProps(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return decodeHtmlEntities(obj);
  if (Array.isArray(obj)) return obj.map(filterBlockProps);
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        if (TITLE_KEYS.has(key)) out[key] = filterTitle(value);
        else if (DESC_KEYS.has(key)) out[key] = filterDescription(value);
        else if (CONTENT_KEYS.has(key)) out[key] = filterContent(value);
        else out[key] = filterBlockProps(value);
      } else {
        out[key] = filterBlockProps(value);
      }
    }
    return out;
  }
  return obj;
}
