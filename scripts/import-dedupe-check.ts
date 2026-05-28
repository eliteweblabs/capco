#!/usr/bin/env npx tsx
/**
 * Check a CSV import file for duplicate clients/projects before importing.
 *
 * Usage:
 *   npx tsx scripts/import-dedupe-check.ts path/to/import.csv
 *   npx tsx scripts/import-dedupe-check.ts path/to/import.csv --json
 *   npx tsx scripts/import-dedupe-check.ts path/to/import.csv --threshold 0.9
 *
 * Env: PUBLIC_SUPABASE_URL + SUPABASE_SECRET (or SUPABASE_SERVICE_ROLE_KEY) from .env
 *
 * CSV columns (any subset; header names are flexible):
 *   email, firstName, lastName, companyName, phone, role, title, address, status, sqFt, newConstruction
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  scanImportBatch,
  type ImportCandidate,
  type ImportDedupeResult,
} from "../src/lib/import-duplicate-matcher";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    const raw = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i < 0) continue;
      const key = line.slice(0, i);
      let val = line.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  } catch {
    /* optional */
  }
  return env;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return [];

  const parseRow = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  };

  const headers = parseRow(nonEmpty[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < nonEmpty.length; i++) {
    const cells = parseRow(nonEmpty[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

const HEADER_ALIASES: Record<string, keyof ImportCandidate> = {
  email: "email",
  "e-mail": "email",
  firstname: "firstName",
  "first name": "firstName",
  first: "firstName",
  lastname: "lastName",
  "last name": "lastName",
  last: "lastName",
  companyname: "companyName",
  company: "companyName",
  "company name": "companyName",
  address: "address",
  street: "address",
  "street address": "address",
  title: "title",
  project: "title",
  "project title": "title",
};

function rowToCandidate(row: Record<string, string>, rowIndex: number): ImportCandidate {
  const candidate: ImportCandidate = { rowIndex };
  for (const [rawKey, value] of Object.entries(row)) {
    const key = rawKey.trim().toLowerCase();
    const field = HEADER_ALIASES[key];
    if (field && value.trim()) {
      (candidate as Record<string, string>)[field] = value.trim();
    }
  }
  return candidate;
}

function printHuman(results: ImportDedupeResult[]) {
  const skip = results.filter((r) => r.action === "skip");
  const review = results.filter((r) => r.action === "review");
  const create = results.filter((r) => r.action === "create");

  console.log("\n=== Import duplicate check ===\n");
  console.log(`Total rows:     ${results.length}`);
  console.log(`Skip (dup):     ${skip.length}`);
  console.log(`Review (fuzzy): ${review.length}`);
  console.log(`Create (new):   ${create.length}`);

  const show = (label: string, list: ImportDedupeResult[]) => {
    if (list.length === 0) return;
    console.log(`\n--- ${label} ---`);
    for (const r of list) {
      const row = r.candidate.rowIndex ?? "?";
      const top = r.matches[0];
      console.log(
        `Row ${row}: score ${r.bestScore.toFixed(2)}` +
          (top ? ` | ${top.field} → id ${top.existingId} (${top.reason})` : "")
      );
      if (r.candidate.email) console.log(`  email: ${r.candidate.email}`);
      if (r.candidate.address) console.log(`  address: ${r.candidate.address}`);
      const name =
        r.candidate.companyName ||
        [r.candidate.firstName, r.candidate.lastName].filter(Boolean).join(" ");
      if (name) console.log(`  name: ${name}`);
      if (top) {
        console.log(`  existing: ${top.existingValue}`);
      }
    }
  };

  show("SKIP — likely duplicates", skip);
  show("REVIEW — manual check recommended", review);
}

async function main() {
  const args = process.argv.slice(2);
  const csvPath = args.find((a) => !a.startsWith("--"));
  const jsonOut = args.includes("--json");
  const thresholdIdx = args.indexOf("--threshold");
  const duplicateThreshold =
    thresholdIdx >= 0 ? Number(args[thresholdIdx + 1]) : undefined;

  if (!csvPath) {
    console.error(
      "Usage: npx tsx scripts/import-dedupe-check.ts <file.csv> [--json] [--threshold 0.85]"
    );
    process.exit(1);
  }

  const env = { ...process.env, ...loadEnv() };
  const url = env.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing PUBLIC_SUPABASE_URL or SUPABASE_SECRET in .env");
    process.exit(1);
  }

  const csvText = readFileSync(resolve(process.cwd(), csvPath), "utf8");
  const parsed = parseCsv(csvText);
  const candidates = parsed.map((row, i) => rowToCandidate(row, i + 1));

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: profiles, error: pErr }, { data: projects, error: prErr }] =
    await Promise.all([
      sb.from("profiles").select("id, email, firstName, lastName, companyName"),
      sb.from("projects").select("id, authorId, address, title"),
    ]);

  if (pErr || prErr) {
    console.error("Supabase error:", pErr?.message || prErr?.message);
    process.exit(1);
  }

  console.log(
    `Loaded ${profiles?.length ?? 0} profiles, ${projects?.length ?? 0} projects from database.`
  );

  const options =
    duplicateThreshold !== undefined && !Number.isNaN(duplicateThreshold)
      ? { duplicateThreshold, reviewThreshold: Math.max(0.5, duplicateThreshold - 0.15) }
      : {};

  const results = scanImportBatch(candidates, {
    profiles: profiles ?? [],
    projects: projects ?? [],
  }, options);

  if (jsonOut) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printHuman(results);
  }

  const hasBlocking = results.some((r) => r.action === "skip" || r.action === "review");
  process.exit(hasBlocking ? 2 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
