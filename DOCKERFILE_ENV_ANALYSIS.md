# Dockerfile vs Environment Variables Analysis

## Summary

This document compares the Dockerfile ARG/ENV declarations against actual environment variable usage in the codebase.

## Issues Found

### 1. Missing ARG Declarations (Used in Code but Not in Dockerfile)

These variables are used in the codebase but are **NOT** declared as ARG in the Dockerfile:

- `VAPI_API_KEY` - Used extensively in API routes and scripts
- `VAPI_WEBHOOK_SECRET` - Used in `src/pages/api/vapi/status.ts`
- `PUBLIC_VAPI_ASSISTANT_ID` - Used in multiple files (should be PUBLIC_ prefix for client-side)
- `PUBLIC_VAPI_KEY` - Used in VapiChatWidget and voice-assistant pages
- `GLOBAL_COMPANY_NAME` - Used in VapiChatWidget
- `GLOBAL_COMPANY_SLOGAN` - Used in content.ts (has ENV but missing ARG)
- `GLOBAL_COMPANY_EMAIL` - Used in content.ts and global-company-data.ts
- `GLOBAL_COMPANY_PHONE` - Used in content.ts and global-company-data.ts
- `GLOBAL_COMPANY_ADDRESS` - Used in content.ts
- `GLOBAL_COMPANY_LOGO_SVG` - Used in content.ts and global-company-data.ts
- `GLOBAL_COMPANY_ICON_SVG` - Used in content.ts and global-company-data.ts
- `FONT_FAMILY` - Used in tailwind.config.mjs and content.ts
- `FONT_FAMILY_FALLBACK` - Used in tailwind.config.mjs and content.ts
- `GOOGLE_PEOPLE_CLIENT_ID` - Used in `src/pages/api/google/signin.ts`
- `GOOGLE_PEOPLE_CLIENT_SECRET` - Used in `src/pages/api/google/signin.ts`
- `VAPI_PHONE_NUMBER_ID` - Used in `src/pages/api/voice-assistant/call-client.ts`
- `VAPI_PHONE_NUMBER` - Used in global-company-data.ts

### 2. Missing ENV Declarations (Has ARG but No ENV)

These variables are declared as ARG but **NOT** set as ENV (won't be available at runtime):

- `TWILIO_ACCOUNT_SID` - Has ARG but ENV is commented out
- `TWILIO_AUTH_TOKEN` - Has ARG but ENV is commented out
- `TWILIO_PHONE_NUMBER` - Has ARG but ENV is commented out
- `AGORA_APP_ID` - Has ARG but ENV is commented out
- `AGORA_APP_CERTIFICATE` - Has ARG but ENV is commented out
- `BIRD_ACCESS_KEY` - Has ARG but ENV is commented out
- `BIRD_IDENTITY_SIGNING_KEY` - Has ARG but ENV is commented out
- `BIRD_ISSUER` - Has ARG but ENV is commented out
- `BIRD_ORIGIN` - Has ARG but ENV is commented out
- `BIRD_WORKSPACE_ID` - Has ARG but ENV is commented out
- `COMPANY_LOGO_DARK` - Has ARG but ENV is commented out
- `COMPANY_LOGO_LIGHT` - Has ARG but ENV is commented out
- `EMAIL_LOGO_LIGHT` - Has ARG but ENV is commented out

### 3. Variables with ENV but Missing ARG

These have ENV declarations but **NO** ARG declaration (won't be passed at build time):

- `FALLBACK_MODE` - Has ENV but no ARG
- `GLOBAL_COMPANY_SLOGAN` - Has ENV but no ARG

### 4. Inconsistencies

- `PUBLIC_CAMPFIRE_URL` and `PUBLIC_CAMPFIRE_WIDGET_ID` - Correctly declared (PUBLIC_ vars need to be available at build time)
- Some variables use `PUBLIC_` prefix (for client-side) but are not consistently named

## Recommended Fixes

### Priority 1: Add Missing Critical Variables

Add these ARG declarations to Dockerfile (lines 31-74):

```dockerfile
ARG VAPI_API_KEY
ARG VAPI_WEBHOOK_SECRET
ARG PUBLIC_VAPI_ASSISTANT_ID
ARG PUBLIC_VAPI_KEY
ARG GLOBAL_COMPANY_NAME
ARG GLOBAL_COMPANY_EMAIL
ARG GLOBAL_COMPANY_PHONE
ARG GLOBAL_COMPANY_ADDRESS
ARG GLOBAL_COMPANY_LOGO_SVG
ARG GLOBAL_COMPANY_ICON_SVG
ARG FONT_FAMILY
ARG FONT_FAMILY_FALLBACK
ARG GOOGLE_PEOPLE_CLIENT_ID
ARG GOOGLE_PEOPLE_CLIENT_SECRET
ARG VAPI_PHONE_NUMBER_ID
ARG VAPI_PHONE_NUMBER
```

Add corresponding ENV declarations (after line 120):

```dockerfile
ENV VAPI_API_KEY=$VAPI_API_KEY
ENV VAPI_WEBHOOK_SECRET=$VAPI_WEBHOOK_SECRET
ENV PUBLIC_VAPI_ASSISTANT_ID=$PUBLIC_VAPI_ASSISTANT_ID
ENV PUBLIC_VAPI_KEY=$PUBLIC_VAPI_KEY
ENV GLOBAL_COMPANY_NAME=$GLOBAL_COMPANY_NAME
ENV GLOBAL_COMPANY_EMAIL=$GLOBAL_COMPANY_EMAIL
ENV GLOBAL_COMPANY_PHONE=$GLOBAL_COMPANY_PHONE
ENV GLOBAL_COMPANY_ADDRESS=$GLOBAL_COMPANY_ADDRESS
ENV GLOBAL_COMPANY_LOGO_SVG=$GLOBAL_COMPANY_LOGO_SVG
ENV GLOBAL_COMPANY_ICON_SVG=$GLOBAL_COMPANY_ICON_SVG
ENV FONT_FAMILY=$FONT_FAMILY
ENV FONT_FAMILY_FALLBACK=$FONT_FAMILY_FALLBACK
ENV GOOGLE_PEOPLE_CLIENT_ID=$GOOGLE_PEOPLE_CLIENT_ID
ENV GOOGLE_PEOPLE_CLIENT_SECRET=$GOOGLE_PEOPLE_CLIENT_SECRET
ENV VAPI_PHONE_NUMBER_ID=$VAPI_PHONE_NUMBER_ID
ENV VAPI_PHONE_NUMBER=$VAPI_PHONE_NUMBER
```

### Priority 2: Fix Missing ARG for Existing ENV

Add ARG declarations for variables that have ENV but no ARG:

```dockerfile
ARG FALLBACK_MODE
ARG GLOBAL_COMPANY_SLOGAN
```

### Priority 3: Review Commented Out Variables

If these services are not used, remove the ARG declarations. If they are used, uncomment the ENV lines:
- Twilio variables (lines 77-79)
- Agora variables (lines 80-81)
- Bird variables (lines 82-86)
- Company logo variables (lines 90-91, 93)

## Variables Currently in Dockerfile (Complete List)

### ARG Declarations (Build-time)
1. TWILIO_ACCOUNT_SID
2. TWILIO_AUTH_TOKEN
3. TWILIO_PHONE_NUMBER
4. AGORA_APP_ID
5. AGORA_APP_CERTIFICATE
6. BIRD_ACCESS_KEY
7. BIRD_IDENTITY_SIGNING_KEY
8. BIRD_ISSUER
9. BIRD_ORIGIN
10. BIRD_WORKSPACE_ID
11. CHAT_PORT
12. PUBLIC_CAMPFIRE_URL
13. PUBLIC_CAMPFIRE_WIDGET_ID
14. COMPANY_LOGO_DARK
15. COMPANY_LOGO_LIGHT
16. EMAIL_API_KEY
17. EMAIL_LOGO_LIGHT
18. EMAIL_PROVIDER
19. FROM_EMAIL
20. FROM_NAME
21. RAILWAY_PROJECT_NAME
22. GOOGLE_MAPS_API_KEY
23. GOOGLE_PLACES_API_KEY
24. GOOGLE_PLACES_API_SECRET_KEY
25. MAILGUN_API
26. MAILGUN_BASE_URL
27. MAILGUN_SANDBOX_DOMAIN
28. MAILGUN_WEBHOOK_SIGNING_KEY
29. GLOBAL_COLOR_PRIMARY
30. STRIPE_PUBLISHABLE_KEY
31. PUBLIC_SUPABASE_ANON_KEY
32. SUPABASE_ADMIN_KEY
33. PUBLIC_SUPABASE_URL
34. PUBLIC_SUPABASE_PUBLISHABLE
35. SUPABASE_SECRET
36. RESEND_WEBHOOK_SECRET
37. GLOBAL_COLOR_SECONDARY
38. RAILWAY_PUBLIC_DOMAIN
39. STRIPE_DOMAIN_ID
40. STRIPE_SECRET_KEY
41. YEAR
42. ANTHROPIC_API_KEY

### ENV Declarations (Runtime)
1. CHAT_PORT
2. EMAIL_API_KEY
3. EMAIL_PROVIDER
4. FALLBACK_MODE (no ARG!)
5. FROM_EMAIL
6. FROM_NAME
7. RAILWAY_PROJECT_NAME
8. GLOBAL_COMPANY_SLOGAN (no ARG!)
9. GOOGLE_MAPS_API_KEY
10. GOOGLE_PLACES_API_KEY
11. GOOGLE_PLACES_API_SECRET_KEY
12. MAILGUN_API
13. MAILGUN_BASE_URL
14. MAILGUN_SANDBOX_DOMAIN
15. MAILGUN_WEBHOOK_SIGNING_KEY
16. GLOBAL_COLOR_PRIMARY
17. STRIPE_PUBLISHABLE_KEY
18. PUBLIC_SUPABASE_ANON_KEY
19. SUPABASE_ADMIN_KEY
20. PUBLIC_SUPABASE_URL
21. PUBLIC_SUPABASE_PUBLISHABLE
22. SUPABASE_SECRET
23. RESEND_WEBHOOK_SECRET
24. GLOBAL_COLOR_SECONDARY
25. RAILWAY_PUBLIC_DOMAIN
26. STRIPE_DOMAIN_ID
27. STRIPE_SECRET_KEY
28. YEAR
29. ANTHROPIC_API_KEY
30. PUBLIC_CAMPFIRE_URL
31. PUBLIC_CAMPFIRE_WIDGET_ID

## Next Steps

1. Review this analysis
2. Decide which commented-out variables are needed
3. Add missing ARG/ENV pairs
4. Test Docker build with all required variables
5. Update deployment documentation with complete variable list

