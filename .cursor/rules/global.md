# Project Context

This app is a general purpose website and admin for fire protection, contractors, and project management systems. The forms fields are

## Core Information

- **Purpose**: Clients submit files, Admins review/approve for fire protection systems
- **Users**: Admins (review/manage) & Clients (submit/download)
- **Auth**: Password protected, redirects to /project/dashboard

## Tech Stack (IMPORTANT)

- Astro framework
- Tailwind CSS + Flowbite components
- BoxIcons for icons
- Supabase (database/auth)
- Railway Hosted, deployed from Github

## Database Schema Key Points

- `projects`: id (int), author_id (uuid), address, title, status (int), sq_ft, new_construction
- `files`: id (int), project_id (int), author_id (uuid), file_path, uploaded_at, status
- `profiles`: id (uuid), name, phone, role ('Admin'/'Client')
- camelCase is always used for table and column names as well as all variables.
- keep CSS ids / selectors lowercase and kebab-case.
- **Common Issues**: Use `id` not `projectId` in files, `authorId` references user ID not project ID

## RLS Policies

- Admins: Full access to all files/projects
- Clients: Can only view/edit their own projects (projects.author_id = auth.uid())

## Development Guidelines

- Use Astro components (.astro files)
- Vanilla JS/TS in <script> tags, no React components
- Tailwind for styling
- Supabase for backend operations
- Always consider RLS policies when querying

- database tables and columns are always camelCase
- 6 minutes after syncing to github, mcp to railway and ensure that capco and rothco are working as expected.
- MCP ALWAYS DO NOT WAIT
- save instructional markdowns in /markdowns
- always check for exisitng components / templates to use over generating html. For example, <button> should be Button.astro. SVG icons should be <SimpleIcon> which maps to custom culled list of svgs
- always use DeleteConfirmButton.astro for delete buttons
- always use CloseButton.astro for modals, etc.
- save .sql files to /sql-queriers
- save .sh scripts to /scripts
- **IMPORTANT**: Site config: SITE_CONFIG or SITE_CONFIG_JSON env var (full JSON), fallback site-config.json in root

## Protected Code (DO NOT MODIFY WITHOUT USER APPROVAL)

- **MultiStepForm Placeholder Stagger Delay** (src/components/form/MultiStepForm.astro, line ~944):
  - The `staggerDelay = stepIndex * 100` calculation is PROTECTED
  - Creates cascading animation effect for successive placeholders
  - Has been accidentally removed multiple times - DO NOT REMOVE
  - See: .cursor/rules/multistep-form-placeholder-stagger.md for details

Always reference this context when making suggestions or implementing features.

- never use - ${globalCompanyName} in App.astro title, it is added globally in the App.astro component.

- VAPI can only be tested online, not locally.

- you do not need to make a markdown file for every change, just the major ones.

view-source:https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg example for product icon

- always add curly braces around html comments for astro to format correctly. {/_ ... _/} and {<!-- ... -->}

- validate everything after writing code.

- no modals
