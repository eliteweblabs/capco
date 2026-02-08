# Railway → Supabase blocked by Cloudflare

## What happened

Deploy logs on Railway (e.g. CAPCO production) showed:

- `❌ [CONTENT] Database error for wp/wp-config.php` (and `cms/wp-config.php`) with a **full Cloudflare "Sorry, you have been blocked" HTML page** in the message.
- The log line said **"You are unable to access supabase.co"**.

So:

1. **Bots** were requesting `/wp/wp-config.php` and `/cms/wp-config.php`. The app treated those as page slugs and called the CMS (Supabase).
2. **Supabase** is behind Cloudflare. Requests from **Railway’s server IP** (e.g. `34.48.122.217`) to `supabase.co` were being **blocked by Cloudflare** (WAF/bot protection).
3. The Supabase client then saw an HTML error page instead of JSON, and our code logged that whole HTML as a "database error".

## Code changes made

- **Skip CMS for probe paths:** In `src/lib/content.ts`, `getPageContent()` now returns `null` immediately for slugs that look like bot probes (e.g. `.php`, `wp/`, `wp-config`). We no longer call Supabase for those, so no more log spam from those requests.
- **Sanitize error logs:** If a Supabase error message looks like Cloudflare HTML (e.g. contains `cf-wrapper`, "you have been blocked"), we log a short message like “Database unreachable (likely Cloudflare/network block)” instead of dumping the full HTML.

## Fixing Supabase access from Railway

The underlying issue is **Cloudflare blocking Railway → supabase.co**. Options:

1. **Supabase dashboard**  
   Check if your project has IP allowlisting or “Restrict access” settings. If so, add Railway’s egress IP(s). Railway’s IP can change; consider using a [static egress IP](https://docs.railway.app/reference/static-egress-ip) if available.

2. **Supabase connection method**  
   Use the **connection pooler** (Supavisor) or the **direct** connection string as recommended for server/server use. Sometimes one path is less likely to hit the same Cloudflare rules.

3. **Contact Supabase**  
   Ask if they can allowlist or whitelist traffic from Railway’s IP range so server-side requests from your app aren’t blocked by Cloudflare.

4. **Cloudflare (if you manage it)**  
   If the block is on a zone you control in front of Supabase, add a WAF or firewall rule to allow Railway’s IP(s).

Until Supabase is reachable from Railway, **real CMS pages** that are loaded from the database may fail or fall back to env/file content. The code changes above only reduce log noise and avoid unnecessary Supabase calls for probe URLs.
