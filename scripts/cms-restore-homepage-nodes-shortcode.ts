#!/usr/bin/env npx tsx
/**
 * Persist `<NodesCapco />` back into the homepage cmsPages row when the CMS body has
 * `<LayoutProductCapco />` but dropped the nodes shortcode (CapcoHeroSection merge requires both).
 *
 * The app also fixes this in memory per request (see src/lib/content.ts); this script writes
 * the corrected `content` to Supabase so the DB matches reality.
 *
 * Requires: .env with PUBLIC_SUPABASE_URL + SUPABASE_SECRET (or SUPABASE_SERVICE_ROLE_KEY)
 * Multi-site: set RAILWAY_PROJECT_NAME to match the row's clientId (same filter as getPageContent).
 *
 *   npm run cms:restore-home-nodes              # dry-run: print preview only
 *   npm run cms:restore-home-nodes -- --apply # write update
 */

import dotenv from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: resolve(process.cwd(), ".env") });

function quoteClientIdForPostgrest(clientId: string): string {
  return clientId.includes(" ") || clientId.includes(",") || clientId.includes('"')
    ? `"${clientId.replace(/"/g, '""')}"`
    : clientId;
}

function insertNodesBeforeLayout(content: string): string | null {
  const body = content || "";
  if (!/\bLayoutProductCapco\b/.test(body) || /\bNodesCapco\b/.test(body)) return null;
  const marker = /<LayoutProductCapco\b/i;
  if (!marker.test(body)) return null;
  return body.replace(marker, "<NodesCapco />\n\n<LayoutProductCapco");
}

const apply = process.argv.includes("--apply");

const supabaseUrl =
  process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URI || process.env.VITE_PUBLIC_SUPABASE_URL;
const secret =
  process.env.SUPABASE_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ADMIN_KEY;

if (!supabaseUrl || !secret) {
  console.error(
    "Missing PUBLIC_SUPABASE_URL (or SUPABASE_URI) and SUPABASE_SECRET (or SUPABASE_SERVICE_ROLE_KEY) in .env"
  );
  process.exit(1);
}

const clientId = process.env.RAILWAY_PROJECT_NAME || null;
const supabase = createClient(supabaseUrl, secret, { auth: { persistSession: false } });

let query = supabase
  .from("cmsPages")
  .select("id,slug,clientId,content,isActive")
  .in("slug", ["/", "home"])
  .eq("isActive", true);

if (clientId) {
  query = query.or(`clientId.is.null,clientId.eq.${quoteClientIdForPostgrest(clientId)}`);
}

const { data: row, error } = await query
  .order("clientId", { ascending: false })
  .order("slug", { ascending: true })
  .limit(1)
  .maybeSingle();

if (error) {
  console.error("Query error:", error.message);
  process.exit(1);
}
if (!row) {
  console.log("No active cmsPages row for slug / or home (with current clientId filter). Nothing to do.");
  process.exit(0);
}

const fixed = insertNodesBeforeLayout(String(row.content ?? ""));
if (!fixed) {
  console.log(
    `Row id=${row.id} slug=${row.slug} clientId=${row.clientId ?? "null"}: already has NodesCapco or lacks LayoutProductCapco — no update needed.`
  );
  process.exit(0);
}

console.log("--- Before (snippet) ---\n", String(row.content).slice(0, 400));
console.log("\n--- After (snippet) ---\n", fixed.slice(0, 400));
console.log(`\nMode: ${apply ? "APPLY (writing to DB)" : "DRY-RUN (pass --apply to persist)"}`);

if (!apply) {
  process.exit(0);
}

const { error: upErr } = await supabase.from("cmsPages").update({ content: fixed }).eq("id", row.id);

if (upErr) {
  console.error("Update failed:", upErr.message);
  process.exit(1);
}
console.log(`\nUpdated cmsPages id=${row.id} slug=${row.slug}.`);
