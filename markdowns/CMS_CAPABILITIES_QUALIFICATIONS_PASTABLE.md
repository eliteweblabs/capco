# Capabilities & Qualifications — CMS Pastable Content

Paste into Admin → CMS → Create/Edit Page. Use **Content** field.

**Page settings (CMS form):**
- **Slug:** `capabilities` or `capabilities-qualifications`
- **Title:** Capabilities & Qualifications
- **Description:** SDVOSB-certified with the bonding capacity, experience, and infrastructure to deliver complex federal and institutional construction projects.
- **Template:** `default` or `fullwidth`

---

## Option A: With Hero Block (full hero section)

Use this if you want a large hero above the content. Copy everything below into the **Content** field.

```
<Hero title="Capabilities &amp; Qualifications" description="SDVOSB-certified with the bonding capacity, experience, and infrastructure to deliver complex federal and institutional construction projects." enableAos="false" />

<FeatureGridBlock title="Capability Snapshot" columns="2" variant="cards" feature1Icon="award" feature1Title="Certification" feature1Description="SDVOSB Certified" feature2Icon="building" feature2Title="Primary NAICS" feature2Description="236220 — Commercial &amp; Institutional Building Construction" feature3Icon="dollar-sign" feature3Title="Bonding" feature3Description="$12M Single / $18M Aggregate" feature4Icon="map-pin" feature4Title="Geographic Reach" feature4Description="Northeast United States" feature5Icon="briefcase" feature5Title="Delivery Model" feature5Description="Self-Performing General Contractor" />

## Core Competencies

<FeatureGridBlock columns="4" variant="cards" feature1Icon="building" feature1Title="General Contracting" feature1Description="Full project delivery from preconstruction to closeout" feature2Icon="bar-chart-3" feature2Title="Construction Management" feature2Description="Schedule, budget, and quality oversight" feature3Icon="shield" feature3Title="Safety Management" feature3Description="OSHA-compliant programs, zero-incident culture" feature4Icon="check-circle" feature4Title="Quality Control" feature4Description="QC plans, inspections, documentation" />

## What Makes Rothco Different

<ListBlock title="What Makes Rothco Different" variant="checklist" icon="check" items="Healthcare &amp; VA Expertise
Proven Safety Culture
Turnkey Federal Delivery
Responsive &amp; Agile Team
Trusted Agency Relationships" />

## Certifications &amp; Registrations

<ContentBlock title="Certifications &amp; Registrations" list="SDVOSB Certified, SAM.gov Registered, State Licenses, OSHA 30 &amp; Safety Certifications" />

<ContentBlock title="Capability Statement" content="Download our capability statement for project requirements, certifications, and past performance." image="/images/capability-statement-thumb.jpg" imageAlt="Capability Statement PDF preview" imagePosition="left" buttonText="Download Capability Statement (PDF)" buttonHref="/documents/capability-statement.pdf" />

<CTABlock title="Let's Discuss Your Project Requirements" description="Ready to talk scope, schedule, or teaming?" buttonText="Contact Us" buttonHref="/contact" variant="centered" />
```

---

## Option B: Title/description only (no hero block)

If the layout already shows the page title and description at the top, omit the Hero block and start with the Snapshot:

```
<FeatureGridBlock title="Capability Snapshot" columns="2" variant="cards" feature1Icon="award" feature1Title="Certification" feature1Description="SDVOSB Certified" feature2Icon="building" feature2Title="Primary NAICS" feature2Description="236220 — Commercial &amp; Institutional Building Construction" feature3Icon="dollar-sign" feature3Title="Bonding" feature3Description="$12M Single / $18M Aggregate" feature4Icon="map-pin" feature4Title="Geographic Reach" feature4Description="Northeast United States" feature5Icon="briefcase" feature5Title="Delivery Model" feature5Description="Self-Performing General Contractor" />

## Core Competencies

<FeatureGridBlock columns="4" variant="cards" feature1Icon="building" feature1Title="General Contracting" feature1Description="Full project delivery from preconstruction to closeout" feature2Icon="bar-chart-3" feature2Title="Construction Management" feature2Description="Schedule, budget, and quality oversight" feature3Icon="shield" feature3Title="Safety Management" feature3Description="OSHA-compliant programs, zero-incident culture" feature4Icon="check-circle" feature4Title="Quality Control" feature4Description="QC plans, inspections, documentation" />

## What Makes Rothco Different

<ListBlock title="What Makes Rothco Different" variant="checklist" icon="check" items="Healthcare &amp; VA Expertise
Proven Safety Culture
Turnkey Federal Delivery
Responsive &amp; Agile Team
Trusted Agency Relationships" />

## Certifications &amp; Registrations

<ContentBlock title="Certifications &amp; Registrations" list="SDVOSB Certified, SAM.gov Registered, State Licenses, OSHA 30 &amp; Safety Certifications" />

<ContentBlock title="Capability Statement" content="Download our capability statement for project requirements, certifications, and past performance." image="/images/capability-statement-thumb.jpg" imageAlt="Capability Statement PDF preview" imagePosition="left" buttonText="Download Capability Statement (PDF)" buttonHref="/documents/capability-statement.pdf" />

<CTABlock title="Let's Discuss Your Project Requirements" description="Ready to talk scope, schedule, or teaming?" buttonText="Contact Us" buttonHref="/contact" variant="centered" />
```

---

## Certifications with logos (when you have images)

Replace placeholders with your logo URLs (e.g. `/images/certs/sdvosb.png`):

```
<LogoCloudBlock title="Certifications &amp; Registrations" variant="grid" logos='[{"src":"/images/certs/sdvosb.png","alt":"SDVOSB Certified","href":"https://www.sam.gov"},{"src":"/images/certs/sam.png","alt":"SAM.gov","href":"https://www.sam.gov"},{"src":"/images/certs/state-license.png","alt":"State Licensed"},{"src":"/images/certs/osha30.png","alt":"OSHA 30"}]' />
```

---

## PDFPreview shortcode

Embed a PDF directly in the page:

```
<PDFPreview url="/documents/capability-statement.pdf" height="600px" documentName="Capability Statement" />
```

Props: `url` (required for shortcode), `height`, `documentName`, `showZoomControls` ("true"/"false").

---

## Notes

- **Ampersands:** Use `&amp;` in attribute values (e.g. "Commercial &amp; Institutional", "Healthcare &amp; VA").
- **Capability statement PDF:** Put the PDF in `public/documents/capability-statement.pdf` and the thumbnail in `public/images/capability-statement-thumb.jpg`. Remove `image`, `imageAlt`, `imagePosition` if you don't have a thumbnail.
- **ListBlock items:** Use line breaks between list items.
- **Icons:** From SimpleIcon set (award, building, dollar-sign, map-pin, briefcase, bar-chart-3, shield, check-circle).
