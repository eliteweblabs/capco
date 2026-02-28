#!/usr/bin/env npx tsx
/**
 * Updates the Supabase confirm-sign-up auth email template.
 * Uses src/templates/email/template.html structure with the branded content.
 *
 * Requires: SUPABASE_ACCESS_TOKEN, PUBLIC_SUPABASE_URL (or SUPABASE_PROJECT_REF)
 * Run: npm run update:supabase-confirm-email
 */

import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env") });
import { readFileSync } from "fs";
import { join } from "path";

const CONFIRM_CONTENT = `<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>`;

const SUBJECT = "Confirm your signup";

/** Replace placeholders from env (avoids importing app code that needs import.meta.env) */
function replacePlaceholdersFromEnv(html: string): string {
  const baseUrl =
    process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_SITE_URL || "https://rothcollc.com";
  const siteUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;

  const companyName = process.env.RAILWAY_PROJECT_NAME || "Rothco Built";
  const primaryColor = process.env.GLOBAL_COLOR_PRIMARY || "#1a1a1a";
  const secondaryColor = process.env.GLOBAL_COLOR_SECONDARY || "#374151";
  const bgLight = process.env.GLOBAL_BACKGROUND_COLOR_LIGHT || "#ffffff";
  const bgDark = process.env.GLOBAL_BACKGROUND_COLOR_DARK || "#0a0a0a";
  const slogan = process.env.GLOBAL_COMPANY_SLOGAN || "Fire Protection Systems";
  const year = new Date().getFullYear().toString();

  const logoUrl = `${siteUrl.replace(/\/$/, "")}/img/email-logo.png`;

  let out = html;
  const repl: [RegExp, string][] = [
    [/\{\{\s*RAILWAY_PROJECT_NAME\s*\}\}/g, companyName],
    [/\{\{\s*GLOBAL_COMPANY_SLOGAN\s*\}\}/g, slogan],
    [/\{\{\s*GLOBAL_COLOR_PRIMARY\s*\}\}/g, primaryColor.startsWith("#") ? primaryColor : `#${primaryColor}`],
    [/\{\{\s*GLOBAL_COLOR_SECONDARY\s*\}\}/g, secondaryColor.startsWith("#") ? secondaryColor : `#${secondaryColor}`],
    [/\{\{\s*GLOBAL_BACKGROUND_COLOR_LIGHT\s*\}\}/g, bgLight.startsWith("#") ? bgLight : `#${bgLight}`],
    [/\{\{\s*GLOBAL_BACKGROUND_COLOR_DARK\s*\}\}/g, bgDark.startsWith("#") ? bgDark : `#${bgDark}`],
    [/\{\{\s*RAILWAY_PUBLIC_DOMAIN\s*\}\}/g, siteUrl],
    [/\{\{\s*GLOBAL_COMPANY_WEBSITE\s*\}\}/g, siteUrl],
    [/\{\{\s*YEAR\s*\}\}/g, year],
    [/\{\{\s*GLOBAL_COMPANY_LOGO_BASE_64_DARK\s*\}\}/g, logoUrl],
    [/\{\{\s*GLOBAL_COMPANY_LOGO_BASE_64_LIGHT\s*\}\}/g, logoUrl],
    [/\{\{\s*GLOBAL_COMPANY_LOGO_DARK_SRC\s*\}\}/g, logoUrl],
    [/\{\{\s*GLOBAL_COMPANY_LOGO_EMAIL_URL\s*\}\}/g, logoUrl],
  ];
  for (const [re, val] of repl) {
    out = out.replace(re, val);
  }
  return out;
}

/** When true, exit 0 on missing token (used during build so build doesn't fail) */
const LENIENT = process.env.SUPABASE_TEMPLATE_UPDATE_LENIENT === "1" || process.argv.includes("--lenient");

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;

  if (!accessToken) {
    if (LENIENT) {
      console.log("⏭ Supabase confirm-email template: skipped (no SUPABASE_ACCESS_TOKEN)");
      return;
    }
    console.error("❌ SUPABASE_ACCESS_TOKEN is required");
    console.error("   Add it to .env or run: SUPABASE_ACCESS_TOKEN=your_token npm run update:supabase-confirm-email");
    process.exit(1);
  }

  let projectRef = process.env.SUPABASE_PROJECT_REF;
  if (!projectRef && supabaseUrl) {
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    projectRef = match ? match[1] : "";
  }
  if (!projectRef) {
    console.error("❌ SUPABASE_PROJECT_REF or PUBLIC_SUPABASE_URL required to derive project ref");
    process.exit(1);
  }

  console.log("📧 Building confirm-signup template from template.html...");

  const templatePath = join(process.cwd(), "src", "templates", "email", "template.html");
  let template = readFileSync(templatePath, "utf-8");

  template = template.replace("{{CONTENT}}", CONFIRM_CONTENT);
  template = template.replace("{{BUTTON_LINK}}", "{{ .ConfirmationURL }}");
  template = template.replace("{{BUTTON_TEXT}}", "Confirm your mail");

  const html = replacePlaceholdersFromEnv(template);

  if (!html.includes("{{ .ConfirmationURL }}")) {
    console.error("❌ Template lost {{ .ConfirmationURL }} - aborting");
    process.exit(1);
  }

  console.log("📤 Patching Supabase auth config...");

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mailer_subjects_confirmation: SUBJECT,
      mailer_templates_confirmation_content: html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("❌ Supabase confirm-email template API error:", res.status, errText);
    if (!LENIENT) process.exit(1);
    return;
  }

  console.log("✅ Supabase confirm-signup template updated");
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
