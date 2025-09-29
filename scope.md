# Project Scope

This app is designed to facilitate the process of submitting (by clients) and reviewing (by admins) PDFs for fire protection systems.

ALWAYS RUN ON PORT 4321

- **Admins & Clients** can upload and submit PDF documents related to fire protection systems.
- **Admins** can review, manage, and approve/reject these submissions.
- **Client** can download final submissions

## Authentication & Navigation

- The index page (`/`) is now a marketing landing page for public visitors.
- Authenticated users access the dashboard for project management.
- User Roles: Admin > Staff > Client

## Development Session Management

**⚠️ IMPORTANT: Always check `PREVIOUS_SESSION_SUMMARY.md` at the start of each development session.**

This file contains:

- Current branch status and last working location
- Recent changes and implementations
- Todo items and next steps
- Technical context and decisions made
- Git commit history and file changes

Update this file at the end of each significant development session to maintain context continuity.

### Use Packages

- Astro
- BoxIcons
- Toast Notifications
- Resend
- Tailwind
- Flowbite
- SupaBase
- Railway
- NO REACT
- Stripe
- All Pages to Format with App Component
- avoid using JS to create Mark up whenever possible

## HTML Template Capture Pattern

**When you need to capture HTML from Astro templates for use in modals or dynamic content:**

### Method 1: Hidden Template with CSS (Recommended)

```astro
<!-- Template stays in Astro component, hidden by default -->
<form id="my-form" style="display: none;">
  <!-- Form content -->
</form>

<script>
  // Capture HTML and remove original
  const form = document.getElementById("my-form");
  const formHTML = form.outerHTML;
  form.remove();

  // Use in modal system
  window.showModal("info", "Title", formHTML);
</script>
```

### Method 2: Astro Page Partials (For Complex Templates)

```astro
---
// src/pages/partials/my-form.astro
export const partial = true;
---

<form>
  <!-- Complex form content -->
</form>
```

Then fetch dynamically:

```javascript
const response = await fetch("/partials/my-form/");
const formHTML = await response.text();
window.showModal("info", "Title", formHTML);
```

### Best Practices:

- ✅ **Use Method 1** for simple forms/templates
- ✅ **Use Method 2** for complex, reusable templates
- ✅ **Always remove original element** after capturing HTML
- ✅ **Use event delegation** for dynamically created content
- ❌ **Avoid** generating HTML in JavaScript
- ❌ **Avoid** keeping hidden elements in DOM permanently

### Environment Variables

**Railway Production Variables (for development reference):**

```env
EMAIL_API_KEY=<resend_api_key>
EMAIL_PROVIDER=resend
FROM_EMAIL=<noreply_email_address>
FROM_NAME=CAPCo
SUPABASE_ANON_KEY=<supabase_anonymous_key>
SUPABASE_URL=<supabase_project_url>
```

**Required for local development:**

- Copy these variables to your local `.env` file
- Replace `<placeholders>` with actual values from Railway dashboard
- Email service (Resend) is required for SMS contact form functionality
- Supabase credentials are required for authentication and database access

### Architecture Principles

**Server-Side Rendering First:**

- Minimize client-side HTML generation via JavaScript
- Astro components should build proper page structure server-side for each session
- Prefer static HTML with progressive enhancement over dynamic DOM manipulation
- Use client-side JS only for:
  - Interactive behaviors (form submissions, search filtering)
  - Real-time updates (live data fetching)
  - User input handling (dropzone, file uploads)
- Avoid rebuilding entire sections of the page with innerHTML when possible
- Structure should be determined at build/render time, not runtime

## Database Schema

### Common Issues

- Use `id` not `project_id` in files table
- `author_id` references project author's user ID, not project ID
- UUID vs text comparisons in RLS policies
- **IMPORTANT**: The `profiles` table does NOT have a `name` column. Use `first_name` and `last_name` (or `company_name` as fallback) for user display names. Many APIs incorrectly assume a `name` field exists.

### TODO Items

- **HIGH PRIORITY**: Fix RLS policies - current implementation broke everything and needs complete overhaul
- Implement auto-suggest mention system for comments (Admin, Staff, Project Author)
- Add "completed" toggle for discussions/comments (checkbox true/false) next to SMS alert
- Convert SMS alert and internal into toggles too
- Fix Supabase RLS security issues (Policy Exists RLS Disabled, RLS Disabled in Public)

### Recent Schema Updates

- **projects.feature** (boolean): Added for marketing page project showcase. Default: false. Set to true for projects to display on public `/projects` page.
- **projects.assigned_to_id** (uuid): References profiles table for staff assignment
- **projects.building, project, service, requested_docs** (jsonb): Store form configuration data
- **projects.created_at, updated_at** (timestamp): Proper timestamping with timezone
- **profiles.created_at, updated_at** (timestamp): Proper timestamping with timezone
- **projects.status** (integer): Project workflow status codes (10-220)

### Current Database Schema

**Run this SQL in Supabase to get the complete current schema:**

```sql
-- Get complete table structure with all columns, types, and constraints
SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    c.ordinal_position,
    CASE
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY -> ' || fk.foreign_table_name || '.' || fk.foreign_column_name
        ELSE ''
    END as key_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
    SELECT
        ku.table_name,
        ku.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN ('users', 'projects', 'files', 'profiles', 'project_statuses', 'invoices', 'invoice_line_items', 'discussions')
ORDER BY t.table_name, c.ordinal_position;
```

**Alternative simpler query for just the main tables:**

```sql
-- Simple version - just column names and types
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('users', 'projects', 'files', 'profiles', 'project_statuses', 'invoices', 'invoice_line_items', 'discussions')
ORDER BY table_name, ordinal_position;
```

| table_name       | column_name                | data_type                   | is_nullable | column_default                               |
| ---------------- | -------------------------- | --------------------------- | ----------- | -------------------------------------------- |
| chat_messages    | id                         | integer                     | NO          | nextval('chat_messages_id_seq'::regclass)    |
| chat_messages    | user_id                    | uuid                        | YES         | null                                         |
| chat_messages    | user_name                  | text                        | NO          | null                                         |
| chat_messages    | user_role                  | text                        | NO          | null                                         |
| chat_messages    | message                    | text                        | NO          | null                                         |
| chat_messages    | timestamp                  | timestamp with time zone    | YES         | now()                                        |
| chat_messages    | created_at                 | timestamp with time zone    | YES         | now()                                        |
| files            | id                         | integer                     | NO          | nextval('files_id_seq'::regclass)            |
| files            | project_id                 | integer                     | YES         | null                                         |
| files            | author_id                  | uuid                        | YES         | null                                         |
| files            | file_name                  | text                        | YES         | null                                         |
| files            | file_path                  | text                        | YES         | null                                         |
| files            | file_type                  | text                        | YES         | null                                         |
| files            | file_size                  | bigint                      | YES         | null                                         |
| files            | uploaded_at                | timestamp without time zone | YES         | now()                                        |
| files            | status                     | text                        | YES         | 'active'::text                               |
| files            | comments                   | text                        | YES         | null                                         |
| files            | title                      | text                        | YES         | null                                         |
| files            | updated_at                 | timestamp with time zone    | YES         | null                                         |
| files_global     | id                         | integer                     | NO          | nextval('files_id_seq'::regclass)            |
| files_global     | name                       | text                        | YES         | null                                         |
| files_global     | type                       | integer                     | YES         | null                                         |
| files_global     | file_name                  | text                        | YES         | null                                         |
| files_global     | file_path                  | text                        | YES         | null                                         |
| files_global     | file_type                  | text                        | YES         | null                                         |
| files_global     | file_size                  | bigint                      | YES         | null                                         |
| files_global     | uploaded_at                | timestamp without time zone | YES         | now()                                        |
| files_global     | status                     | text                        | YES         | 'active'::text                               |
| global_options   | id                         | bigint                      | NO          | null                                         |
| global_options   | key                        | text                        | YES         | null                                         |
| global_options   | value                      | text                        | YES         | null                                         |
| invoices         | id                         | bigint                      | NO          | null                                         |
| invoices         | created_at                 | timestamp with time zone    | NO          | now()                                        |
| invoices         | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| invoices         | project_id                 | bigint                      | NO          | null                                         |
| invoices         | created_by                 | uuid                        | YES         | auth.uid()                                   |
| invoices         | subject                    | text                        | YES         | null                                         |
| invoices         | status                     | text                        | NO          | 'draft'::text                                |
| invoices         | invoice_date               | date                        | NO          | CURRENT_DATE                                 |
| invoices         | due_date                   | date                        | YES         | null                                         |
| invoices         | sent_at                    | timestamp with time zone    | YES         | null                                         |
| invoices         | subtotal                   | numeric                     | YES         | 0                                            |
| invoices         | tax_rate                   | numeric                     | YES         | 0                                            |
| invoices         | tax_amount                 | numeric                     | YES         | 0                                            |
| invoices         | discount_amount            | numeric                     | YES         | 0                                            |
| invoices         | total_amount               | numeric                     | YES         | 0                                            |
| invoices         | payment_terms              | text                        | YES         | '30 days'::text                              |
| invoices         | notes                      | text                        | YES         | null                                         |
| invoices         | proposal_signature         | text                        | YES         | null                                         |
| invoices         | signed_at                  | timestamp with time zone    | YES         | null                                         |
| invoices         | catalog_line_items         | jsonb                       | YES         | null                                         |
| invoices         | proposal_notes             | text                        | YES         | null                                         |
| profiles         | id                         | uuid                        | NO          | null                                         |
| profiles         | company_name               | text                        | YES         | null                                         |
| profiles         | role                       | text                        | YES         | 'Client'::text                               |
| profiles         | created_at                 | timestamp with time zone    | YES         | now()                                        |
| profiles         | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| profiles         | first_name                 | text                        | YES         | null                                         |
| profiles         | last_name                  | text                        | YES         | null                                         |
| profiles         | mobile_carrier             | text                        | YES         | null                                         |
| profiles         | avatar_url                 | text                        | YES         | null                                         |
| profiles         | sms_alerts                 | boolean                     | YES         | null                                         |
| profiles         | phone                      | text                        | YES         | null                                         |
| profiles         | email                      | text                        | YES         | null                                         |
| project_statuses | id                         | integer                     | NO          | nextval('project_statuses_id_seq'::regclass) |
| project_statuses | status_code                | integer                     | NO          | null                                         |
| project_statuses | admin_status_name          | character varying           | NO          | null                                         |
| project_statuses | client_email_content       | text                        | YES         | null                                         |
| project_statuses | est_time                   | character varying           | YES         | null                                         |
| project_statuses | created_at                 | timestamp with time zone    | YES         | now()                                        |
| project_statuses | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| project_statuses | admin_visible              | boolean                     | YES         | null                                         |
| project_statuses | client_visible             | boolean                     | YES         | null                                         |
| project_statuses | button_text                | text                        | YES         | null                                         |
| project_statuses | client_email_subject       | text                        | YES         | null                                         |
| project_statuses | modal_admin                | text                        | YES         | null                                         |
| project_statuses | modal_client               | text                        | YES         | null                                         |
| project_statuses | button_link                | text                        | YES         | '/dashboard'::text                           |
| project_statuses | project_action             | text                        | YES         | null                                         |
| project_statuses | modal_auto_redirect_client | text                        | YES         | '/dashboard'::text                           |
| project_statuses | admin_email_content        | text                        | YES         | null                                         |
| project_statuses | admin_email_subject        | text                        | YES         | null                                         |
| project_statuses | modal_auto_redirect_admin  | text                        | YES         | '/dashboard'::text                           |
| project_statuses | client_status_name         | text                        | YES         | null                                         |
| project_statuses | client_status_tab          | text                        | YES         | null                                         |
| project_statuses | admin_status_tab           | character varying           | YES         | null                                         |
| projects         | id                         | integer                     | NO          | nextval('projects_id_seq'::regclass)         |
| projects         | author_id                  | uuid                        | YES         | null                                         |
| projects         | description                | text                        | YES         | null                                         |
| projects         | address                    | text                        | YES         | null                                         |
| projects         | created_at                 | timestamp with time zone    | YES         | null                                         |
| projects         | sq_ft                      | integer                     | YES         | 0                                            |
| projects         | new_construction           | boolean                     | YES         | null                                         |
| projects         | status                     | integer                     | YES         | null                                         |
| projects         | title                      | text                        | YES         | null                                         |
| projects         | building                   | jsonb                       | YES         | null                                         |
| projects         | project                    | jsonb                       | YES         | null                                         |
| projects         | service                    | jsonb                       | YES         | null                                         |
| projects         | requested_docs             | jsonb                       | YES         | null                                         |
| projects         | assigned_to_id             | uuid                        | YES         | null                                         |

### Row Level Security (RLS) Policies

#### Files Table Policies

- **Admins full access to files**: Admins and Staff can perform all operations on files
- **Clients can view own files**: Clients can only view files from their own projects

#### Projects Table Policies

- **projects_insert_own**: Users can only insert projects where they are the author
- **projects_select_own_or_admin**: Users can see their own projects, Admins/Staff can see all
- **projects_update_own_or_admin**: Users can update their own projects, Admins/Staff can update all
- **projects_delete_own_or_admin**: Users can delete their own projects, Admins/Staff can delete all

#### Profiles Table Policies

- **Users can view their own profile**: Users can view their own profile data
- **Users can update their own profile**: Users can update their own profile data
- **Admins can view all profiles**: Admins and Staff can view all user profiles
- **Admins can update all profiles**: Admins and Staff can update any profile
- **Admins can insert profiles**: Admins and Staff can create new profiles

### Key RLS Policy Notes

- **Admin Role**: Full access to all data across all tables
- **Staff Role**: Same permissions as Admin (Admin/Staff roles are equivalent)
- **Client Role**: Access only to their own data (projects.author_id = auth.uid())
- **Authentication Required**: All policies require valid authentication (auth.uid())
- **Role-Based Access**: Policies check user role via profiles table join

## Known Issues & Future Improvements

### Email Rate Limiting

- **Issue**: Resend API has rate limiting (2 requests per second) causing email delivery failures
- **Current Workaround**: Added 1-second delay between emails in `/api/email-delivery.ts`
- **Future Fix**: Investigate Resend account settings or consider alternative email providers for higher rate limits
- **Location**: `src/pages/api/email-delivery.ts` - email sending loop with delay

all emails deliver through email-delivery.ts except for the authentication

### Database Query Optimization TODOs

notes

client:visible is for <script>
User rules are always capitalized Admin, Client, Staff

Placeholders

{{PROJECT_ADDRESS}}
{{CLIENT_NAME}}
{{CLIENT_EMAIL}}
{{EST_TIME}}
{{STATUS_NAME}}
{{BUTTON_LINK}}
{{BUTTON_TEXT}}
{{CONTRACT_URL}}
{{BASE_URL}}

Brand/Design Color Placeholders
{{GLOBAL_COLOR_PRIMARY}} - Primary brand color hex code (#825bdd)
{{GLOBAL_COLOR_PRIMARY_RGB}} - Primary color in RGB format (130, 91, 221)
{{GLOBAL_COLOR_SECONDARY}} - Secondary brand color hex code (#0ea5e9)
{{SUCCESS_COLOR}} - Success color hex code (#22c55e)
{{WARNING_COLOR}} - Warning color hex code (#f59e0b)
{{DANGER_COLOR}} - Danger color hex code (#ef4444)

Brand/Design Asset Placeholders
{{SVG_LOGO}} - Company SVG logo (responsive, dark mode compatible)

projectStatusInt = ALWAYS THE NUMERICAL VALUE
projectStatusLabel = THE status_name column corresponding to projectStatus

Do not put variables on the window object whenever possible
Do not use data attributes whenever possible
Do not use fallback functions
