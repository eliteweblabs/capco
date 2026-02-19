/**
 * Block Components Index
 *
 * Central export for all block components.
 * Import from here for cleaner imports:
 *
 * import { CTABlock, FeatureGridBlock } from '../components/blocks';
 */

// Content blocks
export { default as CTABlock } from "./CTABlock.astro";
export { default as FeatureGridBlock } from "./FeatureGridBlock.astro";
export { default as TestimonialBlock } from "./TestimonialBlock.astro";
export { default as FAQBlock } from "./FAQBlock.astro";
export { default as StatsBlock } from "./StatsBlock.astro";
export { default as CountUpBlock } from "./CountUpBlock.astro";
export { default as TeamBlock } from "./TeamBlock.astro";
export { default as ContentBlock } from "./ContentBlock.astro";
export { default as TimelineBlock } from "./TimelineBlock.astro";
export { default as LogoCloudBlock } from "./LogoCloudBlock.astro";
export { default as NewsletterBlock } from "./NewsletterBlock.astro";
export { default as GalleryBlock } from "./GalleryBlock.astro";
export { default as AlertBlock } from "./AlertBlock.astro";
export { default as PricingBlock } from "./PricingBlock.astro";
export { default as FooterBlock } from "./FooterBlock.astro";
export { default as ImageBlock } from "./ImageBlock.astro";
export { default as ListBlock } from "./ListBlock.astro";
export { default as GoogleReviewsBlock } from "./GoogleReviewsBlock.astro";

// Layout blocks (wrapper components with slots)
export { default as TwoColumnBlock } from "./TwoColumnBlock.astro";
export { default as ThreeColumnBlock } from "./ThreeColumnBlock.astro";
export { default as GridBlock } from "./GridBlock.astro";
export { default as ContainerBlock } from "./ContainerBlock.astro";
export { default as SectionBlock } from "./SectionBlock.astro";
export { default as SidebarBlock } from "./SidebarBlock.astro";

// Dynamic renderer
export { default as BlockRenderer } from "./BlockRenderer.astro";

// Registry and utilities
export {
  blockRegistry,
  getBlockNames,
  getBlockDefinition,
  parseJsonProp,
  parseListProp,
  buildArrayFromFlatProps,
} from "./BlockRegistry";

// Type exports
export type { BlockDefinition } from "./BlockRegistry";
