# Banner Alert Feature

Site-wide banner alerts with position (top/bottom) and expiration settings.

## Setup

1. Run the SQL migration to create the `banner_alerts` table:

```bash
# Copy the SQL from sql-queriers/create-banner-alerts-table.sql and run it in your Supabase dashboard
```

## Usage

### Admin Management

Navigate to `/admin/banner-alerts` to:
- Create new banner alerts
- Edit existing banners
- Toggle banners active/inactive
- Delete banners
- Copy shortcodes for markdown content

### Display Banners on Pages

#### Option 1: Auto-load all active banners

Add the `BannerAlertsLoader` component to your layout:

```astro
---
import BannerAlertsLoader from "../features/banner-alert/components/BannerAlertsLoader.astro";
---

<html>
  <body>
    <BannerAlertsLoader />
    <!-- Your page content -->
  </body>
</html>
```

Filter by position:

```astro
<BannerAlertsLoader position="top" />
<BannerAlertsLoader position="bottom" />
```

#### Option 2: Display specific banner

Use the shortcode in markdown content:

```markdown
<BannerAlert id="123"/>
```

Or in Astro components:

```astro
---
import BannerAlert from "../features/banner-alert/components/BannerAlert.astro";
---

<BannerAlert
  id={123}
  type="warning"
  title="Maintenance Notice"
  description="Scheduled maintenance on Saturday"
  position="top"
  expireMs={30000}
  dismissible={true}
/>
```

## Props

### BannerAlert

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `number` | - | Banner ID (for dismissal tracking) |
| `type` | `"info" \| "success" \| "warning" \| "error"` | `"info"` | Alert type/style |
| `title` | `string` | - | Optional title |
| `description` | `string` | - | Banner message content |
| `position` | `"top" \| "bottom"` | `"top"` | Fixed position |
| `expireMs` | `number \| null` | `null` | Auto-dismiss after X milliseconds |
| `dismissible` | `boolean` | `true` | Show dismiss button |

### BannerAlertsLoader

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `"top" \| "bottom" \| "all"` | `"all"` | Filter banners by position |

## API Endpoints

### GET /api/banner-alerts/get

Query params:
- `active`: `boolean` - Only return active banners (default: true)
- `all`: `boolean` - Return all banners (admin only)

### POST /api/banner-alerts/upsert

Create or update a banner alert. Requires Admin authentication.

```json
{
  "id": 123,           // Optional: update existing
  "title": "Notice",
  "description": "Important message",
  "type": "info",
  "position": "top",
  "expireMs": 5000,    // null = never expires
  "dismissible": true,
  "isActive": true,
  "startDate": "2024-01-01T00:00:00Z",  // Optional
  "endDate": "2024-12-31T23:59:59Z"     // Optional
}
```

### POST /api/banner-alerts/delete

Delete a banner alert. Requires Admin authentication.

```json
{
  "id": 123
}
```

## Database Schema

```sql
CREATE TABLE banner_alerts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info',
  position VARCHAR(10) DEFAULT 'top',
  expireMs INTEGER,
  dismissible BOOLEAN DEFAULT true,
  isActive BOOLEAN DEFAULT true,
  startDate TIMESTAMPTZ,
  endDate TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW(),
  createdBy UUID REFERENCES auth.users(id)
);
```
