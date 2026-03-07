# E-commerce & Social Media Module

Module for luxemeds.com and similar e-commerce sites. Uses Square for payments; no projects dependency.

## Overview

- **E-commerce**: Products, cart, checkout, Square payments
- **Social media**: Create posts, publish to Instagram, Facebook, TikTok, Bluesky

## Setup

### 1. Run migration

```bash
supabase db push
# Or apply: supabase/migrations/20260307000000_ecommerce_and_social.sql
```

### 2. Square env vars

```
SQUARE_APPLICATION_ID=sandbox-sq0idb-xxx
SQUARE_LOCATION_ID=sandbox-xxx
SQUARE_ACCESS_TOKEN=sandbox-xxx
SQUARE_ENVIRONMENT=sandbox
```

For production, use production keys and `SQUARE_ENVIRONMENT=production`.

### 3. Luxemeds config

Create `public/data/config-luxemeds.json` (or set `RAILWAY_PROJECT_NAME=Luxemeds` and add config). Add to `.gitignore` exceptions if committing:

```
!public/data/config-luxemeds.json
```

### 4. Social media OAuth (per platform)

Each platform requires separate setup:

- **Instagram/Facebook**: Meta for Developers app, Business account, `instagram_content_publish`, `pages_manage_posts`
- **TikTok**: Developer account, Content Posting API (app review required)
- **Bluesky**: App password or OAuth; AT Protocol `com.atproto.repo.createRecord`

Store tokens in env or a secure store. The publish API (`/api/social/publish`) is a stub; implement platform adapters as needed.

## Routes

| Route | Description |
|-------|-------------|
| `/shop` | Product listing |
| `/shop/cart` | Cart |
| `/shop/checkout` | Step 1: email |
| `/shop/checkout/pay?orderId=` | Step 2: Square payment |
| `/shop/confirmation?order=` | Order confirmed |
| `/admin/social-posts` | Social media manager (to build) |

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/shop/cart` | GET | Get cart |
| `/api/shop/cart` | POST | Add/update/remove items |
| `/api/shop/products` | GET | List products |
| `/api/square/create-order` | POST | Create order from cart |
| `/api/square/create-payment` | POST | Process Square payment |
| `/api/shop/order?orderId=` | GET | Get order (for pay page) |
| `/api/social/publish` | POST | Publish post to platforms |

## Database tables

- `ecomProducts`, `ecomProductVariants` – catalog
- `ecomCarts`, `ecomCartItems` – cart
- `ecomOrders`, `ecomOrderItems` – orders
- `socialPosts`, `socialPostTargets` – social content

## Mobile-first

Shop pages use responsive Tailwind; prioritize mobile layout. Social media flows are designed for quick posting from mobile.
