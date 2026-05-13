#!/usr/bin/env node
/**
 * One-shot wipe of media: empties the listed Supabase storage buckets and
 * the public.files row index. Reads SUPABASE creds from .env.
 *
 * Usage: node scripts/wipe-media.mjs
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { readFileSync, existsSync } from "fs";

dotenv.config();

const PATHS_FILE = process.env.WIPE_MEDIA_PATHS_FILE || "/tmp/wipe-media/paths.json";
const PRELISTED_PATHS = existsSync(PATHS_FILE)
  ? JSON.parse(readFileSync(PATHS_FILE, "utf-8"))
  : null;

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET;

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.error("Missing PUBLIC_SUPABASE_URL or SUPABASE_SECRET in .env");
  process.exit(1);
}

const BUCKETS = ["project-media", "ai-chat-images"];

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Enumerate every object in a bucket by querying storage.objects directly.
 * supabase-js .list("") returns empty under storage RLS even with the service
 * role key on some projects, so we bypass it by reading the table via PostgREST
 * over the storage schema-less REST endpoint isn't exposed; use the Postgres
 * REST API instead via supabase.rpc isn't available either, so use SQL via
 * the supabase-js .from() on a custom view? Simplest: hit the REST query
 * endpoint directly for storage.objects.
 */
async function listAllPaths(bucket) {
  // Storage schema isn't exposed via PostgREST by default; use a fetch to the
  // Postgres /rest/v1 with schema=storage header which Supabase exposes for
  // service role. If that fails, fall back to the SDK list().
  const url = `${SUPABASE_URL}/rest/v1/objects?select=name&bucket_id=eq.${encodeURIComponent(bucket)}&limit=10000`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SECRET,
      Authorization: `Bearer ${SUPABASE_SECRET}`,
      "Accept-Profile": "storage",
    },
  });
  if (res.ok) {
    const rows = await res.json();
    return rows.map((r) => r.name);
  }
  // Fallback: SDK list — may return [] under storage RLS.
  console.warn(
    `  REST list failed (${res.status}); falling back to SDK list which may be empty under RLS.`
  );
  const collected = [];
  const walk = async (prefix) => {
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(prefix, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw new Error(`list(${bucket}, ${prefix || "/"}): ${error.message}`);
      if (!data || data.length === 0) break;
      for (const entry of data) {
        const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.id === null) await walk(fullPath);
        else collected.push(fullPath);
      }
      if (data.length < pageSize) break;
      offset += pageSize;
    }
  };
  await walk("");
  return collected;
}

async function emptyBucket(bucket) {
  console.log(`\n=== ${bucket} ===`);
  const paths = PRELISTED_PATHS?.[bucket] ?? (await listAllPaths(bucket));
  console.log(`  Found ${paths.length} object(s) ${PRELISTED_PATHS ? "(prelisted)" : "(via SDK list)"}`);
  if (paths.length === 0) return { bucket, deleted: 0 };

  // Use the Storage REST API directly with service role (bypasses storage RLS).
  // Endpoint: DELETE /storage/v1/object/{bucket}  body: { prefixes: [...paths] }
  let deleted = 0;
  let failed = 0;
  const batchSize = 100;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SECRET,
        Authorization: `Bearer ${SUPABASE_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: batch }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(
        `\n  DELETE batch [${i}..${i + batch.length}] HTTP ${res.status}: ${text.slice(0, 200)}`
      );
      failed += batch.length;
      continue;
    }
    const removed = await res.json();
    deleted += Array.isArray(removed) ? removed.length : batch.length;
    process.stdout.write(`\r  Deleted ${deleted}/${paths.length}`);
  }
  process.stdout.write("\n");
  if (failed) console.warn(`  ${failed} object(s) failed to delete`);
  return { bucket, deleted, failed };
}

async function main() {
  console.log("Supabase URL:", SUPABASE_URL);
  console.log("Buckets to empty:", BUCKETS.join(", "));

  const results = [];
  for (const b of BUCKETS) {
    try {
      results.push(await emptyBucket(b));
    } catch (err) {
      console.error(`Failed bucket ${b}:`, err.message);
      results.push({ bucket: b, error: err.message });
    }
  }

  console.log("\n=== public.files (library index) ===");
  const { count: beforeCount } = await supabase
    .from("files")
    .select("*", { count: "exact", head: true });
  console.log(`  Rows before: ${beforeCount ?? "?"}`);
  const { error: delError } = await supabase.from("files").delete().not("id", "is", null);
  if (delError) {
    console.error("  files delete failed:", delError.message);
  } else {
    const { count: afterCount } = await supabase
      .from("files")
      .select("*", { count: "exact", head: true });
    console.log(`  Rows after:  ${afterCount ?? "?"}`);
  }

  console.log("\nSummary:");
  for (const r of results) console.log(" ", r);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
