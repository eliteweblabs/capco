# Voice AI Pipeline Setup Guide

## Overview

This guide sets up a complete voice AI pipeline for your fire protection system:

**Incoming Call → MessageBird → Webhook → n8n → Claude → ElevenLabs → MessageBird → Caller**

## Architecture

```
[Caller] → [MessageBird Voice] → [Your Webhook] → [n8n] → [Claude AI] → [ElevenLabs] → [MessageBird] → [Caller]
```

## Prerequisites

1. **MessageBird Account** with Voice API access
2. **n8n Instance** (self-hosted or cloud)
3. **Claude API Key** (Anthropic)
4. **ElevenLabs API Key**
5. **Your CAPCo Fire Protection System** (already configured)

## Step 1: MessageBird Voice Setup

### 1.1 Get MessageBird Credentials

1. Go to [MessageBird Dashboard](https://dashboard.messagebird.com/)
2. Navigate to **API Access** → **API Keys**
3. Create a new API key with Voice permissions
4. Get your **Workspace ID** from the dashboard

### 1.2 Configure Environment Variables

Add to your `.env` file:

```bash
# MessageBird Configuration
BIRD_ACCESS_KEY=your_messagebird_access_key
BIRD_WORKSPACE_ID=your_workspace_id
BIRD_IDENTITY_SIGNING_KEY=your_signing_key
BIRD_ISSUER=your_issuer
BIRD_ORIGIN=your_origin

# n8n Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/voice-ai
N8N_WEBHOOK_TOKEN=your_n8n_webhook_token
```

### 1.3 Create Voice Connector

1. Go to your admin panel: `/admin/voice-channels`
2. Create a new voice connector with your phone number ID
3. Note the **Channel ID** - you'll need this for n8n

## Step 2: n8n Workflow Setup

### 2.1 Create n8n Workflow

Create a new workflow in n8n with these nodes:

```
[Webhook] → [HTTP Request] → [Claude] → [ElevenLabs] → [HTTP Request] → [Response]
```

### 2.2 Webhook Node Configuration

- **HTTP Method**: POST
- **Path**: `/webhook/voice-ai`
- **Authentication**: Bearer Token (use N8N_WEBHOOK_TOKEN)

### 2.3 Claude AI Node Configuration

**Node Type**: HTTP Request
**Method**: POST
**URL**: `https://api.anthropic.com/v1/messages`
**Headers**:

```json
{
  "x-api-key": "your_claude_api_key",
  "Content-Type": "application/json",
  "anthropic-version": "2023-06-01"
}
```

**Body**:

```json
{
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 1000,
  "messages": [
    {
      "role": "user",
      "content": "You are a fire protection system AI assistant. The caller said: {{ $json.transcript }}. Respond professionally and helpfully."
    }
  ]
}
```

### 2.4 ElevenLabs Node Configuration

**Node Type**: HTTP Request
**Method**: POST
**URL**: `https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID`
**Headers**:

```json
{
  "xi-api-key": "your_elevenlabs_api_key",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "text": "{{ $json.content }}",
  "model_id": "eleven_monolingual_v1",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.5
  }
}
```

### 2.5 Response Node Configuration

**Node Type**: HTTP Request
**Method**: POST
**URL**: `https://api.bird.com/v1/calls/{{ $json.callId }}/talk`
**Headers**:

```json
{
  "Authorization": "AccessKey your_messagebird_access_key",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "text": "{{ $json.response_text }}",
  "voiceName": "Amy"
}
```

## Step 3: Test the Pipeline

### 3.1 Test Webhook Endpoint

```bash
curl -X GET https://capcofire.com/api/webhook/incoming-call
```

Should return: "MessageBird Voice webhook endpoint is working!"

### 3.2 Test n8n Webhook

```bash
curl -X POST https://your-n8n-instance.com/webhook/voice-ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_n8n_webhook_token" \
  -d '{
    "callId": "test-call-123",
    "from": "+1234567890",
    "to": "+0987654321",
    "conversationId": "test-conversation",
    "source": "messagebird"
  }'
```

### 3.3 Make a Test Call

1. Call your MessageBird phone number
2. The system should:
   - Answer with initial greeting
   - Record your voice
   - Process through n8n → Claude → ElevenLabs
   - Respond with AI-generated voice

## Step 4: Fire Protection System Integration

### 4.1 Customize Claude Prompts

Update the Claude node in n8n to include fire protection context:

```json
{
  "role": "user",
  "content": "You are CAPCo Fire Protection Systems AI assistant. You help with fire protection system inquiries, project status, and technical support. The caller said: {{ $json.transcript }}. Respond professionally and helpfully. If they ask about project status, direct them to check their project dashboard."
}
```

### 4.2 Add Project Context

Modify the webhook to include project context:

```javascript
// In your webhook handler
const n8nPayload = {
  callId,
  from,
  to,
  conversationId,
  timestamp: new Date().toISOString(),
  source: "messagebird",
  webhookData: body,
  // Add fire protection context
  systemContext: {
    company: "CAPCo Fire Protection Systems",
    services: ["Fire Alarm Systems", "Sprinkler Systems", "Fire Suppression"],
    supportHours: "24/7 Emergency Support",
  },
};
```

## Step 5: Monitoring and Debugging

### 5.1 Check Webhook Logs

Monitor your webhook logs:

```bash
# Check webhook endpoint
curl -X GET https://capcofire.com/api/webhook/incoming-call

# Check recording webhook
curl -X POST https://capcofire.com/api/webhook/voice-recording \
  -H "Content-Type: application/json" \
  -d '{"recording_url": "test", "callId": "test"}'
```

### 5.2 n8n Workflow Monitoring

1. Check n8n execution logs
2. Monitor webhook triggers
3. Verify Claude API responses
4. Check ElevenLabs audio generation

### 5.3 MessageBird Dashboard

1. Monitor call logs in MessageBird dashboard
2. Check webhook delivery status
3. Verify phone number configuration

## Troubleshooting

### Common Issues

1. **Webhook not receiving calls**
   - Check MessageBird webhook configuration
   - Verify SSL certificate
   - Check firewall settings

2. **n8n not triggering**
   - Verify webhook URL
   - Check authentication token
   - Monitor n8n logs

3. **Claude API errors**
   - Check API key
   - Verify request format
   - Check rate limits

4. **ElevenLabs audio issues**
   - Check API key
   - Verify voice ID
   - Check audio format

### Debug Commands

```bash
# Test webhook connectivity
curl -X GET https://capcofire.com/api/webhook/incoming-call

# Test n8n webhook
curl -X POST https://your-n8n-instance.com/webhook/voice-ai \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check MessageBird API
curl -X GET https://api.bird.com/workspaces/YOUR_WORKSPACE_ID/connectors \
  -H "Authorization: AccessKey YOUR_ACCESS_KEY"
```

## Security Considerations

1. **Webhook Authentication**: Use JWT tokens for webhook security
2. **API Key Management**: Store API keys securely
3. **Rate Limiting**: Implement rate limiting for webhooks
4. **SSL/TLS**: Ensure all communications are encrypted

## Cost Optimization

1. **Claude API**: Use appropriate model for your needs
2. **ElevenLabs**: Choose cost-effective voice models
3. **MessageBird**: Monitor call volume and costs
4. **n8n**: Optimize workflow execution

## Next Steps

1. **Customize AI Responses**: Train Claude on your specific fire protection knowledge
2. **Add Project Integration**: Connect voice calls to project management system
3. **Implement Call Routing**: Route calls based on inquiry type
4. **Add Analytics**: Track call metrics and AI performance
5. **Scale Infrastructure**: Prepare for increased call volume

## Support

For technical support with this setup:

1. Check webhook logs in your application
2. Monitor n8n workflow executions
3. Review MessageBird dashboard for call status
4. Test individual components (Claude, ElevenLabs) separately

The voice AI pipeline is now ready to handle fire protection system inquiries with professional AI assistance!
