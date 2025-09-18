// Simplified Global Services - Only core functionality that's actually used
import { supabase } from "./supabase";

// Project Status Codes (for backward compatibility - only used in type definitions)
export const PROJECT_STATUS = {
  NEW_PROJECT_STARTED: 0,
  SPECS_RECEIVED: 10,
  GENERATING_PROPOSAL: 20,
  PROPOSAL_SHIPPED: 30,
  PROPOSAL_VIEWED: 40,
  PROPOSAL_SIGNED_OFF: 50,
  GENERATING_DEPOSIT_INVOICE: 60,
  DEPOSIT_INVOICE_SHIPPED: 70,
  DEPOSIT_INVOICE_VIEWED: 80,
  DEPOSIT_INVOICE_PAID: 90,
  GENERATING_SUBMITTALS: 100,
  SUBMITTALS_SHIPPED: 110,
  SUBMITTALS_VIEWED: 120,
  SUBMITTALS_SIGNED_OFF: 130,
  GENERATING_FINAL_INVOICE: 140,
  FINAL_INVOICE_SHIPPED: 150,
  FINAL_INVOICE_VIEWED: 160,
  FINAL_INVOICE_PAID: 170,
  GENERATING_FINAL_DELIVERABLES: 180,
  STAMPING_FINAL_DELIVERABLES: 190,
  FINAL_DELIVERABLES_SHIPPED: 200,
  FINAL_DELIVERABLES_VIEWED: 210,
  PROJECT_COMPLETE: 220,
} as const;

export type ProjectStatusCode = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

// Type definitions for notifications
export interface NotificationOptions {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface GlobalServiceEvent {
  type: string;
  data: any;
  source?: string;
}

// Simplified GlobalServices class - only core functionality
export class GlobalServices {
  private static instance: GlobalServices;
  private eventTarget: EventTarget;

  constructor() {
    // console.log("🌐 [GLOBAL] GlobalServices constructor called");
    this.eventTarget = new EventTarget();
    // console.log("🌐 [GLOBAL] GlobalServices initialized");
  }

  static getInstance(): GlobalServices {
    if (!GlobalServices.instance) {
      // console.log("🌐 [GLOBAL] Creating new GlobalServices instance");
      GlobalServices.instance = new GlobalServices();
    } else {
      // console.log("🌐 [GLOBAL] Returning existing GlobalServices instance");
    }
    return GlobalServices.instance;
  }

  emit(type: string, data: any, source?: string) {
    // console.log("🌐 [GLOBAL] Emitting event:", { type, data, source });
    const event = new CustomEvent("global-service", {
      detail: { type, data, source } as GlobalServiceEvent,
    });
    this.eventTarget.dispatchEvent(event);

    // Also dispatch to window for cross-component access
    if (typeof window !== "undefined") {
      // console.log("🌐 [GLOBAL] Dispatching to window:", `global:${type}`);
      window.dispatchEvent(new CustomEvent(`global:${type}`, { detail: data }));
    }
  }

  on(type: string, callback: (data: any) => void) {
    // console.log("🌐 [GLOBAL] Registering event listener for:", type);
    const handler = (event: CustomEvent<GlobalServiceEvent>) => {
      if (event.detail.type === type) {
        // console.log("🌐 [GLOBAL] Event handler called:", {
        //   type,
        //   data: event.detail.data,
        // });
        callback(event.detail.data);
      }
    };

    this.eventTarget.addEventListener("global-service", handler as EventListener);
    return () => {
      this.eventTarget.removeEventListener("global-service", handler as EventListener);
    };
  }

  async getCurrentUser() {
    try {
      if (!supabase) {
        throw new Error("Database not configured");
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("🌐 [GLOBAL] Error getting current user:", error);
        return null;
      }

      if (!user) {
        return null;
      }

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_name, first_name, last_name, email, phone, role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("🌐 [GLOBAL] Error fetching profile:", profileError);
        // Return user without profile data
        return user;
      }

      // Return user with profile data merged
      return {
        ...user,
        ...profile,
      };
    } catch (error) {
      console.error("🌐 [GLOBAL] Error in getCurrentUser:", error);
      return null;
    }
  }

  // Sign out - Used by some components
  async signOut() {
    try {
      if (!supabase) {
        throw new Error("Database not configured");
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("🌐 [GLOBAL] Error signing out:", error);
        throw error;
      }

      this.emit("auth:signout", {});
      // console.log("🌐 [GLOBAL] User signed out successfully");
    } catch (error) {
      // console.error("🌐 [GLOBAL] Error in signOut:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const globalServices = GlobalServices.getInstance();

// Export convenience functions for direct use
// showNotification removed - use centralized notifications from App.astro

export const emit = globalServices.emit.bind(globalServices);
export const on = globalServices.on.bind(globalServices);
