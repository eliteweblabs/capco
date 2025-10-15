import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Appointments GET API for AI Virtual Agent
 * 
 * Query Parameters:
 * - id: Get specific appointment by ID
 * - calUid: Get appointment by Cal.com UID
 * - attendeeEmail: Filter by attendee email
 * - status: Filter by status (ACCEPTED, PENDING, CANCELLED, etc.)
 * - startDate: Filter appointments from this date (ISO format)
 * - endDate: Filter appointments to this date (ISO format)
 * - limit: Number of results (default: 20, max: 100)
 * - offset: Number to skip (default: 0)
 * - sortBy: Sort field (default: startTime)
 * - sortOrder: Sort direction (asc/desc, default: asc)
 * - includeTotal: Include total count (true/false, default: false)
 * 
 * Examples:
 * - /api/appointments?attendeeEmail=user@example.com&status=ACCEPTED
 * - /api/appointments?startDate=2024-01-01&endDate=2024-01-31
 * - /api/appointments?calUid=abc123
 */

interface AppointmentFilters {
  id?: string;
  calUid?: string;
  attendeeEmail?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
  includeTotal?: boolean;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse query parameters
    const filters: AppointmentFilters = {
      id: url.searchParams.get("id") || undefined,
      calUid: url.searchParams.get("calUid") || undefined,
      attendeeEmail: url.searchParams.get("attendeeEmail") || undefined,
      status: url.searchParams.get("status") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      limit: Math.min(parseInt(url.searchParams.get("limit") || "20"), 100),
      offset: parseInt(url.searchParams.get("offset") || "0"),
      sortBy: url.searchParams.get("sortBy") || "startTime",
      sortOrder: url.searchParams.get("sortOrder") || "asc",
      includeTotal: url.searchParams.get("includeTotal") === "true",
    };

    console.log(`📅 [APPOINTMENTS-GET] Fetching appointments with filters:`, filters);

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Database connection not available" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if requesting specific appointment
    if (filters.id) {
      const { data: appointment, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", filters.id)
        .single();

      if (error || !appointment) {
        return new Response(
          JSON.stringify({ error: "Appointment not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          data: appointment,
          pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if requesting by Cal.com UID
    if (filters.calUid) {
      const { data: appointment, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("calUid", filters.calUid)
        .single();

      if (error || !appointment) {
        return new Response(
          JSON.stringify({ error: "Appointment not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          data: appointment,
          pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build query for multiple appointments
    let query = supabase.from("appointments").select("*");

    // Apply filters
    if (filters.attendeeEmail) {
      query = query.eq("attendeeEmail", filters.attendeeEmail);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.startDate) {
      query = query.gte("startTime", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("startTime", filters.endDate);
    }

    // Apply sorting
    const ascending = filters.sortOrder === "asc";
    query = query.order(filters.sortBy, { ascending });

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    // Get total count if requested
    let totalCount = null;
    if (filters.includeTotal) {
      let countQuery = supabase.from("appointments").select("*", { count: "exact", head: true });
      
      if (filters.attendeeEmail) {
        countQuery = countQuery.eq("attendeeEmail", filters.attendeeEmail);
      }
      if (filters.status) {
        countQuery = countQuery.eq("status", filters.status);
      }
      if (filters.startDate) {
        countQuery = countQuery.gte("startTime", filters.startDate);
      }
      if (filters.endDate) {
        countQuery = countQuery.lte("startTime", filters.endDate);
      }

      const { count } = await countQuery;
      totalCount = count;
    }

    // Execute query
    const { data: appointments, error } = await query;

    if (error) {
      console.error("❌ [APPOINTMENTS-GET] Error fetching appointments:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch appointments",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const hasMore = appointments.length === filters.limit;

    return new Response(
      JSON.stringify({
        data: appointments || [],
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: totalCount,
          hasMore,
        },
        filters: {
          attendeeEmail: filters.attendeeEmail,
          status: filters.status,
          startDate: filters.startDate,
          endDate: filters.endDate,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [APPOINTMENTS-GET] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
