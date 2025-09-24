import { defineConfig } from "astro/config";
// import node from "@astrojs/node";
// import solidJs from "@astrojs/solid-js";

// @ts-check
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";

// Load environment variables
import { loadEnv } from "vite";
import { hexToRgb } from "./src/lib/color-utils.ts";

const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");

// Generate RGB version of primary color automatically
const primaryColor = env.PRIMARY_COLOR || "#825BDD";
const primaryColorRgb = hexToRgb(primaryColor);

// https://astro.build/config
export default defineConfig({
  site: env.SITE_URL || "https://capcofire.com", // Set your production domain
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [tailwind()],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Server configuration
  server: {
    host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost",
    port: process.env.PORT ? parseInt(process.env.PORT) : 4321,
    ...(process.env.NODE_ENV === "development" && {
      allowedHosts: ["d7ddd3920a86.ngrok-free.app", ".ngrok-free.app"],
    }),
  },
  // Ensure proper CI building
  vite: {
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
      // Environment variables in alphabetical order
      "process.env.BIRD_ACCESS_KEY": JSON.stringify(env.BIRD_ACCESS_KEY),
      "process.env.BIRD_IDENTITY_SIGNING_KEY": JSON.stringify(env.BIRD_IDENTITY_SIGNING_KEY),
      "process.env.BIRD_ISSUER": JSON.stringify(env.BIRD_ISSUER),
      "process.env.BIRD_ORIGIN": JSON.stringify(env.BIRD_ORIGIN),
      "process.env.CHAT_PORT": JSON.stringify(env.CHAT_PORT),
      "process.env.COMPANY_LOGO_DARK": JSON.stringify(env.COMPANY_LOGO_DARK),
      "process.env.COMPANY_LOGO_LIGHT": JSON.stringify(env.COMPANY_LOGO_LIGHT),
      "process.env.EMAIL_API_KEY": JSON.stringify(env.EMAIL_API_KEY),
      "process.env.EMAIL_LOGO_LIGHT": JSON.stringify(env.EMAIL_LOGO_LIGHT),
      "process.env.EMAIL_PROVIDER": JSON.stringify(env.EMAIL_PROVIDER),
      "process.env.FALLBACK_MODE": JSON.stringify(env.FALLBACK_MODE),
      "process.env.FROM_EMAIL": JSON.stringify(env.FROM_EMAIL),
      "process.env.FROM_NAME": JSON.stringify(env.FROM_NAME),
      "process.env.GLOBAL_COMPANY_NAME": JSON.stringify(env.GLOBAL_COMPANY_NAME),
      "process.env.GLOBAL_COMPANY_SLOGAN": JSON.stringify(env.GLOBAL_COMPANY_SLOGAN),
      "process.env.GOOGLE_MAPS_API_KEY": JSON.stringify(env.GOOGLE_MAPS_API_KEY),
      "process.env.GOOGLE_PLACES_API_KEY": JSON.stringify(env.GOOGLE_PLACES_API_KEY),
      "process.env.GOOGLE_PLACES_API_SECRET_KEY": JSON.stringify(env.GOOGLE_PLACES_API_SECRET_KEY),
      "process.env.GOOGLE_VOICE": JSON.stringify(env.GOOGLE_VOICE),
      "process.env.MAILGUN_API": JSON.stringify(env.MAILGUN_API),
      "process.env.MAILGUN_BASE_URL": JSON.stringify(env.MAILGUN_BASE_URL),
      "process.env.MAILGUN_SANDBOX_DOMAIN": JSON.stringify(env.MAILGUN_SANDBOX_DOMAIN),
      "process.env.MAILGUN_WEBHOOK_SIGNING_KEY": JSON.stringify(env.MAILGUN_WEBHOOK_SIGNING_KEY),
      "process.env.PRIMARY_COLOR": JSON.stringify(env.PRIMARY_COLOR),
      "process.env.PRIMARY_COLOR_RGB": JSON.stringify(env.PRIMARY_COLOR_RGB),
      "process.env.PUBLIC_GOOGLE_MAPS_API_KEY": JSON.stringify(env.PUBLIC_GOOGLE_MAPS_API_KEY),
      "process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY": JSON.stringify(
        env.PUBLIC_STRIPE_PUBLISHABLE_KEY
      ),
      "process.env.PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(env.PUBLIC_SUPABASE_ANON_KEY),
      "process.env.PUBLIC_SUPABASE_URL": JSON.stringify(env.PUBLIC_SUPABASE_URL),
      "process.env.RESEND_WEBHOOK_SECRET": JSON.stringify(env.RESEND_WEBHOOK_SECRET),
      "process.env.SECONDARY_COLOR": JSON.stringify(env.SECONDARY_COLOR),
      "process.env.SITE_URL": JSON.stringify(env.SITE_URL || "https://capcofire.com"),
      "process.env.STRIPE_DOMAIN_ID": JSON.stringify(env.STRIPE_DOMAIN_ID),
      "process.env.STRIPE_SECRET_KEY": JSON.stringify(env.STRIPE_SECRET_KEY),
      "process.env.SUPABASE_ANON_KEY": JSON.stringify(env.SUPABASE_ANON_KEY),
      "process.env.SUPABASE_SERVICE_ROLE_KEY": JSON.stringify(env.SUPABASE_SERVICE_ROLE_KEY),
      "process.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL),
      "process.env.YEAR": JSON.stringify(env.YEAR),
    },
  },
});
