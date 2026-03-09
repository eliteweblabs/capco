# superAdmin

superAdmin is a **database role** stored in `profiles.role`. It is assigned manually via User Management.

## Setup

1. As Admin, open **Admin → User Management**.
2. Edit the user and set **Role** to **superAdmin**.
3. Or update the database: `UPDATE profiles SET role = 'superAdmin' WHERE id = '<user-uuid>';`

## Access

- **Super Admin page** (`/admin/super-admin`) – superAdmin only. Shows Clone & Deploy link.
- **Clone & Deploy** (`/admin/clone-deploy`) – Generate Railway + Supabase clone scripts.
- superAdmin sees the same nav items as Admin (Design, Content, Media, Admin, Tools, etc.).

## Files

- `src/lib/user-form-config.ts` – Role options include superAdmin.
- `src/components/admin/AdminUsers.astro` – Role filter and counts; role-select allows superAdmin.
- `src/lib/auth.ts` – `currentRole` from `profile.role` only.
- `src/pages/admin/super-admin.astro` – superAdmin-only info page with Clone & Deploy link.
