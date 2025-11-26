# Anthropic API Setup Guide

## Console Configuration Checklist

### Step 1: Verify API Key Access

1. **Go to Anthropic Console**
   - Visit: https://console.anthropic.com
   - Login with your account

2. **Check API Keys**
   - Go to **Settings** → **API Keys**
   - Find your API key (the one you added to Railway)
   - Check the status:
     - ✅ **Active** - Key is working
     - ⚠️ **Pending** - Key needs activation
     - ❌ **Revoked** - Key is disabled

3. **Verify Key Permissions**
   - Check if there are any restrictions on the key
   - Some keys might be limited to specific models or features

### Step 2: Check Model Access

1. **Go to Usage/Billing**
   - Check if you have access to Claude models
   - Some accounts might need to:
     - Add payment method
     - Enable model access
     - Upgrade account tier

2. **Check Available Models**
   - Go to **API** → **Models** (if available)
   - Or check **Documentation** → **Models**
   - Verify which models your account can access

### Step 3: Verify Account Status

1. **Check Account Type**
   - Free tier might have limited model access
   - Paid accounts have full access
   - Some models might require specific account types

2. **Check Billing**
   - Go to **Billing** or **Usage**
   - Ensure account is in good standing
   - Check if there are spending limits blocking API calls

### Step 4: Check Organization Settings (if applicable)

If you're using an organization account:

1. **Organization Settings**
   - Check if API keys are restricted by organization policies
   - Verify model access permissions
   - Check spending limits or quotas

### Step 5: Test API Key Directly

You can test your API key directly using curl:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-opus-20240229",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "test"}]
  }'
```

Replace `YOUR_API_KEY` with your actual key.

## Common Issues

### Issue 1: API Key Not Activated
**Symptom:** 401 Unauthorized errors  
**Fix:** Activate the API key in Anthropic console

### Issue 2: Model Not Available
**Symptom:** 404 Model not found errors  
**Possible Causes:**
- Account doesn't have access to that model
- Model name is incorrect
- Model requires paid account

**Fix:**
- Check which models your account can access
- Try different model names
- Upgrade account if needed

### Issue 3: Billing/Usage Limits
**Symptom:** API calls fail or are blocked  
**Fix:**
- Add payment method
- Check spending limits
- Verify account is in good standing

### Issue 4: Organization Restrictions
**Symptom:** API key works but models are restricted  
**Fix:**
- Check organization settings
- Contact organization admin
- Verify model access permissions

## What to Check Right Now

1. ✅ **API Key Status** - Is it active?
2. ✅ **Account Type** - Free or paid?
3. ✅ **Payment Method** - Is one added?
4. ✅ **Model Access** - Which models can you use?
5. ✅ **Usage Limits** - Any restrictions?

## Quick Test

After checking the console, test with our endpoint:
- Visit: `https://capcofire.com/api/agent/test-models`
- This will try multiple models and show which ones work

## Next Steps

1. **Check Anthropic Console** for the items above
2. **Test the API key** directly with curl (see above)
3. **Check Railway logs** for detailed error messages
4. **Try the test-models endpoint** after deployment

If all models return 404, it's likely:
- API key doesn't have model access
- Account needs upgrade/payment method
- Model names have changed

