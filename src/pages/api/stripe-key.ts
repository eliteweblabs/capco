import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    // Try all possible ways to get the Stripe publishable key
    const stripeKey =
      import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      import.meta.env.STRIPE_PUBLISHABLE_KEY ||
      process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      process.env.STRIPE_PUBLISHABLE_KEY ||
      "";

    console.log("🔧 [STRIPE-KEY API] Environment check:");
    console.log(
      "🔧 [STRIPE-KEY API] import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY:",
      !!import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
    );
    console.log(
      "🔧 [STRIPE-KEY API] import.meta.env.STRIPE_PUBLISHABLE_KEY:",
      !!import.meta.env.STRIPE_PUBLISHABLE_KEY
    );
    console.log(
      "🔧 [STRIPE-KEY API] process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY:",
      !!process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
    );
    console.log(
      "🔧 [STRIPE-KEY API] process.env.STRIPE_PUBLISHABLE_KEY:",
      !!process.env.STRIPE_PUBLISHABLE_KEY
    );
    console.log("🔧 [STRIPE-KEY API] Final key found:", !!stripeKey);

    if (!stripeKey) {
      return new Response(
        JSON.stringify({
          error: "Stripe publishable key not found",
          success: false,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!stripeKey.startsWith("pk_")) {
      return new Response(
        JSON.stringify({
          error: "Invalid Stripe key format",
          success: false,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        publishableKey: stripeKey,
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🔧 [STRIPE-KEY API] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
