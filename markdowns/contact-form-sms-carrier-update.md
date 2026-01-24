# Contact Form SMS & Carrier Updates

## Overview

Updated the contact form to properly handle SMS alerts with mobile carrier selection.

## Changes Made

### 1. Field Name Updates
- **Changed:** `smsConsent` → `smsAlerts` (to match profile schema)
- **Added:** `mobileCarrier` field (required if SMS alerts enabled)

### 2. Form Steps Updated (7 → 8 steps)

New step sequence:
1. **Step 1:** Name (First & Last)
2. **Step 2:** Email
3. **Step 3:** Phone Number
4. **Step 4:** SMS Alerts (Yes/No)
5. **Step 5:** Mobile Carrier (Only if Step 4 = Yes) ⭐ NEW
6. **Step 6:** Company
7. **Step 7:** Address
8. **Step 8:** Message

### 3. Navigation Logic

**Step 4 SMS Choice:**
- **"No"** → Skips carrier selection, goes to Step 6 (Company)
- **"Yes"** → Goes to Step 5 (Mobile Carrier)

**Step 5 Back Button:**
- Goes back to Step 4 (SMS Alerts)

### 4. Mobile Carrier Selection

Uses `SlotMachineModal` component with carriers from `SMS_UTILS`:

```astro
<SlotMachineModal
  id="contact-carrier"
  title="Select Your Carrier"
  icon="phone"
  options={mobileCarrierOptions}
  selectedValue=""
  placeholder="Select your carrier..."
  buttonText="Select Carrier *"
  buttonClass="w-full"
  buttonVariant="primary"
  showCloseButton={true}
  showCancelButton={true}
  {globalInputClasses}
/>
```

Available carriers (from `src/lib/sms-utils.ts`):
- AT&T
- Verizon / Spectrum
- T-Mobile
- Sprint
- Boost Mobile
- Cricket Wireless
- MetroPCS
- US Cellular
- Virgin Mobile
- Consumer Cellular

### 5. Validation Updates

**Step 5 Validation:**
- Only validates carrier selection if `smsAlerts` = "true"
- Shows error: "Please select your mobile carrier"

**Step 7 Validation:**
- Address validation moved from Step 6 to Step 7

### 6. API Changes (`/api/contact/submit`)

**Request Fields:**
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smsAlerts: boolean;      // Changed from smsConsent
  mobileCarrier: string;   // NEW - carrier ID (e.g., "verizon", "att")
  company: string;
  address: string;
  message: string;
}
```

**Mobile Carrier Conversion:**
The API now converts carrier IDs to gateway domains (matching RegisterForm logic):
- **Input:** Carrier ID (e.g., "verizon", "att", "tmobile")
- **Stored:** Gateway domain (e.g., "@vtext.com", "@txt.att.net", "@tmomail.net")
- **Email Display:** Friendly name (e.g., "Verizon / Spectrum", "AT&T", "T-Mobile")

```typescript
// Conversion logic (same as RegisterForm)
if (smsAlerts && mobileCarrierRaw) {
  const carrierInfo = SMS_UTILS.getCarrierInfo(mobileCarrierRaw);
  if (carrierInfo) {
    mobileCarrier = `@${carrierInfo.gateway}`;  // Store gateway
  }
}
```

**Profile Updates:**
- Updates `smsAlerts` field in profiles table
- Updates `mobileCarrier` field with gateway domain (e.g., "@vtext.com")
- Only saves carrier if `smsAlerts` is true

**ContactSubmissions Table:**
- Saves `smsAlerts` instead of `smsConsent`
- Saves `mobileCarrier` as gateway domain (e.g., "@txt.att.net")

### 7. Database Schema Updates

**Updated SQL:**
```sql
CREATE TABLE "contactSubmissions" (
  id SERIAL PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  "smsAlerts" BOOLEAN DEFAULT false,  -- Changed from smsConsent
  "mobileCarrier" TEXT,                -- NEW field
  company TEXT,
  address TEXT,
  message TEXT NOT NULL,
  "userId" TEXT,
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Migration Required:**
If table already exists, run:
```sql
-- Rename smsConsent to smsAlerts
ALTER TABLE "contactSubmissions" 
  RENAME COLUMN "smsConsent" TO "smsAlerts";

-- Add mobileCarrier column
ALTER TABLE "contactSubmissions"
  ADD COLUMN "mobileCarrier" TEXT;
```

### 8. Progress Bar

- Updated from "1 / 7" to "1 / 8"
- Total steps increased from 7 to 8

### 9. Form Data Flow

**Submission Data:**
```javascript
{
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "(555) 123-4567",
  smsAlerts: "true",           // "true" or "false" as string
  mobileCarrier: "verizon",    // Carrier ID (form input)
  company: "Acme Corp",
  address: "123 Main St...",
  message: "Hello..."
}
```

**Stored in Database:**
```javascript
{
  // ... other fields
  smsAlerts: true,              // Boolean
  mobileCarrier: "@vtext.com"   // Gateway domain (converted from ID)
}
```

**Hidden Inputs:**
- `contact-sms-alerts` (value: "true" or "false")
- `contact-carrier-value` (value: carrier ID like "verizon")
- `contact-address-value` (value: full address string)

### 10. Email Notifications

Admin notification includes:
- SMS Alerts status
- Mobile Carrier (friendly name like "Verizon / Spectrum", not gateway)

Example:
```
✅ SMS Alerts: Yes (Updates only, no marketing)
Mobile Carrier: Verizon / Spectrum
```

**Implementation:**
```typescript
// Display friendly name in email
let carrierDisplayName = mobileCarrier;
if (mobileCarrier && mobileCarrierRaw) {
  const carrierInfo = SMS_UTILS.getCarrierInfo(mobileCarrierRaw);
  if (carrierInfo) {
    carrierDisplayName = carrierInfo.name;  // "Verizon / Spectrum"
  }
}
```

## Testing Checklist

- [ ] Step 4 "No" → Skips to Step 6
- [ ] Step 4 "Yes" → Goes to Step 5
- [ ] Step 5 requires carrier selection
- [ ] Step 5 back button → Step 4
- [ ] Carrier selection validates before Step 6
- [ ] Form submits with smsAlerts=true and mobileCarrier
- [ ] Form submits with smsAlerts=false (no carrier)
- [ ] Profile updates with smsAlerts and mobileCarrier
- [ ] ContactSubmissions saves with correct fields

## Benefits

1. **Accurate SMS Delivery:** Carrier info enables proper SMS delivery
2. **Profile Consistency:** Uses `smsAlerts` matching profile schema
3. **Conditional Logic:** Only asks for carrier when needed
4. **Better UX:** Clear flow with progressive disclosure
5. **Consistent with RegisterForm:** Uses same carrier conversion logic ⭐

## Important Notes

### Carrier Storage Format

The contact form now matches the RegisterForm behavior:
- **Form submits:** Carrier ID (e.g., "verizon")
- **API converts:** Carrier ID → Gateway domain (e.g., "@vtext.com")
- **Database stores:** Gateway domain (e.g., "@vtext.com")
- **Email displays:** Friendly name (e.g., "Verizon / Spectrum")

This ensures consistency across all user creation flows:
- ✅ RegisterForm: Converts carrier ID to gateway
- ✅ ContactForm: Converts carrier ID to gateway
- ✅ Profile updates: Uses gateway domain
- ✅ SMS sending: Uses gateway domain

### Why Store Gateway Domain?

Storing the gateway domain (e.g., "@vtext.com") instead of the carrier ID:
1. **Direct SMS usage:** Email-to-SMS format is `{phone}@{gateway}`
2. **No conversion needed:** Can send SMS immediately
3. **Future-proof:** Gateway domains rarely change
4. **Consistency:** All systems use same format
