/**
 * Listmonk Campaigns API Endpoint
 * Proxies campaign management requests to Listmonk
 */
import type { APIRoute } from "astro";
import { listmonk } from "../../../lib/listmonk";
import { checkAuth } from "../../../lib/auth";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, session } = await checkAuth(cookies);
    if (!session || !currentUser || currentUser?.profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    // Get specific campaign or list all
    if (id) {
      const result = await listmonk.campaigns.get(parseInt(id));
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const query = url.searchParams.get("query") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const page = url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!) : undefined;
    const per_page = url.searchParams.get("per_page")
      ? parseInt(url.searchParams.get("per_page")!)
      : undefined;

    const result = await listmonk.campaigns.list({
      query,
      status,
      page,
      per_page,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch campaigns" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, session } = await checkAuth(cookies);
    if (!session || !currentUser || currentUser?.profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const result = await listmonk.campaigns.create(body);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return new Response(JSON.stringify({ error: "Failed to create campaign" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, session } = await checkAuth(cookies);
    if (!session || !currentUser || currentUser?.profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { id, ...campaignData } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Campaign ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await listmonk.campaigns.update(id, campaignData);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return new Response(JSON.stringify({ error: "Failed to update campaign" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, session } = await checkAuth(cookies);
    if (!session || !currentUser || currentUser?.profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Campaign ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await listmonk.campaigns.delete(parseInt(id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return new Response(JSON.stringify({ error: "Failed to delete campaign" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
