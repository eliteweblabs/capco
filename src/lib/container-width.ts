/**
 * Shared container width logic for CMS shortcode blocks.
 * Used by TwoColumnFadeShowBlock, ProjectPortfolio, blocks, etc.
 */

export type MaxWidthOption = "sm" | "md" | "lg" | "xl" | "2xl" | "full";
export type PaddingOption = "none" | "small" | "medium" | "large";
export type GapOption = "none" | "small" | "medium" | "large";

export const maxWidthClasses: Record<MaxWidthOption, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-7xl",
  full: "max-w-full",
};

export const paddingClasses: Record<PaddingOption, string> = {
  none: "",
  small: "py-8",
  medium: "py-12 md:py-16",
  large: "py-16 md:py-24",
};

export const gapClasses: Record<GapOption, string> = {
  none: "gap-0",
  small: "gap-4",
  medium: "gap-8",
  large: "gap-12",
};

export function getContainerWrapperClasses(
  maxWidth: MaxWidthOption = "full",
  extraClasses?: string
): string[] {
  const base = "mx-auto px-4 sm:px-6 lg:px-8";
  const classes = [base];
  if (maxWidth !== "full") {
    classes.push(maxWidthClasses[maxWidth]);
  } else {
    classes.push("w-full max-w-full");
  }
  if (extraClasses) classes.push(extraClasses);
  return classes;
}
