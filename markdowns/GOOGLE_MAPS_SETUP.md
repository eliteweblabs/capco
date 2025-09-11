# Google Maps API Setup Guide

## Overview

This guide will help you set up the Google Maps API for the Places functionality in your Astro application.

## Prerequisites

1. A Google Cloud Platform account
2. A project in Google Cloud Console
3. Billing enabled on your Google Cloud project

## Step 1: Enable Google Places API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Library"
4. Search for "Places API"
5. Click on "Places API" and enable it
6. Also enable "Places API (New)" if available

## Step 2: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Restrict the API key to specific APIs and IP addresses for security

## Step 3: Configure Environment Variables

Create a `.env` file in your project root with the following content:

```env
# Google Maps API (for Places API)
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

Replace `your_actual_api_key_here` with the API key you created in Step 2.

## Step 4: Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to a page with the address input component
3. Click "Add Address" and try searching for an address
4. Check the browser console and server logs for any errors

## API Key Security

For production, consider:

1. **Restrict API Key**: In Google Cloud Console, restrict your API key to:
   - Specific APIs (Places API, Places API (New))
   - Specific IP addresses or HTTP referrers
   - Specific applications

2. **Environment Variables**: Never commit your `.env` file to version control

3. **Server-Side Only**: The API key is only used server-side, which is more secure than client-side usage

## Troubleshooting

### "Google Maps API key not configured" Error

- Ensure your `.env` file exists in the project root
- Verify the `GOOGLE_MAPS_API_KEY` variable is set correctly
- Restart your development server after adding the environment variable

### "API key not valid" Error

- Check that the API key is correct
- Ensure the Places API is enabled in Google Cloud Console
- Verify billing is enabled on your Google Cloud project

### "Quota exceeded" Error

- Check your Google Cloud Console for API usage and quotas
- Consider setting up billing alerts
- Review the Places API pricing

## API Usage

The Places API is used for:

- **Autocomplete**: Search suggestions as users type addresses
- **Place Details**: Get detailed information about selected places

## Cost Considerations

Google Places API has usage-based pricing:

- **Autocomplete (per session)**: $2.83 per 1,000 sessions
- **Place Details**: $3.00 per 1,000 requests

Monitor your usage in the Google Cloud Console to avoid unexpected charges.

## Support

If you encounter issues:

1. Check the Google Cloud Console for API status
2. Review the [Google Places API documentation](https://developers.google.com/maps/documentation/places/web-service)
3. Check your project's server logs for detailed error messages