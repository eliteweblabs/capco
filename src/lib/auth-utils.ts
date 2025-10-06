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
    const firstName = user.user_metadata?.firstName || "";
    const lastName = user.user_metadata?.lastName || "";
    const companyName = user.user_metadata?.companyName || "";
    const avatarUrl = user.user_metadata?.avatarUrl || user.user_metadata?.picture || null;

    console.log("Creating missing profile for user:", user.id, "with data:", {
      email: user.email,
      companyName: companyName,
      firstName,
      lastName,
      avatarUrl,
    });

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        companyName: companyName,
        role: "Client",
        firstName: firstName,
        lastName: lastName,
        avatarUrl: avatarUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
