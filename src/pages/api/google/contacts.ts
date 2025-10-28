import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const searchQuery = url.searchParams.get("input") || "";
    console.log("📞 [GOOGLE-CONTACTS] Search query:", searchQuery);

    // Get the Google access token from cookies
    const googleAccessToken = cookies.get("google_access_token")?.value;
    if (!googleAccessToken) {
      console.error("📞 [GOOGLE-CONTACTS] No Google access token found in cookies");
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

    console.log("📞 [GOOGLE-CONTACTS] Using Google access token from cookies");

    console.log("📞 [GOOGLE-CONTACTS] Making request to Google Contacts API v3");

    // Build the Google Contacts API v3 URL (more permissive than People API)
    const googleApiUrl = new URL("https://www.google.com/m8/feeds/contacts/default/full");
    googleApiUrl.searchParams.set("alt", "json");
    googleApiUrl.searchParams.set("max-results", "1000");

    if (searchQuery) {
      googleApiUrl.searchParams.set("q", searchQuery);
    }

    // Make the request to Google Contacts API v3
    const response = await fetch(googleApiUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${googleAccessToken}`,
        "GData-Version": "3.0",
      },
    });

    if (!response.ok) {
      console.error("📞 [GOOGLE-CONTACTS] Google API error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("📞 [GOOGLE-CONTACTS] Error response:", errorText);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch contacts from Google",
          details: `Google API returned ${response.status}: ${response.statusText}`,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("📞 [GOOGLE-CONTACTS] Google API response:", {
      status: "OK",
      totalContacts: data.feed?.entry?.length || 0,
    });

    // Transform the Google Contacts v3 data to match the expected format
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

      // Extract additional fields
      const photoUrl = contact.gd$photo?.$t || "";
      const biography = contact.content?.$t || "";

      // Extract websites
      const websites = contact.gd$website?.map((w: any) => w.href) || [];

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

        // Additional contact data
        photoUrl: photoUrl,
        biography: biography,
        websites: websites,

        // All emails and phones (for multiple contact methods)
        allEmails:
          contact.gd$email?.map((e: any) => ({
            value: e.address,
            type: e.rel,
            primary: e.primary === "true",
          })) || [],
        allPhones:
          contact.gd$phoneNumber?.map((p: any) => ({
            value: p.$t,
            type: p.rel,
            primary: p.primary === "true",
          })) || [],

        // All organizations
        allOrganizations:
          contact.gd$organization?.map((o: any) => ({
            name: o.gd$orgName?.$t,
            title: o.gd$orgTitle?.$t,
            department: o.gd$orgDepartment?.$t,
            primary: o.primary === "true",
          })) || [],

        // All addresses
        allAddresses:
          contact.gd$structuredPostalAddress?.map((a: any) => ({
            formattedValue: a.gd$formattedAddress?.$t,
            streetAddress: a.gd$street?.$t,
            city: a.gd$city?.$t,
            region: a.gd$region?.$t,
            postalCode: a.gd$postcode?.$t,
            country: a.gd$country?.$t,
            primary: a.primary === "true",
          })) || [],

        // Raw contact data for advanced use cases
        rawContact: contact,
      };
    });

    console.log("📞 [GOOGLE-CONTACTS] Transformed contacts:", contacts.length);

    return new Response(
      JSON.stringify({
        success: true,
        contacts: contacts,
        total: contacts.length,
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
    console.error("📞 [GOOGLE-CONTACTS] Error:", error);

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
