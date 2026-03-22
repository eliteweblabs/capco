/**
 * Vapi.ai Assistant Configuration - Luxe Meds (luxemeds.com)
 *
 * Peptide e-commerce assistant for health and wellness questions.
 * Fetches product data from WordPress/WooCommerce on each run so prices
 * and catalog stay up to date.
 *
 * PRODUCT FETCHING:
 * - LUXEMEDS_WORDPRESS_URL: Base URL (e.g. https://luxemeds.com or http://localhost:10078)
 * - Tries WooCommerce Store API: /wp-json/wc/store/v1/products
 * - Fallback: scripts/data/luxemeds-products.json
 *
 * SALES LINKS:
 * - Agent offers "Would you like me to add that to your cart?"
 * - Add-to-cart URLs: {base}/?add-to-cart={productId}
 * - In text chat, user clicks link → WooCommerce adds to cart
 *
 * To create a new assistant (first run), leave ASSISTANT_ID empty.
 * After creation, add the returned ID and rerun to update.
 *
 * Run: npm run update-vapi-luxemeds
 */

import "dotenv/config";
import fetch from "node-fetch";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// CLIENT-SPECIFIC CONFIGURATION
// ============================================================================

const WORDPRESS_BASE =
  process.env.LUXEMEDS_WORDPRESS_URL ||
  process.env.LUXEMEDS_PRODUCTS_URL ||
  "https://luxemeds.com";

// Assistant ID - set after first run (create), or leave empty to create new
const ASSISTANT_ID = process.env.LUXEMEDS_VAPI_ASSISTANT_ID || "";

const LOG_PREFIX = "[VAPI-LUXEMEDS]";

// ============================================================================
// PRODUCT FETCHING
// ============================================================================

/**
 * Fetch products from WooCommerce Store API (public, no auth).
 * Returns array of { id, name, price, description, permalink, addToCartUrl }
 */
async function fetchWooCommerceProducts(baseUrl) {
  const url = `${baseUrl.replace(/\/$/, "")}/wp-json/wc/store/v1/products`;
  try {
    const res = await fetch(url, { timeout: 10000 });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return data.map((p) => {
      const id = p.id;
      const price = p.prices?.price || p.price || "—";
      const priceStr = typeof price === "string" ? price : String(price);
      const addToCartUrl = `${baseUrl.replace(/\/$/, "")}/?add-to-cart=${id}`;
      return {
        id,
        name: p.name || "Unknown",
        price: priceStr,
        description: stripHtml(p.short_description || p.description || ""),
        permalink: p.permalink || p.link || "",
        addToCartUrl,
      };
    });
  } catch (e) {
    console.warn(`${LOG_PREFIX} WooCommerce Store API fetch failed:`, e.message);
    return null;
  }
}

/**
 * Try WooCommerce REST v3 if consumer key/secret provided.
 * Env: LUXEMEDS_WC_CONSUMER_KEY, LUXEMEDS_WC_CONSUMER_SECRET
 */
async function fetchWooCommerceRestV3(baseUrl) {
  const key = process.env.LUXEMEDS_WC_CONSUMER_KEY;
  const secret = process.env.LUXEMEDS_WC_CONSUMER_SECRET;
  if (!key || !secret) return null;

  const url = `${baseUrl.replace(/\/$/, "")}/wp-json/wc/v3/products`;
  try {
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return data.map((p) => {
      const id = p.id;
      const price = p.price || "—";
      const addToCartUrl = `${baseUrl.replace(/\/$/, "")}/?add-to-cart=${id}`;
      return {
        id,
        name: p.name || "Unknown",
        price: String(price),
        description: stripHtml(p.short_description || p.description || ""),
        permalink: p.permalink || p.link || "",
        addToCartUrl,
      };
    });
  } catch (e) {
    console.warn(`${LOG_PREFIX} WooCommerce REST v3 fetch failed:`, e.message);
    return null;
  }
}

function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

/**
 * Load fallback products from scripts/data/luxemeds-products.json
 * Format: [ { id, name, price, description?, permalink?, addToCartUrl? } ]
 */
function loadFallbackProducts() {
  const path = join(__dirname, "data", "luxemeds-products.json");
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf8");
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : data.products || [];
    const base = WORDPRESS_BASE.replace(/\/$/, "");
    return arr.map((p) => ({
      id: p.id,
      name: p.name || "Unknown",
      price: p.price != null ? String(p.price) : "—",
      description: p.description || "",
      permalink: p.permalink || p.link || "",
      addToCartUrl: p.addToCartUrl || `${base}/?add-to-cart=${p.id}`,
    }));
  } catch (e) {
    console.warn(`${LOG_PREFIX} Fallback products load failed:`, e.message);
    return null;
  }
}

/**
 * Fetch products from WordPress. Updates on every script run.
 * Priority: Store API → REST v3 → fallback JSON
 */
async function fetchProducts() {
  let products = await fetchWooCommerceProducts(WORDPRESS_BASE);
  if (!products?.length) products = await fetchWooCommerceRestV3(WORDPRESS_BASE);
  if (!products?.length) products = loadFallbackProducts();
  if (!products?.length) {
    console.warn(
      `${LOG_PREFIX} No products found. Set LUXEMEDS_WORDPRESS_URL and ensure WooCommerce Store API is available, or create scripts/data/luxemeds-products.json`
    );
    return [];
  }
  console.log(`${LOG_PREFIX} Loaded ${products.length} product(s)`);
  return products;
}

/**
 * Build the product catalog block for the system prompt.
 */
function buildProductCatalogBlock(products) {
  if (!products.length) return "No products in catalog. Suggest visiting the website.";

  const lines = products.map(
    (p) =>
      `- **${p.name}** (ID: ${p.id}) — $${p.price} | Add to cart: ${p.addToCartUrl} | Product page: ${p.permalink || p.addToCartUrl} | ${p.description ? p.description.slice(0, 150) + "…" : ""}`
  );
  return lines.join("\n");
}

// ============================================================================
// ASSISTANT CONFIG
// ============================================================================

const VAPI_API_KEY = process.env.VAPI_API_KEY;

async function buildAssistantConfig(products) {
  const productBlock = buildProductCatalogBlock(products);
  const baseUrl = WORDPRESS_BASE.replace(/\/$/, "");
  const shopUrl = `${baseUrl}/product/`;
  const cartUrl = `${baseUrl}/cart/`;

  return {
    name: "Luxe Meds Assistant",
    functions: [],
    model: {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.7,
      maxTokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are a helpful, knowledgeable assistant for Luxe Meds (luxemeds.com), a peptide e-commerce website focused on health and wellness.

## Your Role
- Answer health and wellness questions about peptides (e.g., BPC-157, TB-500, semaglutide, tirzepatide, growth hormone peptides)
- Provide accurate, evidence-based information — but remind users to consult their healthcare provider
- Help users find products that match their interests
- Gently guide interested users toward purchase when appropriate

## Product Catalog (current prices and links)

${productBlock}

## Sales Behavior
- When a user expresses interest in a product, say: "Would you like me to add that to your cart? I can send you a one-click link."
- In text chat: Provide the add-to-cart URL. A single click adds the product to their cart on our WordPress site.
- In voice: Spell out or offer to send the link via SMS/follow-up if available.
- Add-to-cart format: ${baseUrl}/?add-to-cart=PRODUCT_ID
- Example: "Here's a link to add [Product Name] to your cart: [addToCartUrl]. One click and it's in your cart."
- Shop page: ${shopUrl} | Cart: ${cartUrl}

## Conversation Style
- Warm, professional, and informative
- Concise but thorough — avoid overwhelming users
- Do not make medical claims; recommend consulting a healthcare provider
- If asked about dosing, storage, or usage: share general guidance and suggest reading product pages or speaking with a clinician

## Limits
- Do not diagnose conditions or prescribe
- Do not guarantee results
- Stay within peptide/wellness topic; for unrelated topics, politely steer back`,
        },
      ],
      toolIds: [],
    },
    voice: {
      provider: "vapi",
      voiceId: "Savannah",
    },
    firstMessage:
      "Hi! I'm the Luxe Meds assistant. I can answer questions about our peptides and wellness products, or help you find what you're looking for. What can I help you with?",
    maxDurationSeconds: 900,
    endCallMessage: "Thanks for chatting. Take care!",
    endCallPhrases: ["goodbye", "bye", "thanks bye"],
    backgroundSound: "off",
    silenceTimeoutSeconds: 45,
  };
}

// ============================================================================
// VAPI API
// ============================================================================

async function createAssistant(config) {
  const response = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create assistant: ${response.status} ${err}`);
  }
  return response.json();
}

async function updateAssistant(assistantId, config) {
  const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to update assistant: ${response.status} ${err}`);
  }
  return response.json();
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  if (!VAPI_API_KEY) {
    console.warn(`⚠️ ${LOG_PREFIX} VAPI_API_KEY not set. Skipping.`);
    return;
  }

  console.log(`${LOG_PREFIX} Fetching products from ${WORDPRESS_BASE}...`);
  const products = await fetchProducts();

  const config = await buildAssistantConfig(products);

  if (ASSISTANT_ID) {
    console.log(`${LOG_PREFIX} Updating assistant ${ASSISTANT_ID}...`);
    await updateAssistant(ASSISTANT_ID, config);
    console.log(`✅ ${LOG_PREFIX} Assistant updated.`);
  } else {
    console.log(`${LOG_PREFIX} Creating new assistant...`);
    const assistant = await createAssistant(config);
    console.log(`✅ ${LOG_PREFIX} Created assistant:`, assistant.id);
    console.log(`📝 Add to .env: LUXEMEDS_VAPI_ASSISTANT_ID=${assistant.id}`);
    console.log(`📝 Then rerun to update with fresh product data.`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`❌ ${LOG_PREFIX}`, e);
    process.exit(1);
  });
}

export {
  fetchProducts,
  fetchWooCommerceProducts,
  loadFallbackProducts,
  buildProductCatalogBlock,
  buildAssistantConfig,
};
