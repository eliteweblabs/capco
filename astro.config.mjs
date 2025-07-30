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
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: netlify(),
  integrations: [tailwind()],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Remove development-specific server config for production
  ...(process.env.NODE_ENV === "development" && {
    server: {
      allowedHosts: ["d7ddd3920a86.ngrok-free.app", ".ngrok-free.app"],
    },
  }),
});
