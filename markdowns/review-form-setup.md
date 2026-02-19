# Review Form Setup

The review form lets customers submit reviews via a JSON-driven multi-step form. Reviews are stored in Supabase. **Google does not allow programmatic submission of reviews** — users must leave reviews directly on Google. The form saves to your database and optionally shows a "Leave a review on Google" link.

## 1. Create the database table

Run in Supabase SQL Editor:

```bash
# From sql-queriers/create-review-submissions-table.sql
```

Or copy the contents of `sql-queriers/create-review-submissions-table.sql` into the Supabase SQL Editor and run it.

## 2. Configure Google Place ID (optional)

To show the "Leave a review on Google" link on `/reviews`:

1. Find your Google Place ID (use [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder) or inspect your Google Business profile)
2. Add to `config.json` under `reviewForm`:

```json
"reviewForm": {
  ...
  "googlePlaceId": "ChIJxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

The link format is: `https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`

## 3. Pages

- **Public form**: `/reviews` — customers can submit reviews
- **Admin**: `/admin/reviews` — view, approve, reject, or delete submissions

## 4. Form config

The form is defined in `config.json` under `reviewForm`. It uses the same JSON structure as `contactForm` and `mepForm`:

- `formAction`: `/api/reviews/submit`
- Steps: name → email → rating (1–5) → review text
- `getReviewFormConfig()` in `form-config-from-site.ts` loads it

## 5. Using reviews on the site

- **GoogleReviewsBlock**: Add approved reviews manually via the `reviews` prop (JSON or flat props)
- **Testimonials**: Admins can copy approved review text into the Testimonials admin
- Future: API to fetch approved reviews for blocks (e.g. `?source=reviewSubmissions`)
