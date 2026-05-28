# Fire Pump Customer Import — Final

**Date:** 2026-05-27  
**Source:** Customers.xlsx (FIRE PUMP TESTING COMPANY, INC.)  
**Status:** Complete (clients + addresses)

## Totals

- **120** Client profiles (auth + profiles, role Client)
- **105** Projects from **billing addresses** only; `authorId` = client; meta in `projects.project` jsonb (`node scripts/reconcile-fire-pump-addresses.mjs --execute`)
- **0** placeholder emails
- Rows without a real email were **not** imported as clients (Neil Rasmussen, VA Brockton removed; Blue Finn uses shauna@bluefinrealty.com when projects are added)

## Policy applied

- One profile per client email
- Duplicate spreadsheet rows → deferred projects (not separate clients)

## Emails resolved during review

| Customer | Email |
|----------|-------|
| Anthony Barrasso Residence | jinxedpirate@gmail.com |
| Ben Brown | info@tbreno.com |
| Casper Plumbing & Heating LLC. | casperphdc@gmail.com |
| Elite Fire & Security, Inc | alicia@elitefiresec.com |
| Mark Ferrazzani | russovfl@gmail.com |

## Not imported (no email)

| Spreadsheet name | Notes |
|------------------|-------|
| Neil Rasmussen | Had placeholder only — removed |
| VA Brockton - Renovate SCIU Vestibule & Patio | Had placeholder only — removed |
| Blue Finn Realty | Same client as shauna@bluefinrealty.com — project later |

## Deferred projects (add under existing client later)

### shauna@bluefinrealty.com (12 Station St. LLC)
- West Grove Holdings, LLC
- Blue Finn Realty

### michaelmitrano123@gmail.com (467 MAIN ST)
- MICHAEL MITRANO

### lawrence.matthias@climatepros.com (Climate Pros)
- Lawrence Matthias

### ennakingco@gmail.com (Enna King Construction)
- KS Partners, LLC

### mahavir.patel@karmproperties.com (KARM Hospitality)
- KARM realty trust

### info@wecarpentrycorp.com (W & E Carpentry Corp.)
- W&E Carpentry Corp.
