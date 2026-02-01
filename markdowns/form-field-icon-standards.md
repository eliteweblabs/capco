# Form Field Icon Standards

## Overview
This document defines the standard icons to be used across all form configurations in the project. Consistent icon usage improves UX by providing visual cues that help users quickly identify field types.

## Standard Field Icons

All icons should be positioned on the **left** side of the input field (`iconPosition: "left"`).

### Email Fields
- **Icon**: `mail`
- **Field Type**: `type: "email"`
- **Example**:
```typescript
{
  id: "login-email",
  name: "email",
  type: "email",
  placeholder: "your.email@example.com",
  required: true,
  autocomplete: "email",
  errorMessage: "Please enter a valid email address",
  icon: "mail",
  iconPosition: "left",
}
```

### Password Fields
- **Icon**: `lock`
- **Field Type**: `type: "password"`
- **Example**:
```typescript
{
  id: "login-password",
  name: "password",
  type: "password",
  placeholder: "Enter your password",
  required: true,
  minlength: 6,
  autocomplete: "current-password",
  errorMessage: "Password must be at least 6 characters",
  icon: "lock",
  iconPosition: "left",
}
```

### Phone/Tel Fields
- **Icon**: `phone`
- **Field Type**: `type: "tel"`
- **Example**:
```typescript
{
  id: "contact-phone",
  name: "phone",
  type: "tel",
  placeholder: "(555) 123-4567",
  autocomplete: "tel",
  required: false,
  icon: "phone",
  iconPosition: "left",
}
```

### Name Fields (First/Last Name)
- **Icon**: `user`
- **Field Type**: `type: "text"`
- **Field Names**: `firstName`, `lastName`
- **Example**:
```typescript
{
  id: "step-first-name",
  name: "firstName",
  type: "text",
  placeholder: "John",
  required: true,
  autocomplete: "given-name",
  errorMessage: "Please enter your first name",
  icon: "user",
  iconPosition: "left",
}
```

### Company/Organization Fields
- **Icon**: `building`
- **Field Type**: `type: "text"`
- **Field Names**: `companyName`, `company`
- **Example**:
```typescript
{
  id: "step-company-name",
  name: "companyName",
  type: "text",
  placeholder: "Acme Corporation",
  required: true,
  autocomplete: "organization",
  errorMessage: "Please enter your company name",
  icon: "building",
  iconPosition: "left",
}
```

## Form Configurations Updated

All the following form configuration files have been updated to follow these standards:

### ✅ login-form-config.ts
- Email field: `mail` icon
- Password field: `lock` icon

### ✅ register-form-config.ts
- Email field: `mail` icon
- Password field: `lock` icon
- Phone field: `phone` icon
- First/Last name fields: `user` icon
- Company name field: `building` icon

### ✅ contact-form-config.ts
- Email field: `mail` icon
- Phone field: `phone` icon
- First/Last name fields: `user` icon
- Company field: `building` icon

### ✅ mep-form-config.ts
- Email field: `mail` icon
- Phone field: `phone` icon
- First/Last name fields: `user` icon

## Icon Position Standard

**ALL icons should be positioned on the LEFT side of the input:**
```typescript
iconPosition: "left"
```

This creates a consistent visual pattern across all forms where users can quickly scan the left edge to identify field types.

## Benefits of Icon Standardization

1. **Visual Recognition**: Users can quickly identify field types without reading labels
2. **Accessibility**: Icons provide additional context for screen readers
3. **Consistency**: Same field types look identical across different forms
4. **Professional Appearance**: Cohesive design language throughout the application
5. **Reduced Cognitive Load**: Familiar patterns reduce mental effort

## Icon Reference

All icons are stored in `/src/lib/icon-data.json` and can be used via the `<SimpleIcon>` component:

```typescript
// Available icons used in forms:
"mail"      // Envelope icon for email
"lock"      // Padlock icon for password
"phone"     // Phone handset icon for telephone
"user"      // Person silhouette icon for names
"building"  // Building icon for company/organization
```

## Implementation Checklist

When creating a new form configuration:

- [ ] Email field has `mail` icon
- [ ] Password field has `lock` icon
- [ ] Phone/tel field has `phone` icon
- [ ] Name fields (firstName/lastName) have `user` icon
- [ ] Company fields have `building` icon
- [ ] All icons are positioned `left`
- [ ] Test on both light and dark themes
- [ ] Verify icon colors use `currentColor` for theme compatibility

## Related Files

- Icon data: `/src/lib/icon-data.json`
- Icon component: `/src/components/common/SimpleIcon.astro`
- Form configs: `/src/lib/forms/*-form-config.ts`
- Form renderer: `/src/components/form/MultiStepForm.astro`

## Future Considerations

As new field types are added, consider adding icons for:
- Address fields: `map-pin` or `home` icon
- Date fields: `calendar` icon
- File upload: `upload` or `paperclip` icon
- Search fields: `search` icon
- Message/textarea: `message-circle` icon

Always maintain consistency with the left-aligned icon position standard.
