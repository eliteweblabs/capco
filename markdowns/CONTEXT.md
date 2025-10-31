# 🔥 CAPCO Design Group Systems - Developer Context

> **Always reference this file when working on the project**

## 🎯 Project Purpose

Fire protection systems PDF submission and review platform:

- **Clients**: Submit PDFs, download final submissions
- **Admins**: Review, approve/reject, manage submissions

## ⚡ Critical Tech Constraints

- **NO REACT** ❌ - Use vanilla JS/TypeScript only
- **Astro Framework** ✅ - `.astro` components with `<script>` tags
- **Supabase** ✅ - Database, auth, RLS policies
- **Tailwind + Flowbite** ✅ - Styling only

## 🗄️ Database Quick Ref

```sql
-- Key tables and their purposes
projects: id(int), author_id(uuid), address, title, status(int)
files: id(int), project_id(int), author_id(uuid), file_path
profiles: id(uuid), role('Admin'/'Client')

-- Common gotchas
- Use author_id (uuid) for user references
- Status is integer in projects table
- RLS policies: Admins see all, Clients see own only
```

## 🔐 Authentication Flow

1. Password protected entry
2. Redirect to index with latest project
3. Role-based access (Admin vs Client)

## 🚨 Common Mistakes to Avoid

- ❌ Using React components
- ❌ Confusing `id` vs `project_id` in files table
- ❌ UUID vs text comparisons in RLS
- ❌ Forgetting RLS policies when querying

## 📁 File Structure Patterns

```
src/
├── components/     # .astro components only
├── pages/         # Routes and API endpoints
├── lib/           # Shared utilities
├── emails/        # React Email templates (exception)
└── styles/        # Global CSS
```

## ⚙️ Development Commands

- `npm run dev` - Start development
- Visit `/api/send-react-email` - Test emails
- Check `scope.md` for full requirements
- Check `EMAIL_SETUP.md` for email config

---

**📌 Pin this context for all development decisions**
