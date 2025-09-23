import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * MIGRATION TOOL: Creates profile for existing users who don't have one.
 * This is a one-time migration function for users created before the auth trigger was implemented.
 * New users will automatically get profiles created by the database trigger.
 *
 * Use this only for:
 * - One-time migration of existing users
 * - Manual profile creation for specific cases
 * - Recovery from accidental profile deletion
 */
export async function createMissingUserProfile(user: User): Promise<void> {
  if (!supabase) {
    console.error("Supabase client not available");
    return;
  }

  try {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existingProfile) {
      console.log("Profile already exists for user:", user.id, "- no action needed");
      return;
    }

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found", other errors are concerning
      console.error("Error checking existing profile:", checkError);
      return;
    }

    // Create profile with user data
    const firstName = user.user_metadata?.first_name || "";
    const lastName = user.user_metadata?.last_name || "";
    const companyName = user.user_metadata?.company_name || "";

    console.log("Creating missing profile for user:", user.id, "with data:", {
      email: user.email,
      company_name: companyName,
      firstName,
      lastName,
    });

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        company_name: companyName,
        role: "Client",
        first_name: firstName,
        last_name: lastName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating profile:", createError);
      return;
    }

    console.log("Missing profile created successfully:", newProfile);
  } catch (error) {
    console.error("Unexpected error in createMissingUserProfile:", error);
  }
}
