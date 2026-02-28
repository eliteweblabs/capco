# Block Components System

A comprehensive, CMS-ready block component system for building pages dynamically. All blocks support both direct Astro props and flat CMS shortcode-style props.

## Available Blocks

| Block | Description | Use Case |
|-------|-------------|----------|
| `CTABlock` | Call-to-action sections | Conversion prompts, sign-ups |
| `FeatureGridBlock` | Feature/service grids | Showcasing capabilities |
| `TestimonialBlock` | Customer testimonials | Social proof |
| `FAQBlock` | FAQ accordions | Common questions |
| `StatsBlock` | Statistics display | Metrics, achievements |
| `TeamBlock` | Team member cards | About pages |
| `ContentBlock` | Text + image sections | About, services |
| `TimelineBlock` | Process/timeline steps | Workflows, history |
| `LogoCloudBlock` | Partner/client logos | Trust indicators |
| `NewsletterBlock` | Email signup forms | Lead capture |
| `GalleryBlock` | Image galleries | Portfolio, projects |
| `AlertBlock` | Alert/notification banners | Announcements |
| `PricingBlock` | Pricing tables | Plans, packages |

## Quick Start

### Direct Usage in Astro

```astro
---
import { CTABlock, FeatureGridBlock } from '../components/blocks';
---

<CTABlock 
  title="Get Started Today"
  description="Join thousands of fire protection professionals"
  buttonText="Sign Up"
  buttonHref="/signup"
  variant="centered"
/>

<FeatureGridBlock 
  title="Our Services"
  columns={3}
  features={[
    { icon: "shield", title: "Fire Safety", description: "Comprehensive protection" },
    { icon: "check", title: "Compliance", description: "Meet all regulations" },
    { icon: "file", title: "Documentation", description: "Complete records" }
  ]}
/>
```

### CMS/Shortcode Usage

All blocks accept flat props for CMS shortcode compatibility:

```
{{CTABlock title="Get Started" buttonText="Sign Up" buttonHref="/signup"}}

{{FeatureGridBlock 
  title="Features" 
  feature1Icon="shield" 
  feature1Title="Safety" 
  feature1Description="..."
  feature2Icon="check"
  feature2Title="Compliance"
  feature2Description="..."
}}
```

### Dynamic Rendering with BlockRenderer

```astro
---
import { BlockRenderer } from '../components/blocks';

const pageBlocks = [
  { type: "CTABlock", props: { title: "Welcome", buttonText: "Learn More" } },
  { type: "FeatureGridBlock", props: { title: "Services", features: [...] } },
  { type: "TestimonialBlock", props: { quote: "Great service!", author: "John" } }
];
---

<BlockRenderer blocks={pageBlocks} gap="medium" />
```

## Block Reference

### CTABlock

Call-to-action section with multiple layout variants.

**Variants:** `centered`, `left`, `split`, `gradient`, `banner`, `minimal`

```astro
<CTABlock 
  title="Ready to Get Started?"
  description="Join our platform today"
  eyebrow="Limited Time Offer"
  variant="gradient"
  buttonText="Sign Up Free"
  buttonHref="/signup"
  buttonIcon="arrow-right"
  secondaryButtonText="Learn More"
  secondaryButtonHref="/about"
  backgroundImage="/images/hero-bg.jpg"
  backgroundOverlay={true}
  overlayOpacity={0.6}
/>
```

### FeatureGridBlock

Display features in a responsive grid with icons.

**Variants:** `cards`, `icons`, `minimal`, `bordered`, `centered`

```astro
<FeatureGridBlock 
  title="Why Choose Us"
  description="Industry-leading fire protection services"
  columns={4}
  variant="cards"
  features={[
    { icon: "shield", title: "Safety First", description: "...", href: "/safety" },
    { icon: "check-circle", title: "Certified", description: "..." },
  ]}
/>

<!-- Or with flat props -->
<FeatureGridBlock 
  title="Features"
  feature1Icon="shield"
  feature1Title="Safety"
  feature1Description="Description here"
  feature2Icon="check"
  feature2Title="Quality"
  feature2Description="Another description"
/>
```

### TestimonialBlock

Customer testimonials with rating support.

**Variants:** `single`, `grid`, `featured`, `minimal`

```astro
<TestimonialBlock 
  title="What Our Clients Say"
  variant="grid"
  columns={3}
  testimonials={[
    {
      quote: "Excellent service and fast turnaround!",
      author: "John Smith",
      role: "Project Manager",
      company: "ABC Construction",
      avatar: "/images/john.jpg",
      rating: 5
    }
  ]}
/>

<!-- Single testimonial with flat props -->
<TestimonialBlock 
  variant="featured"
  quote="The best fire protection team we've worked with."
  author="Jane Doe"
  role="CEO"
  company="BuildRight Inc"
  rating="5"
/>
```

### FAQBlock

FAQ accordion with Flowbite-style interactivity.

**Variants:** `accordion`, `grid`, `cards`, `simple`

```astro
<FAQBlock 
  title="Frequently Asked Questions"
  variant="accordion"
  defaultOpen={true}
  faqs={[
    { 
      question: "How long does the review process take?", 
      answer: "Typically 3-5 business days depending on complexity." 
    },
    { 
      question: "What documents do I need?", 
      answer: "You'll need floor plans, specifications, and..." 
    }
  ]}
/>

<!-- With flat props -->
<FAQBlock 
  title="FAQ"
  faq1Question="Question one?"
  faq1Answer="Answer one."
  faq2Question="Question two?"
  faq2Answer="Answer two."
/>
```

### StatsBlock

Display key metrics and statistics.

**Variants:** `simple`, `cards`, `gradient`, `bordered`, `minimal`, `dark`

```astro
<StatsBlock 
  title="Our Track Record"
  variant="cards"
  columns={4}
  stats={[
    { value: "500+", label: "Projects Completed", icon: "folder" },
    { value: "99%", label: "Client Satisfaction", suffix: "%" },
    { value: "24/7", label: "Support Available" },
    { value: "15+", label: "Years Experience" }
  ]}
/>

<!-- With flat props -->
<StatsBlock 
  stat1Value="500+"
  stat1Label="Projects"
  stat2Value="99%"
  stat2Label="Satisfaction"
/>
```

### TeamBlock

Team member cards with social links.

**Variants:** `grid`, `cards`, `compact`, `detailed`

```astro
<TeamBlock 
  title="Meet Our Team"
  description="Experienced fire protection professionals"
  columns={4}
  variant="cards"
  members={[
    {
      name: "John Smith",
      role: "Lead Engineer",
      photo: "/images/team/john.jpg",
      bio: "15 years of experience in fire protection...",
      email: "john@example.com",
      linkedin: "https://linkedin.com/in/johnsmith"
    }
  ]}
/>
```

### ContentBlock

Flexible content section with text and optional image.

**Variants:** `standard`, `feature`, `split`, `overlap`, `fullwidth`

```astro
<ContentBlock 
  title="About Our Services"
  eyebrow="Fire Protection"
  content="<p>We provide comprehensive fire protection solutions...</p>"
  image="/images/services.jpg"
  imagePosition="right"
  imageRounded={true}
  listItems={[
    { text: "NFPA Compliance", icon: "check" },
    { text: "Expert Review", icon: "check" },
    { text: "Fast Turnaround", icon: "check" }
  ]}
  buttonText="Learn More"
  buttonHref="/services"
/>
```

### TimelineBlock

Process steps or timeline display.

**Variants:** `vertical`, `horizontal`, `alternating`, `compact`

```astro
<TimelineBlock 
  title="Our Process"
  variant="vertical"
  steps={[
    { 
      title: "Initial Consultation", 
      description: "We assess your project requirements",
      icon: "phone",
      status: "completed"
    },
    { 
      title: "Design Review", 
      description: "Expert engineers review your plans",
      icon: "file",
      status: "current"
    },
    { 
      title: "Approval", 
      description: "Final certification and documentation",
      icon: "check",
      status: "upcoming"
    }
  ]}
/>
```

### LogoCloudBlock

Display partner, client, or technology logos.

**Variants:** `simple`, `grid`, `marquee`, `centered`

```astro
<LogoCloudBlock 
  title="Trusted By Industry Leaders"
  variant="marquee"
  grayscale={true}
  logos={[
    { src: "/logos/company1.png", alt: "Company 1", href: "https://..." },
    { src: "/logos/company2.png", alt: "Company 2" }
  ]}
/>
```

### NewsletterBlock

Email signup forms.

**Variants:** `inline`, `stacked`, `card`, `banner`, `minimal`

```astro
<NewsletterBlock 
  title="Stay Updated"
  description="Get the latest fire safety news and updates"
  variant="card"
  buttonText="Subscribe"
  placeholder="Enter your email"
  showName={true}
  action="/api/subscribe"
/>
```

### GalleryBlock

Image gallery with lightbox support.

**Variants:** `grid`, `masonry`, `carousel`, `featured`

```astro
<GalleryBlock 
  title="Recent Projects"
  variant="featured"
  columns={3}
  lightbox={true}
  showCaptions={true}
  images={[
    { src: "/images/project1.jpg", alt: "Project 1", caption: "Downtown Office" },
    { src: "/images/project2.jpg", alt: "Project 2", caption: "Medical Center" }
  ]}
/>
```


### PricingBlock

Pricing tables and plans.

**Variants:** `cards`, `comparison`, `simple`, `compact`

```astro
<PricingBlock 
  title="Choose Your Plan"
  description="Flexible pricing for every need"
  variant="cards"
  plans={[
    {
      name: "Starter",
      price: "$29",
      period: "month",
      description: "For small projects",
      features: ["5 projects", "Email support", "Basic analytics"],
      buttonText: "Get Started",
      buttonHref: "/signup?plan=starter"
    },
    {
      name: "Professional",
      price: "$99",
      period: "month",
      description: "For growing teams",
      features: ["Unlimited projects", "Priority support", "Advanced analytics"],
      buttonText: "Get Started",
      buttonHref: "/signup?plan=pro",
      highlighted: true,
      badge: "Most Popular"
    }
  ]}
/>
```

## CMS Integration

### Flat Props Pattern

All blocks support flat props for CMS systems that can't pass objects/arrays:

```
<!-- Instead of objects, use numbered flat props -->
feature1Icon="shield"
feature1Title="Safety"
feature1Description="Description"

feature2Icon="check"
feature2Title="Quality"
feature2Description="Description"
```

### JSON Props

For CMS systems that support JSON strings:

```
features='[{"icon":"shield","title":"Safety"},{"icon":"check","title":"Quality"}]'
```

### Boolean/String Conversion

Props that accept booleans also accept strings for CMS compatibility:

```
dismissible="true"   <!-- Works the same as dismissible={true} -->
lightbox="false"     <!-- Works the same as lightbox={false} -->
```

## Utilities

### parseJsonProp

Safely parse JSON string to array/object:

```ts
import { parseJsonProp } from '../components/blocks';

const items = parseJsonProp(propsFromCMS, defaultValue);
```

### parseListProp

Parse comma-separated string to array:

```ts
import { parseListProp } from '../components/blocks';

const features = parseListProp("Feature 1, Feature 2, Feature 3");
// ["Feature 1", "Feature 2", "Feature 3"]
```

### buildArrayFromFlatProps

Build array from numbered flat props:

```ts
import { buildArrayFromFlatProps } from '../components/blocks';

const features = buildArrayFromFlatProps(
  props,
  'feature',           // prefix
  ['icon', 'title'],   // fields to extract
  8                    // max items
);
```

## Styling

All blocks use Tailwind CSS and support:

- Dark mode (automatic via `dark:` classes)
- Responsive design (mobile-first)
- Custom className prop for additional styles
- Custom backgroundColor props where applicable

## Icons

Blocks use the `SimpleIcon` component from `@/components/common/SimpleIcon.astro`. Available icons include:

- `shield`, `check`, `check-circle`, `x`, `x-circle`
- `user`, `users`, `envelope`, `phone`, `map-pin`
- `star`, `star-solid`, `heart`, `bell`
- `file`, `folder`, `image`, `play`
- `arrow-right`, `arrow-left`, `chevron-down`, `chevron-right`
- `linkedin`, `twitter`, `github`, `facebook`
- And many more...

## Best Practices

1. **Use semantic variants** - Choose the variant that matches your content's purpose
2. **Provide alt text** - Always include alt text for images
3. **Keep content concise** - Blocks work best with focused, scannable content
4. **Test responsively** - Preview on mobile, tablet, and desktop
5. **Maintain consistency** - Use the same variants/styles across similar sections
