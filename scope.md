# Project Scope

This app is designed to facilitate the process of submitting (by clients) and reviewing (by admins) PDFs for fire protection systems.

- **Admins & Clients** can upload and submit PDF documents related to fire protection systems.
- **Admins** can review, manage, and approve/reject these submissions.
- **Client** can download final submissions

## Authentication & Navigation

- The entire app is password protected.
- Upon authentication, clients are redirected to the dashboard page (`/dashboard`).
- The index page (`/`) is now a marketing landing page for public visitors.
- Authenticated users access the dashboard for project management.

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
- Tailwind
- Flowbite
- SupaBase
- NO REACT
- All Pages to Format with App Component

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

### Recent Schema Updates

- **projects.feature** (boolean): Added for marketing page project showcase. Default: false. Set to true for projects to display on public `/projects` page.

| table_name | column_name      | data_type                   | is_nullable | column_default                       |
| ---------- | ---------------- | --------------------------- | ----------- | ------------------------------------ |
| files      | id               | integer                     | NO          | nextval('files_id_seq'::regclass)    |
| files      | project_id       | integer                     | YES         | null                                 |
| files      | author_id        | uuid                        | YES         | null                                 |
| files      | name             | text                        | YES         | null                                 |
| files      | type             | integer                     | YES         | null                                 |
| files      | file_name        | text                        | YES         | null                                 |
| files      | file_path        | text                        | YES         | null                                 |
| files      | file_type        | text                        | YES         | null                                 |
| files      | file_size        | bigint                      | YES         | null                                 |
| files      | uploaded_at      | timestamp without time zone | YES         | now()                                |
| files      | status           | text                        | YES         | 'active'::text                       |
| profiles   | id               | uuid                        | NO          | null                                 |
| profiles   | name             | text                        | YES         | null                                 |
| profiles   | phone            | bigint                      | YES         | null                                 |
| profiles   | role             | text                        | YES         | 'Client'::text                       |
| profiles   | created          | timestamp without time zone | YES         | now()                                |
| projects   | id               | integer                     | NO          | nextval('projects_id_seq'::regclass) |
| projects   | author_id        | uuid                        | YES         | null                                 |
| projects   | description      | text                        | YES         | null                                 |
| projects   | address          | text                        | YES         | null                                 |
| projects   | created          | timestamp without time zone | YES         | now()                                |
| projects   | sq_ft            | integer                     | YES         | 0                                    |
| projects   | new_construction | boolean                     | YES         | null                                 |
| projects   | status           | integer                     | YES         | null                                 |
| projects   | title            | text                        | YES         | null                                 |

SELECT \* FROM pg_policies WHERE tablename = 'files';

| schemaname | tablename | policyname                  | permissive | roles    | cmd | qual               | with_check |
| ---------- | --------- | --------------------------- | ---------- | -------- | --- | ------------------ | ---------- |
| public     | files     | Admins full access to files | PERMISSIVE | {public} | ALL | (EXISTS ( SELECT 1 |

FROM profiles
WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'Admin'::text)))) | null |
| public | files | Clients can view own files | PERMISSIVE | {public} | SELECT | ((EXISTS ( SELECT 1
FROM profiles
WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'Client'::text)))) AND (EXISTS ( SELECT 1
FROM projects
WHERE ((projects.id = files.project_id) AND ((projects.author_id)::text = (auth.uid())::text))))) | null |
