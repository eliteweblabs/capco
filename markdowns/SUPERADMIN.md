# SuperAdmin (cookie-based)

SuperAdmin is an **elevated role that is not stored in the database**. It is kept in temporary storage (a signed cookie) so you can “load” it when you need to manage projects, and avoid storing super-admin status in the DB.

## Why

- No SuperAdmin row in `profiles` → cannot be escalated by someone with DB or user-admin access.
- You only have SuperAdmin when you explicitly activate (passphrase) or import (saved token).

## Setup

1. Set **SUPERADMIN_SECRET** in your environment (e.g. Railway, or `.env` locally). Use a strong passphrase only you know.
2. Open **/admin/super-admin** (you must be logged in as Admin or already SuperAdmin).

## Usage

- **Activate:** Enter the passphrase (SUPERADMIN_SECRET). Sets a signed cookie; your effective role becomes SuperAdmin until the cookie expires or you deactivate.
- **Deactivate:** Clears the cookie. Your normal role (e.g. Admin) is unchanged.
- **Export:** Generates a signed token (JSON) bound to your user and expiry. Save it somewhere secure.
- **Import:** Paste a previously exported token to activate SuperAdmin (e.g. after clearing cookies or on another device). Token must match current user and be unexpired.

## Behaviour

- **Auth:** `checkAuth()` and middleware read the SuperAdmin cookie. If valid and matches the current user, `currentRole` is set to `"SuperAdmin"`.
- **Access:** SuperAdmin is treated like Admin for nav and admin pages (see `isAdminOrSuperAdmin()` in `user-utils.ts`). Project delete and other admin-only APIs allow SuperAdmin where they allow Admin.
- **No DB:** Nothing is written to `profiles.role` for SuperAdmin; the cookie is the only source of truth for that elevation.

## Files

- `src/lib/superadmin.ts` – signing, verify, cookie get/set/clear.
- `src/lib/auth.ts` – after resolving profile role, checks SuperAdmin cookie and elevates role.
- `src/middleware/index.ts` – same cookie check for `locals.role`.
- `src/pages/api/superadmin/` – activate, deactivate, import, export.
- `src/pages/admin/super-admin.astro` – UI for activate / deactivate / import / export.
