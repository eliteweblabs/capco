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

    console.log("📞 [GOOGLE-CONTACTS] Making request to Google People API");

    // Build the Google People API URL (matches our OAuth scope)
    const googleApiUrl = new URL("https://people.googleapis.com/v1/people/me/connections");
    googleApiUrl.searchParams.set(
      "personFields",
      "names,emailAddresses,phoneNumbers,organizations,addresses,photos,biographies,urls"
    );
    googleApiUrl.searchParams.set("pageSize", "1000");

    if (searchQuery) {
      googleApiUrl.searchParams.set("query", searchQuery);
    }

    // Make the request to Google People API
    const response = await fetch(googleApiUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${googleAccessToken}`,
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
    console.log("📞 [GOOGLE-CONTACTS] Google People API response:", {
      status: "OK",
      totalContacts: data.connections?.length || 0,
    });

    // Transform the Google People API data to match the expected format
    const contacts = (data.connections || []).map((contact: any) => {
      // Extract name
      const nameEntry = contact.names?.[0];
      const name = nameEntry
        ? `${nameEntry.givenName || ""} ${nameEntry.familyName || ""}`.trim() ||
          nameEntry.displayName ||
          "Unknown Contact"
        : "Unknown Contact";

      // Extract email
      const emailEntry = contact.emailAddresses?.[0];
      const email = emailEntry?.value || "";

      // Extract phone
      const phoneEntry = contact.phoneNumbers?.[0];
      const phone = phoneEntry?.value || "";

      // Extract organization
      const orgEntry = contact.organizations?.[0];
      const organization = orgEntry?.name || "";
      const jobTitle = orgEntry?.title || "";

      // Extract address
      const addressEntry = contact.addresses?.[0];
      const address = addressEntry
        ? [
            addressEntry.streetAddress,
            addressEntry.city,
            addressEntry.region,
            addressEntry.postalCode,
            addressEntry.country,
          ]
            .filter(Boolean)
            .join(", ")
        : "";

      // Extract photo URL
      const photoUrl = contact.photos?.[0]?.url || "";

      // Extract biography/notes
      const biography = contact.biographies?.[0]?.value || "";

      // Extract websites
      const websites = contact.urls?.map((url: any) => url.value) || [];

      // Create ID from contact resource name
      const id = contact.resourceName || Math.random().toString(36).substr(2, 9);

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
