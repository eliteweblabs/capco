# Database Naming Conventions

## Cal.com Integration Tables (snake_case)

These tables follow Cal.com's naming convention and should remain in snake_case:

- `bookings` (e.g., `user_id`, `event_type_id`)
- `event_types` (e.g., `time_zone`, `week_start`)
- `schedules` (e.g., `user_id`, `time_zone`)
- `team_members` (e.g., `team_id`, `user_id`)
- `teams` (e.g., `hide_branding`, `parent_id`)
- `users` (e.g., `email_verified`, `time_zone`)
- `webhooks` (e.g., `user_id`, `event_triggers`)

## Application Tables (camelCase)

Our application-specific tables use camelCase:

- `files` (e.g., `projectId`, `fileName`, `checkedOutBy`)
- `projects` (e.g., `authorId`, `assignedToId`)
- `profiles` (e.g., `companyName`, `firstName`)
- `discussion` (e.g., `authorId`, `projectId`)
- `fileCheckoutHistory` (e.g., `fileId`, `userId`)
- `fileVersions` (e.g., `fileId`, `versionNumber`)

## Naming Rules

1. Cal.com tables: Keep original snake_case
2. Our tables: Use camelCase
3. Foreign keys: Match the case of the referenced column
4. New tables: Follow camelCase unless integrating with external system

## Examples

```sql
-- Cal.com table (snake_case)
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    event_type_id INTEGER,
    created_at TIMESTAMP
);

-- Our table (camelCase)
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    projectId INTEGER,
    fileName TEXT,
    uploadedAt TIMESTAMP
);
```
