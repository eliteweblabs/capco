/**
 * Client-side Supabase singleton
 * Ensures only one Supabase client instance is created on the client-side
 * to avoid "Multiple GoTrueClient instances" warnings
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

/**
 * Custom storage wrapper that provides better debugging for auth state
 */
const createAuthStorage = () => {
  return {
    getItem: (key: string): string | null => {
      try {
        const value = window.localStorage.getItem(key);
        // Only log for auth-related keys during debugging
        if (key.includes("code-verifier") || key.includes("auth-token")) {
          console.log(`[SUPABASE-STORAGE] getItem(${key}):`, value ? "found" : "not found");
        }
        return value;
      } catch (error) {
        console.error(`[SUPABASE-STORAGE] Error reading ${key}:`, error);
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        window.localStorage.setItem(key, value);
        if (key.includes("code-verifier")) {
          console.log(`[SUPABASE-STORAGE] setItem(${key}): stored code verifier`);
        }
      } catch (error) {
        console.error(`[SUPABASE-STORAGE] Error writing ${key}:`, error);
      }
    },
    removeItem: (key: string): void => {
      try {
        window.localStorage.removeItem(key);
        if (key.includes("code-verifier")) {
          console.log(`[SUPABASE-STORAGE] removeItem(${key}): removed code verifier`);
        }
      } catch (error) {
        console.error(`[SUPABASE-STORAGE] Error removing ${key}:`, error);
      }
    },
  };
};

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

  // Create singleton instance with custom storage for better debugging
  clientInstance = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: createAuthStorage(),
      storageKey: `sb-${supabaseUrl.split("//")[1].split(".")[0]}-auth-token`,
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
