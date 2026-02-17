/**
 * Block Registry
 *
 * Central registry for all CMS-compatible block components.
 * Each block supports flat props for shortcode usage.
 *
 * Usage in CMS/Markdown:
 * {{CTABlock title="Get Started" description="Join us today" buttonText="Sign Up" buttonHref="/signup"}}
 */

// Block type definitions for TypeScript support
export interface BlockDefinition {
  name: string;
  description: string;
  props: Record<
    string,
    {
      type: "string" | "number" | "boolean" | "array" | "object";
      required?: boolean;
      default?: any;
      description?: string;
    }
  >;
}

// Common animation props for all blocks
const animationProps = {
  animate: {
    type: "string" as const,
    description:
      'Animation type: fade-blur-scale, fade-blur, fade-scale, fade-up, fade-up-blur, zoom-blur, fade. Use "true" for default.',
  },
  animateDelay: {
    type: "string" as const,
    description: "Animation delay in ms (100, 200, 300, etc.)",
  },
  animateStagger: { type: "boolean" as const, description: "Stagger children animations" },
};

// Registry of all available blocks
export const blockRegistry: Record<string, BlockDefinition> = {
  CTABlock: {
    name: "CTABlock",
    description: "Call-to-action section with title, description, and buttons",
    props: {
      title: { type: "string", required: true, description: "Main headline" },
      description: { type: "string", description: "Supporting text" },
      variant: {
        type: "string",
        default: "centered",
        description: "Layout variant: centered, left, split, gradient",
      },
      buttonText: { type: "string", description: "Primary button text" },
      buttonHref: { type: "string", description: "Primary button link" },
      buttonVariant: { type: "string", default: "primary", description: "Button style variant" },
      secondaryButtonText: { type: "string", description: "Secondary button text" },
      secondaryButtonHref: { type: "string", description: "Secondary button link" },
      backgroundImage: { type: "string", description: "Background image URL" },
      backgroundColor: { type: "string", description: "Background color class" },
      ...animationProps,
    },
  },

  FeatureGridBlock: {
    name: "FeatureGridBlock",
    description: "Grid of feature cards with icons",
    props: {
      title: { type: "string", description: "Section title" },
      description: { type: "string", description: "Section description" },
      columns: { type: "number", default: 3, description: "Number of columns (2, 3, 4)" },
      variant: { type: "string", default: "cards", description: "Style: cards, icons, minimal" },
      // Features are passed as JSON string for CMS
      features: {
        type: "string",
        description: "JSON array of features [{icon, title, description}]",
      },
      // Or flat props for up to 6 features
      feature1Icon: { type: "string", description: "Feature 1 icon name" },
      feature1Title: { type: "string", description: "Feature 1 title" },
      feature1Description: { type: "string", description: "Feature 1 description" },
      // ... repeat for features 2-6
    },
  },

  TestimonialBlock: {
    name: "TestimonialBlock",
    description: "Customer testimonial section",
    props: {
      variant: { type: "string", default: "single", description: "Layout: single, grid, carousel" },
      // Single testimonial flat props
      quote: { type: "string", description: "Testimonial quote text" },
      author: { type: "string", description: "Author name" },
      role: { type: "string", description: "Author role/title" },
      company: { type: "string", description: "Company name" },
      avatar: { type: "string", description: "Author avatar URL" },
      rating: { type: "number", description: "Star rating (1-5)" },
      // Multiple testimonials as JSON
      testimonials: { type: "string", description: "JSON array of testimonials" },
    },
  },

  FAQBlock: {
    name: "FAQBlock",
    description: "FAQ accordion section",
    props: {
      title: { type: "string", description: "Section title" },
      description: { type: "string", description: "Section description" },
      variant: {
        type: "string",
        default: "accordion",
        description: "Style: accordion, grid, simple",
      },
      // FAQs as JSON
      faqs: { type: "string", description: "JSON array of FAQs [{question, answer}]" },
      // Or flat props for up to 10 FAQs
      faq1Question: { type: "string" },
      faq1Answer: { type: "string" },
      // ... repeat
    },
  },

  StatsBlock: {
    name: "StatsBlock",
    description: "Statistics/metrics display",
    props: {
      title: { type: "string", description: "Section title" },
      description: { type: "string", description: "Section description" },
      variant: { type: "string", default: "simple", description: "Style: simple, cards, gradient" },
      // Stats as JSON or flat props
      stats: { type: "string", description: "JSON array of stats [{value, label, suffix}]" },
      stat1Value: { type: "string" },
      stat1Label: { type: "string" },
      stat1Suffix: { type: "string" },
      // ... repeat for stats 2-6
    },
  },

  TeamBlock: {
    name: "TeamBlock",
    description: "Team member cards",
    props: {
      title: { type: "string", description: "Section title" },
      description: { type: "string", description: "Section description" },
      variant: { type: "string", default: "grid", description: "Style: grid, cards, compact" },
      columns: { type: "number", default: 4, description: "Grid columns" },
      members: { type: "string", description: "JSON array of team members" },
    },
  },

  ContentBlock: {
    name: "ContentBlock",
    description: "Text content with optional image",
    props: {
      title: { type: "string", description: "Content title" },
      content: { type: "string", description: "Main content (supports HTML)" },
      image: { type: "string", description: "Image URL" },
      imageAlt: { type: "string", description: "Image alt text" },
      imagePosition: {
        type: "string",
        default: "right",
        description: "Image position: left, right, top, bottom",
      },
      variant: { type: "string", default: "standard", description: "Style variant" },
      buttonText: { type: "string" },
      buttonHref: { type: "string" },
    },
  },

  TimelineBlock: {
    name: "TimelineBlock",
    description: "Process/timeline steps",
    props: {
      title: { type: "string", description: "Section title" },
      description: { type: "string", description: "Section description" },
      variant: {
        type: "string",
        default: "vertical",
        description: "Layout: vertical, horizontal, alternating",
      },
      steps: {
        type: "string",
        description: "JSON array of steps [{title, description, icon, date}]",
      },
    },
  },

  LogoCloudBlock: {
    name: "LogoCloudBlock",
    description: "Partner/client logos",
    props: {
      title: { type: "string", description: "Section title" },
      variant: { type: "string", default: "simple", description: "Style: simple, grid, marquee" },
      marqueeDirection: {
        type: "string",
        default: "left",
        description: "Marquee direction: left or right (only when variant=marquee)",
      },
      logos: { type: "string", description: "JSON array of logos [{src, alt, href}]" },
    },
  },

  NewsletterBlock: {
    name: "NewsletterBlock",
    description: "Newsletter signup form",
    props: {
      title: { type: "string", description: "Section title" },
      description: { type: "string", description: "Description text" },
      buttonText: { type: "string", default: "Subscribe", description: "Submit button text" },
      placeholder: {
        type: "string",
        default: "Enter your email",
        description: "Input placeholder",
      },
      variant: { type: "string", default: "inline", description: "Style: inline, stacked, card" },
      action: { type: "string", description: "Form action URL" },
    },
  },

  GalleryBlock: {
    name: "GalleryBlock",
    description: "Image gallery",
    props: {
      title: { type: "string", description: "Section title" },
      columns: { type: "number", default: 3, description: "Grid columns" },
      variant: { type: "string", default: "grid", description: "Style: grid, masonry, carousel" },
      images: { type: "string", description: "JSON array of images [{src, alt, caption}]" },
    },
  },

  AlertBlock: {
    name: "AlertBlock",
    description: "Alert/notification banner",
    props: {
      title: { type: "string", description: "Alert title" },
      message: { type: "string", required: true, description: "Alert message" },
      variant: {
        type: "string",
        default: "info",
        description: "Type: info, success, warning, danger",
      },
      dismissible: { type: "boolean", default: false, description: "Can be dismissed" },
      icon: { type: "string", description: "Icon name" },
      buttonText: { type: "string", description: "Action button text" },
      buttonHref: { type: "string", description: "Action button link" },
    },
  },

  PricingBlock: {
    name: "PricingBlock",
    description: "Pricing table section",
    props: {
      title: { type: "string", description: "Section title" },
      description: { type: "string", description: "Section description" },
      variant: {
        type: "string",
        default: "cards",
        description: "Style: cards, comparison, simple",
      },
      plans: { type: "string", description: "JSON array of pricing plans" },
      // Flat props for up to 3 plans
      plan1Name: { type: "string" },
      plan1Price: { type: "string" },
      plan1Description: { type: "string" },
      plan1Features: { type: "string", description: "Comma-separated features" },
      plan1ButtonText: { type: "string" },
      plan1ButtonHref: { type: "string" },
      plan1Highlighted: { type: "boolean" },
    },
  },

  FooterBlock: {
    name: "FooterBlock",
    description: "Footer section",
    props: {
      variant: {
        type: "string",
        default: "standard",
        description: "Style: standard, minimal, centered",
      },
      logo: { type: "string", description: "Logo image URL" },
      description: { type: "string", description: "Company description" },
      copyright: { type: "string", description: "Copyright text" },
      links: { type: "string", description: "JSON array of link sections" },
      socialLinks: { type: "string", description: "JSON array of social links" },
    },
  },

  WhatSetsUsApartBlock: {
    name: "WhatSetsUsApartBlock",
    description:
      "What Sets Us Apart section with icon/text blocks or numbered list + supporting image",
    props: {
      title: { type: "string", default: "What Sets Us Apart", description: "Section headline" },
      description: { type: "string", description: "Optional section description" },
      variant: {
        type: "string",
        default: "icons",
        description: "Layout: icons (icon + text blocks) | numbered (numbered list)",
      },
      imageSrc: { type: "string", description: "Supporting image URL (QC walk, safety briefing)" },
      imageAlt: { type: "string", description: "Image alt text" },
      imagePosition: {
        type: "string",
        default: "right",
        description: "Image position: left | right",
      },
      item1Title: { type: "string" },
      item1Icon: { type: "string" },
      item1Description: { type: "string" },
      // ... repeat for items 2-6
    },
  },

  TwoColumnFadeShowBlock: {
    name: "TwoColumnFadeShowBlock",
    description:
      "Left: image fadeshow, Right: content. Use image1..image12, interval, fadeDuration, rightContent.",
    props: {
      image1: { type: "string" },
      image2: { type: "string" },
      image3: { type: "string" },
      image4: { type: "string" },
      image5: { type: "string" },
      image6: { type: "string" },
      image7: { type: "string" },
      image8: { type: "string" },
      image9: { type: "string" },
      image10: { type: "string" },
      image11: { type: "string" },
      image12: { type: "string" },
      interval: { type: "string", default: "4000", description: "Ms per image" },
      fadeDuration: { type: "string", default: "1200", description: "Crossfade ms" },
      rightContent: { type: "string", description: "Right column HTML" },
      ratio: { type: "string", default: "1:1" },
      maxWidth: { type: "string", default: "full" },
      gap: { type: "string", default: "medium" },
      padding: { type: "string", default: "medium" },
    },
  },

  ListBlock: {
    name: "ListBlock",
    description: "Simple list with line breaks and tab indentation for nesting",
    props: {
      items: {
        type: "string",
        required: true,
        description: "List items separated by line breaks. Use tabs or 2 spaces for nesting.",
      },
      title: { type: "string", description: "Optional section title" },
      type: {
        type: "string",
        default: "unordered",
        description: "List type: unordered, ordered, none",
      },
      icon: { type: "string", description: "Font Awesome icon class for bullets" },
      variant: {
        type: "string",
        default: "default",
        description: "Style: default, cards, compact, spaced, checklist",
      },
      iconColor: { type: "string", description: "Tailwind color class for icons" },
      ...animationProps,
    },
  },
};

// Helper to get all block names
export const getBlockNames = (): string[] => Object.keys(blockRegistry);

// Helper to get block definition
export const getBlockDefinition = (name: string): BlockDefinition | undefined =>
  blockRegistry[name];

// Parse JSON props safely (for CMS shortcodes that pass JSON as strings)
export const parseJsonProp = <T>(value: string | T | undefined, defaultValue: T): T => {
  if (value === undefined) return defaultValue;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
};

// Parse comma-separated list to array
export const parseListProp = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// Build array from flat props (e.g., feature1Title, feature2Title -> array of features)
export const buildArrayFromFlatProps = <T extends Record<string, any>>(
  props: Record<string, any>,
  prefix: string,
  fields: string[],
  maxItems: number = 10
): T[] => {
  const items: T[] = [];

  for (let i = 1; i <= maxItems; i++) {
    const item: Record<string, any> = {};
    let hasValue = false;

    for (const field of fields) {
      const key = `${prefix}${i}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
      if (props[key] !== undefined) {
        item[field] = props[key];
        hasValue = true;
      }
    }

    if (hasValue) {
      items.push(item as T);
    }
  }

  return items;
};
