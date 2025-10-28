# Google Contacts Integration Setup (Standalone)

This document explains how to set up and use the standalone Google Contacts integration for the PDF System.

## Overview

The standalone Google Contacts integration allows users to:

1. Sign in with Google OAuth (no database required)
2. Select a template for PDF generation
3. Use a slot machine modal to search and select contacts from their Google account
4. Map contact data to form placeholders to automatically fill out PDF forms

## Setup Requirements

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the **Contacts API** (Google Contacts API v3)
4. Configure OAuth consent screen
5. Add the Contacts scope: `https://www.google.com/m8/feeds/`
6. Create OAuth 2.0 credentials (Web application)
7. Add authorized redirect URIs:
   - Development: `http://localhost:4321/api/google/oauth-callback`
   - Production: `https://yourdomain.com/api/google/oauth-callback`

**Note:** We use Google Contacts API v3 instead of People API for better compatibility and fewer restrictions.

### 2. Environment Variables

Add these to your `.env` file:

```env
# Google OAuth for Contacts API (Standalone)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## API Endpoint

### `/api/google/contacts`

**Method:** GET

**Parameters:**

- `input` (optional): Search query to filter contacts

**Response:**

```json
{
  "success": true,
  "contacts": [
    {
      "id": "contact_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "organization": "Company Name",
      "address": "123 Main St",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "company": "Company Name",
      "phoneNumber": "+1234567890",
      "emailAddress": "john@example.com",
      "streetAddress": "123 Main St",
      "value": "contact_id",
      "label": "John Doe"
    }
  ],
  "total": 1
}
```

## Usage in Components

### SlotMachineModal Integration

The `SlotMachineModal` component is already configured to work with Google Contacts:

```astro
<SlotMachineModal
  id="user-search"
  icon="user"
  title="Search User"
  options={[]}
  placeholder="Search for a user..."
  showCloseButton={true}
  showCancelButton={true}
  fetchApiEndpoint="/api/google/contacts"
  searchText="Search for a user..."
  searchPlaceholder="Search for a user..."
  valueField="id"
  labelField="name"
  {project}
  {currentUser}
/>
```

### Contact Data Mapping

When a contact is selected, the following fields are available for template mapping:

#### Basic Information

- `{{firstName}}` - Contact's first name
- `{{lastName}}` - Contact's last name
- `{{fullName}}` - Contact's full name
- `{{middleName}}` - Middle name
- `{{namePrefix}}` - Name prefix (Mr., Dr., etc.)
- `{{nameSuffix}}` - Name suffix (Jr., Sr., etc.)

#### Contact Information

- `{{email}}` or `{{emailAddress}}` - Primary email address
- `{{phone}}` or `{{phoneNumber}}` - Primary phone number
- `{{company}}` or `{{organization}}` - Company/organization name
- `{{jobTitle}}` - Job title/position
- `{{address}}` or `{{streetAddress}}` - Primary address

#### Extended Information

- `{{photoUrl}}` - Profile photo URL
- `{{biography}}` - Contact biography/notes
- `{{birthday}}` - Birthday information
- `{{websites}}` - Array of website URLs
- `{{relations}}` - Family/relationship information

#### Multiple Contact Methods

- `{{allEmails}}` - Array of all email addresses with types
- `{{allPhones}}` - Array of all phone numbers with types
- `{{allOrganizations}}` - Array of all organizations/companies
- `{{allAddresses}}` - Array of all addresses with details

#### Advanced Data

- `{{rawContact}}` - Complete raw contact data from Google

## Testing

### Test Page

Visit `/test-google-contacts` to test the Google Contacts API integration:

1. Make sure you're logged in with Google OAuth
2. Click "Fetch Contacts" to load all contacts
3. Use the search input to filter contacts
4. Check the debug output for API response details

### Common Issues

1. **"Authentication required" error:**
   - Make sure you're logged in with Google OAuth
   - Check that the OAuth includes the Contacts scope

2. **"Google access token not available" error:**
   - Re-authenticate with Google to get a fresh token
   - Make sure the OAuth consent screen includes the Contacts scope

3. **"Failed to fetch contacts from Google" error:**
   - Check that the People API is enabled in Google Cloud Console
   - Verify the OAuth client configuration

## Security Notes

- The integration uses read-only access to contacts (`contacts.readonly` scope)
- Contact data is not stored in the database - it's fetched on-demand
- All API calls require authentication
- The Google access token is obtained through Supabase OAuth flow

## Next Steps

1. **Template System:** Create a template system that can map contact fields to PDF form placeholders
2. **Form Generation:** Build the form generation logic that uses selected contact data
3. **PDF Generation:** Integrate with PDF generation to create filled forms

## Files Modified

- `src/pages/api/google/contacts.ts` - New API endpoint
- `src/pages/api/auth/signin.ts` - Updated OAuth scopes
- `src/pages/test-google-contacts.astro` - Test page
- `src/components/project/PDFSystem.astro` - Already configured for Google Contacts
