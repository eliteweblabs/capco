# libphonenumber-js Integration in PhoneAndSMS Component

## Overview
The `PhoneAndSMS.astro` component now uses `libphonenumber-js` for robust phone number validation and formatting.

## Package Information
- **Package**: libphonenumber-js v1.12.35
- **Already installed**: ✅ Yes (in package.json)
- **Documentation**: https://github.com/catamphetamine/libphonenumber-js

## Implementation Details

### Files Modified
1. `/src/components/form/PhoneAndSMS.astro`
   - Imported `isValidPhoneNumber` and `AsYouType` from libphonenumber-js
   - Replaced basic 10-digit validation with proper US phone validation
   - Added automatic phone formatting as user types

### Files Used (Already Existed)
1. `/src/lib/phone-validation.ts`
   - Contains reusable validation and formatting functions
   - Can be used in other components if needed

## Features

### 1. Real-time Phone Validation
- Validates US phone numbers using libphonenumber-js
- Requires exactly 10 digits for a complete number
- Shows green checkmark indicator when valid
- Reveals SMS section only when phone is valid

### 2. Automatic Formatting
- Formats phone as user types: `(555) 123-4567`
- Removes non-digit characters automatically
- Uses `AsYouType` formatter for natural typing experience

### 3. SMS Integration
- SMS section appears only after valid phone entry
- Carrier selection auto-opens when SMS toggle enabled
- Prevents SMS signup with invalid phone numbers

## Usage Example

```astro
<PhoneAndSMS
  id="phone"
  name="phone"
  placeholder="(555) 123-4567"
  required={true}
  showSMS={true}
  smsChecked={false}
  selectedCarrier=""
  globalInputClasses="w-full px-4 py-2 border rounded"
/>
```

## Validation Logic

1. **Empty/Partial Input**: Returns false (hides SMS section)
2. **Less than 10 digits**: Returns false
3. **10+ digits**: Validates using `isValidPhoneNumber(phone, "US")`
4. **Valid format**: Shows checkmark, reveals SMS options

## Technical Notes

### Why libphonenumber-js?
- Industry-standard phone validation
- Supports international formats (configurable)
- Maintained by Google's libphonenumber project
- Lightweight JavaScript port

### Country Code
Currently hardcoded to "US" but can be changed:
```javascript
isValidPhoneNumber(phone, "US") // Change "US" to other codes
```

### Error Handling
All validation wrapped in try-catch to prevent crashes:
```javascript
try {
  return isValidPhoneNumber(phone, "US");
} catch (error) {
  console.error("[PHONE-VALIDATION] Error:", error);
  return false;
}
```

## Future Enhancements

### Potential Improvements
1. **International Support**: Add country selector
2. **Custom Formatting**: Allow different format patterns
3. **Extension Support**: Handle phone extensions
4. **Mobile Detection**: Different validation for mobile vs landline

### Example: International Support
```javascript
// Add country prop to component
interface Props {
  // ... existing props
  country?: string; // e.g., "US", "CA", "GB"
}

// Use in validation
isValidPhoneNumber(phone, country || "US");
```

## Testing

### Valid US Phone Formats
- `5551234567` → Formats to `(555) 123-4567`
- `(555) 123-4567` → Valid
- `555-123-4567` → Valid
- `+1 555 123 4567` → Valid

### Invalid Formats
- `555123` → Too short (< 10 digits)
- `55512345678` → Too long (> 11 digits)
- `abc-def-ghij` → No digits

## Dependencies

```json
{
  "libphonenumber-js": "^1.12.35"
}
```

No additional installation needed - already in project.

## Related Files
- `/src/lib/phone-validation.ts` - Reusable validation utilities
- `/src/components/form/PhoneAndSMS.astro` - Main component
- `/src/lib/sms-utils.ts` - SMS carrier utilities

## Support
For issues or questions about libphonenumber-js, see:
- [GitHub Repository](https://github.com/catamphetamine/libphonenumber-js)
- [API Documentation](https://catamphetamine.gitlab.io/libphonenumber-js/)
