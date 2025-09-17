// Simplified Global Services - Only core functionality that's actually used
import { supabase } from "./supabase";

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

  // Event Management - Used by project-service.ts and various components
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

  // User Management - Used by project-service.ts
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
