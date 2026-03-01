#!/usr/bin/env node
import "dotenv/config";
/**
 * Prepare policygen.json with entity data from CMS, env, or site config.
 * Run before `npx policygen generate` in the build.
 *
 * DATA SOURCES (priority order):
 * 1. CMS Database (globalSettings) - same as process-manifest
 * 2. SITE_CONFIG / SITE_CONFIG_JSON / site-config.json
 * 3. Env: PUBLIC_SITE_URL, PUBLIC_URL, RAILWAY_PUBLIC_DOMAIN, GLOBAL_COMPANY_*
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const configPath = join(root, "policygen.json");

const get = (settings, key, envKey, fallback) => {
  if (key && settings?.[key]) return settings[key];
  if (key && process.env[key]) return process.env[key];
  if (envKey && process.env[envKey]) return process.env[envKey];
  return fallback ?? "";
};

/** Load company data from CMS (same pattern as process-manifest.js) */
async function loadCompanyData() {
  try {
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("globalSettings").select("key, value");

    if (error || !data?.length) return null;

    const settings = data.reduce((acc, item) => {
      acc[item.key] = item.value || "";
      return acc;
    }, {});
    return settings;
  } catch (e) {
    return null;
  }
}

async function main() {
  const companyData = await loadCompanyData();
  const s = companyData;

  const getEntity = (key, envKey, fallback) => get(s, key, envKey, fallback);

  const website =
    getEntity("website", "PUBLIC_SITE_URL", null) ||
    process.env.PUBLIC_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null) ||
    "https://example.com";

  const entity = {
    name: getEntity("companyName", "POLICYGEN_ENTITY_NAME", null) ||
      getEntity("companyName", "RAILWAY_PROJECT_NAME", "Fire Protection Services"),
    website,
    address: getEntity("address", "POLICYGEN_ENTITY_ADDRESS", null) ||
      getEntity("address", "GLOBAL_COMPANY_ADDRESS", "123 Main St"),
  };

  let config;
  try {
    config = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch (e) {
    console.warn("[prepare-policygen] Could not read policygen.json, using entity only:", e.message);
    config = {};
  }

  config.entity = { ...config.entity, ...entity };
  const entityEmail =
    getEntity("email", "POLICYGEN_PRIVACY_EMAIL", null) ||
    getEntity("email", "GLOBAL_COMPANY_EMAIL", null);
  if (config.privacy && entityEmail) {
    config.privacy.privacyEmail = entityEmail;
  } else if (config.privacy && !config.privacy.privacyEmail) {
    config.privacy.privacyEmail = "privacy@example.com";
  }

  // SITE_CONFIG / site-config.json override
  let siteConfig = null;
  const siteConfigJson = process.env.SITE_CONFIG || process.env.SITE_CONFIG_JSON;
  if (siteConfigJson) {
    try {
      siteConfig = JSON.parse(siteConfigJson);
    } catch (_) {}
  }
  if (!siteConfig && existsSync(join(root, "site-config.json"))) {
    try {
      siteConfig = JSON.parse(readFileSync(join(root, "site-config.json"), "utf-8"));
    } catch (_) {}
  }
  if (siteConfig?.site) {
    config.entity = {
      name: siteConfig.site.name || config.entity.name,
      website: siteConfig.site.url || config.entity.website,
      address: siteConfig.site.address || config.entity.address,
    };
    if (config.privacy) {
      config.privacy.privacyEmail = siteConfig.site.email || config.privacy.privacyEmail;
    }
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  console.log("[prepare-policygen] Updated policygen.json entity:", config.entity.name, "| website:", config.entity.website);
}

main().catch((e) => {
  console.error("[prepare-policygen] Error:", e);
  process.exit(1);
});
