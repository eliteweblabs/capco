import { defineConfig } from "astro/config";
// import node from "@astrojs/node";
// import solidJs from "@astrojs/solid-js";

// @ts-check
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// import studiocms from "studiocms"; // Disabled - not in use, causing SDK initialization errors

// Load environment variables (merge with process.env so Railway build args are available when .env is missing)
import { loadEnv } from "vite";
// import { hexToRgb } from "./src/lib/color-utils.ts";

const loaded = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const env = { ...process.env, ...loaded };

// Generate RGB version of primary color automatically
// const primaryColor = env.GLOBAL_COLOR_PRIMARY || "#825BDD";

// https://astro.build/config
export default defineConfig({
  // preserveScriptOrder was added in Astro 5.5; removed for Astro 4
  // When RAILWAY_PUBLIC_DOMAIN is unset (local dev) use localhost so URLs never switch to production
  site: env.RAILWAY_PUBLIC_DOMAIN
    ? env.RAILWAY_PUBLIC_DOMAIN.startsWith("http")
      ? env.RAILWAY_PUBLIC_DOMAIN
      : `https://${env.RAILWAY_PUBLIC_DOMAIN}`
    : "http://localhost:4321",
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [tailwind()],
  devToolbar: {
    enabled: false,
  },
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
    // When using Browsersync (page at localhost:3000), HMR client must connect to Astro dev server (4321).
    // Set DISABLE_HMR=1 when using dev:sync if you prefer Browsersync full-page reload only (no WebSocket).
    hmr:
      process.env.DISABLE_HMR === "1" ? false : { host: "localhost", port: 4321, clientPort: 4321 },
  },
  // Ensure proper CI building
  vite: {
    // Force @floating-ui/dom to resolve to dist file so it is bundled (avoids "Failed to resolve module specifier" in production)
    resolve: {
      alias: {
        "@floating-ui/dom": path.resolve(
          __dirname,
          "node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs"
        ),
      },
    },
    // es2022: required for top-level await in Astro 4 build. (Previously es2018 for iOS 12; downgrade to Astro 4 needed newer target.)
    build: {
      target: "es2022",
      rollupOptions: {
        external: (id) => {
          // gray-matter uses Node APIs – exclude from client bundle
          if (id === "gray-matter") return true;
          return false;
        },
      },
      ssr: {
        // Bundle everything for SSR – prevents ERR_MODULE_NOT_FOUND in standalone deploy
        noExternal: true,
      },
    },
    optimizeDeps: {
      include: [
        "cropperjs",
        "@floating-ui/dom",
        "@supabase/supabase-js",
        "flowbite",
        "libphonenumber-js",
        "typeit",
      ],
      // Avoid 504 Outdated Optimize Dep in dev by re-optimizing when deps change
      ...(process.env.NODE_ENV === "development" && { force: true }),
    },
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
      "process.env.COMPANY_LOGO": JSON.stringify(env.COMPANY_LOGO),
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
      // Do not default to production URL so local dev uses request origin / localhost
      "process.env.RAILWAY_PUBLIC_DOMAIN": JSON.stringify(env.RAILWAY_PUBLIC_DOMAIN || ""),
      "process.env.PUBLIC_URL": JSON.stringify(
        env.PUBLIC_URL ||
          (env.RAILWAY_PUBLIC_DOMAIN
            ? env.RAILWAY_PUBLIC_DOMAIN.startsWith("http")
              ? env.RAILWAY_PUBLIC_DOMAIN
              : `https://${env.RAILWAY_PUBLIC_DOMAIN}`
            : "")
      ),
      "process.env.STRIPE_DOMAIN_ID": JSON.stringify(env.STRIPE_DOMAIN_ID),
      "process.env.STRIPE_SECRET_KEY": JSON.stringify(env.STRIPE_SECRET_KEY),
      "process.env.YEAR": JSON.stringify(env.YEAR),
    },
  },
});
