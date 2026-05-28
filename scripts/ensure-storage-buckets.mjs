#!/usr/bin/env node
/**
 * Ensure required Supabase Storage buckets exist (idempotent).
 * Uses SUPABASE_SECRET + PUBLIC_SUPABASE_URL from .env (via Vite loadEnv).
 *
 * Usage: node scripts/ensure-storage-buckets.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";

const env = { ...process.env, ...loadEnv(process.env.NODE_ENV || "development", process.cwd(), "") };
const supabaseUrl = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URI;
const serviceKey = env.SUPABASE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    "Missing PUBLIC_SUPABASE_URL and SUPABASE_SECRET (or SUPABASE_SERVICE_ROLE_KEY) in environment"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Buckets used by the app — id must match storage.from(id) calls. */
const REQUIRED_BUCKETS = [
  { id: "project-media", public: true },
  { id: "project-marketing", public: true },
  { id: "deliverable-templates", public: false },
  { id: "ai-chat-images", public: true },
  { id: "contact-files", public: true },
  { id: "avatars", public: true },
];

async function main() {
  const { data: existing, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Failed to list buckets:", listError.message);
    process.exit(1);
  }

  const existingIds = new Set((existing || []).map((b) => b.id));
  console.log(`Project: ${supabaseUrl}`);
  console.log(`Existing buckets: ${[...existingIds].sort().join(", ") || "(none)"}`);

  let created = 0;
  for (const bucket of REQUIRED_BUCKETS) {
    if (existingIds.has(bucket.id)) {
      console.log(`  ✓ ${bucket.id} (already exists)`);
      continue;
    }
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
    });
    if (error) {
      console.error(`  ✗ ${bucket.id}: ${error.message}`);
      process.exit(1);
    }
    console.log(`  + ${bucket.id} (created, public=${bucket.public})`);
    created++;
  }

  console.log(created ? `\nCreated ${created} bucket(s).` : "\nAll required buckets already exist.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
