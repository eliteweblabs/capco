#!/usr/bin/env node
/**
 * Remove finance-dashboard demo seed data from the connected Supabase project.
 *
 * Targets:
 *   - Projects (jobs): title LIKE '[DEMO SEED]%'
 *   - Clients: email LIKE 'demo-seed-client-%@demo-seed.local'
 *
 * Usage:
 *   node scripts/clear-demo-seed-data.mjs           # preview only
 *   node scripts/clear-demo-seed-data.mjs --execute # delete
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

const DEMO_PROJECT_TITLE = "[DEMO SEED]%";
const DEMO_CLIENT_EMAIL = "demo-seed-client-%@demo-seed.local";

/** Tables with projectId — delete before projects. Order: dependents first where needed. */
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
  "invoices",
];

async function fetchAllIds(table, filterFn) {
  const ids = [];
  let from = 0;
  const pageSize = 500;
  while (true) {
    let q = sb.from(table).select("id").range(from, from + pageSize - 1);
    q = filterFn(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table} select: ${error.message}`);
    if (!data?.length) break;
    ids.push(...data.map((r) => r.id));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return ids;
}

async function deleteByProjectIds(table, projectIds) {
  if (!projectIds.length) return 0;
  let total = 0;
  for (let i = 0; i < projectIds.length; i += 50) {
    const chunk = projectIds.slice(i, i + 50);
    const { data, error } = await sb.from(table).delete().in("projectId", chunk).select("id");
    if (error) throw new Error(`${table} delete: ${error.message}`);
    total += data?.length ?? 0;
  }
  return total;
}

async function deletePaymentsForDemoInvoices() {
  const invoiceIds = await fetchAllIds("invoices", (q) => q.like("subject", DEMO_PROJECT_TITLE));
  if (!invoiceIds.length) return 0;
  let total = 0;
  for (let i = 0; i < invoiceIds.length; i += 100) {
    const chunk = invoiceIds.slice(i, i + 100);
    const { data, error } = await sb.from("payments").delete().in("invoiceId", chunk).select("id");
    if (error) throw new Error(`payments delete: ${error.message}`);
    total += data?.length ?? 0;
  }
  return total;
}

async function deleteDemoInvoices() {
  const { data, error } = await sb
    .from("invoices")
    .delete()
    .like("subject", DEMO_PROJECT_TITLE)
    .select("id");
  if (error) throw new Error(`invoices delete: ${error.message}`);
  return data?.length ?? 0;
}

async function deleteDemoProjects() {
  const { data, error } = await sb
    .from("projects")
    .delete()
    .like("title", DEMO_PROJECT_TITLE)
    .select("id");
  if (error) throw new Error(`projects delete: ${error.message}`);
  return data?.length ?? 0;
}

async function listDemoClientProfiles() {
  const { data, error } = await sb
    .from("profiles")
    .select("id, email, companyName")
    .eq("role", "Client")
    .like("email", DEMO_CLIENT_EMAIL);
  if (error) throw new Error(`profiles select: ${error.message}`);
  return data ?? [];
}

async function deleteDemoClients(profiles) {
  let deleted = 0;
  for (const p of profiles) {
    const { error } = await sb.auth.admin.deleteUser(p.id);
    if (error) throw new Error(`auth delete ${p.email}: ${error.message}`);
    deleted += 1;
  }
  return deleted;
}

async function preview() {
  const [{ count: projectCount }, { count: invoiceCount }, clients] = await Promise.all([
    sb.from("projects").select("*", { count: "exact", head: true }).like("title", DEMO_PROJECT_TITLE),
    sb
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .like("subject", DEMO_PROJECT_TITLE),
    listDemoClientProfiles(),
  ]);
  console.log("Connected:", url);
  console.log("Demo projects (jobs):", projectCount ?? 0);
  console.log("Demo invoices:", invoiceCount ?? 0);
  console.log("Demo clients:", clients.length);
  if (clients.length) {
    console.log(
      "  sample:",
      clients.slice(0, 3).map((c) => c.email).join(", ")
    );
  }
}

async function run() {
  const projectIds = await fetchAllIds("projects", (q) => q.like("title", DEMO_PROJECT_TITLE));
  console.log(`Found ${projectIds.length} demo project(s).`);

  const paymentsDeleted = await deletePaymentsForDemoInvoices();
  console.log(`Deleted ${paymentsDeleted} payment(s).`);

  const invoicesDeleted = await deleteDemoInvoices();
  console.log(`Deleted ${invoicesDeleted} invoice(s) (subject [DEMO SEED]).`);

  for (const table of PROJECT_CHILD_TABLES) {
    if (table === "invoices") continue;
    try {
      const n = await deleteByProjectIds(table, projectIds);
      if (n > 0) console.log(`Deleted ${n} row(s) from ${table}.`);
    } catch (e) {
      const msg = String(e.message || e);
      if (msg.includes("does not exist") || msg.includes("Could not find")) {
        console.log(`Skipped ${table} (not in schema).`);
      } else {
        throw e;
      }
    }
  }

  const projectsDeleted = await deleteDemoProjects();
  console.log(`Deleted ${projectsDeleted} project(s).`);

  const clients = await listDemoClientProfiles();
  const clientsDeleted = await deleteDemoClients(clients);
  console.log(`Deleted ${clientsDeleted} demo client auth user(s) (+ profiles via cascade).`);

  const [{ count: leftProjects }, { count: leftClients }] = await Promise.all([
    sb.from("projects").select("*", { count: "exact", head: true }).like("title", DEMO_PROJECT_TITLE),
    sb
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "Client")
      .like("email", DEMO_CLIENT_EMAIL),
  ]);
  console.log("Remaining demo projects:", leftProjects ?? 0);
  console.log("Remaining demo clients:", leftClients ?? 0);
}

async function main() {
  await preview();
  if (!execute) {
    console.log("\nPreview only. Re-run with --execute to delete.");
    return;
  }
  console.log("\nExecuting teardown...\n");
  await run();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
