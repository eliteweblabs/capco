# CAPCO Operations — CAP Design Group Business Automation

## What This Is
Operational AI assistant for Jason Kahan (Jay), P.E. — principal at CAP Design Group.
Fire protection engineering firm in Massachusetts.

## Goal
Replace Jason's current zero-project-management chaos with an AI-driven ops layer that:
1. Handles email → task conversion
2. Generates documents (narratives, affidavits, NFPA 241 plans) from templates
3. Manages designer pipeline (keeps people on track)
4. Integrates with GoHighLevel CRM
5. Lives on Slack (Jason's preferred surface)

## Jason's Profile
- **Name:** Jason Kahan, P.E. (MA Registration 48388)
- **Email:** jk@capcofire.com
- **Phone:** 617-633-3533
- **Role:** Engineer of record, principal
- **Style:** Wants results, not database tables. Iterative — gives scope then refines.

## CAP Design Group
- Fire sprinkler design (NFPA 13, 13R, 13D)
- Fire alarm design (NFPA 72)
- NFPA 25 inspection/remediation
- Life safety narratives
- Building code compliance analysis
- Third-party plan review (stamping)

## Massachusetts Regulatory Environment
- 780 CMR (10th Edition, based on IBC 2021)
- 527 CMR 1.00 (MA Fire Safety Code)
- Local AHJ requirements (including Boston Fire Dept rules)
- NFPA: 1, 13, 13D, 13R, 14, 25, 72, 101, 241

## Key Clients & Collaborators
- The Hamilton Company (property management)
- Bob Parsekian (developer)
- John Crowell (architect)
- Xcel Fire Protection (contractor)
- Boustris & Sons, Inc. (contractor)

## Existing Tools
- Google Workspace (Forms → Sheets → Docs via Apps Script)
- Node.js docx library for Word generation
- Zoho Books for proposals/invoicing
- GoHighLevel (has API — to be integrated)
- Slack (preferred comms)

## Jason's Working Principles
- AHJ interpretation > strict code compliance
- Proactive issue flagging (surface problems, don't bury them)
- Preempt reviewer pushback in submittals
- Template integrity: red text = placeholder only, final = all black
- Sections 3, 4, 6, 7 of life safety narratives = fixed boilerplate
- Boston vs non-Boston toggle for BFD Rules Section 9
- Downloadable/exportable outputs > inline markdown
- Plan review: color-coded priority tables (critical/major/clarification)

## Active Work (from Jason's Claude project)
- Life Safety Narrative template builder (7-step, working for non-Boston)
- 23 Prince St, Danvers — NFPA 25 remediation (open: missing backflow preventer Bldg 2)
- Expanding narrative templates: 13D/13R, 13, commercial
- MA building code IRC/IBC threshold analysis

## Staff Domains (not clients)
- capcofire.com
- eliteweblabs.com
- tomsens.com

## Database Schema

### Existing Tables (already built)
- `projects` — project records with address, status, assignedTo, requestedDocs, dueDate
- `magicLinkTokens` — token-based auth with redirect URLs (for internal auth)
- `projectStatuses` — status codes with client email templates, button text/links
- `files` / `fileVersions` — file management system
- `notifications` — internal notification system
- `documentTemplates` / `documentComponents` — template system
- `punchlist` — task/completion tracking per project
- `contactSubmissions` — intake form with phone, smsAlerts
- `profiles` — user profiles

### New Tables (migration: 20260325000000_capco_ops_pipeline.sql)
- `emailLog` — every ingested email, parsed + classified + linked to project
- `tasks` — actionable items derived from emails or manual creation
- `clientMagicLinks` — one-pager tokens for clients (upload, review, fill form)
- `clientUploads` — files uploaded by clients via magic links
- `projectRequirements` — per-project checklist of required docs
- `smsLog` — all Twilio SMS sent/received (audit trail)
- `followUps` — scheduled auto-nag cadence (client + designer)
- `docGenLog` — AI-generated documents tracking

### Integration Keys (env vars — NOT committed)
- `TWILIO_ACCOUNT_SID` — Twilio account
- `TWILIO_AUTH_TOKEN` — Twilio auth
- `TWILIO_PHONE_NUMBER` — outbound SMS number
- `SUPABASE_URL` — existing
- `SUPABASE_SERVICE_KEY` — existing
- `IMAP_*` — email polling credentials

## TODO
- [ ] Fix OG image: `PUBLIC_GOOGLE_MAPS_API_KEY` not resolving in build — Dockerfile fallback to PLACES key not working. May need to set explicitly in Railway or debug ARG/ENV order
- [ ] Fix Twilio SMS: toll-free number needs verification OR buy a local number (~$1.15/mo)
- [ ] Get GoHighLevel API key from Jason
- [ ] Get Slack workspace invite
- [ ] Get document templates from Jason (narratives, affidavits, NFPA 241)
- [ ] Wire up email ingestion (IMAP polling → emailLog → classification)
- [ ] Build email delivery for magic links (currently SMS only)
- [ ] Designer pipeline / nag system
