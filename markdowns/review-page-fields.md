# Review Page (Step 8) - Complete Field List

## Visual Layout

```
┌─────────────────────────────────────────────────────┐
│                   Almost there!                     │
│        Review your information and create           │
│                  your account                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Email                                      [Edit]  │
│  user@example.com                                   │
├─────────────────────────────────────────────────────┤
│  Name                                       [Edit]  │
│  John Doe                                           │
├─────────────────────────────────────────────────────┤
│  Company                                    [Edit]  │
│  Acme Corporation                                   │
├─────────────────────────────────────────────────────┤
│  Password                                   [Edit]  │
│  ••••••                                             │
├─────────────────────────────────────────────────────┤
│  Phone                                      [Edit]  │
│  (555) 123-4567                                     │
├─────────────────────────────────────────────────────┤
│  SMS Alerts                                 [Edit]  │
│  Yes                                                │
├─────────────────────────────────────────────────────┤
│  Mobile Carrier                             [Edit]  │
│  AT&T                                               │
└─────────────────────────────────────────────────────┘

          [← back]           [Create Account →]
```

## Field Details

### 1. Email
- **ID:** `review-email`
- **Edit Step:** 1
- **Display:** Raw email value or "Not provided"
- **Example:** `user@example.com`

### 2. Name
- **ID:** `review-name`
- **Edit Step:** 2
- **Display:** First name + Last name (trimmed)
- **Example:** `John Doe`
- **Fallback:** "Not provided"

### 3. Company
- **ID:** `review-company`
- **Edit Step:** 3
- **Display:** Company name or "Not provided"
- **Example:** `Acme Corporation`

### 4. Password
- **ID:** `review-password`
- **Edit Step:** 4
- **Display:** Always shown as `••••••` (masked)
- **Fallback:** "Not provided"

### 5. Phone
- **ID:** `review-phone`
- **Edit Step:** 5
- **Display:** Formatted phone number or "Not provided"
- **Example:** `(555) 123-4567`
- **Note:** Shows "Not provided" if phone was skipped

### 6. SMS Alerts (NEW)
- **ID:** `review-sms-alerts`
- **Edit Step:** 6 (SMS Consent)
- **Display:** "Yes" or "No"
- **Source:** `step-sms-alerts` hidden input value
- **Logic:**
  - `value === "true"` → Display "Yes"
  - `value === "false"` → Display "No"
  - Empty → Display "No"

### 7. Mobile Carrier (NEW)
- **ID:** `review-carrier`
- **Edit Step:** 7 (Carrier Selection)
- **Display:** Carrier name or "Not provided"
- **Example:** `AT&T`, `Verizon`, `T-Mobile`
- **Source:** Gets display text from `step-carrier-button` element
- **Fallback:** "Not provided" if carrier not selected or phone was skipped

## updateReviewSection() Function Logic

```typescript
function updateReviewSection() {
  // Get form values
  const email = document.getElementById("step-email")?.value || "Not provided";
  const firstName = document.getElementById("step-first-name")?.value || "";
  const lastName = document.getElementById("step-last-name")?.value || "";
  const company = document.getElementById("step-company-name")?.value || "Not provided";
  const password = document.getElementById("step-password")?.value || "Not provided";
  const phone = document.getElementById("step-phone")?.value || "Not provided";
  
  // SMS Alerts - convert true/false to Yes/No
  const smsAlertsInput = document.getElementById("step-sms-alerts");
  const smsAlertsValue = smsAlertsInput?.value || "false";
  const smsAlerts = smsAlertsValue === "true" ? "Yes" : "No";
  
  // Carrier - get display name from button text
  const carrierInput = document.getElementById("step-carrier-value");
  const carrierValue = carrierInput?.value || "";
  const carrierButton = document.getElementById("step-carrier-button");
  const carrierDisplay = carrierButton?.textContent?.trim() || "Not provided";
  const carrier = carrierValue ? carrierDisplay : "Not provided";

  // Update review display elements
  if (reviewEmail) reviewEmail.textContent = email;
  if (reviewName) reviewName.textContent = `${firstName} ${lastName}`.trim() || "Not provided";
  if (reviewCompany) reviewCompany.textContent = company;
  if (reviewPassword) reviewPassword.textContent = password ? "••••••" : "Not provided";
  if (reviewPhone) reviewPhone.textContent = phone;
  if (reviewSmsAlerts) reviewSmsAlerts.textContent = smsAlerts;
  if (reviewCarrier) reviewCarrier.textContent = carrier;
}
```

## Display Scenarios

### Scenario 1: User Skips Phone
```
Phone: Not provided
SMS Alerts: No
Mobile Carrier: Not provided
```

### Scenario 2: User Enters Phone but Says No to SMS
```
Phone: (555) 123-4567
SMS Alerts: No
Mobile Carrier: Not provided
```

### Scenario 3: Full Phone/SMS/Carrier Flow
```
Phone: (555) 123-4567
SMS Alerts: Yes
Mobile Carrier: AT&T
```

### Scenario 4: Phone + SMS Yes but No Carrier Selected (should not happen due to validation)
```
Phone: (555) 123-4567
SMS Alerts: Yes
Mobile Carrier: Not provided
```
*Note: This scenario is prevented by validation on Step 7*

## Edit Button Navigation

When user clicks Edit button on review page:

| Field | Edit Button Step | Where It Goes |
|-------|-----------------|---------------|
| Email | data-edit="1" | Step 1: Email |
| Name | data-edit="2" | Step 2: Name |
| Company | data-edit="3" | Step 3: Company |
| Password | data-edit="4" | Step 4: Password |
| Phone | data-edit="5" | Step 5: Phone |
| SMS Alerts | data-edit="6" | Step 6: SMS Consent |
| Mobile Carrier | data-edit="7" | Step 7: Carrier Selection |

## Data Submitted on Form Submit

When the form is submitted, it includes:
```javascript
{
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  companyName: "Acme Corporation",
  password: "******",
  phone: "(555) 123-4567",
  smsAlerts: "true",           // Hidden input value
  mobileCarrier: "att",         // Carrier ID (hidden input value)
  role: "Client"
}
```

## CSS Classes

Review section uses:
- Border between items: `border-b border-gray-200 pb-4 dark:border-gray-700`
- Last item (Mobile Carrier): No border-b class
- Label text: `text-sm text-gray-600 dark:text-gray-400`
- Value text: `text-lg font-medium text-gray-900 dark:text-white`
- Edit button: `text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400`
