/**
 * AI Agent Usage Tracking API
 *
 * Get usage statistics for billing/monitoring
 *
 * GET /api/agent/usage - Get usage statistics
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const { isAuth, currentUser, currentRole } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isAdmin = currentRole === "Admin";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Build query
    let query = supabaseAdmin.from("ai_agent_usage").select("*");

    // Filter by user (unless admin viewing all)
    if (!isAdmin) {
      query = query.eq("userId", currentUser.id);
    }

    // Filter by date range if provided
    if (startDate) {
      query = query.gte("createdAt", startDate);
    }
    if (endDate) {
      query = query.lte("createdAt", endDate);
    }

    const { data: usage, error } = await query.order("createdAt", { ascending: false });

    if (error) {
      console.error("❌ [AGENT-USAGE] Error fetching usage:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch usage data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Calculate totals
    const totals = (usage || []).reduce(
      (acc, record) => {
        acc.totalTokens += record.totalTokens || 0;
        acc.totalCost += parseFloat(record.estimatedCost || 0);
        acc.totalRequests += 1;
        return acc;
      },
      { totalTokens: 0, totalCost: 0, totalRequests: 0 }
    );

    // Group by model
    const byModel = (usage || []).reduce((acc: any, record: any) => {
      const model = record.model || "unknown";
      if (!acc[model]) {
        acc[model] = { tokens: 0, cost: 0, requests: 0 };
      }
      acc[model].tokens += record.totalTokens || 0;
      acc[model].cost += parseFloat(record.estimatedCost || 0);
      acc[model].requests += 1;
      return acc;
    }, {});

    return new Response(
      JSON.stringify({
        success: true,
        usage: usage || [],
        totals,
        byModel,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-USAGE] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
