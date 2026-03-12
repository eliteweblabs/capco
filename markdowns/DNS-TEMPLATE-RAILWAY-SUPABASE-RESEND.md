# DNS Template: Railway + Supabase + Resend

Use this as the default DNS baseline for a professional production setup.

## 1) Web Hosting (Railway)

Required:

- `A` `@` -> `66.33.22.191` (apex/root domain to Railway)
- `CNAME` `www` -> `<your-service>.up.railway.app`

Notes:

- Keep TTL at `300` during setup, then increase later if desired.
- Ensure the same custom domains are added in Railway project networking.

## 2) Email Receiving (Google Workspace)

If using Google Workspace for inboxes:

- `MX` `@` -> `aspmx.l.google.com` priority `1`
- `MX` `@` -> `alt1.aspmx.l.google.com` priority `5`
- `MX` `@` -> `alt2.aspmx.l.google.com` priority `5`
- `MX` `@` -> `alt3.aspmx.l.google.com` priority `10`
- `MX` `@` -> `alt4.aspmx.l.google.com` priority `10`

## 3) Transactional Sending (Resend / SES MAIL FROM)

Recommended pattern: send from subdomain (example `send.example.com`)

- `MX` `send` -> `feedback-smtp.us-east-1.amazonses.com` priority `10`
- `TXT` `send` -> `v=spf1 include:amazonses.com ~all`
- `TXT` `resend._domainkey` -> `p=...` (Resend DKIM key)

Optional but recommended:

- `TXT` `@` -> SPF for root mail if you send from root domain
  - Example (Google + SES): `v=spf1 include:_spf.google.com include:amazonses.com ~all`

## 4) Domain Authentication (DMARC)

Required:

- `TXT` `_dmarc` -> `v=DMARC1; p=none; rua=mailto:dmarc@<domain>; adkim=s; aspf=s`

For stricter production after monitoring:

- Move from `p=none` -> `p=quarantine` -> `p=reject` in phases.

## 5) Google Search Console (Webmaster Tools)

Required:

- `TXT` `@` -> `google-site-verification=...`

Important:

- Record existing in DNS does **not** guarantee the property is verified in Search Console.
- You still need to add/verify the exact property in Google Search Console (Domain property preferred).

## 6) Supabase

Supabase often works without DNS changes unless you configure custom domains/features.

Common cases:

- **No custom Supabase domain**: no DNS records needed.
- **Custom auth/api domain**: add the exact `CNAME`/verification records Supabase provides in project settings.
- Keep site URL + redirect URLs aligned with your live domain(s).

## 7) Security Hardening (Recommended)

- Add `CAA` records to restrict certificate issuers.
  - Example:
    - `CAA` `@` `0 issue "letsencrypt.org"`
    - `CAA` `@` `0 iodef "mailto:security@<domain>"`

## 8) Launch Checklist

- Domain resolves for both `@` and `www`.
- SSL certificate is valid for both `@` and `www`.
- Google Workspace mail receives correctly.
- Resend test email passes SPF, DKIM, DMARC.
- Search Console domain property is verified.
- Railway `RAILWAY_PUBLIC_DOMAIN` matches the active live URL.
- Supabase auth redirect URLs include production domain.

## 9) Quick Assessment of Current `rothcollc.com` Screenshot

Looks good:

- Railway web records present (`A @`, `CNAME www`).
- Google Workspace MX records present.
- Resend DKIM + SES mail-from (`send`) present.
- DMARC present.
- Google site verification TXT appears present.

Potential improvements:

- Add `rua` mailbox to DMARC for reporting.
- Consider phased DMARC policy hardening later.
- Add CAA records for certificate control.
