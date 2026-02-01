# OTP Email Configuration Guide

## Overview

The OTP (One-Time Password) authentication system now uses centralized configuration for better maintainability and consistency. All configuration values are stored in `/src/lib/otp-email-config.ts`.

## Configuration Structure

### 1. Email Input Configuration (`otpEmailConfig`)

Controls the email input field for requesting OTP codes:

```typescript
{
  id: "otp-email",
  name: "email",
  type: "email",
  placeholder: "Your email address",
  required: true,
  autocomplete: "email",
  autofocus: true,
  label: {
    text: "Email",
    classes: "hidden mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
  },
  validation: {
    type: "email",
    errorMessage: "Please enter your email address"
  }
}
```

### 2. OTP Code Input Configuration (`otpCodeConfig`)

Controls the 6-digit verification code input:

```typescript
{
  id: "otp-code",
  name: "token",
  type: "text",
  placeholder: "Enter 6-digit code",
  required: true,
  maxlength: 6,
  pattern: "[0-9]{6}",
  autocomplete: "one-time-code",
  instructionText: "Enter the 6-digit code sent to",
  validation: {
    length: 6,
    errorMessage: "Please enter a valid 6-digit code"
  }
}
```

### 3. Button Configuration (`otpFormButtonConfig`)

Centralizes all button configurations:

- **sendCode**: Primary submit button to send OTP
- **verify**: Primary submit button to verify OTP code
- **back**: Outline button to navigate back
- **resend**: Text link button to resend OTP

### 4. API Configuration (`otpApiConfig`)

Defines API endpoints and request bodies:

```typescript
{
  endpoints: {
    sendOtp: "/api/auth/send-otp",
    verifyOtp: "/api/auth/verify-otp"
  },
  requestBody: {
    sendOtp: { type: "magiclink" },
    verifyOtp: { type: "email" }
  },
  redirectUrl: "/project/dashboard"
}
```

### 5. Notification Configuration (`otpNotificationConfig`)

Standardizes notification messages for:
- Sending code
- Code sent success
- Verifying code
- Verification success
- Errors
- Resending code
- Code resent success

## Usage in Components

The configuration is imported and used in `OTPForm.astro`:

```astro
---
import {
  otpEmailConfig,
  otpCodeConfig,
  otpFormButtonConfig,
  otpApiConfig,
  otpNotificationConfig,
} from "../../lib/otp-email-config";
---

<!-- Use config values in template -->
<input
  type="email"
  name={otpEmailConfig.name}
  id={otpEmailConfig.id}
  placeholder={otpEmailConfig.placeholder}
  ...
/>
```

## Benefits

1. **Single Source of Truth**: All OTP-related configuration in one file
2. **Easy Customization**: Change labels, messages, or settings in one place
3. **Type Safety**: TypeScript interfaces ensure correct usage
4. **Consistency**: Ensures all OTP forms use the same configuration
5. **Maintainability**: Updates only need to be made in the config file

## Customization

To customize the OTP authentication experience:

1. Open `/src/lib/otp-email-config.ts`
2. Modify the relevant configuration object
3. Changes will automatically apply to all OTP forms

### Examples

**Change button labels:**
```typescript
export const otpFormButtonConfig = {
  sendCode: {
    ...
    label: "Email Me a Code", // Changed from "Send Code"
  }
}
```

**Change redirect destination:**
```typescript
export const otpApiConfig = {
  ...
  redirectUrl: "/dashboard", // Changed from "/project/dashboard"
}
```

**Customize notification messages:**
```typescript
export const otpNotificationConfig = {
  sent: {
    type: "success",
    title: "Check Your Inbox!",
    message: "We've sent you a verification code"
  }
}
```

## File Locations

- **Configuration**: `/src/lib/otp-email-config.ts`
- **Component**: `/src/components/form/OTPForm.astro`
- **Documentation**: `/markdowns/otp-email-config-guide.md`
