#!/usr/bin/env node

/**
 * List global media in Supabase storage (project-media/global), find duplicates
 * by base filename (ignoring timestamp prefix), and remove duplicates keeping the newest.
 * Also cleans up files table rows for removed storage objects.
 *
 * Usage:
 *   node scripts/dedupe-global-media.js           # run and delete duplicates
 *   node scripts/dedupe-global-media.js --dry-run # only report, do not delete
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "project-media";
const PREFIX = "global";
const LIMIT = 500;
const DRY_RUN = process.argv.includes("--dry-run");

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URI;
const supabaseKey = process.env.SUPABASE_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing Supabase credentials. Set PUBLIC_SUPABASE_URL and SUPABASE_SECRET (or SUPABASE_URI)."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Get base filename for deduplication: strip leading timestamp (digits + hyphen). */
function baseName(name) {
  const withoutTimestamp = name.replace(/^\d+-/, "");
  return withoutTimestamp || name;
}

async function listAllGlobalFiles() {
  const all = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(PREFIX, {
      limit: LIMIT,
      offset,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      console.error("❌ Storage list error:", error);
      throw error;
    }

    const files = (data || []).filter((f) => f.name !== ".emptyFolderPlaceholder" && f.id != null);
    all.push(...files);

    if (files.length < LIMIT) break;
    offset += LIMIT;
  }
  return all;
}

async function main() {
  console.log("📂 Listing global media in project-media/global...\n");

  const files = await listAllGlobalFiles();
  console.log(`   Found ${files.length} files.\n`);

  if (files.length === 0) {
    console.log("   Nothing to dedupe.");
    return;
  }

  // Group by base name (same logical file, different uploads — e.g. 1234-logo.png and 5678-logo.png)
  const byBase = new Map();
  for (const f of files) {
    const base = baseName(f.name);
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push({
      name: f.name,
      created_at: f.created_at,
      id: f.id,
      metadata: f.metadata,
    });
  }

  const duplicateGroups = [...byBase.entries()].filter(([, list]) => list.length > 1);
  if (duplicateGroups.length === 0) {
    console.log("✅ No duplicates found.");
    return;
  }

  console.log(`🔍 Found ${duplicateGroups.length} duplicate group(s):\n`);

  let totalToRemove = 0;
  const toRemove = []; // { path, createdAt } for storage + DB cleanup

  for (const [base, list] of duplicateGroups) {
    // Sort by created_at desc — newest first; keep first, remove rest
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const [keep, ...dupes] = list;
    console.log(
      `   "${base}" (${list.length} copies): keeping ${keep.name}, removing ${dupes.length}:`
    );
    for (const d of dupes) {
      console.log(`      - ${d.name} (${d.created_at || "no date"})`);
      totalToRemove++;
      toRemove.push({ path: `${PREFIX}/${d.name}`, name: d.name });
    }
    console.log("");
  }

  console.log(`📊 Total duplicate files to remove: ${totalToRemove}\n`);

  if (DRY_RUN) {
    console.log("🔒 Dry run — no changes made. Run without --dry-run to delete.");
    return;
  }

  for (const { path, name } of toRemove) {
    // Delete from storage
    const { error: storageErr } = await supabase.storage.from(BUCKET).remove([path]);
    if (storageErr) {
      console.warn(`   ⚠️ Storage delete failed for ${path}:`, storageErr.message);
    } else {
      console.log(`   ✅ Deleted from storage: ${path}`);
    }

    // Delete DB rows that point to this path (files table, targetLocation = global)
    const { data: rows, error: selectErr } = await supabase
      .from("files")
      .select("id")
      .eq("targetLocation", "global")
      .eq("filePath", path);

    if (!selectErr && rows && rows.length > 0) {
      const ids = rows.map((r) => r.id).filter(Boolean);
      const { error: deleteErr } = await supabase.from("files").delete().in("id", ids);
      if (deleteErr) {
        console.warn(`   ⚠️ DB delete failed for filePath ${path}:`, deleteErr.message);
      } else {
        console.log(`   ✅ Removed ${ids.length} DB row(s) for ${path}`);
      }
    }
  }

  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
