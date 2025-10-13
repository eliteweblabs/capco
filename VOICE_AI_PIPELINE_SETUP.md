# 🎙️ Voice AI Pipeline Setup Guide

## Complete Pipeline: Twilio → Railway → n8n → Respond

### 🏗️ Architecture Overview

```
📞 Twilio Call → 🌐 Railway Astro App → 🤖 n8n AI → 📱 Response
```

1. **Twilio** receives incoming calls
2. **Railway Astro App** handles webhooks and forwards to n8n
3. **n8n** processes with AI (Claude + ElevenLabs)
4. **Response** sent back through Twilio

---

## 🚀 Step 1: Deploy to Railway

### Prerequisites

- Railway CLI installed: `npm install -g @railway/cli`
- Railway account created

### Deploy Commands

```bash
# 1. Login to Railway
railway login

# 2. Initialize project (if first time)
railway init

# 3. Deploy both services
railway up
```

**Or use the deployment script:**

```bash
./deploy-to-railway.sh
```

### Expected URLs After Deployment

- **Astro App**: `https://capco-fire-protection.railway.app`
- **n8n**: `https://capco-fire-protection-n8n.railway.app`

---

## 📞 Step 2: Configure Twilio

### Update Twilio Console

1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Select your phone number
3. Set **Webhook URL** to:
   ```
   https://capco-fire-protection.railway.app/api/webhook-test/bde5f8fe-9f74-4310-a01e-cff3c843fcac
   ```
4. Set **HTTP Method** to: `POST`

---

## 🤖 Step 3: Configure n8n

### Access n8n

1. Go to: `https://capco-fire-protection-n8n.railway.app`
2. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`

### Create Voice AI Workflow

1. **Create new workflow**
2. **Add webhook trigger**:
   - URL: `/webhook/voice-ai`
   - Method: `POST`

3. **Add Claude AI node**:
   - Process the incoming call data
   - Generate intelligent response

4. **Add ElevenLabs node**:
   - Convert text to speech
   - Use voice: "Drew" (as configured)

5. **Add HTTP Request node**:
   - Send response back to Twilio
   - Use Twilio API to control the call

---

## 🔧 Step 4: Environment Variables

### Set in Railway Dashboard

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# n8n Configuration
N8N_WEBHOOK_URL=https://capco-fire-protection-n8n.railway.app/webhook/voice-ai
N8N_WEBHOOK_TOKEN=your_n8n_webhook_token

# AI Services
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

---

## 🧪 Step 5: Test the Pipeline

### Test Call Flow

1. **Call your Twilio number**
2. **Check Railway logs** for webhook reception
3. **Check n8n logs** for AI processing
4. **Verify response** is sent back

### Debug Endpoints

- **Debug webhook**: `https://capco-fire-protection.railway.app/api/debug-webhook`
- **Health check**: `https://capco-fire-protection.railway.app/api/webhook-test/bde5f8fe-9f74-4310-a01e-cff3c843fcac`

---

## 🔍 Troubleshooting

### Common Issues

#### 1. 404 Error on Webhook

- ✅ **Check**: Railway deployment is complete
- ✅ **Check**: Webhook URL is correct in Twilio
- ✅ **Check**: File exists: `src/pages/api/webhook-test/bde5f8fe-9f74-4310-a01e-cff3c843fcac.ts`

#### 2. n8n Not Receiving Data

- ✅ **Check**: N8N_WEBHOOK_URL environment variable
- ✅ **Check**: n8n service is running
- ✅ **Check**: Webhook endpoint in n8n workflow

#### 3. AI Response Not Working

- ✅ **Check**: API keys are set correctly
- ✅ **Check**: n8n workflow is active
- ✅ **Check**: Claude and ElevenLabs nodes are configured

---

## 📊 Monitoring

### Railway Logs

```bash
# View Astro app logs
railway logs --service astro-app

# View n8n logs
railway logs --service n8n
```

### n8n Execution Logs

1. Go to n8n dashboard
2. Click on your workflow
3. View execution history
4. Check for errors

---

## 🎯 Expected Result

When someone calls your Twilio number:

1. **Twilio** sends webhook to Railway
2. **Railway Astro app** receives and forwards to n8n
3. **n8n** processes with AI and generates response
4. **Response** is sent back through Twilio
5. **Caller** hears the AI-generated response

---

## 🚀 Next Steps

1. **Deploy to Railway** using the commands above
2. **Update Twilio webhook URL** to your Railway domain
3. **Configure n8n workflow** with AI nodes
4. **Test the complete pipeline**
5. **Monitor and debug** as needed

Your voice AI pipeline will be fully operational! 🎉
