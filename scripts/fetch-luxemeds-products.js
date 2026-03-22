/**
 * Fetch Luxe Meds products from WordPress/WooCommerce and save to
 * scripts/data/luxemeds-products.json.
 *
 * Use when WooCommerce Store API is available but you want to cache
 * product data for the VAPI config (or when running in CI without
 * access to the WordPress site).
 *
 * Env: LUXEMEDS_WORDPRESS_URL (default: https://luxemeds.com)
 *      For local WordPress: LUXEMEDS_WORDPRESS_URL=http://localhost:10078
 *
 * Run: node scripts/fetch-luxemeds-products.js
 */

import "dotenv/config";
import fetch from "node-fetch";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE =
  process.env.LUXEMEDS_WORDPRESS_URL ||
  process.env.LUXEMEDS_PRODUCTS_URL ||
  "https://luxemeds.com";

function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
}

async function fetchStoreApi() {
  const url = `${BASE.replace(/\/$/, "")}/wp-json/wc/store/v1/products`;
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data)) return null;
  return data.map((p) => ({
    id: p.id,
    name: p.name || "Unknown",
    price: p.prices?.price ?? p.price ?? "0",
    description: stripHtml(p.short_description || p.description || ""),
    permalink: p.permalink || p.link || "",
  }));
}

async function fetchRestV3() {
  const key = process.env.LUXEMEDS_WC_CONSUMER_KEY;
  const secret = process.env.LUXEMEDS_WC_CONSUMER_SECRET;
  if (!key || !secret) return null;

  const url = `${BASE.replace(/\/$/, "")}/wp-json/wc/v3/products`;
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
    timeout: 10000,
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data)) return null;
  return data.map((p) => ({
    id: p.id,
    name: p.name || "Unknown",
    price: p.price ?? "0",
    description: stripHtml(p.short_description || p.description || ""),
    permalink: p.permalink || p.link || "",
  }));
}

async function main() {
  console.log(`[fetch-luxemeds] Fetching from ${BASE}...`);

  let products = await fetchStoreApi();
  if (!products?.length) products = await fetchRestV3();

  if (!products?.length) {
    console.error(
      "[fetch-luxemeds] No products found. Ensure WooCommerce Store API is available at /wp-json/wc/store/v1/products, or set LUXEMEDS_WC_CONSUMER_KEY and LUXEMEDS_WC_CONSUMER_SECRET for REST v3."
    );
    process.exit(1);
  }

  const outPath = join(__dirname, "data", "luxemeds-products.json");
  writeFileSync(outPath, JSON.stringify(products, null, 2), "utf8");
  console.log(`[fetch-luxemeds] Saved ${products.length} products to ${outPath}`);
}

main().catch((e) => {
  console.error("[fetch-luxemeds]", e);
  process.exit(1);
});
