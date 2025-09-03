// import { defineConfig } from "astro/config";
// import node from "@astrojs/node";
// import tailwind from "@astrojs/tailwind";
// import solidJs from "@astrojs/solid-js";

// // https://astro.build/config
// export default defineConfig({
//   site: "https://astro-supabase-auth.vercel.app",
//   output: "server",
//   adapter: node({
//     mode: "standalone",
//   }),
//   integrations: [tailwind(), solidJs()],
// });

// @ts-check
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// Load environment variables
import { loadEnv } from "vite";
const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");

// https://astro.build/config
export default defineConfig({
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
      // Ensure environment variables are available in server context
      "process.env.EMAIL_PROVIDER": JSON.stringify(env.EMAIL_PROVIDER),
      "process.env.EMAIL_API_KEY": JSON.stringify(env.EMAIL_API_KEY),
      "process.env.FROM_EMAIL": JSON.stringify(env.FROM_EMAIL),
      "process.env.FROM_NAME": JSON.stringify(env.FROM_NAME),
      "process.env.GOOGLE_MAPS_API_KEY": JSON.stringify(env.GOOGLE_MAPS_API_KEY),
      // Stripe environment variables
      "process.env.STRIPE_SECRET_KEY": JSON.stringify(env.STRIPE_SECRET_KEY),
      "process.env.STRIPE_PUBLISHABLE_KEY": JSON.stringify(env.PUBLIC_STRIPE_PUBLISHABLE_KEY),
    },
  },
});
