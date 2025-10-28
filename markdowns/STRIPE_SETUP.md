# Stripe Payment Integration Setup

## Overview

This project now includes Stripe payment processing with support for:

- ✅ Credit/Debit Cards
- ✅ Apple Pay
- ✅ Google Pay
- ✅ Link Pay (Venmo-like payments)

## Environment Variables Required

Add these to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## Stripe Dashboard Setup

1. **Create a Stripe Account**
   - Go to [stripe.com](https://stripe.com) and create an account
   - Complete your business verification

2. **Get Your API Keys**
   - Go to Stripe Dashboard → Developers → API Keys
   - Copy your **Publishable Key** and **Secret Key**
   - Use test keys for development, live keys for production

3. **Enable Payment Methods**
   - Go to Stripe Dashboard → Settings → Payment Methods
   - Enable the payment methods you want to support:
     - ✅ Cards
     - ✅ Apple Pay
     - ✅ Google Pay
     - ✅ Link (for Venmo-like payments)

4. **Apple Pay Setup** (Optional)
   - Go to Stripe Dashboard → Settings → Payment Methods → Apple Pay
   - Register your domain
   - Download and install the Apple Pay certificate

5. **Google Pay Setup** (Optional)
   - Go to Stripe Dashboard → Settings → Payment Methods → Google Pay
   - Configure your Google Pay merchant ID

## Features Implemented

### API Endpoints

- `POST /api/create-payment-intent` - Creates Stripe payment intents
- `POST /api/confirm-payment` - Confirms payments and updates invoice status

### Payment Form Component

- `src/components/PaymentForm.astro` - Complete payment form with multiple payment methods
- Automatically detects available payment methods
- Handles payment processing and error states
- Updates invoice status after successful payment

### Invoice Integration

- Payment form appears on invoice pages when status is 'sent'
- Shows payment success/error messages
- Updates project status after payment (status 90: "Deposit Invoice Paid")

## Testing

### Test Card Numbers

Use these test card numbers in development:

- **Visa**: `4242424242424242`
- **Mastercard**: `5555555555554444`
- **American Express**: `378282246310005`
- **Declined Card**: `4000000000000002`

### Test Payment Methods

- **Apple Pay**: Works on Safari with Apple Pay enabled
- **Google Pay**: Works on Chrome with Google Pay enabled
- **Link**: Works on supported browsers with Link enabled

## Production Deployment

1. **Switch to Live Keys**
   - Replace test keys with live keys in production
   - Update environment variables

2. **Webhook Setup** (Recommended)
   - Set up webhooks in Stripe Dashboard
   - Handle payment events server-side
   - Add webhook endpoint: `POST /api/stripe-webhook`

3. **SSL Certificate**
   - Ensure your domain has SSL (required for Apple Pay/Google Pay)
   - Update Apple Pay/Google Pay domain registration

## Security Notes

- ✅ Stripe handles all sensitive payment data
- ✅ No credit card data stored in your database
- ✅ PCI compliance handled by Stripe
- ✅ Secure payment processing with 3D Secure

## Troubleshooting

### Common Issues

1. **"Failed to load Stripe"**
   - Check your `STRIPE_PUBLISHABLE_KEY` environment variable
   - Ensure the key is correct and not empty

2. **"Payment failed"**
   - Check Stripe Dashboard for detailed error logs
   - Verify your secret key is correct
   - Test with different payment methods

3. **Apple Pay/Google Pay not showing**
   - Ensure you're on HTTPS in production
   - Check browser compatibility
   - Verify domain registration in Stripe Dashboard

### Debug Mode

Add this to see detailed Stripe logs:

```javascript
// In your payment form
console.log("Stripe loaded:", !!stripe);
console.log("Payment intent created:", clientSecret);
```

## Next Steps

1. **Add Webhook Support** - Handle payment events server-side
2. **Email Notifications** - Send payment confirmations
3. **Refund Support** - Add refund functionality
4. **Subscription Support** - For recurring payments
5. **Multi-Currency** - Support different currencies

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe Discord](https://discord.gg/stripe)
