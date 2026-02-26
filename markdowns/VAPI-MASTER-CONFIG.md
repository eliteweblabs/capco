# VAPI master config – one source for all instances

Per-instance VAPI config is no longer spread across multiple scripts. A single **master config** plus **prompt templates** drive all instances; one script updates them.

## Goals

- **Detach per-instance data** – One place to list instances (assistant ID, webhook env, company name, tools).
- **Single master with all tools** – Shared tool definitions (e.g. processFile) and behavior; instance-specific overrides only in the master.
- **Stop managing multiple files** – No need to edit `vapi-capco-config.js`, `vapi-innercity-fireprotection-config.js`, etc. for routine updates. Add/edit instance in master and run the script.

## Layout

| Path | Purpose |
|------|--------|
| `scripts/data/vapi-master.json` | Master config: `instances` (capco, innercity, …) and `shared` (model, timeouts, etc.). |
| `scripts/data/vapi-prompts/*.md` | System prompt templates. Use `{{COMPANY_NAME}}`, `{{OWNER_NAME}}`; replaced at run time. |
| `scripts/update-vapi-from-master.js` | Reads master + prompts, builds assistant config, PATCHes VAPI API. |

## Usage

```bash
# Update all instances (from master)
npm run update-vapi

# Update one instance
npm run update-vapi:capco
npm run update-vapi:innercity

# Or directly
node scripts/update-vapi-from-master.js all
node scripts/update-vapi-from-master.js capco
```

**Env:** `VAPI_API_KEY` required. Per-instance webhook/company name come from master (`webhookDomainEnv`, `companyNameEnv`, or fixed `companyName` / `webhookFallback`).

## Adding an instance

1. Add an entry under `instances` in `scripts/data/vapi-master.json` (e.g. `"rothco": { "assistantId": "...", "webhookDomainEnv": [...], ... }`).
2. Add a prompt file under `scripts/data/vapi-prompts/` and set `systemPromptTemplate` to its name (no extension).
3. Run `node scripts/update-vapi-from-master.js rothco` (or `all`).

## Legacy scripts

`npm run update-vapi-capco` and `npm run update-vapi-innercity` still point at the old per-instance scripts (`vapi-capco-config.js`, `vapi-innercity-fireprotection-config.js`) if you need them. Prefer the master script for consistency.
