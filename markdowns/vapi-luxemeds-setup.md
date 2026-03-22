# VAPI Luxe Meds Assistant Setup

Voice/chat assistant for Luxe Meds (luxemeds.com) peptide e-commerce. Answers health and wellness questions about peptides, recommends products, and provides add-to-cart links.

## Quick Start

1. **Create assistant (first run):**
   ```bash
   LUXEMEDS_VAPI_ASSISTANT_ID= npm run update-vapi-luxemeds
   ```
   Copy the printed assistant ID.

2. **Add to .env:**
   ```
   LUXEMEDS_VAPI_ASSISTANT_ID=<assistant-id-from-step-1>
   ```

3. **Update assistant (subsequent runs):**
   ```bash
   npm run update-vapi-luxemeds
   ```
   Each run fetches fresh product data, so prices and catalog stay current.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LUXEMEDS_WORDPRESS_URL` | `https://luxemeds.com` | WordPress base URL |
| `LUXEMEDS_VAPI_ASSISTANT_ID` | _(empty)_ | VAPI assistant ID (set after first create) |
| `LUXEMEDS_WC_CONSUMER_KEY` | — | WooCommerce REST API key (optional) |
| `LUXEMEDS_WC_CONSUMER_SECRET` | — | WooCommerce REST API secret (optional) |

## Local WordPress (localhost:10078)

To use a local WordPress instance:

```bash
LUXEMEDS_WORDPRESS_URL=http://localhost:10078 npm run update-vapi-luxemeds
```

## Product Data Sources (priority order)

1. **WooCommerce Store API** – `/wp-json/wc/store/v1/products` (public, no auth)
2. **WooCommerce REST v3** – `/wp-json/wc/v3/products` (requires consumer key/secret)
3. **Fallback JSON** – `scripts/data/luxemeds-products.json`

If the Store API is not available (e.g. classic WooCommerce without blocks), either:

- Add REST API credentials (`LUXEMEDS_WC_CONSUMER_KEY`, `LUXEMEDS_WC_CONSUMER_SECRET`), or
- Run `node scripts/fetch-luxemeds-products.js` when WordPress is reachable to update the fallback JSON.

## Add-to-Cart Links

The assistant provides WooCommerce add-to-cart URLs in this format:

```
https://luxemeds.com/?add-to-cart=PRODUCT_ID
```

**With quantity:**
```
https://luxemeds.com/?add-to-cart=PRODUCT_ID&quantity=2
```

**Redirect to cart after add:**
```
https://luxemeds.com/cart/?add-to-cart=PRODUCT_ID
```

In text chat, the user clicks the link → product is added to cart. No need for the VAPI/chat to live inside the WordPress site.

## Sales Behavior

The assistant is instructed to:

- Offer: *"Would you like me to add that to your cart? I can send you a one-click link."*
- Provide the add-to-cart URL when the user agrees
- Be informative about peptides without making medical claims

## Files

| File | Purpose |
|------|---------|
| `scripts/vapi-luxemeds-config.js` | Main VAPI assistant config |
| `scripts/data/luxemeds-products.json` | Fallback product catalog |
| `scripts/fetch-luxemeds-products.js` | Fetch products and save to JSON |
