#!/usr/bin/env node
/**
 * Prepare policygen.json with entity data from env / site config.
 * Run before `npx policygen generate` in the build.
 * Env vars: RAILWAY_PROJECT_NAME, GLOBAL_COMPANY_EMAIL, GLOBAL_COMPANY_ADDRESS,
 * PUBLIC_URL, RAILWAY_PUBLIC_DOMAIN
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const configPath = join(root, "policygen.json");

const get = (key, envKey, fallback) => {
  if (process.env[key]) return process.env[key];
  if (envKey && process.env[envKey]) return process.env[envKey];
  return fallback || "";
};

const website = get("PUBLIC_SITE_URL") || get("PUBLIC_URL")
  || (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : "https://example.com");

const entity = {
  name: get("POLICYGEN_ENTITY_NAME", "RAILWAY_PROJECT_NAME") || "Fire Protection Services",
  website,
  address: get("POLICYGEN_ENTITY_ADDRESS", "GLOBAL_COMPANY_ADDRESS") || "123 Main St",
};

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf-8"));
} catch (e) {
  console.warn("[prepare-policygen] Could not read policygen.json, using entity only:", e.message);
  config = {};
}

config.entity = { ...config.entity, ...entity };
if (config.privacy && !config.privacy.privacyEmail) {
  config.privacy.privacyEmail = get("POLICYGEN_PRIVACY_EMAIL", "GLOBAL_COMPANY_EMAIL") || "privacy@example.com";
}

// Try SITE_CONFIG / site-config.json for company data
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
console.log("[prepare-policygen] Updated policygen.json entity:", config.entity.name);
