# Animated Placeholder System

## Overview

The animated placeholder system allows form fields to display rotating placeholder values with a smooth slide animation. This is useful for showing multiple examples or adding visual interest to form inputs.

## Features

- **Automatic rotation**: Placeholders rotate every 3 seconds with slide animation
- **Hide on input**: Placeholders automatically hide when user starts typing
- **Step-aware**: Animations restart when returning to a step
- **Type-agnostic**: Works with any input type (text, email, tel, etc.)
- **Icon-compatible**: Works seamlessly with icon-positioned inputs

## Default Placeholder Sets

### Email Placeholders

Located in: `src/lib/multi-step-form-config.ts`

```typescript
export const DEFAULT_EMAIL_PLACEHOLDERS = [
  "hello@example.com",
  "definitely.not.spam@email.com",
  "inbox.zero@impossible.com",
  "reply.all@regrets.com",
  "unsubscribe@never.works",
  "404@notfound.com",
  "no.reply@void.com",
  "you@company.com",
  "professional.email@work.biz",
  "sent.from.my.iphone@mobile.com",
];
```

### Name Placeholders

First and last name placeholders are defined in individual form config files:

```typescript
const FIRST_NAME_PLACEHOLDERS = [
  "John", // English
  "Juan", // Spanish
  "Jean", // French
  "João", // Portuguese
  "Giovanni", // Italian
  "Hans", // German
  "Иван", // Russian (Ivan)
  "太郎", // Japanese (Taro)
  "伟", // Chinese (Wei)
];

const LAST_NAME_PLACEHOLDERS = [
  "Doe", // English
  "García", // Spanish
  "Dupont", // French
  "Silva", // Portuguese
  "Rossi", // Italian
  "Müller", // German
  "Иванов", // Russian (Ivanov)
  "山田", // Japanese (Yamada)
  "李", // Chinese (Li)
];
```

## Usage

### 1. Import the placeholder constants

```typescript
import { DEFAULT_EMAIL_PLACEHOLDERS } from "../multi-step-form-config";
```

### 2. Add to field configuration

```typescript
{
  type: "email",
  id: "user-email",
  name: "email",
  placeholder: DEFAULT_EMAIL_PLACEHOLDERS[0], // First placeholder shown initially
  animatedPlaceholders: DEFAULT_EMAIL_PLACEHOLDERS, // Full array for rotation
  required: true,
  autocomplete: "email",
  icon: "mail",
  iconPosition: "left",
}
```

### 3. Custom Placeholder Arrays

You can create custom placeholder arrays for specific fields:

```typescript
const CUSTOM_PLACEHOLDERS = [
  "Example 1",
  "Example 2",
  "Example 3",
];

// Then use in field config
{
  type: "text",
  id: "custom-field",
  name: "customField",
  placeholder: CUSTOM_PLACEHOLDERS[0],
  animatedPlaceholders: CUSTOM_PLACEHOLDERS,
  // ... other config
}
```

## How It Works

### 1. Field Rendering

`MultiStepForm.astro` detects fields with `animatedPlaceholders` and renders them with special markup:

```astro
{field.animatedPlaceholders && field.animatedPlaceholders.length > 0 ? (
  <div class="relative input-with-icon" data-icon={field.icon}>
    <input
      type={field.type}
      id={field.id}
      name={field.name}
      placeholder=""
      data-has-animated-placeholder="true"
      data-animated-placeholders={JSON.stringify(field.animatedPlaceholders)}
      {...otherProps}
    />
    <span
      class="animated-placeholder"
      data-for={field.id}
    >
      {field.placeholder}
    </span>
  </div>
)}
```

### 2. JavaScript Logic

The script in `MultiStepForm.astro` handles:

- **Initialization**: Parses `data-animated-placeholders` from each input
- **Storage**: Uses a `Map` to track current index and values for each field
- **Visibility**: Hides/shows placeholder spans based on input value
- **Rotation**: Cycles through placeholders with slide animation
- **Step awareness**: Resets and restarts animations when steps become active

### 3. Animation CSS

Located in `global.css`:

```css
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideOutDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(10px);
  }
}
```

## Files Updated

### Core System

- `src/lib/multi-step-form-config.ts` - Added `DEFAULT_EMAIL_PLACEHOLDERS` and `animatedPlaceholders` field property
- `src/components/form/MultiStepForm.astro` - Added generic animated placeholder logic

### Form Configs

All form configs now use animated placeholders:

- `src/lib/forms/mep-form-config.ts` - Email, firstName, lastName
- `src/lib/forms/contact-form-config.ts` - Email, firstName, lastName
- `src/lib/forms/register-form-config.ts` - Email, firstName, lastName
- `src/lib/forms/login-form-config.ts` - Email only

## Best Practices

1. **First placeholder**: Always set `placeholder` to the first item in the array for initial display
2. **Array length**: Use 5-10 placeholders for good variety without being overwhelming
3. **Relevance**: Keep placeholders relevant to the field type and context
4. **Humor**: Funny placeholders (like the email ones) can improve UX, but keep them appropriate
5. **Internationalization**: Include diverse language examples for name fields

## Examples

### Email Field

```typescript
{
  type: "email",
  id: "contact-email",
  name: "email",
  placeholder: DEFAULT_EMAIL_PLACEHOLDERS[0],
  animatedPlaceholders: DEFAULT_EMAIL_PLACEHOLDERS,
  required: true,
  icon: "mail",
  iconPosition: "left",
}
```

Result: Email input cycles through funny email examples every 3 seconds

### Name Fields (Side by Side)

```typescript
{
  stepNumber: 1,
  title: "What's your name?",
  fieldLayout: "grid",
  fields: [
    {
      type: "text",
      id: "first-name",
      name: "firstName",
      placeholder: FIRST_NAME_PLACEHOLDERS[0],
      animatedPlaceholders: FIRST_NAME_PLACEHOLDERS,
      columns: 2,
    },
    {
      type: "text",
      id: "last-name",
      name: "lastName",
      placeholder: LAST_NAME_PLACEHOLDERS[0],
      animatedPlaceholders: LAST_NAME_PLACEHOLDERS,
      columns: 2,
    },
  ],
}
```

Result: Both name inputs cycle through international name examples simultaneously

## Troubleshooting

### Placeholders not rotating

1. Check browser console for errors in parsing `data-animated-placeholders`
2. Ensure `animatedPlaceholders` array is not empty
3. Verify step is active (animation only runs on active steps)

### Animation looks wrong

1. Check `global.css` has the `slideInDown` and `slideOutDown` animations
2. Verify `.animated-placeholder` class is applied to the span

### Placeholder doesn't hide on input

1. Check input has `data-has-animated-placeholder="true"` attribute
2. Verify event listener is attached in browser dev tools
3. Check for JavaScript errors in console
