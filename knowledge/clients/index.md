# Client Knowledge

Knowledge files for each client — loaded dynamically based on site config.

## Priority

- Set priority in contact-api (1-1000)
- Priority 0 = archived (ignore)

When asked "what should I work on?", query contact-api sorted by priority.

## Files

Client knowledge files named by config key (e.g., `capco-design-group.md`).

## Loading

At build/deploy time, the site knows its config. Add the config key to `SITE_CONFIG_KNOWLEDGE` env var, or run:

```bash
./scripts/load-client-knowledge.sh
```

This reads the active config and sources the matching knowledge file.