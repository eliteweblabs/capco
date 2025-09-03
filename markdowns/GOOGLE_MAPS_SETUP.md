# Google Maps API Setup

This project uses Google Maps Places API for address autocomplete functionality.

## Setup Steps

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the "Places API" service
   - Create credentials (API Key)

2. **Restrict API Key (Recommended):**
   - In Google Cloud Console, go to "Credentials"
   - Click on your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API" from the dropdown
   - Under "Website restrictions", add your domain(s)

3. **Add to Environment Variables:**
   Add the API key to your `.env` file:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

4. **For Development:**
   - You can use the API key without domain restrictions for local development
   - Add `localhost` and `127.0.0.1` to website restrictions for local testing

## Features

- **Address Autocomplete**: Users get real-time address suggestions as they type
- **US Only**: Currently restricted to US addresses (configurable in component)
- **No Map Display**: Only provides autocomplete functionality, no visual map
- **Dark Mode Support**: Automatically adapts to light/dark theme
- **Mobile Friendly**: Responsive design that works on all devices
- **Async Loading**: Uses Google's recommended async loading pattern for optimal performance
- **Graceful Fallback**: Falls back to regular text input if API fails to load

## Component Usage

The address field is automatically rendered as a Google Maps Autocomplete component when:
- The field type is "component"
- The component name is "GoogleAddressAutocomplete"

Example configuration in `project-form-config.ts`:
```typescript
{
  id: "address-input",
  name: "address",
  type: "component",
  label: "Address / Title",
  component: "GoogleAddressAutocomplete",
  componentProps: {
    placeholder: "Enter project address...",
    required: true,
  },
  // ... other config
}
```

## Troubleshooting

- **"Google Maps API not ready"**: The API script is loading asynchronously
- **No suggestions**: Check API key is valid and Places API is enabled
- **Quota exceeded**: Monitor usage in Google Cloud Console
- **CORS errors**: Ensure domain is added to API key restrictions
