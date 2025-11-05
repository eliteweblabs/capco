/**
 * Client-side Supabase singleton
 * Ensures only one Supabase client instance is created on the client-side
 * to avoid "Multiple GoTrueClient instances" warnings
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

/**
 * Get or create the singleton Supabase client for client-side use
 * This ensures only one GoTrueClient instance exists, preventing auth state conflicts
 */
export function getSupabaseClient(): SupabaseClient | null {
  // Only run on client-side
  if (typeof window === "undefined") {
    return null;
  }

  // Return existing instance if available
  if (clientInstance) {
    return clientInstance;
  }

  // Get configuration from environment
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
  const supabasePublishableKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE || "";

  if (!supabaseUrl || !supabasePublishableKey) {
    console.warn("[SUPABASE-CLIENT] Supabase configuration missing for client-side");
    return null;
  }

  // Create singleton instance
  clientInstance = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: window.localStorage, // Explicitly use localStorage
    },
  });

  return clientInstance;
}

/**
 * Reset the client instance (useful for testing or logout scenarios)
 */
export function resetSupabaseClient(): void {
  clientInstance = null;
}

