# Contact Form Feature

A multi-step contact form with Google Places address autocomplete.

# Contact Form Feature

A multi-step contact form with Google Places address autocomplete and **auto-setup detection**.

## Setup

### Quick Setup (WordPress-style)

The form will **automatically detect** if the database table is missing and provide you with the exact SQL to run!

Just use the form - if the table doesn't exist, you'll get a helpful message with setup instructions.

### Manual Setup (Recommended)

Run the SQL script to create the `contact_submissions` table:

**Option 1 - Supabase Dashboard:**
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste the contents of `sql-queriers/create-contact-submissions-table.sql`
4. Click "Run"

**Option 2 - Command Line:**
```bash
psql -f sql-queriers/create-contact-submissions-table.sql
```

### 2. Environment Variables

Ensure these are set in your `.env` file:

```bash
PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Usage

### In CMS (Markdown Shortcode)

```markdown
<ContactForm />
```

### In Astro Component

```astro
---
import ContactForm from "@/features/contact-form/components/ContactForm.astro";
---

<ContactForm />
```

### Example Page

See `/src/pages/contact.astro` for a complete example.

## Features

- **6-step form** with progress bar
- **Field validation** with error messages  
- **Google Places** address autocomplete (SlotMachine)
- **AOS animations** for smooth transitions
- **Mobile-responsive** design
- **Success/error notifications** via modal system

## Form Fields

1. **Name** - First name and last name
2. **Email** - Email address validation
3. **Phone** - Phone number with formatting
4. **Company** - Company/organization name
5. **Address** - Google Places autocomplete via SlotMachine
6. **Message** - Multi-line message textarea

## API Endpoint

Form submits to `/api/contact/submit` with the following data:

```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  "contact-address": string; // Address from SlotMachine
  message: string;
}
```

## Database Schema

Submissions are stored in the `contact_submissions` table:

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| first_name | TEXT | First name (required) |
| last_name | TEXT | Last name (required) |
| email | TEXT | Email address (required) |
| phone | TEXT | Phone number (optional) |
| company | TEXT | Company name (optional) |
| address | TEXT | Google Places address (optional) |
| message | TEXT | Message content (required) |
| submitted_at | TIMESTAMP | Submission timestamp |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record update timestamp |

## WordPress-Style Auto-Detection

Unlike WordPress which can create tables automatically, Supabase requires manual SQL execution for security. However, this form includes **smart auto-detection**:

1. **First submission attempt** - If table doesn't exist, you'll get a friendly error with:
   - Exact SQL to run
   - Location of the full SQL file
   - Step-by-step instructions

2. **Server logs** - Check your server console for the complete SQL commands

3. **One-time setup** - Once you run the SQL, the form works forever

This provides the convenience of auto-detection with the security of manual approval!

- **Admins** can view all submissions
- **Anyone** can submit forms (unauthenticated)

## Styling

Uses the same design system as `MultiStepRegisterForm`:
- Large centered text for questions
- Primary color accents
- Smooth step transitions
- Touch-friendly buttons

## TODO / Future Enhancements

- [ ] Add email notifications to admin when form is submitted
- [ ] Add rate limiting to prevent spam
- [ ] Add CAPTCHA for bot protection
- [ ] Create admin page to view submissions
- [ ] Add export functionality for submissions
