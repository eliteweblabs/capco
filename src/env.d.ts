/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Supabase - Primary (required)
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  
  // Supabase - Client-side (optional, fallback to above)
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  
  // Email configuration
  readonly EMAIL_PROVIDER?: string;
  readonly EMAIL_API_KEY?: string;
  readonly SMTP_HOST?: string;
  readonly SMTP_PORT?: string;
  readonly SMTP_SECURE?: string;
  readonly SMTP_USER?: string;
  readonly SMTP_PASS?: string;
  readonly FROM_EMAIL?: string;
  readonly FROM_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    email?: string;
    user?: import('@supabase/supabase-js').User;
    role?: string;
  }
}

// Global window object extensions
declare global {
  interface Window {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    USER_DATA?: {
      id: string;
      email: string;
    };
  }
}
