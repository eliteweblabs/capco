/**
 * Block-based CMS content
 *
 * Pages stored in cmsBlockPages: each page has sections. Each section is either
 * a single full-width block or a 12-col row (e.g. 6/6, 4-4-4) with width fullwidth | contained.
 * All block pages render through LayoutFullWidth; no page-level template.
 */

import { quoteClientIdForPostgrest } from "./content";
import { filterTitle, filterDescription, filterBlockProps } from "./content-filters";
import { supabaseAdmin } from "./supabase-admin";

/** Single block config (type + props) */
export interface BlockConfig {
  type: string;
  props?: Record<string, unknown>;
  id?: string;
}

/** One block row with its own width (used in section.items) */
export interface BlockSectionItem {
  width?: "fullwidth" | "contained";
  block: BlockConfig;
}

/**
 * One section on the page. Supports two patterns:
 * - items: multiple blocks per section, each with its own width toggle (container / full width)
 * - Legacy: single `block` or `columns`+`blocks` (one row, section width)
 */
export interface BlockSectionConfig {
  width?: "fullwidth" | "contained";
  /** Preferred: multiple blocks per section, each with own width */
  items?: BlockSectionItem[];
  /** Single block for the whole row (legacy) */
  block?: BlockConfig;
  /** Column spans (must sum to 12). e.g. [6,6], [4,4,4], [8,4] (legacy) */
  columns?: number[];
  /** One block per column (legacy) */
  blocks?: BlockConfig[];
}

export interface BlockPageContent {
  title: string;
  description?: string;
  sections: BlockSectionConfig[];
}

const cache = new Map<string, BlockPageContent | null>();
const CACHE_TTL_MS = 2 * 60 * 1000;
let cacheTimestamp = 0;

function isLikelyBotProbe(slug: string): boolean {
  const lower = slug.toLowerCase();
  if (lower.includes("wp-") || lower.includes("wordpress") || lower.includes(".php")) return true;
  if (lower.includes("wp-admin") || lower.includes("wp-content") || lower.includes("wp-includes"))
    return true;
  if (lower.includes("xmlrpc") || lower.includes("wp-login")) return true;
  if (["favicon.ico", "robots.txt", "sitemap.xml"].includes(lower)) return true;
  return false;
}

/** Apply content filters to each block's props so CMS text (e.g. &amp;) displays correctly. */
function filterSections(sections: unknown[]): unknown[] {
  return sections.map((section: any) => {
    if (!section || typeof section !== "object") return section;
    const out = { ...section };
    if (out.items && Array.isArray(out.items)) {
      out.items = out.items.map((item: any) => {
        if (item?.block?.props) {
          return { ...item, block: { ...item.block, props: filterBlockProps(item.block.props) } };
        }
        return item;
      });
    }
    if (out.block?.props) {
      out.block = { ...out.block, props: filterBlockProps(out.block.props) };
    }
    if (out.blocks && Array.isArray(out.blocks)) {
      out.blocks = out.blocks.map((block: any) =>
        block?.props ? { ...block, props: filterBlockProps(block.props) } : block
      );
    }
    return out;
  });
}

/**
 * Fetch block-based page by slug. Returns null if no block page exists (caller falls back to template CMS).
 */
export async function getBlockPageContent(slug: string): Promise<BlockPageContent | null> {
  const cacheKey = `block-page-${slug}`;
  const now = Date.now();

  if (process.env.NODE_ENV !== "development" && cache.has(cacheKey)) {
    if (now - cacheTimestamp < CACHE_TTL_MS) return cache.get(cacheKey) ?? null;
    cache.delete(cacheKey);
  }

  if (isLikelyBotProbe(slug)) return null;

  if (!supabaseAdmin) return null;

  try {
    const clientId = process.env.RAILWAY_PROJECT_NAME || null;
    const normalizedSlug = slug === "home" || slug === "/" ? ["home", "/"] : [slug];

    let query = supabaseAdmin
      .from("cmsBlockPages")
      .select("*")
      .in("slug", normalizedSlug)
      .eq("isActive", true);

    if (clientId) {
      query = query.or(
        `clientId.is.null,clientId.eq.${quoteClientIdForPostgrest(clientId)}`
      );
    }

    const { data: row, error } = await query
      .order("clientId", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[CONTENT-BLOCKS] Database error for", slug, error);
      return null;
    }

    if (!row) return null;

    const rawSections = Array.isArray(row.sections) ? row.sections : [];
    const sections = filterSections(rawSections) as BlockSectionConfig[];
    const page: BlockPageContent = {
      title: filterTitle(row.title ?? slug),
      description: filterDescription(row.description ?? ""),
      sections,
    };
    cache.set(cacheKey, page);
    cacheTimestamp = now;
    return page;
  } catch (e) {
    console.warn("[CONTENT-BLOCKS] Error loading block page", slug, e);
    return null;
  }
}

/** Clear block page cache (call after POST/DELETE in admin API) */
export function clearBlockPageCache(slug?: string): void {
  if (slug) cache.delete(`block-page-${slug}`);
  else cache.clear();
}
