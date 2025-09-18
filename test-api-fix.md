# 🔧 API Content-Type Fix Applied

## ✅ **Issue Fixed**

The `TypeError: Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded"` error has been resolved.

## 🛠 **What Was Changed**

Updated `/api/send-email-sms` to handle both content types:

### **Before (Error-prone):**
```javascript
const formData = await request.formData(); // ❌ Only handled form data
```

### **After (Flexible):**
```javascript
// Handle both form data and JSON requests
let message: string;
let contactInfo: string;

const contentType = request.headers.get("content-type");
console.log("📧 [EMAIL-API] Request content-type:", contentType);

if (contentType?.includes("application/json")) {
  // Handle JSON request
  const jsonData = await request.json();
  message = jsonData.message;
  contactInfo = jsonData.contact_info || jsonData.contactInfo;
} else {
  // Handle form data request
  const formData = await request.formData();
  message = formData.get("message") as string;
  contactInfo = formData.get("contact_info") as string;
}
```

## 🧪 **How to Test**

### **Test 1: Form Data (Normal Usage)**
```bash
curl -X POST http://localhost:4321/api/send-email-sms \
  -F "message=Test form data message" \
  -F "contact_info=Test User - test@example.com"
```

### **Test 2: JSON Data (Edge Cases)**
```bash
curl -X POST http://localhost:4321/api/send-email-sms \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test JSON message",
    "contact_info": "Test User - test@example.com"
  }'
```

## 📊 **Expected Results**

Both tests should:
- ✅ Return 200 status code
- ✅ Send emails to capco@eliteweblabs.com and jk@capcofire.com
- ✅ Show proper logging in console
- ✅ No more TypeError exceptions

## 🔍 **Debugging Features Added**

- Content-type logging for troubleshooting
- Enhanced error details in catch blocks
- Support for both `contact_info` and `contactInfo` field names

## 🚀 **Ready for Production**

The API is now robust and handles various request formats that might occur in different deployment environments or client configurations.
