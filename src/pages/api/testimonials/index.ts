/**
 * Testimonials API
 * GET: List all testimonials (public)
 * POST: Create/update testimonial (Admin only)
 * DELETE: Delete testimonial (Admin only)
 * PUT: Reorder testimonials (Admin only)
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const GET: APIRoute = async () => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .select("*")
      .order("displayOrder", { ascending: true, nullsFirst: false });

    if (error) throw error;

    return new Response(JSON.stringify({ testimonials: data || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch testimonials";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

async function requireAdmin(cookies: Parameters<APIRoute>[0]["cookies"]) {
  const { isAuth, currentUser, supabase } = await checkAuth(cookies);
  if (!isAuth || !currentUser) {
    return { error: "Authentication required", status: 401 };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();
  if (profile?.role !== "Admin") {
    return { error: "Admin access required", status: 403 };
  }
  return { currentUser };
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const auth = await requireAdmin(cookies);
    if ("error" in auth) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { id, title, testimonial, name, company, image } = body;

    if (!testimonial || typeof testimonial !== "string") {
      return new Response(JSON.stringify({ error: "testimonial is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = {
      title: title || null,
      testimonial: testimonial.trim(),
      name: name || null,
      company: company || null,
      image: image || null,
      updatedAt: new Date().toISOString(),
    };

    let data;
    let error;

    if (id) {
      const result = await supabaseAdmin
        .from("testimonials")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await supabaseAdmin.from("testimonials").insert(payload).select().single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    return new Response(
      JSON.stringify({
        testimonial: data,
        message: id ? "Testimonial updated" : "Testimonial created",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to save testimonial";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request, url, cookies }) => {
  try {
    const auth = await requireAdmin(cookies);
    if ("error" in auth) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let id = url.searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        /* no body */
      }
    }

    if (!id) {
      return new Response(JSON.stringify({ error: "id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabaseAdmin.from("testimonials").delete().eq("id", id);

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Testimonial deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete testimonial";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const auth = await requireAdmin(cookies);
    if ("error" in auth) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { orders } = body;

    if (!orders || !Array.isArray(orders)) {
      return new Response(JSON.stringify({ error: "orders array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const promises = orders.map(
      (item: { id: string; display_order?: number; displayOrder?: number }) => {
        const displayOrder = item.displayOrder ?? item.display_order ?? 0;
        return supabaseAdmin.from("testimonials").update({ displayOrder }).eq("id", item.id);
      }
    );

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: "Reorder failed", details: errors }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Order updated" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to reorder";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
