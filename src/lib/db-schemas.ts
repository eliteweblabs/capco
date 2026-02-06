/**
 * Database Schema Definitions
 * Contains table schemas that can be auto-created if missing
 *
 * Usage: Import the schema and use ensureTable() before database operations
 */

import { supabaseAdmin } from "./supabase-admin";

export interface TableSchema {
  name: string;
  createSQL: string;
  description: string;
}

/**
 * Check if a table exists by attempting a simple query
 */
export async function tableExists(tableName: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { error } = await supabaseAdmin.from(tableName).select("*").limit(1);

  // No error means table exists
  if (!error) return true;

  // Check for "table not found" type errors
  if (
    error.message?.includes("schema cache") ||
    error.message?.includes("does not exist") ||
    error.code === "42P01"
  ) {
    return false;
  }

  // Other errors (like RLS) still mean the table exists
  return true;
}

/**
 * Banner Alerts Table Schema
 */
export const bannerAlertsSchema: TableSchema = {
  name: "bannerAlerts",
  description: "Stores site-wide banner alerts for notifications",
  createSQL: `
-- Create bannerAlerts table
CREATE TABLE IF NOT EXISTS "bannerAlerts" (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  position TEXT DEFAULT 'top' CHECK (position IN ('top', 'bottom')),
  "expireMs" INTEGER,
  dismissible BOOLEAN DEFAULT true,
  "isActive" BOOLEAN DEFAULT true,
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  "targetPages" TEXT,
  "createdBy" UUID REFERENCES auth.users(id),
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE "bannerAlerts" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active banners
CREATE POLICY "Anyone can read active banners" ON "bannerAlerts"
  FOR SELECT USING ("isActive" = true);

-- Allow admins full access
CREATE POLICY "Admins have full access to bannerAlerts" ON "bannerAlerts"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );
`.trim(),
};

/**
 * All registered table schemas
 */
export const allSchemas: TableSchema[] = [bannerAlertsSchema];

/**
 * Get the SQL needed to create missing tables
 */
export async function getMissingTableSQL(): Promise<string[]> {
  const missingSQL: string[] = [];

  for (const schema of allSchemas) {
    const exists = await tableExists(schema.name);
    if (!exists) {
      missingSQL.push(`-- ${schema.description}\n${schema.createSQL}`);
    }
  }

  return missingSQL;
}

/**
 * Check if a specific table exists, return error message if not
 */
export async function ensureTable(
  schema: TableSchema
): Promise<{ exists: boolean; createSQL?: string }> {
  const exists = await tableExists(schema.name);

  if (exists) {
    return { exists: true };
  }

  return {
    exists: false,
    createSQL: schema.createSQL,
  };
}
