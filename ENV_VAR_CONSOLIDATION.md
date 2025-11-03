# Environment Variable Consolidation

## Summary

We've consolidated to use `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` as the primary variables, with fallbacks to the non-PUBLIC versions for backwards compatibility.

## Why Consolidate?

1. **Simpler Configuration**: Only need to set `PUBLIC_` variables in Railway
2. **Works Everywhere**: `PUBLIC_` variables work in both server-side and client-side code
3. **No Duplication**: One set of variables instead of two
4. **Astro Best Practice**: `PUBLIC_` prefix tells Astro these are safe to expose

## What Changed

### Code Updates
- `src/lib/supabase.ts` - Now uses `PUBLIC_SUPABASE_ANON_KEY` with fallback
- `src/pages/api/utils/feedback.ts` - Now uses `PUBLIC_SUPABASE_ANON_KEY` with fallback
- `src/pages/auth/callback.astro` - Already had fallback, now consistent
- Error messages updated to reference `PUBLIC_SUPABASE_ANON_KEY`

### Type Definitions
- Added `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` to `src/env.d.ts`

### Astro Config
- Already configured to expose `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` with fallbacks

## Railway Setup

**Set these in Railway Variables:**

```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Optional (for backwards compatibility):**
```bash
SUPABASE_URL=https://your-project.supabase.co  # Fallback only
SUPABASE_ANON_KEY=your_anon_key_here            # Fallback only
```

## Migration Notes

- Code will work with either `PUBLIC_` or non-PUBLIC variables (backwards compatible)
- New setups should use `PUBLIC_` variables only
- Existing setups can keep both until you're ready to consolidate

## Why This is Safe

The Supabase **anon key** is designed to be public - it's meant to be used in client-side applications. The `PUBLIC_` prefix just tells Astro to include it in the client bundle, which is exactly what we need for:
- Client-side auth (callback handler)
- Client-side Supabase operations
- Server-side operations (still works)

The **service role key** (`SUPABASE_ADMIN_KEY`) should NEVER be `PUBLIC_` - it stays server-side only.

