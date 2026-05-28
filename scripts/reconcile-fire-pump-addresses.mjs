#!/usr/bin/env node
/**
 * Reconcile Fire Pump spreadsheet billing addresses → projects.
 * - authorId = client profile id
 * - projects.address = cleaned billing address
 * - projects.project (jsonb) = import meta (addresses, chronology)
 *
 * Usage:
 *   node scripts/reconcile-fire-pump-addresses.mjs           # preview
 *   node scripts/reconcile-fire-pump-addresses.mjs --execute
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const execute = process.argv.includes("--execute");
const IMPORT_TAG = "fire-pump-customers-xlsx-2026-05-27";
const SPREADSHEET_EXPORT_DATE = "2026-05-27"; // from export folder name
const DEFAULT_STATUS = 1;

const DEFAULT_XLSX = resolve(
  process.env.HOME || "",
  "Downloads/FIRE PUMP TESTING COMPANY, INC. May 27, 2026/Customers.xlsx"
);
const fileArgIdx = process.argv.indexOf("--file");
const xlsxPath =
  fileArgIdx >= 0 && process.argv[fileArgIdx + 1]
    ? resolve(process.argv[fileArgIdx + 1])
    : DEFAULT_XLSX;

function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i < 0) continue;
      const key = line.slice(0, i);
      let val = line.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  } catch {
    /* optional */
  }
  return env;
}

function normEmail(raw) {
  if (raw == null || raw === "") return null;
  let s = String(raw).trim().toLowerCase();
  if (s.includes(",")) s = s.split(",")[0].trim();
  if (!s.includes("@") || s.includes(" ")) return null;
  return s;
}

function cleanAddress(raw) {
  if (!raw) return null;
  const s = String(raw)
    .replace(/\r\n/g, "\n")
    .replace(/,?\s*USA\s*$/im, "")
    .replace(/\n+/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  return s || null;
}

function addressMeta(raw) {
  if (!raw) return null;
  const rawText = String(raw).replace(/\r\n/g, "\n").trim();
  return {
    raw: rawText,
    formatted: cleanAddress(rawText),
    lines: rawText.split("\n").map((l) => l.trim()).filter(Boolean),
  };
}

function normalizeKey(email, billingFormatted) {
  return `${email.toLowerCase()}|${billingFormatted.toLowerCase()}`;
}

/** Parse spreadsheet preserving row order for chronology. */
function loadBillingRowsFromXlsx(path) {
  const wb = XLSX.readFile(path);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headerIdx = rows.findIndex((row) => row.some((c) => String(c).trim() === "Customer"));
  if (headerIdx < 0) throw new Error("Could not find header row with 'Customer' column");

  const out = [];
  let seq = 0;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const companyName = String(row[1] ?? "").trim();
    const phone = row[2];
    const emailRaw = row[3];
    const fullName = row[4];
    const billingRaw = row[5];
    const shippingRaw = row[6];
    if (!companyName || companyName === "Customer") continue;

    const email = normEmail(emailRaw);
    const billing = addressMeta(billingRaw);
    if (!email || !billing?.formatted) continue;

    seq += 1;
    out.push({
      spreadsheetRowIndex: i + 1,
      importSequence: seq,
      email,
      companyName,
      fullName: fullName != null ? String(fullName).trim() : "",
      phone: phone != null ? String(phone).trim() : null,
      billingAddress: billing,
      shippingAddress: addressMeta(shippingRaw),
      source: "spreadsheet",
    });
  }
  return out;
}

function dedupeRows(rows) {
  const seen = new Set();
  const unique = [];
  for (const row of rows) {
    const key = normalizeKey(row.email, row.billingAddress.formatted);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
}

function buildTitle(companyName, address) {
  const co = String(companyName || "").trim();
  const base = co ? `${co} — ${address}` : address;
  return base.slice(0, 255);
}

function buildProjectMeta(row, profile) {
  return {
    importSource: IMPORT_TAG,
    spreadsheetName: row.companyName,
    spreadsheetRowIndex: row.spreadsheetRowIndex,
    importSequence: row.importSequence,
    spreadsheetExportDate: SPREADSHEET_EXPORT_DATE,
    importedAt: new Date().toISOString(),
    clientId: profile.id,
    clientEmail: profile.email,
    clientCompanyName: profile.companyName,
    clientProfileCreatedAt: profile.createdAt || null,
    contactFullName: row.fullName || null,
    phone: row.phone || profile.phone || null,
    billingAddress: row.billingAddress,
    shippingAddress: row.shippingAddress,
    addressRole: "billing",
  };
}

async function main() {
  console.log(`Reading spreadsheet: ${xlsxPath}`);
  const allRows = loadBillingRowsFromXlsx(xlsxPath);
  const rows = dedupeRows(allRows);

  const outDir = resolve(root, "scripts/data");
  mkdirSync(outDir, { recursive: true });

  const env = { ...process.env, ...loadEnv() };
  const url = env.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env");
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const emails = [...new Set(rows.map((r) => r.email))];
  const emailToProfile = new Map();
  const chunk = 50;
  for (let i = 0; i < emails.length; i += chunk) {
    const slice = emails.slice(i, i + chunk);
    const { data, error } = await sb
      .from("profiles")
      .select("id, email, companyName, phone, createdAt")
      .eq("role", "Client")
      .in("email", slice);
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    for (const p of data || []) {
      if (p.email) emailToProfile.set(String(p.email).toLowerCase(), p);
    }
  }

  const { data: existingProjects } = await sb
    .from("projects")
    .select("id, authorId, address, project");
  const existingKeys = new Set();
  for (const p of existingProjects || []) {
    if (!p.authorId || !p.address) continue;
    const prof = [...emailToProfile.values()].find((x) => x.id === p.authorId);
    const email = prof?.email?.toLowerCase();
    if (email) existingKeys.add(normalizeKey(email, cleanAddress(p.address) || p.address));
  }

  const plan = [];
  const skipped = [];

  for (const row of rows) {
    const profile = emailToProfile.get(row.email);
    if (!profile) {
      skipped.push({ ...row, reason: "no_client_profile" });
      continue;
    }
    const billing = row.billingAddress.formatted;
    const key = normalizeKey(row.email, billing);
    if (existingKeys.has(key)) {
      skipped.push({ email: row.email, companyName: row.companyName, reason: "project_exists" });
      continue;
    }
    plan.push({
      authorId: profile.id,
      email: row.email,
      address: billing,
      title: buildTitle(row.companyName, billing),
      meta: buildProjectMeta(row, profile),
      spreadsheetRowIndex: row.spreadsheetRowIndex,
      importSequence: row.importSequence,
    });
    existingKeys.add(key);
  }

  const skippedNoBilling = allRows.length - rows.length;
  const report = {
    preparedAt: new Date().toISOString(),
    spreadsheetExportDate: SPREADSHEET_EXPORT_DATE,
    spreadsheetRowsWithBillingAndEmail: allRows.length,
    uniqueBillingProjects: rows.length,
    skippedDuplicateBillingInSheet: skippedNoBilling,
    toCreate: plan.length,
    skipped,
    plan: plan.map((p) => ({
      authorId: p.authorId,
      email: p.email,
      address: p.address,
      title: p.title,
      spreadsheetRowIndex: p.spreadsheetRowIndex,
      importSequence: p.importSequence,
    })),
  };
  const reportPath = resolve(outDir, "fire-pump-address-reconciliation.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Rows with billing + email: ${allRows.length}`);
  console.log(`Unique billing projects: ${rows.length}`);
  console.log(`Projects to create: ${plan.length}`);
  console.log(`Skipped (no client / exists): ${skipped.length}`);
  console.log(`Report: ${reportPath}`);

  if (plan.length) {
    console.log("\nSample (first 5):");
    plan.slice(0, 5).forEach((p) => {
      console.log(
        `  seq ${p.importSequence} row ${p.spreadsheetRowIndex} | ${p.email} → ${p.address}`
      );
    });
  }

  if (!execute) {
    console.log("\nPreview only. Run with --execute to insert projects.");
    return;
  }

  console.log("\n--- EXECUTE: creating projects (billing → authorId) ---\n");
  let created = 0;
  let failed = 0;
  const failures = [];

  for (const p of plan) {
    const { error } = await sb.from("projects").insert({
      authorId: p.authorId,
      address: p.address,
      title: p.title,
      status: DEFAULT_STATUS,
      description: `Billing address import (${IMPORT_TAG}, row ${p.spreadsheetRowIndex})`,
      project: p.meta,
    });

    if (error) {
      failed += 1;
      failures.push({ email: p.email, address: p.address, error: error.message });
      console.error(`FAIL ${p.email}: ${error.message}`);
      continue;
    }
    created += 1;
    if (created % 20 === 0) console.log(`  … ${created} projects`);
  }

  console.log(`\nDone. Created: ${created}, Failed: ${failed}`);
  if (failures.length) {
    writeFileSync(
      resolve(outDir, "fire-pump-address-reconciliation-failures.json"),
      JSON.stringify(failures, null, 2)
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
