# Project Scope

This app is designed to facilitate the process of submitting (by clients) and reviewing (by admins) PDFs for fire protection systems.

- **Admins & Clients** can upload and submit PDF documents related to fire protection systems.
- **Admins** can review, manage, and approve/reject these submissions.
- **Client** can download final submissions

## Authentication & Navigation

- The entire app is password protected.
- Upon authentication, clients are redirected to the index page.
- The index page references the client's latest project and provides links to their past projects.

### Use Packages

- Astro
- BoxIcons
- Tailwind
- Flowbite
- SupaBase

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
