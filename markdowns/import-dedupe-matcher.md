# Import duplicate matcher

Fuzzy duplicate detection for CSV imports (clients + projects) before rows are written to Supabase.

## Library

`src/lib/import-duplicate-matcher.ts`

| Field | Normalization | Fuzzy logic |
|-------|---------------|-------------|
| Email | Lowercase, strip `+alias`, Gmail dot removal, `googlemail.com` → `gmail.com` | Exact normalized match, local-part regex, edit distance |
| Name | Company suffix strip, punctuation removal | Token-order regex, token overlap, Levenshtein |
| Address | Abbrev expansion (`St` → `street`), zip extraction, street number | Token regex, overlap, edit distance |

**Actions** (per row):

- `skip` — score ≥ 0.85 (default): treat as duplicate
- `review` — score 0.70–0.84: manual check
- `create` — score &lt; 0.70: safe to import

## CLI

```bash
npm run import:dedupe-check -- path/to/file.csv
npm run import:dedupe-check -- path/to/file.csv --json
npm run import:dedupe-check -- path/to/file.csv --threshold 0.9
npm run test:import-matcher
```

Requires `.env` with `PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET`.

Exit codes: `0` = no duplicates/review rows, `2` = at least one skip/review, `1` = error.

## Wiring into import APIs

When implementing `/api/import-users` and `/api/import-projects`, call `scanImportBatch()` (or `findDuplicateMatches()` per row) and skip or flag rows with `action === "skip"` / `"review"`.
