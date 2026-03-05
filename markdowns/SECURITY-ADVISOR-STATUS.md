# Supabase Security Advisor Status

This document tracks findings from the Supabase Security Advisor (the email alerts you receive). Run `get_advisors` with `type: "security"` via Supabase MCP to refresh.

**Last run:** 2026-03-05

---

## 1. Function Search Path Mutable (21 functions)

**Level:** WARN  
**Description:** Functions where the `search_path` parameter is not set. Without it, an attacker could potentially exploit schema resolution (CVE-2018-1058) by creating objects in writable schemas.

**Remediation:** [Supabase Linter 0011](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)

**Fix:** Add `SET search_path = public` (or appropriate schema) to each function definition:

```sql
CREATE OR REPLACE FUNCTION public.function_name(...)
RETURNS ...
LANGUAGE plpgsql
SET search_path = public   -- add this line
AS $$ ... $$;
```

### Affected functions

| Function |
|----------|
| `public.update_updated_at_on_status_change` |
| `public.update_project_punchlist_counts` |
| `public.update_cms_block_pages_updatedAt` |
| `public.update_project_item_templates_updated_at` |
| `public.update_review_submissions_updatedat` |
| `public.get_unread_notification_count` |
| `public.cleanup_expired_notifications` |
| `public.append_project_log` |
| `public.append_project_log_with_limit` |
| `public.reset_project_due_date` |
| `public.set_project_due_date_on_status_change` |
| `public.set_project_due_date_on_insert` |
| `public.to_camel_case` |
| `public.update_missing_due_dates` |
| `public.update_single_project_due_date` |
| `public.sync_featured_image_data` |
| `public.refresh_project_featured_image_data` |
| `public.calculate_ai_cost` |
| `public.get_agent_knowledge` |
| `public.handle_new_user` |
| `public.get_user_role` |
| `public.is_admin` |

**Note:** Some functions may already be fixed in `sql-queriers/fix-function-search-path-warnings.sql`. Apply any missing fixes to the remaining functions above. Each site (Capco, Rothco) uses its own Supabase—run migrations per project.

---

## 2. RLS Policy Always True (6 tables)

**Level:** WARN  
**Description:** Policies using `WITH CHECK (true)` for INSERT effectively bypass row-level security for that operation. SELECT with `USING (true)` is often intentional for public read; INSERT/UPDATE/DELETE with always-true checks is risky.

**Remediation:** [Supabase Linter 0024](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)

### Affected policies

| Table | Policy name | Command | Role | Detail |
|-------|-------------|---------|------|--------|
| `ai_agent_usage` | System can create usage records | INSERT | authenticated | WITH CHECK always true |
| `ai_generations` | System can create AI generations | INSERT | authenticated | WITH CHECK always true |
| `contactSubmissions` | Anonymous users can insert contact submissions | INSERT | anon | WITH CHECK always true |
| `demo_bookings` | Anyone can create demo bookings | INSERT | anon | WITH CHECK always true |
| `feedback` | Users can submit feedback | INSERT | authenticated | WITH CHECK always true |
| `reviewSubmissions` | Anyone can insert review submissions | INSERT | anon | WITH CHECK always true |

**Action:** Review each policy. If anonymous/authenticated insert into these tables is intentional (e.g. contact form), you may accept the risk. For `ai_agent_usage` and `ai_generations`, consider restricting INSERT to service role or a specific role that backs your AI system.

---

## 3. Leaked Password Protection Disabled

**Level:** WARN  
**Description:** Supabase Auth can block compromised passwords via HaveIBeenPwned.org. This feature is currently disabled.

**Remediation:** [Password security docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

**Action:** In Supabase Dashboard → Auth → Providers → Email, enable **Prevent the use of leaked passwords**. Available on Pro Plan and above. Also consider:

- Requiring digits, uppercase, lowercase, and symbols
- Minimum password length ≥ 8 characters

---

## Quick links

- [Supabase Security Advisor](https://supabase.com/dashboard/project/_/database/security-advisor)
- [Database Linter docs](https://supabase.com/docs/guides/database/database-linter)
- [RLS Security Audit 2026-01-23](./rls-security-audit-2026-01-23.md)
