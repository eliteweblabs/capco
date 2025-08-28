import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * Ensures that a user has a profile record.
 * This function checks if a profile exists for the user, and creates one if it doesn't.
 * This handles cases where:
 * - OAuth users sign in for the first time
 * - Database triggers didn't fire properly
 * - Profile was accidentally deleted
 */
export async function ensureUserProfile(user: User): Promise<void> {
  try {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existingProfile) {
      console.log("Profile already exists for user:", user.id);
      return;
    }

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found", other errors are concerning
      console.error("Error checking existing profile:", checkError);
      return;
    }

    // Create profile with enhanced data - prioritize display_name
    const firstName = user.user_metadata?.first_name || "";
    const lastName = user.user_metadata?.last_name || "";
    const displayName = user.user_metadata?.display_name || "";
    const fullName =
      user.user_metadata?.full_name || (firstName && lastName ? `${firstName} ${lastName}` : "");

    // Priority: display_name > full_name > constructed name > OAuth name > email > fallback
    const profileName = displayName || fullName || user.user_metadata?.name || user.email || "User";

    const phone = user.user_metadata?.phone || "";

    console.log("Creating profile for user:", user.id, "with enhanced data:", {
      name: profileName,
      firstName,
      lastName,
      displayName,
      phone: phone ? "provided" : "not provided",
    });

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        name: profileName, // Use display_name as the main name field
        phone: phone,
        role: "Client",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating profile:", createError);
      return;
    }

    console.log("Profile created successfully:", newProfile);
  } catch (error) {
    console.error("Unexpected error in ensureUserProfile:", error);
  }
}
