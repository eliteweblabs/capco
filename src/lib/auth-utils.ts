import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

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

    // Create profile
    const profileName =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email ||
      "User";

    console.log(
      "Creating profile for user:",
      user.id,
      "with name:",
      profileName,
    );

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        name: profileName,
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
