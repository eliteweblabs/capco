import Stripe from "stripe";

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

// Stripe configuration for client-side
export const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
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
