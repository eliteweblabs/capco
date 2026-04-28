# Client Knowledge

Knowledge files for each client — loaded dynamically based on site config.

## Priority System

| Priority | Status | Meaning |
|----------|--------|---------|
| 0 | archived | On hold / archive — ignore |
| 1-1000 | active | Higher = more important |

Common scale:
- 100 = Low priority
- 300 = Medium
- 500 = Normal  
- 700 = High
- 900 = Highest
- 1000 = Critical

When asked "what should I work on?", sort by priority (descending), filter out 0.

## Current Clients

| Priority | Client |
|----------|--------|
| 300 | CAPCO Design Group |
| 800 | MAVSAFE |
| 750 | Paulino Auto Group |
| 100 | Rothco Built |
| 0 | Solid Builders (archived) |

## Files

Client knowledge files named by config key (e.g., `capco-design-group.md`).

## Loading

At build/deploy time, the site knows its config. Add the config key to `SITE_CONFIG_KNOWLEDGE` env var, or run:

```bash
./scripts/load-client-knowledge.sh
```

This reads the active config and sources the matching knowledge file.