# Age Consent Module

Reusable age verification component for forms. Confirms users meet a minimum age (default 18) before proceeding.

## Enable/Disable via Site Config

Age consent is controlled by `plugins.ageConsent` in the site config (e.g. `config-capco-design-group.json`, `config-rothco-built.json`):

```json
"plugins": [{
  "ageConsent": false
}]
```

- **`ageConsent: false`** (default) – No site-wide wall. Form steps come only from config; if your config has no AgeConsent step, none is shown.
- **`ageConsent: true`** – **Site-wide consent wall** – A full-page overlay blocks the entire site until the user confirms they are 18+. Consent is stored in `localStorage`; returning users skip the wall.

**Form steps** (contact, register, etc.) are always defined in `config-*.json`. To show age consent in a form, add an AgeConsent step to that form's `steps` in your company config. No code injection.

The `plugins` array is merged into a single object, so you can combine multiple plugin flags:

```json
"plugins": [
  { "ageConsent": true },
  { "otherPlugin": true }
]
```

## Usage

### In Form Config (JSON)

Add a step with the AgeConsent component:

```json
{
  "title": "Age verification",
  "fields": [
    {
      "id": "age-consent",
      "name": "ageConsent",
      "type": "component",
      "component": "AgeConsent",
      "required": true,
      "componentProps": {
        "minAge": 18,
        "heading": "I confirm I am 18 years of age or older",
        "subtext": "You must meet this requirement to use our services.",
        "refuseMessage": "You must be 18 or older to use this service."
      }
    }
  ],
  "buttons": [
    { "type": "prev", "label": "back", "dataPrev": 1 },
    { "type": "next", "label": "next", "dataNext": 2 }
  ]
}
```

### Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | string | `"age-consent"` | Unique ID for the module |
| `name` | string | `"ageConsent"` | Form field name (submitted value) |
| `minAge` | number | `18` | Minimum age requirement |
| `heading` | string | "I confirm I am {minAge} years of age or older" | Main heading text |
| `subtext` | string | Terms of Service reference | Description below heading |
| `refuseMessage` | string | "You must be 18 or older..." | Message shown when user selects "No" |
| `value` | boolean | `false` | Initial value |

### Behavior

- **Yes** → Sets `ageConsent` to `"true"`, enables and clicks the Next button to advance
- **No** → Sets `ageConsent` to `"false"`, shows refuse message, does not advance

### Backend Handling

When the form submits, check `ageConsent`:

```ts
const ageConsent = formData.get("ageConsent") === "true";
if (!ageConsent) {
  return new Response(JSON.stringify({ error: "Age verification required" }), { status: 400 });
}
```

### Adding to Contact or Register Form

Insert the age consent step early in the form flow (e.g., after name/email, before sensitive data). Update `config-*.json` under `forms.contact-form.steps` or `forms.register-form.steps`.
