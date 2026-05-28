#!/usr/bin/env node
/**
 * Import Fire Pump Testing customer spreadsheet → auth.users + profiles (role Client).
 *
 * Usage:
 *   node scripts/import-fire-pump-customers.mjs [--file path/to/Customers.xlsx]
 *   node scripts/import-fire-pump-customers.mjs --execute
 *   node scripts/import-fire-pump-customers.mjs --missing-emails          # preview placeholders
 *   node scripts/import-fire-pump-customers.mjs --missing-emails --execute
 *   node scripts/import-fire-pump-customers.mjs --export-deferred-projects
 *
 * Duplicate spreadsheet emails → one client profile; extra rows saved in
 * scripts/data/fire-pump-customers-deferred-projects.json for projects later.
 *
 * Default spreadsheet path (override with --file):
 *   ~/Downloads/FIRE PUMP TESTING COMPANY, INC. May 27, 2026/Customers.xlsx
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const DEFAULT_XLSX = resolve(
  process.env.HOME || "",
  "Downloads/FIRE PUMP TESTING COMPANY, INC. May 27, 2026/Customers.xlsx"
);

const execute = process.argv.includes("--execute");
const missingEmailsOnly = process.argv.includes("--missing-emails");
const exportDeferredOnly = process.argv.includes("--export-deferred-projects");
const PLACEHOLDER_EMAIL_DOMAIN = "fire-pump-import.local";
const fileArgIdx = process.argv.indexOf("--file");
const xlsxPath =
  fileArgIdx >= 0 && process.argv[fileArgIdx + 1]
    ? resolve(process.argv[fileArgIdx + 1])
    : DEFAULT_XLSX;

const IMPORT_TAG = "fire-pump-customers-xlsx-2026-05-27";

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

function normPhone(raw) {
  if (raw == null || raw === "") return null;
  let s = String(raw).replace(/^Phone:\s*/i, "").trim();
  const digits = s.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return s || null;
}

function cleanAddress(raw) {
  if (raw == null || raw === "") return null;
  return String(raw)
    .replace(/\r\n/g, "\n")
    .replace(/,\s*USA\s*$/i, "")
    .trim();
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Deterministic placeholder for spreadsheet rows with no email (update in admin later). */
function placeholderEmailForCompany(companyName, usedSlugs) {
  let base = slugify(companyName) || "client";
  let slug = base;
  let n = 2;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  usedSlugs.add(slug);
  return `fire-pump-${slug}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

function prepareMissingEmailRows(skipped) {
  const usedSlugs = new Set();
  const rows = [];
  for (const row of skipped) {
    if (row.reason !== "missing_or_invalid_email") continue;
    const email = placeholderEmailForCompany(row.companyName, usedSlugs);
    const { firstName, lastName } = splitName(row.fullName, row.companyName);
    const displayName =
      row.fullName ||
      `${firstName} ${lastName}`.trim() ||
      row.companyName;
    rows.push({
      ...row,
      email,
      placeholderEmail: true,
      firstName,
      lastName,
      displayName,
    });
  }
  return rows;
}

function splitName(fullName, companyName) {
  const full = fullName != null ? String(fullName).trim() : "";
  if (full && full.toLowerCase() !== "nan") {
    const parts = full.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: "—" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }
  const co = String(companyName || "").trim();
  if (!co) return { firstName: "Client", lastName: "Account" };
  const words = co.split(/\s+/);
  if (words.length === 1) return { firstName: "Client", lastName: words[0].slice(0, 80) };
  return { firstName: words[0].slice(0, 80), lastName: words.slice(1).join(" ").slice(0, 80) };
}

function generateSecurePassword() {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const all = lowercase + uppercase + numbers + special;
  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

function parseSpreadsheet(path) {
  const wb = XLSX.readFile(path);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headerIdx = rows.findIndex((row) =>
    row.some((c) => String(c).trim() === "Customer")
  );
  if (headerIdx < 0) throw new Error("Could not find header row with 'Customer' column");
  const dataRows = rows.slice(headerIdx + 1);
  const records = [];
  for (const row of dataRows) {
    const customer = String(row[1] ?? "").trim();
    const phoneRaw = row[2];
    const emailRaw = row[3];
    const fullName = row[4];
    const billing = row[5];
    const shipping = row[6];
    if (!customer || customer === "Customer") continue;
    records.push({
      companyName: customer,
      phone: normPhone(phoneRaw),
      email: normEmail(emailRaw),
      fullName: fullName != null ? String(fullName).trim() : "",
      billingAddress: cleanAddress(billing),
      shippingAddress: cleanAddress(shipping),
    });
  }
  return records;
}

function massageRecords(records) {
  const seenEmails = new Set();
  const ready = [];
  const skipped = [];

  for (const row of records) {
    if (!row.email) {
      skipped.push({ reason: "missing_or_invalid_email", ...row });
      continue;
    }
    if (seenEmails.has(row.email)) {
      skipped.push({ reason: "duplicate_email_in_spreadsheet", ...row });
      continue;
    }
    seenEmails.add(row.email);
    const { firstName, lastName } = splitName(row.fullName, row.companyName);
    const displayName =
      row.fullName ||
      `${firstName} ${lastName}`.trim() ||
      row.companyName;
    ready.push({
      ...row,
      firstName,
      lastName,
      displayName,
    });
  }
  return { ready, skipped };
}

/** Same email in sheet twice → first row is the client; second+ are deferred projects. */
function buildDeferredProjects(ready, skipped) {
  const emailToCanonical = new Map();
  for (const row of ready) {
    if (row.email) emailToCanonical.set(row.email, row.companyName);
  }

  const byEmail = new Map();
  for (const row of skipped) {
    if (row.reason !== "duplicate_email_in_spreadsheet" || !row.email) continue;
    const clientEmail = row.email;
    if (!byEmail.has(clientEmail)) {
      byEmail.set(clientEmail, {
        clientEmail,
        canonicalSpreadsheetName: emailToCanonical.get(clientEmail) || "(imported first)",
        projects: [],
      });
    }
    byEmail.get(clientEmail).projects.push({
      spreadsheetName: row.companyName,
      billingAddress: row.billingAddress,
      shippingAddress: row.shippingAddress,
      phone: row.phone,
      notes: "Same client email—create as project later, not a new profile.",
    });
  }

  return {
    preparedAt: new Date().toISOString(),
    policy:
      "One auth/profile per client email. Extra spreadsheet rows are sites/projects to add later—not separate clients.",
    deferred: [...byEmail.values()],
  };
}

async function createClientUsers(sb, toCreate, outDir) {
  console.log("\n--- EXECUTE: creating users (no welcome emails) ---\n");
  let created = 0;
  let failed = 0;
  const failures = [];

  for (const row of toCreate) {
    const password = generateSecurePassword();
    const { data: authData, error: authError } = await sb.auth.admin.createUser({
      email: row.email,
      password,
      email_confirm: true,
      user_metadata: {
        firstName: row.firstName,
        lastName: row.lastName,
        companyName: row.companyName,
        phone: row.phone,
        billingAddress: row.billingAddress,
        shippingAddress: row.shippingAddress,
        importSource: IMPORT_TAG,
        placeholderEmail: row.placeholderEmail === true,
      },
    });

    if (authError) {
      failed += 1;
      failures.push({ email: row.email, companyName: row.companyName, error: authError.message });
      console.error(`FAIL ${row.email}: ${authError.message}`);
      continue;
    }

    const userId = authData.user?.id;
    if (!userId) {
      failed += 1;
      failures.push({ email: row.email, error: "no user id returned" });
      continue;
    }

    const { error: profileError } = await sb.from("profiles").upsert(
      {
        id: userId,
        email: row.email,
        role: "Client",
        firstName: row.firstName,
        lastName: row.lastName,
        companyName: row.companyName,
        phone: row.phone,
        name: row.displayName,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      failed += 1;
      failures.push({ email: row.email, error: profileError.message });
      console.error(`FAIL profile ${row.email}: ${profileError.message}`);
      continue;
    }

    created += 1;
    console.log(`  OK ${row.companyName} → ${row.email}`);
  }

  console.log(`\nDone. Created: ${created}, Failed: ${failed}`);
  if (failures.length) {
    const failPath = resolve(outDir, "fire-pump-customers-import-failures.json");
    writeFileSync(failPath, JSON.stringify(failures, null, 2));
    console.log(`Failures written: ${failPath}`);
  }
  return { created, failed };
}

async function main() {
  console.log(`Reading: ${xlsxPath}`);
  const raw = parseSpreadsheet(xlsxPath);
  const { ready, skipped } = massageRecords(raw);

  const outDir = resolve(root, "scripts/data");
  mkdirSync(outDir, { recursive: true });

  if (exportDeferredOnly) {
    const deferred = buildDeferredProjects(ready, skipped);
    const deferredPath = resolve(outDir, "fire-pump-customers-deferred-projects.json");
    writeFileSync(deferredPath, JSON.stringify(deferred, null, 2));
    console.log(`Wrote ${deferred.deferred.length} client(s) with deferred project(s): ${deferredPath}`);
    for (const group of deferred.deferred) {
      console.log(`\n  ${group.clientEmail} (client: ${group.canonicalSpreadsheetName})`);
      for (const p of group.projects) {
        console.log(`    → project later: ${p.spreadsheetName}`);
      }
    }
    return;
  }

  const preparedPath = resolve(outDir, "fire-pump-customers-prepared.json");
  writeFileSync(
    preparedPath,
    JSON.stringify({ preparedAt: new Date().toISOString(), ready, skipped }, null, 2)
  );
  console.log(`Prepared JSON: ${preparedPath}`);

  let importRows = ready;
  if (missingEmailsOnly) {
    importRows = prepareMissingEmailRows(skipped);
    const mapPath = resolve(outDir, "fire-pump-customers-placeholder-emails.json");
    writeFileSync(
      mapPath,
      JSON.stringify(
        {
          preparedAt: new Date().toISOString(),
          domain: PLACEHOLDER_EMAIL_DOMAIN,
          note: "Replace placeholder emails in Admin → Users when real addresses are known.",
          rows: importRows.map((r) => ({
            companyName: r.companyName,
            placeholderEmail: r.email,
            phone: r.phone,
            fullName: r.fullName || r.displayName,
          })),
        },
        null,
        2
      )
    );
    console.log(`\n--missing-emails mode: ${importRows.length} rows with placeholder @${PLACEHOLDER_EMAIL_DOMAIN}`);
    console.log(`Placeholder map: ${mapPath}`);
    importRows.forEach((r) => {
      console.log(`  ${r.companyName}`);
      console.log(`    → ${r.email} | ${r.phone || "no phone"}`);
    });
  } else {
    console.log(`Rows in sheet (data): ${raw.length}`);
    console.log(`Ready to import: ${ready.length}`);
    console.log(`Skipped: ${skipped.length}`);
    if (skipped.length) {
      console.log("\nSkipped breakdown:");
      const byReason = skipped.reduce((acc, s) => {
        acc[s.reason] = (acc[s.reason] || 0) + 1;
        return acc;
      }, {});
      console.log(byReason);
      const missing = skipped.filter((s) => s.reason === "missing_or_invalid_email");
      if (missing.length) {
        console.log(`\n${missing.length} rows lack email — run with --missing-emails to import placeholders.`);
      }
    }
  }

  const env = { ...process.env, ...loadEnv() };
  const url = env.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("\nMissing PUBLIC_SUPABASE_URL or SUPABASE_SECRET in .env");
    process.exit(1);
  }
  const host = new URL(url).hostname;
  console.log(`\nSupabase target: ${host}`);

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const emails = importRows.map((r) => r.email);
  const existing = new Set();
  const chunk = 50;
  for (let i = 0; i < emails.length; i += chunk) {
    const slice = emails.slice(i, i + chunk);
    const { data, error } = await sb.from("profiles").select("email").in("email", slice);
    if (error) {
      console.error("Failed to check existing profiles:", error.message);
      process.exit(1);
    }
    for (const row of data || []) {
      if (row.email) existing.add(String(row.email).toLowerCase());
    }
  }

  const toCreate = importRows.filter((r) => !existing.has(r.email));
  const alreadyThere = importRows.filter((r) => existing.has(r.email));

  console.log(`Already in profiles: ${alreadyThere.length}`);
  console.log(`Would create (new): ${toCreate.length}`);

  if (!execute) {
    console.log("\nPreview only. Re-run with --execute to create auth users + profiles.");
    if (toCreate.length) {
      console.log("\nSample (first 5 new):");
      toCreate.slice(0, 5).forEach((r) => {
        console.log(
          `  ${r.email} | ${r.companyName} | ${r.firstName} ${r.lastName} | ${r.phone || "no phone"}`
        );
      });
    }
    return;
  }

  await createClientUsers(sb, toCreate, outDir);
  if (alreadyThere.length) {
    console.log(`Skipped existing: ${alreadyThere.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
