# 🎤 Voice Assistant Setup Guide

This guide will help you set up the Vapi.ai voice assistant for phone-based appointment booking.

## 🎯 **What You'll Have**

- **Phone number** that customers can call
- **AI assistant** that answers and books appointments
- **Natural conversation** flow for scheduling
- **Automatic integration** with your Cal.com instance

---

## **Step 1: Get Vapi.ai API Key** 🔑

1. Go to [https://dashboard.vapi.ai/](https://dashboard.vapi.ai/)
2. Sign up/login to your account
3. Navigate to **Settings > API Keys**
4. Create a new API key
5. Copy the key (starts with `vapi_` or similar)

## **Step 2: Update Environment Variables** ⚙️

Add to your `.env` file:

```bash
# Vapi.ai Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_WEBHOOK_SECRET=your_webhook_secret_here
VAPI_ASSISTANT_ID=your_assistant_id_here
```

## **Step 3: Configure Vapi.ai Assistant** 🤖

Run the setup script:

```bash
node scripts/vapi-assistant-config.js
```

This will:

- Create a new assistant in Vapi.ai
- Configure it for appointment booking
- Set up webhook endpoints
- Return an assistant ID

**Save the assistant ID** and add it to your `.env` file.

## **Step 4: Set Up Phone Number** 📞

### Option A: Use Vapi.ai's Built-in Phone Numbers

1. Go to [Vapi.ai Dashboard > Phone Numbers](https://dashboard.vapi.ai/phone-numbers)
2. Purchase a phone number
3. Assign your assistant to the number
4. Test by calling the number

### Option B: Use Twilio (Recommended)

1. **Get Twilio Credentials:**
   - Go to [Twilio Console](https://console.twilio.com/)
   - Get your Account SID and Auth Token
   - Purchase a phone number

2. **Add to Environment:**

   ```bash
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

3. **Configure in Vapi.ai:**
   - Go to Vapi.ai Dashboard > Phone Numbers
   - Add your Twilio credentials
   - Assign your assistant

## **Step 5: Test the System** 🧪

1. **Visit the testing page:**

   ```
   http://localhost:4321/voice-test
   ```

2. **Check system status:**
   - Click "Check Assistant Status"
   - Verify all components are green

3. **Test voice assistant:**
   - Click "Test Voice Assistant"
   - Should show success message

4. **Call your phone number:**
   - Call the number you configured
   - Test the conversation flow
   - Try booking an appointment

---

## **🎤 How It Works**

### **Customer Experience:**

1. **Customer calls** your phone number
2. **AI assistant answers** with friendly greeting
3. **Natural conversation** about scheduling preferences
4. **AI finds available times** and suggests options
5. **Customer confirms** their choice
6. **Appointment is created** automatically in Cal.com
7. **Confirmation sent** via email/SMS

### **Example Conversation:**

```
AI: "Hi! I'm here to help you schedule a demo. What day works best for you?"

Customer: "How about next Tuesday?"

AI: "Great! I have Tuesday the 14th available at 2pm or 4pm. Which works better?"

Customer: "2pm sounds perfect."

AI: "Excellent! I've got you down for Tuesday the 14th at 2pm. What's your name and email?"

Customer: "John Smith, john@company.com"

AI: "Perfect! I've sent you a calendar invite. You'll receive a confirmation email shortly. Is there anything else I can help you with?"
```

---

## **🔧 Troubleshooting**

### **Assistant Not Working:**

- Check API key is correct
- Verify assistant ID in .env
- Run the configuration script again

### **Phone Number Issues:**

- Ensure Twilio credentials are correct
- Check phone number is active in Twilio
- Verify webhook URLs are accessible

### **Appointment Creation Fails:**

- Check Cal.com integration
- Verify webhook endpoints
- Check database connection

---

## **📞 Production Deployment**

### **Update Environment Variables:**

```bash
SITE_URL=https://your-domain.com
VAPI_WEBHOOK_SECRET=your_production_secret
```

### **Configure Webhooks:**

- Update webhook URLs to production domain
- Test all endpoints are accessible
- Verify SSL certificates

### **Monitor Performance:**

- Check Vapi.ai dashboard for call logs
- Monitor appointment creation success rate
- Set up alerts for failures

---

## **🎯 Next Steps**

1. **Get your Vapi.ai API key**
2. **Run the configuration script**
3. **Set up a phone number**
4. **Test the complete flow**
5. **Deploy to production**

Your voice-powered appointment booking system will be ready! 🚀
