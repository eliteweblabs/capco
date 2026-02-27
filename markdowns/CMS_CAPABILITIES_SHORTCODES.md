# Capabilities / Core Competencies Page — CMS Shortcodes

Paste these shortcodes into a CMS page (e.g. Capabilities or About) content. Uses existing blocks only.

**Syntax:** Self-closing tags with `prop="value"`. Replace PDF path, logo image URLs, and any placeholders where noted.

---

## 1. Snapshot Block (Capability at a glance)

Horizontal card grid: certification, NAICS, bonding, geographic reach, delivery model. Icons add visual appeal.

```html
<FeatureGridBlock title="Capability Snapshot" columns="2" variant="cards" feature1Icon="award" feature1Title="Certification" feature1Description="SDVOSB Certified" feature2Icon="building" feature2Title="Primary NAICS" feature2Description="236220 — Commercial &amp; Institutional Building Construction" feature3Icon="dollar-sign" feature3Title="Bonding" feature3Description="$12M Single / $18M Aggregate" feature4Icon="map-pin" feature4Title="Geographic Reach" feature4Description="Northeast United States" feature5Icon="briefcase" feature5Title="Delivery Model" feature5Description="Self-Performing General Contractor" />
```

**Edit:** Use `columns="3"` for a tighter grid. Use `&amp;` for "&" in attribute values.

---

## 2. Core Competencies (Icon tooltips)

Four competencies with icons; title and description appear in tooltips on hover/tap. Add a markdown heading **Core Competencies** above this block, or use the ContentBlock below for the headline.

**Option A — JSON (use single quotes around the JSON so double quotes inside are fine):**

```html
<IconTooltip4Block items='[{"icon":"building","title":"General Contracting","description":"Full project delivery from preconstruction to closeout"},{"icon":"bar-chart-3","title":"Construction Management","description":"Schedule, budget, and quality oversight"},{"icon":"shield","title":"Safety Management","description":"OSHA-compliant programs, zero-incident culture"},{"icon":"check-circle","title":"Quality Control","description":"QC plans, inspections, documentation"}]' />
```

**Option B — Flat props (no JSON):**

```html
<IconTooltip4Block item1Icon="building" item1Title="General Contracting" item1Description="Full project delivery from preconstruction to closeout" item2Icon="bar-chart-3" item2Title="Construction Management" item2Description="Schedule, budget, and quality oversight" item3Icon="shield" item3Title="Safety Management" item3Description="OSHA-compliant programs, zero-incident culture" item4Icon="check-circle" item4Title="Quality Control" item4Description="QC plans, inspections, documentation" />
```

**Optional headline above it (title only):**

```html
<ContentBlock title="Core Competencies" />
```

---

## 3. Differentiators Section

Headline plus list with checkmarks.

```html
<ContentBlock title="What Makes Rothco Different" list="Healthcare &amp; VA Expertise, Proven Safety Culture, Turnkey Federal Delivery, Responsive &amp; Agile Team, Trusted Agency Relationships" />
```

**Edit:** Use `&amp;` for "&" in list items (e.g. "Healthcare & VA").

---

## 4. Certifications & Registrations

**Option A — Logo/badge images:** Use LogoCloudBlock once you have image URLs for SDVOSB, SAM.gov, state licenses, safety certs. Replace the `src` and `alt` values.

```html
<LogoCloudBlock title="Certifications &amp; Registrations" variant="grid" columns="4" logo1Src="/images/certs/sdvosb.png" logo1Alt="SDVOSB Certified" logo1Href="https://www.sam.gov" logo2Src="/images/certs/sam.png" logo2Alt="SAM.gov" logo2Href="https://www.sam.gov" logo3Src="/images/certs/state-license.png" logo3Alt="State Licensed" logo4Src="/images/certs/osha30.png" logo4Alt="OSHA 30" />
```

**Option B — Text-only list (no images yet):** Use a simple list until you have logo assets.

```html
<ContentBlock title="Certifications &amp; Registrations" list="SDVOSB Certified, SAM.gov Registered, State Licenses, OSHA 30 &amp; Safety Certifications" />
```

---

## 5. Downloadable Capability Statement

Thumbnail preview (optional) plus download button. Replace the PDF path and thumbnail image URL.

```html
<ContentBlock title="Capability Statement" content="Download our capability statement for project requirements, certifications, and past performance." image="/images/capability-statement-thumb.jpg" imageAlt="Capability Statement PDF preview" imagePosition="left" buttonText="Download Capability Statement (PDF)" buttonHref="/documents/capability-statement.pdf" />
```

**Edit:** Set `buttonHref` to your PDF path (e.g. `/documents/capability-statement.pdf`). Remove `image`, `imageAlt`, and `imagePosition` if you don’t have a thumbnail; the block will show just the title, content, and button.

---

## 6. Bottom CTA

```html
<CTABlock title="Let's Discuss Your Project Requirements" description="Ready to talk scope, schedule, or teaming?" buttonText="Contact Us" buttonHref="/contact" variant="centered" />
```

---

## Full page paste (all sections in order)

Copy the block below into the CMS page content. Replace PDF path, logo/image URLs, and add the "Core Competencies" heading in markdown if desired.

```html
<FeatureGridBlock title="Capability Snapshot" columns="2" variant="cards" feature1Icon="award" feature1Title="Certification" feature1Description="SDVOSB Certified" feature2Icon="building" feature2Title="Primary NAICS" feature2Description="236220 — Commercial &amp; Institutional Building Construction" feature3Icon="dollar-sign" feature3Title="Bonding" feature3Description="$12M Single / $18M Aggregate" feature4Icon="map-pin" feature4Title="Geographic Reach" feature4Description="Northeast United States" feature5Icon="briefcase" feature5Title="Delivery Model" feature5Description="Self-Performing General Contractor" />

## Core Competencies

<IconTooltip4Block item1Icon="building" item1Title="General Contracting" item1Description="Full project delivery from preconstruction to closeout" item2Icon="bar-chart-3" item2Title="Construction Management" item2Description="Schedule, budget, and quality oversight" item3Icon="shield" item3Title="Safety Management" item3Description="OSHA-compliant programs, zero-incident culture" item4Icon="check-circle" item4Title="Quality Control" item4Description="QC plans, inspections, documentation" />

<ContentBlock title="What Makes Rothco Different" list="Healthcare &amp; VA Expertise, Proven Safety Culture, Turnkey Federal Delivery, Responsive &amp; Agile Team, Trusted Agency Relationships" />

<ContentBlock title="Certifications &amp; Registrations" list="SDVOSB Certified, SAM.gov Registered, State Licenses, OSHA 30 &amp; Safety Certifications" />

<ContentBlock title="Capability Statement" content="Download our capability statement for project requirements, certifications, and past performance." image="/images/capability-statement-thumb.jpg" imageAlt="Capability Statement PDF preview" imagePosition="left" buttonText="Download Capability Statement (PDF)" buttonHref="/documents/capability-statement.pdf" />

<CTABlock title="Let's Discuss Your Project Requirements" description="Ready to talk scope, schedule, or teaming?" buttonText="Contact Us" buttonHref="/contact" variant="centered" />
```

**Note:** The "## Core Competencies" line is markdown; if your CMS strips markdown between components, use the optional `<ContentBlock title="Core Competencies" />` shortcode instead (place it directly above the IconTooltip4Block).

---

## Technical notes

- **Layout:** Card grid and lists use existing blocks; layout is clean and mobile-friendly (grid collapses on small screens).
- **Icons:** All from SimpleIcon (award, building, dollar-sign, map-pin, briefcase, bar-chart-3, shield, check-circle). Consistent line style.
- **Ampersands:** Use `&amp;` in attribute values (e.g. "Commercial & Institutional", "Healthcare & VA").
- **Capability statement PDF:** Upload the PDF to `public/documents/` (or your static asset path) and set `buttonHref` accordingly. Add a thumbnail image under `public/images/` and set `image` to that path for the preview.
