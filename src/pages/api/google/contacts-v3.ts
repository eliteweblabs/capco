import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const searchQuery = url.searchParams.get("input") || "";
    console.log("📞 [GOOGLE-CONTACTS-V3] Search query:", searchQuery);

    // Get the Google access token from cookies
    const googleAccessToken = cookies.get("google_access_token")?.value;
    if (!googleAccessToken) {
      console.error("📞 [GOOGLE-CONTACTS-V3] No Google access token found in cookies");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Google access token not available",
          message: "Please authenticate with Google first",
          authUrl: "/api/google/signin",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("📞 [GOOGLE-CONTACTS-V3] Using Google access token from cookies");

    // Try Google Contacts API v3 (older API, more permissive)
    const contactsApiUrl = new URL("https://www.google.com/m8/feeds/contacts/default/full");
    contactsApiUrl.searchParams.set("alt", "json");
    contactsApiUrl.searchParams.set("max-results", "1000");

    if (searchQuery) {
      contactsApiUrl.searchParams.set("q", searchQuery);
    }

    console.log("📞 [GOOGLE-CONTACTS-V3] Making request to Google Contacts API v3");

    // Make the request to Google Contacts API v3
    const response = await fetch(contactsApiUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${googleAccessToken}`,
        "GData-Version": "3.0",
      },
    });

    if (!response.ok) {
      console.error(
        "📞 [GOOGLE-CONTACTS-V3] Google API error:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error("📞 [GOOGLE-CONTACTS-V3] Error response:", errorText);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch contacts from Google",
          details: `Google API returned ${response.status}: ${response.statusText}`,
          suggestion: "Try updating your OAuth consent screen configuration",
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("📞 [GOOGLE-CONTACTS-V3] Google API response:", {
      status: "OK",
      totalContacts: data.feed?.entry?.length || 0,
    });

    // Transform the Google Contacts v3 data
    const contacts = (data.feed?.entry || []).map((contact: any) => {
      // Extract name
      const name = contact.title?.$t || "Unknown Contact";

      // Extract email
      const emailEntry = contact.gd$email?.[0];
      const email = emailEntry?.address || "";

      // Extract phone
      const phoneEntry = contact.gd$phoneNumber?.[0];
      const phone = phoneEntry?.$t || "";

      // Extract organization
      const orgEntry = contact.gd$organization?.[0];
      const organization = orgEntry?.gd$orgName?.$t || "";
      const jobTitle = orgEntry?.gd$orgTitle?.$t || "";

      // Extract address
      const addressEntry = contact.gd$structuredPostalAddress?.[0];
      const address = addressEntry?.gd$formattedAddress?.$t || "";

      // Create ID from contact ID
      const id = contact.id?.$t?.split("/").pop() || Math.random().toString(36).substr(2, 9);

      return {
        // Basic identification
        id: id,
        name: name,
        value: id,
        label: name,

        // Contact information
        email: email,
        phone: phone,
        organization: organization,
        address: address,

        // Extended name fields
        firstName: name.split(" ")[0] || "",
        lastName: name.split(" ").slice(1).join(" ") || "",
        fullName: name,

        // Extended contact fields
        emailAddress: email,
        phoneNumber: phone,
        streetAddress: address,
        company: organization,
        jobTitle: jobTitle,

        // Raw contact data
        rawContact: contact,
      };
    });

    console.log("📞 [GOOGLE-CONTACTS-V3] Transformed contacts:", contacts.length);

    return new Response(
      JSON.stringify({
        success: true,
        contacts: contacts,
        total: contacts.length,
        apiVersion: "v3",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("📞 [GOOGLE-CONTACTS-V3] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
