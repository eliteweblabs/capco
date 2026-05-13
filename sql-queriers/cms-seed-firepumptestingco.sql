-- =============================================================================
-- CMS seed: Fire Pump Testing Company, Inc. (https://firepumptestingco.com)
-- =============================================================================
-- Re-seeds idempotently via DELETE then INSERT (avoids needing UNIQUE(slug, clientId)).
-- Pages appear under /admin/cms and on the frontend via [...slug].astro when loaded.
--
-- MULTI-TENANT: Rows use clientId = 'fire-pump-testing-co'.
-- Match your Railway/project scope by setting EITHER:
--   RAILWAY_PUBLIC_DOMAIN / SITE_CONFIG pointing at this brand AND
--   RAILWAY_PROJECT_NAME=fire-pump-testing-co
-- OR edit the INSERTs below and replace 'fire-pump-testing-co' with your
-- actual RAILWAY_PROJECT_NAME string for this Supabase-backed deployment.
--
-- Run in Supabase SQL Editor (same project your app uses) or: psql <this file>.
-- Attribution: Aggregated/edited copy from https://firepumptestingco.com (2026).
-- =============================================================================

-- Idempotent without UNIQUE(slug, clientId): remove old seed rows for this clientId first.
DELETE FROM "cmsPages"
WHERE "clientId" = 'fire-pump-testing-co'
  AND "slug" IN ('/', 'about', 'services', 'portfolio', 'contact-us');

-- Home
INSERT INTO "cmsPages" (
  "slug", "title", "description", "content", "frontmatter", "template",
  "clientId", "isActive", "includeInNavigation", "navRoles", "navPageType",
  "displayOrder", "navDesktopOnly", "navHideWhenAuth", "navButtonStyle"
) VALUES (
  '/',
  'Home',
  'Massachusetts trusted fire protection partner — installation, inspection, and testing.',
  $fpt_home$# Massachusetts’ trusted fire protection partner

**24/7 Emergency Service** — [(781) 650-0867](tel:+17816500867)

## Installation

We specialize in installation of fire sprinklers per NFPA standards in residential and commercial settings — new and existing construction.

[Get quote](/contact-us)

## Inspection

Annual inspections help ensure your fire protection system is operational and code-compliant.

[Get quote](/contact-us)

## Testing

Our certified technicians perform thorough fire protection testing for code compliance and system readiness.

[Get quote](/contact-us)

## What we offer

**24/7 service department**

Annual inspection, testing, and maintenance to keep systems reliable and compliant.

- **Call us 24/7** — emergency service, 7 days a week  
- **Sprinkler system installation** — NFPA 13–aligned residential and commercial work  
- **Engineered fire protection systems** — aligned with NFPA 17 / 17A where applicable  
- **Fire pumps** — annual performance testing plus weekly/monthly churn programs (electric monthly; diesel weekly per program requirements)

## About Fire Pump Testing Company

Fire Pump Testing Company, Inc. is a **SDVOSB** (Service-Disabled Veteran-Owned Small Business) founded on the South Shore of Massachusetts by U.S. Marine Corps veteran Martin Duross. After journeyman licensure through Local 550 and continued growth toward fire sprinkler contracting, the company focuses on excellence and life safety for clients across Massachusetts.

---

**Contact**

- [support@firepumptestingco.com](mailto:support@firepumptestingco.com)
- [(781) 650-0867](tel:+17816500867)
- 500 Chestnut St., Unit 106 — Abington, MA 02351 — USA

Ready to scope a job? **[Get a quote](/contact-us)**
$fpt_home$::text,
  '{}'::jsonb,
  'fullwidth',
  'fire-pump-testing-co',
  true,
  true,
  ARRAY['any']::text[],
  'frontend',
  10,
  false,
  false,
  NULL
);

-- About
INSERT INTO "cmsPages" (
  "slug", "title", "description", "content", "frontmatter", "template",
  "clientId", "isActive", "includeInNavigation", "navRoles", "navPageType",
  "displayOrder", "navDesktopOnly", "navHideWhenAuth", "navButtonStyle"
) VALUES (
  'about',
  'About Us',
  'Quality fire protection across Massachusetts — SDVOSB owned and operated.',
  $fpt_about$# About us

## Our commitment to quality

We are committed to high-quality fire protection services regardless of project size or complexity — from targeted repairs through large installations, with precision and reliability.

[Get quote](/contact-us)

## History and mission

Fire Pump Testing Company, Inc. is a **Service-Disabled Veteran-Owned Small Business** founded by **Martin Duross**, U.S. Marine Corps veteran on Massachusetts’ South Shore. After returning from service in support of overseas operations around 2017, Martin apprenticed within his family’s fire protection legacy and deepened responsibility for **life safety** — a principle that guides the business today.

## Our pledge

We protect **what matters most** — your safety, your family, and your community. Veteran-owned and family-operated, we prioritize integrity, responsiveness, and **around-the-clock** availability when emergencies arise.

[Get quote](/contact-us)
$fpt_about$::text,
  '{}'::jsonb,
  'fullwidth',
  'fire-pump-testing-co',
  true,
  true,
  ARRAY['any']::text[],
  'frontend',
  20,
  false,
  false,
  NULL
);

-- Services (combined; original site exposes these under a mega-menu)
INSERT INTO "cmsPages" (
  "slug", "title", "description", "content", "frontmatter", "template",
  "clientId", "isActive", "includeInNavigation", "navRoles", "navPageType",
  "displayOrder", "navDesktopOnly", "navHideWhenAuth", "navButtonStyle"
) VALUES (
  'services',
  'Services',
  'Installation, inspections, NFPA-aligned testing, and maintenance across Massachusetts.',
  $fpt_services$# Services

Trusted fire pump and sprinkler capabilities across Massachusetts. Representative offerings (from public site menus):

## Installation

- New sprinkler installation — **residential and commercial**, aligned with NFPA requirements

## Inspection, testing, and maintenance

- Annual inspections and preventative maintenance paths  
- **Fire pump testing** — performance testing plus weekly/monthly churn support where specified  
- **Standpipe testing**  
- **Dry system trip testing**  
- **Wet system flow testing**  
- **Pressure-regulating valve** forward-flow testing  
- **Hydrant flow test and maintenance**

## Mobile fleet

- **Fire pump testing truck** — mobile flow and flushing unit support

---

Need a scoped proposal? **[Request a quote](/contact-us)**

**24/7** — [(781) 650-0867](tel:+17816500867)
$fpt_services$::text,
  '{}'::jsonb,
  'fullwidth',
  'fire-pump-testing-co',
  true,
  true,
  ARRAY['any']::text[],
  'frontend',
  30,
  false,
  false,
  NULL
);

-- Portfolio
INSERT INTO "cmsPages" (
  "slug", "title", "description", "content", "frontmatter", "template",
  "clientId", "isActive", "includeInNavigation", "navRoles", "navPageType",
  "displayOrder", "navDesktopOnly", "navHideWhenAuth", "navButtonStyle"
) VALUES (
  'portfolio',
  'Portfolio',
  'Project highlights — add imagery and captions in CMS as you migrate visuals.',
  $fpt_portfolio$# Our work

## Crafted with purpose. Delivered with passion.

The live marketing site showcased representative project imagery here. After you migrate photos into this app (or tie into a gallery workflow), extend this page with Markdown image syntax or richer blocks — for now this section is intentionally brief so you control assets and releases.

Explore next steps: **[Get a quote](/contact-us)**.

**Reach us:** [support@firepumptestingco.com](mailto:support@firepumptestingco.com) · [(781) 650-0867](tel:+17816500867)
$fpt_portfolio$::text,
  '{}'::jsonb,
  'fullwidth',
  'fire-pump-testing-co',
  true,
  true,
  ARRAY['any']::text[],
  'frontend',
  40,
  false,
  false,
  NULL
);

-- Contact (canonical path matches original /contact-us)
INSERT INTO "cmsPages" (
  "slug", "title", "description", "content", "frontmatter", "template",
  "clientId", "isActive", "includeInNavigation", "navRoles", "navPageType",
  "displayOrder", "navDesktopOnly", "navHideWhenAuth", "navButtonStyle"
) VALUES (
  'contact-us',
  'Contact',
  'Questions, quotes, or 24/7 emergency support.',
  $fpt_contact$
## Contact us

Have a question or need support? We are a message away.

**Phone (24/7):** [(781) 650-0867](tel:+17816500867)  
**Email:** [support@firepumptestingco.com](mailto:support@firepumptestingco.com)  
**Office:** 500 Chestnut St., Unit 106 — Abington, MA 02351 — USA  

Use the secure form below for project details — select the closest service category and describe your timeline.

<ContactForm />
$fpt_contact$::text,
  '{}'::jsonb,
  'fullform',
  'fire-pump-testing-co',
  true,
  true,
  ARRAY['any']::text[],
  'frontend',
  50,
  false,
  false,
  'outline'
);
