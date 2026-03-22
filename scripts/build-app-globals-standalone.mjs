#!/usr/bin/env node
/**
 * Bundle app-globals.ts into public/scripts/app-globals.js so it loads reliably in production.
 * Fixes 404 for Astro dynamic chunks and "Cannot use import statement outside a module" errors.
 * Run: node scripts/build-app-globals-standalone.mjs (or npm run build:app-globals)
 */
import * as esbuild from "esbuild";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "scripts");
const outFile = join(root, "public", "scripts", "app-globals.js");
const entry = join(root, "src", "scripts", "app-globals.ts");
const contentStub = join(root, "src", "lib", "content-browser-stub.ts");

const loaded = loadEnv(process.env.NODE_ENV || "production", root, "");
const env = { ...process.env, ...loaded };

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

/** Redirect server-only content.ts to browser stub (content uses fs/path) */
const contentStubPlugin = {
  name: "content-stub",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      const norm = args.path.replace(/\.ts$/, "").replace(/\\/g, "/");
      const isContent = norm === "content" || norm.endsWith("/content") || norm.endsWith("lib/content");
      if (isContent && args.importer?.includes("src/")) {
        return { path: contentStub };
      }
    });
  },
};

await esbuild
  .build({
    entryPoints: [entry],
    bundle: true,
    platform: "browser",
    format: "iife",
    outfile: outFile,
    minify: true,
    sourcemap: false,
    target: "es2020",
    plugins: [contentStubPlugin],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.STRIPE_PUBLISHABLE_KEY": JSON.stringify(
        env.STRIPE_PUBLISHABLE_KEY || env.PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
      ),
      "import.meta.env.PUBLIC_SUPABASE_URL": JSON.stringify(env.PUBLIC_SUPABASE_URL || ""),
      "import.meta.env.SUPABASE_URI": JSON.stringify(env.SUPABASE_URI || ""),
      "import.meta.env.SUPABASE_SECRET": JSON.stringify(env.SUPABASE_SECRET || ""),
    },
  })
  .catch((err) => {
    console.error("[build-app-globals]", err);
    process.exit(1);
  });

console.log("[build-app-globals] Wrote", outFile);
