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
- **projects.assigned_to_id** (uuid): References profiles table for staff assignment
- **projects.building, project, service, requested_docs** (jsonb): Store form configuration data
- **projects.created_at, updated_at** (timestamp): Proper timestamping with timezone
- **profiles.created_at, updated_at** (timestamp): Proper timestamping with timezone
- **projects.status** (integer): Project workflow status codes (10-220)

### Current Database Schema

| table_name   | column_name      | data_type                   | is_nullable | column_default                       | description                    |
| ------------ | ---------------- | --------------------------- | ----------- | ------------------------------------ | ------------------------------ |
| **files**    | id               | integer                     | NO          | nextval('files_id_seq'::regclass)    | Primary key                    |
| files        | project_id       | integer                     | YES         | null                                 | FK to projects.id              |
| files        | author_id        | uuid                        | YES         | null                                 | FK to auth.users.id            |
| files        | name             | text                        | YES         | null                                 | Original filename              |
| files        | type             | integer                     | YES         | null                                 | File type code                 |
| files        | file_name        | text                        | YES         | null                                 | Stored filename                |
| files        | file_path        | text                        | YES         | null                                 | Storage path                   |
| files        | file_type        | text                        | YES         | null                                 | MIME type                      |
| files        | file_size        | bigint                      | YES         | null                                 | Size in bytes                  |
| files        | uploaded_at      | timestamp without time zone | YES         | now()                                | Upload timestamp               |
| files        | status           | text                        | YES         | 'active'::text                       | File status                    |
| **profiles** | id               | uuid                        | NO          | null                                 | FK to auth.users.id            |
| profiles     | name             | text                        | YES         | null                                 | Display name                   |
| profiles     | phone            | text                        | YES         | null                                 | Phone number                   |
| profiles     | role             | text                        | YES         | 'Client'::text                       | User role (Admin/Staff/Client) |
| profiles     | created_at       | timestamp with time zone    | YES         | now()                                | Creation timestamp             |
| profiles     | updated_at       | timestamp with time zone    | YES         | now()                                | Last update timestamp          |
| **projects** | id               | integer                     | NO          | nextval('projects_id_seq'::regclass) | Primary key                    |
| projects     | author_id        | uuid                        | YES         | null                                 | FK to auth.users.id (client)   |
| projects     | assigned_to_id   | uuid                        | YES         | null                                 | FK to profiles.id (staff)      |
| projects     | title            | text                        | YES         | null                                 | Project title                  |
| projects     | description      | text                        | YES         | null                                 | Project description            |
| projects     | address          | text                        | YES         | null                                 | Project address                |
| projects     | status           | integer                     | YES         | 10                                   | Workflow status (10-220)       |
| projects     | sq_ft            | integer                     | YES         | null                                 | Square footage                 |
| projects     | new_construction | boolean                     | YES         | false                                | Construction type              |
| projects     | building         | jsonb                       | YES         | null                                 | Building form data             |
| projects     | project          | jsonb                       | YES         | null                                 | Project form data              |
| projects     | service          | jsonb                       | YES         | null                                 | Service form data              |
| projects     | requested_docs   | jsonb                       | YES         | null                                 | Requested documents            |
| projects     | feature          | boolean                     | YES         | false                                | Featured on public page        |
| projects     | created_at       | timestamp with time zone    | YES         | now()                                | Creation timestamp             |
| projects     | updated_at       | timestamp with time zone    | YES         | now()                                | Last update timestamp          |

### Project Status Workflow

| Status Code | Status Name                   | Description                      |
| ----------- | ----------------------------- | -------------------------------- |
| 10          | Specs Received                | Initial project submission       |
| 20          | Generating Proposal           | Creating project proposal        |
| 30          | Proposal Shipped              | Proposal sent to client          |
| 40          | Proposal Viewed               | Client has viewed proposal       |
| 50          | Proposal Signed Off           | Client approved proposal         |
| 60          | Generating Deposit Invoice    | Creating initial invoice         |
| 70          | Deposit Invoice Shipped       | Invoice sent to client           |
| 80          | Deposit Invoice Viewed        | Client has viewed invoice        |
| 90          | Deposit Invoice Paid          | Payment received                 |
| 100         | Generating Submittals         | Creating project submittals      |
| 110         | Submittals Shipped            | Submittals sent for review       |
| 120         | Submittals Viewed             | Submittals under review          |
| 130         | Submittals Signed Off         | Submittals approved              |
| 140         | Generating Final Invoice      | Creating final invoice           |
| 150         | Final Invoice Shipped         | Final invoice sent               |
| 160         | Final Invoice Viewed          | Client has viewed final invoice  |
| 170         | Final Invoice Paid            | Final payment received           |
| 180         | Generating Final Deliverables | Creating final deliverables      |
| 190         | Stamping Final Deliverables   | Official stamping process        |
| 200         | Final Deliverables Shipped    | Deliverables sent to client      |
| 210         | Final Deliverables Viewed     | Client has received deliverables |
| 220         | Project Complete              | Project fully completed          |

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
