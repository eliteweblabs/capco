#!/usr/bin/env node
/**
 * Delete ALL projects and test/demo auth users from the connected Supabase project.
 *
 * Test users: demo-seed-*@demo-seed.local, common e2e emails, obvious test signups.
 * Keeps production accounts (e.g. tom@, mduross@, sen@, overton@rothcollc.com).
 *
 *   node scripts/purge-all-projects-and-test-users.mjs
 *   node scripts/purge-all-projects-and-test-users.mjs --execute
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const execute = process.argv.includes("--execute");

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

const env = { ...process.env, ...loadEnv() };
const url = env.PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing PUBLIC_SUPABASE_URL or SUPABASE_SECRET in .env");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

/** Emails that must never be deleted by this script */
const KEEP_EMAILS = new Set(
  [
    "tom@tomsens.com",
    "mduross@firepumptestingco.com",
    "sen@eliteweblabs.com",
    "overton@rothcollc.com",
  ].map((e) => e.toLowerCase())
);

function isTestEmail(email) {
  if (!email) return false;
  const e = email.toLowerCase();
  if (KEEP_EMAILS.has(e)) return false;
  if (e.includes("demo-seed")) return true;
  if (e.endsWith("@demo-seed.local")) return true;
  if (e === "test@example.com") return true;
  if (e.startsWith("mcp-test@")) return true;
  if (e.startsWith("flow-test@")) return true;
  if (e === "hgjhjg@eliteweblabs.com") return true;
  return false;
}

const PROJECT_CHILD_TABLES = [
  "followUps",
  "smsLog",
  "clientUploads",
  "clientMagicLinks",
  "projectRequirements",
  "docGenLog",
  "tasks",
  "emailLog",
  "pdfGenerationHistory",
  "pdfGenerationJobs",
  "ai_generated_documents",
  "ai_agent_project_memory",
  "ai_agent_knowledge",
  "ai_agent_conversations",
  "generatedDocuments",
  "discussion",
  "punchlist",
  "timeEntries",
  "files",
];

async function fetchAllProjectIds() {
  const ids = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb.from("projects").select("id").range(from, from + 499);
    if (error) throw new Error(`projects: ${error.message}`);
    if (!data?.length) break;
    ids.push(...data.map((r) => r.id));
    if (data.length < 500) break;
    from += 500;
  }
  return ids;
}

async function deleteByProjectIds(table, projectIds) {
  if (!projectIds.length) return 0;
  let total = 0;
  for (let i = 0; i < projectIds.length; i += 50) {
    const chunk = projectIds.slice(i, i + 50);
    const { data, error } = await sb.from(table).delete().in("projectId", chunk).select("id");
    if (error) throw new Error(`${table}: ${error.message}`);
    total += data?.length ?? 0;
  }
  return total;
}

async function deleteAllPayments() {
  const { data, error } = await sb.from("payments").delete().neq("id", 0).select("id");
  if (error) throw new Error(`payments: ${error.message}`);
  return data?.length ?? 0;
}

async function deleteAllInvoices() {
  const { data, error } = await sb.from("invoices").delete().neq("id", 0).select("id");
  if (error) throw new Error(`invoices: ${error.message}`);
  return data?.length ?? 0;
}

async function deleteAllProjects() {
  const { data, error } = await sb.from("projects").delete().neq("id", 0).select("id");
  if (error) throw new Error(`projects: ${error.message}`);
  return data?.length ?? 0;
}

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 100) break;
    page += 1;
  }
  return users;
}

async function preview() {
  const projectIds = await fetchAllProjectIds();
  const users = await listAllAuthUsers();
  const testUsers = users.filter((u) => isTestEmail(u.email));
  console.log("Connected:", url);
  console.log("Projects to delete:", projectIds.length, projectIds);
  console.log("Test users to delete:", testUsers.length);
  testUsers.forEach((u) => console.log(" ", u.email));
  console.log("Users kept:", users.filter((u) => !isTestEmail(u.email)).map((u) => u.email).join(", "));
}

async function run() {
  const projectIds = await fetchAllProjectIds();
  console.log(`Deleting ${projectIds.length} project(s) and related rows...`);

  const payments = await deleteAllPayments();
  console.log(`Deleted ${payments} payment(s).`);

  const invoices = await deleteAllInvoices();
  console.log(`Deleted ${invoices} invoice(s).`);

  for (const table of PROJECT_CHILD_TABLES) {
    try {
      const n = await deleteByProjectIds(table, projectIds);
      if (n > 0) console.log(`Deleted ${n} from ${table}.`);
    } catch (e) {
      const msg = String(e.message || e);
      if (msg.includes("does not exist") || msg.includes("Could not find")) {
        console.log(`Skipped ${table}.`);
      } else {
        throw e;
      }
    }
  }

  const projects = await deleteAllProjects();
  console.log(`Deleted ${projects} project(s).`);

  const users = await listAllAuthUsers();
  const testUsers = users.filter((u) => isTestEmail(u.email));
  for (const u of testUsers) {
    const { error } = await sb.auth.admin.deleteUser(u.id);
    if (error) throw new Error(`delete ${u.email}: ${error.message}`);
    console.log(`Deleted test user: ${u.email}`);
  }

  const leftProjects = await fetchAllProjectIds();
  const leftUsers = await listAllAuthUsers();
  console.log("Remaining projects:", leftProjects.length);
  console.log(
    "Remaining auth users:",
    leftUsers.map((u) => u.email).join(", ")
  );
}

async function main() {
  await preview();
  if (!execute) {
    console.log("\nPreview only. Re-run with --execute to delete.");
    return;
  }
  console.log("\nExecuting...\n");
  await run();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
