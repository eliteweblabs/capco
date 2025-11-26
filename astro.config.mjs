import { defineConfig } from "astro/config";
// import node from "@astrojs/node";
// import solidJs from "@astrojs/solid-js";

// @ts-check
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

// Load environment variables
import { loadEnv } from "vite";
import { hexToRgb } from "./src/lib/color-utils.ts";

const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");

// Generate RGB version of primary color automatically
const primaryColor = env.GLOBAL_COLOR_PRIMARY || "#825BDD";
const primaryColorRgb = hexToRgb(primaryColor);

// https://astro.build/config
export default defineConfig({
  site: env.RAILWAY_PUBLIC_DOMAIN?.startsWith("http")
    ? env.RAILWAY_PUBLIC_DOMAIN
    : `https://${env.RAILWAY_PUBLIC_DOMAIN || "capcofire.com"}`, // Set your production domain
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [tailwind(), react()],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Server configuration
  server: {
    host: true, // Allow network access in development
    port: process.env.PORT ? parseInt(process.env.PORT) : 4321,
    ...(process.env.NODE_ENV === "development" && {
      allowedHosts: ["capco-fire-dev.loca.lt", ".loca.lt"],
    }),
  },
  // Ensure proper CI building
  vite: {
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
      // Environment variables in alphabetical order
      "process.env.ANTHROPIC_API_KEY": JSON.stringify(env.ANTHROPIC_API_KEY || ""),
      // "process.env.BIRD_ACCESS_KEY": JSON.stringify(env.BIRD_ACCESS_KEY),
      // "process.env.BIRD_IDENTITY_SIGNING_KEY": JSON.stringify(env.BIRD_IDENTITY_SIGNING_KEY),
      // "process.env.BIRD_ISSUER": JSON.stringify(env.BIRD_ISSUER),
      // "process.env.BIRD_ORIGIN": JSON.stringify(env.BIRD_ORIGIN),
      // "process.env.CHAT_PORT": JSON.stringify(env.CHAT_PORT),
      "process.env.COMPANY_LOGO_DARK": JSON.stringify(env.COMPANY_LOGO_DARK),
      "process.env.COMPANY_LOGO_LIGHT": JSON.stringify(env.COMPANY_LOGO_LIGHT),
      "process.env.EMAIL_API_KEY": JSON.stringify(env.EMAIL_API_KEY),
      // "process.env.EMAIL_LOGO_LIGHT": JSON.stringify(env.EMAIL_LOGO_LIGHT),
      "process.env.EMAIL_PROVIDER": JSON.stringify(env.EMAIL_PROVIDER),
      // "process.env.FALLBACK_MODE": JSON.stringify(env.FALLBACK_MODE),
      "process.env.FROM_EMAIL": JSON.stringify(env.FROM_EMAIL),
      "process.env.FROM_NAME": JSON.stringify(env.FROM_NAME),
      "process.env.RAILWAY_PROJECT_NAME": JSON.stringify(env.RAILWAY_PROJECT_NAME),
      "process.env.GOOGLE_MAPS_API_KEY": JSON.stringify(env.GOOGLE_MAPS_API_KEY),
      "process.env.GOOGLE_PLACES_API_KEY": JSON.stringify(env.GOOGLE_PLACES_API_KEY),
      "process.env.GOOGLE_PLACES_API_SECRET_KEY": JSON.stringify(env.GOOGLE_PLACES_API_SECRET_KEY),
      "process.env.MAILGUN_API": JSON.stringify(env.MAILGUN_API),
      "process.env.MAILGUN_BASE_URL": JSON.stringify(env.MAILGUN_BASE_URL),
      "process.env.MAILGUN_SANDBOX_DOMAIN": JSON.stringify(env.MAILGUN_SANDBOX_DOMAIN),
      "process.env.MAILGUN_WEBHOOK_SIGNING_KEY": JSON.stringify(env.MAILGUN_WEBHOOK_SIGNING_KEY),
      "process.env.GLOBAL_COLOR_PRIMARY": JSON.stringify(env.GLOBAL_COLOR_PRIMARY),
      "process.env.PUBLIC_GOOGLE_MAPS_API_KEY": JSON.stringify(env.PUBLIC_GOOGLE_MAPS_API_KEY),
      "process.env.PUBLIC_SUPABASE_URL": JSON.stringify(env.PUBLIC_SUPABASE_URL),
      // New Supabase API keys (preferred)
      "process.env.PUBLIC_SUPABASE_PUBLISHABLE": JSON.stringify(env.PUBLIC_SUPABASE_PUBLISHABLE),
      "process.env.SUPABASE_SECRET": JSON.stringify(env.SUPABASE_SECRET),
      // Legacy keys (fallback for backwards compatibility)
      "process.env.PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(env.PUBLIC_SUPABASE_ANON_KEY),
      "process.env.SUPABASE_ADMIN_KEY": JSON.stringify(env.SUPABASE_ADMIN_KEY),
      "process.env.STRIPE_PUBLISHABLE_KEY": JSON.stringify(env.STRIPE_PUBLISHABLE_KEY),
      "process.env.RESEND_WEBHOOK_SECRET": JSON.stringify(env.RESEND_WEBHOOK_SECRET),
      "process.env.GLOBAL_COLOR_SECONDARY": JSON.stringify(env.GLOBAL_COLOR_SECONDARY),
      "process.env.RAILWAY_PUBLIC_DOMAIN": JSON.stringify(
        env.RAILWAY_PUBLIC_DOMAIN || "https://capcofire.com"
      ),
      "process.env.STRIPE_DOMAIN_ID": JSON.stringify(env.STRIPE_DOMAIN_ID),
      "process.env.STRIPE_SECRET_KEY": JSON.stringify(env.STRIPE_SECRET_KEY),
      "process.env.YEAR": JSON.stringify(env.YEAR),
    },
  },
});
