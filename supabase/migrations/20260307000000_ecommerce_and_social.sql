-- E-commerce + Social Media module for luxemeds.com and similar sites
-- Uses Square for payments; no projects table dependency

-- Products (e-commerce catalog)
CREATE TABLE IF NOT EXISTS "public"."ecomProducts" (
  "id" serial PRIMARY KEY,
  "slug" text UNIQUE NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "priceCents" integer NOT NULL CHECK ("priceCents" >= 0),
  "compareAtPriceCents" integer,
  "imageUrl" text,
  "images" jsonb DEFAULT '[]',
  "inventoryQuantity" integer DEFAULT 0,
  "sku" text,
  "status" text DEFAULT 'active' CHECK ("status" IN ('active', 'draft', 'archived')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ecomProducts_slug_idx" ON "public"."ecomProducts" ("slug");
CREATE INDEX IF NOT EXISTS "ecomProducts_status_idx" ON "public"."ecomProducts" ("status");

-- Product variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS "public"."ecomProductVariants" (
  "id" serial PRIMARY KEY,
  "productId" integer NOT NULL REFERENCES "public"."ecomProducts"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "priceCents" integer,
  "sku" text,
  "inventoryQuantity" integer DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ecomProductVariants_productId_idx" ON "public"."ecomProductVariants" ("productId");

-- Cart (anonymous or user-linked; keyed by sessionId or userId)
CREATE TABLE IF NOT EXISTS "public"."ecomCarts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid REFERENCES auth.users("id") ON DELETE SET NULL,
  "sessionId" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ecomCarts_userId_idx" ON "public"."ecomCarts" ("userId");
CREATE INDEX IF NOT EXISTS "ecomCarts_sessionId_idx" ON "public"."ecomCarts" ("sessionId");

-- Cart items
CREATE TABLE IF NOT EXISTS "public"."ecomCartItems" (
  "id" serial PRIMARY KEY,
  "cartId" uuid NOT NULL REFERENCES "public"."ecomCarts"("id") ON DELETE CASCADE,
  "productId" integer NOT NULL REFERENCES "public"."ecomProducts"("id") ON DELETE CASCADE,
  "variantId" integer REFERENCES "public"."ecomProductVariants"("id") ON DELETE SET NULL,
  "quantity" integer NOT NULL DEFAULT 1 CHECK ("quantity" > 0),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ecomCartItems_cartId_idx" ON "public"."ecomCartItems" ("cartId");

-- Orders
CREATE TABLE IF NOT EXISTS "public"."ecomOrders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderNumber" text UNIQUE NOT NULL,
  "userId" uuid REFERENCES auth.users("id") ON DELETE SET NULL,
  "email" text NOT NULL,
  "status" text DEFAULT 'pending' CHECK ("status" IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  "totalCents" integer NOT NULL,
  "squarePaymentId" text,
  "squareOrderId" text,
  "shippingAddress" jsonb,
  "billingAddress" jsonb,
  "metadata" jsonb DEFAULT '{}',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ecomOrders_userId_idx" ON "public"."ecomOrders" ("userId");
CREATE INDEX IF NOT EXISTS "ecomOrders_orderNumber_idx" ON "public"."ecomOrders" ("orderNumber");
CREATE INDEX IF NOT EXISTS "ecomOrders_squarePaymentId_idx" ON "public"."ecomOrders" ("squarePaymentId");

-- Order items (snapshot at purchase time)
CREATE TABLE IF NOT EXISTS "public"."ecomOrderItems" (
  "id" serial PRIMARY KEY,
  "orderId" uuid NOT NULL REFERENCES "public"."ecomOrders"("id") ON DELETE CASCADE,
  "productId" integer NOT NULL,
  "productTitle" text NOT NULL,
  "variantTitle" text,
  "priceCents" integer NOT NULL,
  "quantity" integer NOT NULL,
  "imageUrl" text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ecomOrderItems_orderId_idx" ON "public"."ecomOrderItems" ("orderId");

-- Social media posts (internal content to publish)
CREATE TABLE IF NOT EXISTS "public"."socialPosts" (
  "id" serial PRIMARY KEY,
  "authorId" uuid REFERENCES auth.users("id") ON DELETE SET NULL,
  "content" text NOT NULL,
  "mediaUrls" jsonb DEFAULT '[]',
  "scheduledAt" timestamptz,
  "status" text DEFAULT 'draft' CHECK ("status" IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "socialPosts_status_idx" ON "public"."socialPosts" ("status");
CREATE INDEX IF NOT EXISTS "socialPosts_scheduledAt_idx" ON "public"."socialPosts" ("scheduledAt");

-- Social post publish targets (which platforms to publish to)
CREATE TABLE IF NOT EXISTS "public"."socialPostTargets" (
  "id" serial PRIMARY KEY,
  "postId" integer NOT NULL REFERENCES "public"."socialPosts"("id") ON DELETE CASCADE,
  "platform" text NOT NULL CHECK ("platform" IN ('instagram', 'facebook', 'tiktok', 'bluesky')),
  "status" text DEFAULT 'pending' CHECK ("status" IN ('pending', 'publishing', 'published', 'failed')),
  "externalId" text,
  "externalUrl" text,
  "errorMessage" text,
  "publishedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "socialPostTargets_postId_idx" ON "public"."socialPostTargets" ("postId");
CREATE INDEX IF NOT EXISTS "socialPostTargets_platform_idx" ON "public"."socialPostTargets" ("platform");

-- RLS
ALTER TABLE "public"."ecomProducts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ecomProductVariants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ecomCarts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ecomCartItems" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ecomOrders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ecomOrderItems" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."socialPosts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."socialPostTargets" ENABLE ROW LEVEL SECURITY;

-- Products: public read for active; admins full access
CREATE POLICY "ecomProducts_select_active" ON "public"."ecomProducts"
  FOR SELECT USING ("status" = 'active');
CREATE POLICY "ecomProducts_admin_all" ON "public"."ecomProducts"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."profiles" WHERE id = auth.uid() AND role = 'Admin')
  );

-- Variants: public read when product is active
CREATE POLICY "ecomProductVariants_select" ON "public"."ecomProductVariants"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "public"."ecomProducts" p WHERE p.id = "productId" AND p."status" = 'active')
  );
CREATE POLICY "ecomProductVariants_admin" ON "public"."ecomProductVariants"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."profiles" WHERE id = auth.uid() AND role = 'Admin')
  );

-- Carts: users can manage own; anon can use sessionId (service role for anon cart ops)
CREATE POLICY "ecomCarts_user_own" ON "public"."ecomCarts"
  FOR ALL USING (auth.uid() = "userId");
CREATE POLICY "ecomCarts_anon_insert" ON "public"."ecomCarts"
  FOR INSERT WITH CHECK ("userId" IS NULL AND "sessionId" IS NOT NULL);
CREATE POLICY "ecomCarts_anon_select" ON "public"."ecomCarts"
  FOR SELECT USING ("userId" IS NULL AND "sessionId" IS NOT NULL);

-- Cart items: via cart ownership
CREATE POLICY "ecomCartItems_select" ON "public"."ecomCartItems"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."ecomCarts" c
      WHERE c.id = "cartId"
      AND (c."userId" = auth.uid() OR (c."userId" IS NULL AND c."sessionId" IS NOT NULL))
    )
  );
CREATE POLICY "ecomCartItems_insert" ON "public"."ecomCartItems"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."ecomCarts" c
      WHERE c.id = "cartId"
      AND (c."userId" = auth.uid() OR (c."userId" IS NULL AND c."sessionId" IS NOT NULL))
    )
  );
CREATE POLICY "ecomCartItems_update" ON "public"."ecomCartItems"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "public"."ecomCarts" c
      WHERE c.id = "cartId"
      AND (c."userId" = auth.uid() OR (c."userId" IS NULL AND c."sessionId" IS NOT NULL))
    )
  );
CREATE POLICY "ecomCartItems_delete" ON "public"."ecomCartItems"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "public"."ecomCarts" c
      WHERE c.id = "cartId"
      AND (c."userId" = auth.uid() OR (c."userId" IS NULL AND c."sessionId" IS NOT NULL))
    )
  );

-- Orders: users see own; admins see all
CREATE POLICY "ecomOrders_select_own" ON "public"."ecomOrders"
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "ecomOrders_insert" ON "public"."ecomOrders"
  FOR INSERT WITH CHECK (true);
CREATE POLICY "ecomOrders_admin" ON "public"."ecomOrders"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."profiles" WHERE id = auth.uid() AND role = 'Admin')
  );

-- Order items: via order
CREATE POLICY "ecomOrderItems_select" ON "public"."ecomOrderItems"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."ecomOrders" o
      WHERE o.id = "orderId"
      AND (o."userId" = auth.uid() OR EXISTS (SELECT 1 FROM "public"."profiles" p WHERE p.id = auth.uid() AND p.role = 'Admin'))
    )
  );
CREATE POLICY "ecomOrderItems_insert" ON "public"."ecomOrderItems"
  FOR INSERT WITH CHECK (true);

-- Social posts: admins full access
CREATE POLICY "socialPosts_admin" ON "public"."socialPosts"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."profiles" WHERE id = auth.uid() AND role = 'Admin')
  );

-- Social post targets: via post
CREATE POLICY "socialPostTargets_admin" ON "public"."socialPostTargets"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."profiles" WHERE id = auth.uid() AND role = 'Admin')
  );
