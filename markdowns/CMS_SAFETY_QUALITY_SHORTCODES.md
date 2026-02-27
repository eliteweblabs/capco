# Safety & Quality Page — CMS Shortcodes

Paste these shortcodes into a CMS page (e.g. Safety & Quality) content. Use existing blocks only; no new components required.

**Syntax:** Self-closing tags with `prop="value"`. Replace image URLs and stat numbers where noted.

---

## 1. Safety Philosophy Section

Headline, body, and optional image (team safety briefing / toolbox talk).

```html
<ContentBlock title="Our Safety Commitment" content="At Rothco Built, safety isn't a policy — it's a core value. Every team member is empowered and expected to maintain the highest safety standards. We believe every worker deserves to go home safe, and we build our processes around that commitment." image="https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800" imageAlt="Team safety briefing or toolbox talk" imagePosition="right" />
```

**Edit:** Replace `image` URL with your own (team safety briefing or toolbox talk). Remove `image`, `imageAlt`, and `imagePosition` if you don’t use an image.

---

## 2. Safety Program Highlights

Icon + text list (cards). Icons: shield, hospital, message-circle, file-text, lock, building.

```html
<FeatureGridBlock title="Safety Program" columns="3" variant="cards" feature1Icon="shield-check" feature1Title="OSHA Compliance" feature1Description="Full adherence to OSHA regulations and standards" feature2Icon="hospital" feature2Title="Healthcare Safety Protocols" feature2Description="ICRA, infection control, patient safety" feature3Icon="message-circle" feature3Title="Daily Safety Briefings" feature3Description="Toolbox talks and hazard identification" feature4Icon="file-text" feature4Title="Incident Reporting" feature4Description="Transparent reporting and corrective action" feature5Icon="lock" feature5Title="PPE Requirements" feature5Description="Enforced personal protective equipment standards" feature6Icon="building" feature6Title="Site Security" feature6Description="Controlled access, visitor protocols" />
```

---

## 3. Quality Control Section

Headline, body, and key points as a list with check icons.

```html
<ContentBlock title="Quality Control" content="Our QC program ensures every deliverable meets specifications and client expectations. From material verification to final punch lists, we maintain rigorous documentation and inspection protocols." list="Project-specific QC plans, Three-phase inspection process, Material submittal tracking, Deficiency tracking and resolution, Final inspection and closeout documentation" />
```

---

## 4. Safety Stats (Optional)

Use when you have real numbers. Replace `X` with your values (e.g. years without LTI, hours of training). Icons: shield-check, award, clock.

```html
<StatsBlock variant="cards" columns="3" stat1Value="X" stat1Label="Years Without Lost Time Incident" stat1Icon="shield-check" stat2Value="100%" stat2Label="OSHA Compliance" stat2Icon="check-circle" stat3Value="X" stat3Label="Hours of Safety Training Annually" stat3Icon="award" />
```

**Example with placeholders filled:** e.g. `stat1Value="5+"` and `stat3Value="500+"`. Add a fourth stat with `stat4Value`, `stat4Label`, `stat4Icon` if desired.

---

## 5. Bottom CTA

Headline, body, and Contact Us button.

```html
<CTABlock title="Safety is Non-Negotiable" description="Want to learn more about our safety program?" buttonText="Contact Us" buttonHref="/contact" variant="centered" />
```

---

## Full page paste (all sections in order)

Copy the block below into the CMS page content field. Replace the image URL and any stat placeholders (X) before publishing.

```html
<ContentBlock title="Our Safety Commitment" content="At Rothco Built, safety isn't a policy — it's a core value. Every team member is empowered and expected to maintain the highest safety standards. We believe every worker deserves to go home safe, and we build our processes around that commitment." image="https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800" imageAlt="Team safety briefing or toolbox talk" imagePosition="right" />

<FeatureGridBlock title="Safety Program" columns="3" variant="cards" feature1Icon="shield-check" feature1Title="OSHA Compliance" feature1Description="Full adherence to OSHA regulations and standards" feature2Icon="hospital" feature2Title="Healthcare Safety Protocols" feature2Description="ICRA, infection control, patient safety" feature3Icon="message-circle" feature3Title="Daily Safety Briefings" feature3Description="Toolbox talks and hazard identification" feature4Icon="file-text" feature4Title="Incident Reporting" feature4Description="Transparent reporting and corrective action" feature5Icon="lock" feature5Title="PPE Requirements" feature5Description="Enforced personal protective equipment standards" feature6Icon="building" feature6Title="Site Security" feature6Description="Controlled access, visitor protocols" />

<ContentBlock title="Quality Control" content="Our QC program ensures every deliverable meets specifications and client expectations. From material verification to final punch lists, we maintain rigorous documentation and inspection protocols." list="Project-specific QC plans, Three-phase inspection process, Material submittal tracking, Deficiency tracking and resolution, Final inspection and closeout documentation" />

<StatsBlock variant="cards" columns="3" stat1Value="X" stat1Label="Years Without Lost Time Incident" stat1Icon="shield-check" stat2Value="100%" stat2Label="OSHA Compliance" stat2Icon="check-circle" stat3Value="X" stat3Label="Hours of Safety Training Annually" stat3Icon="award" />

<CTABlock title="Safety is Non-Negotiable" description="Want to learn more about our safety program?" buttonText="Contact Us" buttonHref="/contact" variant="centered" />
```

---

## Technical notes

- **Tone:** Professional and serious; blocks use neutral styling.
- **Icons:** All from SimpleIcon (shield, shield-check, check, check-circle, hospital, message-circle, file-text, lock, building, award). No new icons added.
- **Downloadable safety policy:** To add a link to a PDF (e.g. “Download our Safety Policy”), add a second CTA or a ContentBlock with `buttonText="Download Safety Policy"` and `buttonHref="/path/to/safety-policy.pdf"` (and optionally `secondaryButtonText="Contact Us"` and `secondaryButtonHref="/contact"`), or add a ContentBlock/CTABlock that includes the document link in the body text.
