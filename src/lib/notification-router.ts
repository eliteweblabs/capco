import { supabaseAdmin } from "./supabase-admin";

/**
 * Check which users have SMS alerts enabled
 */
export async function checkUserSMSPreferences(userEmails: string[]): Promise<string[]> {
  try {
    if (!supabaseAdmin || userEmails.length === 0) {
      return [];
    }

    console.log("📱 [SMS-PREFERENCE] Checking SMS preferences for users:", userEmails);

    const { data: users, error } = await supabaseAdmin
      .from("profiles")
      .select("email, smsAlerts, phone")
      .in("email", userEmails)
      .eq("smsAlerts", true);

    if (error) {
      console.error("📱 [SMS-PREFERENCE] Error fetching user SMS preferences:", error);
      return [];
    }

    if (!users || users.length === 0) {
      console.log("📱 [SMS-PREFERENCE] No users have SMS alerts enabled");
      return [];
    }

    // Filter users who have both SMS alerts enabled AND a phone number
    const usersWithSMS = users
      .filter((user) => user.smsAlerts && user.phone)
      .map((user) => user.email);

    console.log("📱 [SMS-PREFERENCE] Users with SMS alerts and phone numbers:", usersWithSMS);
    return usersWithSMS;
  } catch (error) {
    console.error("📱 [SMS-PREFERENCE] Error checking SMS preferences:", error);
    return [];
  }
}

/**
 * Route users to appropriate notification methods based on their preferences
 */
export async function routeUsersByNotificationPreference(userEmails: string[]): Promise<{
  smsUsers: string[];
  emailUsers: string[];
}> {
  const usersWithSMS = await checkUserSMSPreferences(userEmails);
  const usersWithoutSMS = userEmails.filter((email) => !usersWithSMS.includes(email));

  return {
    smsUsers: usersWithSMS,
    emailUsers: usersWithoutSMS,
  };
}

/**
 * Send SMS notification to users with SMS preferences
 */
export async function sendSMSNotification(
  smsUsers: string[],
  subject: string,
  content: string,
  buttonLink?: string,
  buttonText?: string
): Promise<boolean> {
  if (smsUsers.length === 0) {
    return true;
  }

  try {
    console.log("📱 [SMS-NOTIFICATION] Sending SMS to users:", smsUsers);

    // Framework for SMS - implement based on provider
    const smsData = {
      to: smsUsers,
      message: content,
      provider: "twilio", // Default provider
      created_at: new Date().toISOString(),
    };

    // Store SMS request in database for processing
    if (!supabaseAdmin) {
      console.error("📱 [SMS-NOTIFICATION] Supabase client not available");
      return false;
    }

    const { error } = await supabaseAdmin.from("sms_queue").insert(smsData);

    if (error) {
      console.error("📱 [SMS-NOTIFICATION] Database error:", error);
      return false;
    }

    console.log("📱 [SMS-NOTIFICATION] SMS notification queued successfully");
    return true;
  } catch (error) {
    console.error("📱 [SMS-NOTIFICATION] Error sending SMS:", error);
    return false;
  }
}
