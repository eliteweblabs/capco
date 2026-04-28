# Client Knowledge

Knowledge files for each client — loaded dynamically based on site config.

## Priority System

| Priority | Status | Meaning |
|----------|--------|---------|
| 0 | archived | On hold / archive — ignore |
| 1-1000 | active | Work on these |
| 1 | highest | Most important |

When asked "what should I work on?", sort by priority (ascending), filter out 0.

## Files

Client knowledge files named by config key (e.g., `capco-design-group.md`).

## Loading

At build/deploy time, the site knows its config. Add the config key to `SITE_CONFIG_KNOWLEDGE` env var, or run:

```bash
./scripts/load-client-knowledge.sh
```

This reads the active config and sources the matching knowledge file.