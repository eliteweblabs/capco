# N8N Workflows

This repository contains N8N workflows for Twilio voice AI integration.

## Structure

- `workflows/` - N8N workflow JSON files
- `credentials/` - Encrypted credential files
- `railway.json` - Railway deployment configuration

## Deployment

### Railway (Recommended)

1. Connect this repository to Railway
2. Set environment variables:
   - `N8N_BASIC_AUTH_USER=admin`
   - `N8N_BASIC_AUTH_PASSWORD=your_secure_password`
3. Deploy

### Local Development

```bash
npm install
npm run dev
```

## Workflows

- **Twilio Voice AI** - Handles incoming calls with AI responses

## Environment Variables

- `N8N_BASIC_AUTH_ACTIVE=true`
- `N8N_BASIC_AUTH_USER=admin`
- `N8N_BASIC_AUTH_PASSWORD=your_secure_password`
- `N8N_HOST=your-domain.com`
- `N8N_PORT=5678`
- `N8N_PROTOCOL=https`
- `WEBHOOK_URL=https://your-domain.com`
