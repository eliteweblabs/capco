# Project Scope

This app is designed to facilitate the process of submitting (by clients) and reviewing (by admins) PDFs for fire protection systems.

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

| table_name       | column_name                | data_type                   | character_maximum_length | is_nullable | column_default                               | ordinal_position | key_type                   |
| ---------------- | -------------------------- | --------------------------- | ------------------------ | ----------- | -------------------------------------------- | ---------------- | -------------------------- |
| files            | id                         | integer                     | null                     | NO          | nextval('files_id_seq'::regclass)            | 1                | PRIMARY KEY                |
| files            | project_id                 | integer                     | null                     | YES         | null                                         | 2                | FOREIGN KEY -> projects.id |
| files            | author_id                  | uuid                        | null                     | YES         | null                                         | 3                |                            |
| files            | file_name                  | text                        | null                     | YES         | null                                         | 6                |                            |
| files            | file_path                  | text                        | null                     | YES         | null                                         | 7                |                            |
| files            | file_type                  | text                        | null                     | YES         | null                                         | 8                |                            |
| files            | file_size                  | bigint                      | null                     | YES         | null                                         | 9                |                            |
| files            | uploaded_at                | timestamp without time zone | null                     | YES         | now()                                        | 10               |                            |
| files            | status                     | text                        | null                     | YES         | 'active'::text                               | 11               |                            |
| files            | comments                   | text                        | null                     | YES         | null                                         | 12               |                            |
| files            | title                      | text                        | null                     | YES         | null                                         | 13               |                            |
| files            | updated_at                 | timestamp with time zone    | null                     | YES         | null                                         | 14               |                            |
| invoices         | id                         | bigint                      | null                     | NO          | null                                         | 1                | PRIMARY KEY                |
| invoices         | created_at                 | timestamp with time zone    | null                     | NO          | now()                                        | 2                |                            |
| invoices         | updated_at                 | timestamp with time zone    | null                     | YES         | now()                                        | 3                |                            |
| invoices         | project_id                 | bigint                      | null                     | NO          | null                                         | 4                | FOREIGN KEY -> projects.id |
| invoices         | created_by                 | uuid                        | null                     | YES         | auth.uid()                                   | 5                |                            |
| invoices         | subject                    | text                        | null                     | YES         | null                                         | 6                |                            |
| invoices         | status                     | text                        | null                     | NO          | 'draft'::text                                | 7                |                            |
| invoices         | invoice_date               | date                        | null                     | NO          | CURRENT_DATE                                 | 8                |                            |
| invoices         | due_date                   | date                        | null                     | YES         | null                                         | 9                |                            |
| invoices         | sent_at                    | timestamp with time zone    | null                     | YES         | null                                         | 10               |                            |
| invoices         | subtotal                   | numeric                     | null                     | YES         | 0                                            | 11               |                            |
| invoices         | tax_rate                   | numeric                     | null                     | YES         | 0                                            | 12               |                            |
| invoices         | tax_amount                 | numeric                     | null                     | YES         | 0                                            | 13               |                            |
| invoices         | discount_amount            | numeric                     | null                     | YES         | 0                                            | 14               |                            |
| invoices         | total_amount               | numeric                     | null                     | YES         | 0                                            | 15               |                            |
| invoices         | payment_terms              | text                        | null                     | YES         | '30 days'::text                              | 16               |                            |
| invoices         | notes                      | text                        | null                     | YES         | null                                         | 17               |                            |
| invoices         | proposal_signature         | text                        | null                     | YES         | null                                         | 18               |                            |
| invoices         | signed_at                  | timestamp with time zone    | null                     | YES         | null                                         | 19               |                            |
| invoices         | catalog_line_items         | jsonb                       | null                     | YES         | null                                         | 20               |                            |
| invoices         | proposal_notes             | text                        | null                     | YES         | null                                         | 21               |                            |
| profiles         | id                         | uuid                        | null                     | NO          | null                                         | 1                | PRIMARY KEY                |
| profiles         | company_name               | text                        | null                     | YES         | null                                         | 2                |                            |
| profiles         | role                       | text                        | null                     | YES         | 'Client'::text                               | 4                |                            |
| profiles         | created_at                 | timestamp with time zone    | null                     | YES         | now()                                        | 5                |                            |
| profiles         | updated_at                 | timestamp with time zone    | null                     | YES         | now()                                        | 6                |                            |
| profiles         | first_name                 | text                        | null                     | YES         | null                                         | 7                |                            |
| profiles         | last_name                  | text                        | null                     | YES         | null                                         | 8                |                            |
| profiles         | mobile_carrier             | text                        | null                     | YES         | null                                         | 9                |                            |
| profiles         | avatar_url                 | text                        | null                     | YES         | null                                         | 10               |                            |
| profiles         | sms_alerts                 | boolean                     | null                     | YES         | null                                         | 11               |                            |
| project_statuses | id                         | integer                     | null                     | NO          | nextval('project_statuses_id_seq'::regclass) | 1                | PRIMARY KEY                |
| project_statuses | status_code                | integer                     | null                     | NO          | null                                         | 2                |                            |
| project_statuses | admin_status_name          | character varying           | 100                      | NO          | null                                         | 3                |                            |
| project_statuses | client_email_content       | text                        | null                     | YES         | null                                         | 4                |                            |
| project_statuses | est_time                   | character varying           | 50                       | YES         | null                                         | 5                |                            |
| project_statuses | created_at                 | timestamp with time zone    | null                     | YES         | now()                                        | 6                |                            |
| project_statuses | updated_at                 | timestamp with time zone    | null                     | YES         | now()                                        | 7                |                            |
| project_statuses | admin_visible              | boolean                     | null                     | YES         | null                                         | 14               |                            |
| project_statuses | client_visible             | boolean                     | null                     | YES         | null                                         | 16               |                            |
| project_statuses | button_text                | text                        | null                     | YES         | null                                         | 17               |                            |
| project_statuses | client_email_subject       | text                        | null                     | YES         | null                                         | 18               |                            |
| project_statuses | toast_admin                | text                        | null                     | YES         | null                                         | 19               |                            |
| project_statuses | toast_client               | text                        | null                     | YES         | null                                         | 20               |                            |
| project_statuses | button_link                | text                        | null                     | YES         | '/dashboard'::text                           | 21               |                            |
| project_statuses | project_action             | text                        | null                     | YES         | null                                         | 22               |                            |
| project_statuses | toast_auto_redirect_client | text                        | null                     | YES         | '/dashboard'::text                           | 24               |                            |
| project_statuses | admin_email_content        | text                        | null                     | YES         | null                                         | 25               |                            |
| project_statuses | admin_email_subject        | text                        | null                     | YES         | null                                         | 26               |                            |
| project_statuses | toast_auto_redirect_admin  | text                        | null                     | YES         | '/dashboard'::text                           | 27               |                            |
| project_statuses | client_status_name         | text                        | null                     | YES         | null                                         | 28               |                            |
| project_statuses | client_status_tab          | text                        | null                     | YES         | null                                         | 29               |                            |
| projects         | id                         | integer                     | null                     | NO          | nextval('projects_id_seq'::regclass)         | 1                | PRIMARY KEY                |
| projects         | author_id                  | uuid                        | null                     | YES         | null                                         | 2                |                            |
| projects         | description                | text                        | null                     | YES         | null                                         | 3                |                            |
| projects         | address                    | text                        | null                     | YES         | null                                         | 4                |                            |
| projects         | created_at                 | timestamp with time zone    | null                     | YES         | null                                         | 5                |                            |
| projects         | sq_ft                      | integer                     | null                     | YES         | 0                                            | 6                |                            |
| projects         | new_construction           | boolean                     | null                     | YES         | null                                         | 7                |                            |
| projects         | status                     | integer                     | null                     | YES         | null                                         | 8                |                            |
| projects         | title                      | text                        | null                     | YES         | null                                         | 9                |                            |
| projects         | building                   | jsonb                       | null                     | YES         | null                                         | 10               |                            |
| projects         | project                    | jsonb                       | null                     | YES         | null                                         | 11               |                            |
| projects         | service                    | jsonb                       | null                     | YES         | null                                         | 12               |                            |
| projects         | requested_docs             | jsonb                       | null                     | YES         | null                                         | 13               |                            |
| projects         | assigned_to_id             | uuid                        | null                     | YES         | null                                         | 14               |                            |
| projects         | updated_at                 | timestamp with time zone    | null                     | YES         | null                                         | 15               |                            |
| projects         | units                      | integer                     | null                     | YES         | 1                                            | 16               |                            |
| projects         | architect                  | text                        | null                     | YES         | null                                         | 17               |                            |
| projects         | featured                   | boolean                     | null                     | YES         | null                                         | 18               |                            |
| projects         | log                        | jsonb                       | null                     | YES         | '[]'::jsonb                                  | 19               |                            |
| projects         | subject                    | text                        | null                     | YES         | null                                         | 21               |                            |
| projects         | proposal_signature         | text                        | null                     | YES         | null                                         | 22               |                            |
| projects         | signed_at                  | timestamp with time zone    | null                     | YES         | null                                         | 23               |                            |
| projects         | contract_pdf_url           | text                        | null                     | YES         | null                                         | 24               |                            |

### Tables Structure

**Note:** Run this SQL in Supabase to get the current schema:

```sql
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('users', 'projects', 'files', 'profiles')
ORDER BY table_name, ordinal_position;
```

### Key Column Names (for reference)

- **projects table**: `id` (primary key), `author_id` (foreign key to users)
- **files table**: `id` (primary key), `author_id` (foreign key to users)
- **users table**: `id` (primary key)
- **profiles table**: `id` (matches auth.uid()), `role` (Admin/Client)

### Common Issues

- Use `id` not `project_id` in files table
- `author_id` references user ID, not project ID
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

all emails deliver through email-delivery.ts except for the authentication ones which are handled by Superbase

### Database Query Optimization TODOs

#### ✅ Completed Optimizations

- **Fixed N+1 Profile Queries**: Enhanced `/api/get-project` with JOINs to fetch author profiles, eliminating individual profile queries in ProjectListItem
- **Eliminated Redundant Status Calls**: Pass statuses from dashboard to child components instead of individual API fetches

#### 🔄 Pending Optimizations

**#3 - Medium Priority: Optimize Project Page Queries with JOINs**

- **Issue**: Project page makes 4-5 separate queries (project data, author profile, assigned user profile, project statuses)
- **Solution**: Create consolidated project page query with JOINs to reduce to 1-2 database queries
- **Impact**: ~40-50% reduction in project page load queries
- **Location**: `src/pages/project/[id].astro` - consolidate direct Supabase queries
- **Implementation**:
  - Enhance project query to include author and assigned user profiles via JOINs
  - Use existing status data instead of separate API call
  - Consider creating dedicated `/api/project-page/[id]` endpoint

**#4 - Low Priority: Create Consolidated Dashboard API Endpoint**

- **Issue**: Dashboard makes multiple API calls that could be combined
- **Solution**: Create `/api/dashboard-data` that returns projects with profiles and statuses in one call
- **Impact**: Simplify dashboard data fetching and improve consistency
- **Location**: Create new `src/pages/api/dashboard-data.ts`
- **Implementation**:
  - Combine project fetching with profile JOINs
  - Include status data in single response
  - Apply role-based filtering server-side
  - Return optimized data structure for dashboard components

**Performance Impact Summary:**

- **Current State**: Dashboard (~2 queries), Project Page (~4-5 queries)
- **After #3**: Dashboard (~2 queries), Project Page (~1-2 queries)
- **After #4**: Dashboard (~1 query), Project Page (~1-2 queries)
- **Total Expected Improvement**: ~60-70% reduction in database queries across main pages

notes

client:visible is for <script>
User rules are always capitalized Admin, Client, Staff

Placeholders

{{PROJECT_TITLE}}
{{PROJECT_ADDRESS}}
{{ADDRESS}}
{{CLIENT_NAME}}
{{CLIENT_EMAIL}}
{{EST_TIME}}
{{STATUS_NAME}}
{{BUTTON_LINK}}
{{BUTTON_TEXT}}
{{CONTRACT_URL}}
{{BASE_URL}}

projectStatus = ALWAYS THE NUMERICAL VALUE
projectStatusLabel = THE status_name column corresponding to projectStatus

Do not put variables on the window object
Do not use data attributes whenever possible
