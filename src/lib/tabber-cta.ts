/**
 * Pull CTA buttons out of TabberBlock HTML so leftover shortcodes
 * or trailing plain text render as real buttons.
 */

export interface TabCta {
  text: string;
  href: string;
  variant: "primary" | "secondary" | "outline";
}

const BUTTON_VARIANTS = new Set(["primary", "secondary", "outline"]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseAttrs(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrString)) !== null) {
    const key = match[1].replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    attrs[key] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function normalizeVariant(value?: string): TabCta["variant"] {
  const v = (value || "").toLowerCase();
  return BUTTON_VARIANTS.has(v) ? (v as TabCta["variant"]) : "secondary";
}

/** Map leftover CTA labels to a sensible destination. */
export function inferTabCtaHref(text: string): string {
  const t = text.toLowerCase();
  if (/\b(view|see|browse)\b/.test(t) && /\bprojects?\b/.test(t)) return "/projects";
  return "/contact";
}

export function contentHasRenderedButton(html: string): boolean {
  return /<(?:a|button)\b[^>]*(?:data-variant|bg-secondary-500|bg-primary-500)[^>]*>/i.test(html);
}

function stripTrailingText(html: string, text: string): string {
  return html.replace(new RegExp(`\\s*${escapeRegExp(text)}\\s*$`), "").trim();
}

export function extractTabCta(
  html: string,
  explicit?: Partial<TabCta>
): { html: string; cta?: TabCta } {
  let content = html || "";
  let cta: TabCta | undefined;

  const buttonMatch = content.match(/<Button\b([^>]*)>([\s\S]*?)<\/Button>/i);
  if (buttonMatch) {
    const attrs = parseAttrs(buttonMatch[1] || "");
    const text = (buttonMatch[2] || "").replace(/<[^>]+>/g, "").trim();
    if (text) {
      cta = {
        text,
        href: attrs.href || inferTabCtaHref(text),
        variant: normalizeVariant(attrs.variant),
      };
    }
    content = content.replace(buttonMatch[0], "").trim();
  }

  if (!cta && !contentHasRenderedButton(content)) {
    const trailing = content.match(/<\/(?:ul|ol|p|div)>\s*([^<\n][^<]*?)\s*$/i);
    const text = trailing?.[1]?.trim() ?? "";
    if (text.length >= 3) {
      cta = {
        text,
        href: inferTabCtaHref(text),
        variant: "secondary",
      };
      content = stripTrailingText(content, text);
    }
  }

  if (explicit?.text) {
    cta = {
      text: explicit.text,
      href: explicit.href || cta?.href || inferTabCtaHref(explicit.text),
      variant: normalizeVariant(explicit.variant || cta?.variant),
    };
    content = stripTrailingText(content, explicit.text);
  }

  return { html: content, cta };
}
