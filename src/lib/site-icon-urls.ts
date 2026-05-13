/**
 * Canonical favicon / touch-icon URLs (same rules as AppHead.astro).
 */
import { createHash } from "node:crypto";

export interface SiteIconUrlsInput {
  globalCompanyIcon?: string | null;
  primaryColor?: string | null;
}

export interface SiteIconUrls {
  iconSrc: string;
  appleTouchIconSrc: string;
  iconType: "image/svg+xml" | "image/png";
  faviconVersionMark: string;
}

export function getSiteIconUrls(input: SiteIconUrlsInput): SiteIconUrls {
  const { globalCompanyIcon, primaryColor = "" } = input;

  const faviconVersionMark =
    globalCompanyIcon &&
    typeof globalCompanyIcon === "string" &&
    (globalCompanyIcon.includes("<svg") || globalCompanyIcon.includes("<?xml"))
      ? createHash("sha256")
          .update(globalCompanyIcon)
          .update(primaryColor || "")
          .digest("hex")
          .slice(0, 12)
      : "";

  const favIconPngQuery = faviconVersionMark ? `?size=180&v=${faviconVersionMark}` : "?size=180";
  const favIconApiSuffix = faviconVersionMark ? `?v=${faviconVersionMark}` : "";

  let iconSrc: string;
  if (
    globalCompanyIcon &&
    typeof globalCompanyIcon === "string" &&
    !globalCompanyIcon.includes("<svg") &&
    !globalCompanyIcon.includes("<?xml")
  ) {
    iconSrc = globalCompanyIcon;
  } else {
    iconSrc = `/api/favicon.svg${favIconApiSuffix}`;
  }

  const appleTouchIconSrc = iconSrc.startsWith("data:")
    ? `/api/favicon.png${favIconPngQuery}`
    : iconSrc.includes(".png")
      ? iconSrc
      : `/api/favicon.png${favIconPngQuery}`;

  const iconType: "image/svg+xml" | "image/png" = iconSrc.includes(".png")
    ? "image/png"
    : "image/svg+xml";

  return { iconSrc, appleTouchIconSrc, iconType, faviconVersionMark };
}

/** True when custom CSS references the footer logo hook (mask pattern from CMS docs). */
export function customCssDefinesFooterLogoMask(css: string | undefined | null): boolean {
  if (!css?.trim()) return false;
  return /\.cms-logo-mask\b/.test(css);
}
