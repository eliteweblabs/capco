import Stripe from "stripe";

// Server-side Stripe instance
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// console.log("🔧 [STRIPE] Environment check:");
// console.log("STRIPE_SECRET_KEY exists:", !!stripeSecretKey);
// console.log(
//   "STRIPE_SECRET_KEY value:",
//   stripeSecretKey ? `${stripeSecretKey.substring(0, 15)}...` : "undefined"
// );
// console.log("STRIPE_SECRET_KEY starts with sk_:", stripeSecretKey?.startsWith("sk_"));
// console.log("PUBLIC_STRIPE_PUBLISHABLE_KEY exists:", !!process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY);
// console.log(
//   "All process.env keys containing STRIPE:",
//   Object.keys(process.env).filter((key) => key.includes("STRIPE"))
// );

if (!stripeSecretKey) {
  console.error("🚨 STRIPE_SECRET_KEY environment variable is not set!");
  console.error("Please add STRIPE_SECRET_KEY to your environment variables.");
} else if (!stripeSecretKey.startsWith("sk_")) {
  console.error(
    "🚨 STRIPE_SECRET_KEY should start with 'sk_' (secret key), not 'pk_' (publishable key)!"
  );
  console.error("Current value starts with:", stripeSecretKey.substring(0, 7));
}

export const stripe =
  stripeSecretKey && stripeSecretKey.startsWith("sk_")
    ? new Stripe(stripeSecretKey, {
        apiVersion: "2025-07-30.basil",
      })
    : null;

// Stripe configuration for client-side
export const stripeConfig = {
  publishableKey: process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  // Enable Apple Pay and other payment methods
  paymentMethods: {
    card: true,
    applePay: true,
    googlePay: true,
    link: true, // For Venmo-like payments
  },
};

// Payment method types we support
export const supportedPaymentMethods = ["card", "apple_pay", "google_pay", "link"] as const;

export type SupportedPaymentMethod = (typeof supportedPaymentMethods)[number];
