# Unused API Endpoints Analysis

## ✅ **USED API Endpoints** (Keep these)

### Core Functionality

- `/api/create-user` - Used in users.astro
- `/api/delete-user` - Used in users.astro
- `/api/create-project` - Used in ProjectForm.astro
- `/api/update-project` - Referenced in middleware
- `/api/delete-project` - Referenced in middleware
- `/api/update-status` - Used in multiple components
- `/api/upload` - Used in TabDocuments.astro
- `/api/update-file-metadata` - Used in TabDocuments.astro
- `/api/update-featured-image` - Used in TabDocuments.astro and Discussions.astro
- `/api/get-project-files` - Used in TabDocuments.astro
- `/api/download-file` - Used in TabDocuments.astro
- `/api/delete-media-file` - Used in TabDocuments.astro

### Discussions

- `/api/add-discussion` - Used in Discussions.astro
- `/api/update-discussion-completed` - Used in Discussions.astro
- `/api/upload-discussion-image` - Used in Discussions.astro

### Invoices & Payments

- `/api/create-invoice` - Used in ProposalManager.astro
- `/api/update-invoice-line-items` - Used in ProposalManager.astro
- `/api/delete-line-item` - Used in ProposalManager.astro
- `/api/create-payment-intent` - Used in PaymentForm.astro
- `/api/confirm-payment` - Used in PaymentForm.astro

### PDF & Documents

- `/api/generate-pdf` - Used in PDFGenerator.astro and affidavit.astro
- `/api/generate-contract-pdf` - Used in DigitalSignature.astro
- `/api/save-signature` - Used in DigitalSignature.astro

### Chat & Communication

- `/api/chat` - Used in HttpChatWidget.astro
- `/api/send-sms` - Used in bird-test.astro
- `/api/send-email-sms` - Used in SMSForm.astro and StickySMS.astro

### Subject Catalog

- `/api/subject-catalog` - Used in ProposalManager.astro and SubjectSelectDropdown.astro
- `/api/update-proposal-subject` - Used in ProposalManager.astro

### Import/Export

- `/api/import-users` - Used in ImportManager.astro
- `/api/import-projects` - Used in ImportManager.astro

### Line Items

- `/api/line-items-catalog` - Used in ProposalManager.astro

### User Management

- `/api/get-clients` - Used in ProjectForm.astro
- `/api/get-user-info` - Used in user-utils.ts

### Auth (Form Actions)

- `/api/auth/signin` - Used in AuthForm.astro and RegisterForm.astro
- `/api/auth/register` - Used in RegisterForm.astro
- `/api/auth/signout` - Used in AuthIcon.astro
- `/api/auth/forgot-password` - Used in AuthForm.astro and profile.astro
- `/api/auth/reset-password` - Used in reset-password.astro

## ❌ **UNUSED API Endpoints** (Can be deleted)

### Debug/Test Endpoints

- `/api/debug-auth.ts`
- `/api/debug-featured-image.ts`
- `/api/debug-users.ts`
- `/api/test-dashboard-data.ts`
- `/api/test-update-status.ts`
- `/api/test-status-email.ts`
- `/api/test-pdf-generation.ts`
- `/api/test-email-simple.ts`
- `/api/test-email-config.ts`

### Status/Data Endpoints (Likely replaced by front-matter optimization)

- `/api/get-project-statuses.ts`
- `/api/get-client-profiles.ts`
- `/api/process-client-status.ts`

### Places API (May be unused if not using address autocomplete)

- `/api/places-autocomplete.ts`
- `/api/places-details.ts`

### Video API (May be unused if not using adaptive video)

- `/api/video-quality.ts`

### Invoice Details (May be unused)

- `/api/get-invoice.ts`
- `/api/get-invoice-details.ts`
- `/api/get-project-invoice.ts`
- `/api/update-invoice.ts`

### User/Team Management (May be unused)

- `/api/get-mentionable-users.ts`
- `/api/get-team-users.ts`
- `/api/get-user-emails-by-role.ts`
- `/api/assign-staff.ts`
- `/api/get-user-profile.ts`

### Project Data (May be unused)

- `/api/backend-page-check.ts`
- `/api/get-global-activity-feed.ts`
- `/api/get-project-status-data.ts`
- `/api/filter-projects.ts`

### Email/Webhook (May be unused)

- `/api/email-delivery.ts`
- `/api/email-webhook.ts`
- `/api/resend-webhook.ts`

### Activity/Logging (May be unused)

- `/api/get-user-activity-log.ts`
- `/api/get-simple-project-log.ts`

### Subject/Proposal (May be unused)

- `/api/get-proposal-subject.ts`
- `/api/check-proposal-subject-column.ts`
- `/api/add-subject-column.ts`
- `/api/setup-subject-catalog.ts`

### Status Email (May be unused)

- `/api/get-status-email-content.ts`

### Line Items (May be unused)

- `/api/get-invoice-line-items.ts`
- `/api/add-catalog-item-to-invoice.ts`

### Featured Projects (May be unused)

- `/api/get-featured-projects.ts`

### Utility (May be unused)

- `/api/replace-placeholders.ts`
- `/api/clear-cache.ts`
- `/api/auto-save-line-item.ts`

### Missing API (Referenced but doesn't exist)

- `/api/get-file-by-path` - Referenced in Discussions.astro but file doesn't exist
- `/api/get-pdf-documents` - Referenced in PDFGenerator.astro but file doesn't exist
- `/api/get-project` - Referenced in global-activity.astro but file doesn't exist
- `/api/profile/update` - Referenced in profile.astro but file doesn't exist

## 🚨 **Missing API Endpoints** (Need to be created or references removed)

- `/api/get-file-by-path`
- `/api/get-pdf-documents`
- `/api/get-project`
- `/api/profile/update`
