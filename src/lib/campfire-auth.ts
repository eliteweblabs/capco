/**
 * Campfire Authentication Utility
 * Handles automatic authentication to Campfire chat for Staff and Admin users
 */

const CAMPFIRE_URL =
  process.env.PUBLIC_CAMPFIRE_URL ||
  process.env.CAMPFIRE_URL ||
  "https://campfire-production-8c1a.up.railway.app";

/**
 * Authenticate user to Campfire using their email and password
 * Returns a login URL or session cookies if successful
 */
export async function authenticateCampfire(
  email: string,
  password: string
): Promise<{ success: boolean; loginUrl?: string; cookies?: string[]; error?: string }> {
  try {
    console.log(`🔐 [CAMPFIRE-AUTH] Attempting to authenticate ${email} to Campfire...`);

    // Campfire typically uses POST to /session endpoint
    const loginUrl = `${CAMPFIRE_URL}/session`;

    // Create a form submission request
    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("password", password);

    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; Campfire-AutoLogin/1.0)",
      },
      body: formData.toString(),
      redirect: "manual", // Don't follow redirects automatically
    });

    // Check if login was successful (usually 302 redirect to dashboard)
    if (response.status === 302 || response.status === 303) {
      // Get the redirect location
      const location = response.headers.get("location");
      const redirectUrl = location
        ? location.startsWith("http")
          ? location
          : `${CAMPFIRE_URL}${location}`
        : `${CAMPFIRE_URL}/`;

      // Extract cookies from response
      const cookies = response.headers.get("set-cookie");
      const cookieArray = cookies ? cookies.split(",").map((c) => c.trim()) : [];

      console.log(
        `✅ [CAMPFIRE-AUTH] Successfully authenticated ${email} to Campfire, redirect: ${redirectUrl}`
      );

      return {
        success: true,
        loginUrl: redirectUrl,
        cookies: cookieArray,
      };
    } else if (response.status === 200) {
      // Check if we got an error page (usually 200 with error message)
      const text = await response.text();

      if (
        text.includes("Invalid") ||
        text.includes("error") ||
        text.includes("Error") ||
        text.includes("incorrect")
      ) {
        console.warn(
          `⚠️ [CAMPFIRE-AUTH] Campfire authentication failed for ${email}: Invalid credentials`
        );
        return {
          success: false,
          error: "Invalid Campfire credentials",
        };
      }

      // Might be successful but no redirect
      console.log(`✅ [CAMPFIRE-AUTH] Campfire authentication successful (status 200)`);
      const cookies = response.headers.get("set-cookie");
      const cookieArray = cookies ? cookies.split(",").map((c) => c.trim()) : [];

      return {
        success: true,
        loginUrl: `${CAMPFIRE_URL}/`,
        cookies: cookieArray,
      };
    } else {
      console.warn(`⚠️ [CAMPFIRE-AUTH] Campfire authentication returned status ${response.status}`);
      return {
        success: false,
        error: `Campfire authentication failed with status ${response.status}`,
      };
    }
  } catch (error) {
    console.error(`❌ [CAMPFIRE-AUTH] Error authenticating to Campfire:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if user should be auto-authenticated to Campfire
 * Only Staff and Admin roles should be auto-authenticated
 */
export function shouldAutoAuthCampfire(role: string | null | undefined): boolean {
  return role === "Admin" || role === "Staff";
}
