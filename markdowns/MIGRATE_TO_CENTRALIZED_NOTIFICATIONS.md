# Migration Guide: Global Services to Centralized Notifications

## Overview

This guide helps migrate from the old `globalServices.showNotification` system to the new centralized notification system.

## Files to Update

### 1. Form Components

#### AuthForm.astro

**Replace:**

```javascript
globalServices.showNotification({
  type: "error",
  title: "Login Failed",
  message: "Invalid email or password.",
  duration: 5000,
});
```

**With:**

```javascript
if (window.showError) {
  window.showError("Login Failed", "Invalid email or password.", 5000);
} else {
  console.error("🔔 [Login Failed] Invalid email or password.");
}
```

#### RegisterForm.astro

**Replace:**

```javascript
globalServices.showNotification({
  type: "success",
  title: "Registration Successful",
  message: "Please check your email to verify your account.",
  duration: 5000,
});
```

**With:**

```javascript
if (window.showSuccess) {
  window.showSuccess(
    "Registration Successful",
    "Please check your email to verify your account.",
    5000
  );
} else {
  console.log("🔔 [Registration Successful] Please check your email to verify your account.");
}
```

### 2. Profile Management

#### profile.astro

**Replace:**

```javascript
globalServices.showNotification({
  type: "success",
  title: "Profile Updated",
  message: "Your profile has been updated successfully.",
  duration: 5000,
});
```

**With:**

```javascript
if (window.showSuccess) {
  window.showSuccess("Profile Updated", "Your profile has been updated successfully.", 5000);
} else {
  console.log("🔔 [Profile Updated] Your profile has been updated successfully.");
}
```

### 3. Password Reset

#### reset-password.astro

**Replace:**

```javascript
globalServices.showNotification({
  type: "success",
  title: "Password Reset",
  message: "Password reset email sent successfully.",
  duration: 5000,
});
```

**With:**

```javascript
if (window.showSuccess) {
  window.showSuccess("Password Reset", "Password reset email sent successfully.", 5000);
} else {
  console.log("🔔 [Password Reset] Password reset email sent successfully.");
}
```

### 4. PDF Pages

#### pdf/project-agreement.astro

#### pdf/affidavit.astro

**Replace:**

```javascript
window.globalServices.showNotification({
  type: "success",
  title: "PDF Generated",
  message: "PDF has been generated successfully.",
  duration: 5000,
});
```

**With:**

```javascript
if (window.showSuccess) {
  window.showSuccess("PDF Generated", "PDF has been generated successfully.", 5000);
} else {
  console.log("🔔 [PDF Generated] PDF has been generated successfully.");
}
```

### 5. SMS Form

#### SMSForm.astro

**Replace:**

```javascript
window.globalServices.showNotification({
  type: "success",
  title: "SMS Sent",
  message: "Your message has been sent successfully.",
  duration: 5000,
});
```

**With:**

```javascript
if (window.showSuccess) {
  window.showSuccess("SMS Sent", "Your message has been sent successfully.", 5000);
} else {
  console.log("🔔 [SMS Sent] Your message has been sent successfully.");
}
```

### 6. Digital Signature

#### DigitalSignature.astro

**Replace:**

```javascript
(window as any).globalServices.showNotification({
  type: "success",
  title: "Signature Applied",
  message: "Digital signature has been applied successfully.",
  duration: 5000,
});
```

**With:**

```javascript
if (window.showSuccess) {
  window.showSuccess("Signature Applied", "Digital signature has been applied successfully.", 5000);
} else {
  console.log("🔔 [Signature Applied] Digital signature has been applied successfully.");
}
```

### 7. Email Test Page

#### email-test.astro

**Replace:**

```javascript
globalServices.showNotification({
  type: "success",
  title: "Email Sent",
  message: "Test email sent successfully.",
  duration: 5000,
});
```

**With:**

```javascript
if (window.showSuccess) {
  window.showSuccess("Email Sent", "Test email sent successfully.", 5000);
} else {
  console.log("🔔 [Email Sent] Test email sent successfully.");
}
```

## Migration Patterns

### Success Notifications

**Old:**

```javascript
globalServices.showNotification({
  type: "success",
  title: "Title",
  message: "Message",
  duration: 5000,
});
```

**New:**

```javascript
if (window.showSuccess) {
  window.showSuccess("Title", "Message", 5000);
} else {
  console.log("🔔 [Title] Message");
}
```

### Error Notifications

**Old:**

```javascript
globalServices.showNotification({
  type: "error",
  title: "Error Title",
  message: "Error message",
  duration: 0,
});
```

**New:**

```javascript
if (window.showError) {
  window.showError("Error Title", "Error message", 0);
} else {
  console.error("🔔 [Error Title] Error message");
}
```

### Warning Notifications

**Old:**

```javascript
globalServices.showNotification({
  type: "warning",
  title: "Warning Title",
  message: "Warning message",
  duration: 5000,
});
```

**New:**

```javascript
if (window.showWarning) {
  window.showWarning("Warning Title", "Warning message", 5000);
} else {
  console.warn("🔔 [Warning Title] Warning message");
}
```

### Info Notifications

**Old:**

```javascript
globalServices.showNotification({
  type: "info",
  title: "Info Title",
  message: "Info message",
  duration: 5000,
});
```

**New:**

```javascript
if (window.showInfo) {
  window.showInfo("Info Title", "Info message", 5000);
} else {
  console.info("🔔 [Info Title] Info message");
}
```

## Benefits of Migration

1. **Unified System**: All notifications go through one centralized system
2. **Database-Driven**: Status-based notifications pull from database
3. **Role-Based**: Different messages for different user roles
4. **Placeholder Support**: Dynamic content with {{PLACEHOLDER}} syntax
5. **Fallback Support**: Graceful degradation if system unavailable
6. **Consistent API**: Same interface across all components

## Testing After Migration

1. Test all form submissions
2. Test error scenarios
3. Test success scenarios
4. Verify notifications appear correctly
5. Check console fallbacks work
6. Test role-based messaging

## Rollback Plan

If issues arise, you can temporarily revert by:

1. Keeping the old global services system
2. Using the fallback mechanism in centralized notifications
3. Gradually migrating components back

The centralized system includes fallback support for the old global services, so the transition can be gradual and safe.
