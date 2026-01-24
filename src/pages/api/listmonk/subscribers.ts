/**
 * Listmonk Subscribers API Endpoint
 * Proxies requests to Listmonk to keep credentials server-side
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
    const query = url.searchParams.get("query") || undefined;
    const list_id = url.searchParams.get("list_id")
      ? parseInt(url.searchParams.get("list_id")!)
      : undefined;
    const page = url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!) : undefined;
    const per_page = url.searchParams.get("per_page")
      ? parseInt(url.searchParams.get("per_page")!)
      : undefined;

    // Get subscribers from Listmonk
    const result = await listmonk.subscribers.list({
      query,
      list_id,
      page,
      per_page,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch subscribers" }), {
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
    const result = await listmonk.subscribers.create(body);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating subscriber:", error);
    return new Response(JSON.stringify({ error: "Failed to create subscriber" }), {
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
    const { id, ...subscriberData } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Subscriber ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await listmonk.subscribers.update(id, subscriberData);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating subscriber:", error);
    return new Response(JSON.stringify({ error: "Failed to update subscriber" }), {
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
      return new Response(JSON.stringify({ error: "Subscriber ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await listmonk.subscribers.delete(parseInt(id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    return new Response(JSON.stringify({ error: "Failed to delete subscriber" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
