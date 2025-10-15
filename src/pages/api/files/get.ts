import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Files GET API
 *
 * Query Parameters:
 * - id: Get specific file by ID
 * - projectId: Filter by project ID
 * - fileName: Filter by file name (partial match)
 * - fileType: Filter by file type/extension
 * - isPrivate: Filter by privacy setting (true/false)
 * - authorId: Filter by file author
 * - limit: Number of results (default: 20, max: 100)
 * - offset: Number to skip (default: 0)
 * - sortBy: Sort field (default: updatedAt)
 * - sortOrder: Sort direction (asc/desc, default: desc)
 * - includeTotal: Include total count (true/false, default: false)
 *
 * Examples:
 * - /api/files?projectId=123&fileType=pdf
 * - /api/files?id=456
 * - /api/files?fileName=contract&isPrivate=false
 */

interface FileFilters {
  id?: string;
  projectId?: string;
  fileName?: string;
  fileType?: string;
  isPrivate?: boolean;
  authorId?: string;
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
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query parameters
    const filters: FileFilters = {
      id: url.searchParams.get("id") || undefined,
      projectId: url.searchParams.get("projectId") || undefined,
      fileName: url.searchParams.get("fileName") || undefined,
      fileType: url.searchParams.get("fileType") || undefined,
      isPrivate:
        url.searchParams.get("isPrivate") === "true"
          ? true
          : url.searchParams.get("isPrivate") === "false"
            ? false
            : undefined,
      authorId: url.searchParams.get("authorId") || undefined,
      limit: Math.min(parseInt(url.searchParams.get("limit") || "20"), 100),
      offset: parseInt(url.searchParams.get("offset") || "0"),
      sortBy: url.searchParams.get("sortBy") || "updatedAt",
      sortOrder: url.searchParams.get("sortOrder") || "desc",
      includeTotal: url.searchParams.get("includeTotal") === "true",
    };

    console.log(`📁 [FILES-GET] Fetching files with filters:`, filters);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if requesting specific file
    if (filters.id) {
      const { data: file, error } = await supabase
        .from("files")
        .select("*")
        .eq("id", filters.id)
        .single();

      if (error || !file) {
        return new Response(JSON.stringify({ error: "File not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          data: file,
          pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build query for multiple files
    let query = supabase!.from("files").select("*");

    // Apply filters
    if (filters.projectId) {
      query = query.eq("projectId", filters.projectId);
    }

    if (filters.fileName) {
      query = query.ilike("fileName", `%${filters.fileName}%`);
    }

    if (filters.fileType) {
      query = query.ilike("fileName", `%.${filters.fileType}`);
    }

    if (filters.isPrivate !== undefined) {
      query = query.eq("isPrivate", filters.isPrivate);
    }

    if (filters.authorId) {
      query = query.eq("authorId", filters.authorId);
    }

    // Apply sorting
    const ascending = filters.sortOrder === "asc";
    query = query.order(filters.sortBy, { ascending });

    // Apply pagination
    query = query.range(filters.offset || 0, filters.offset || 0 + filters.limit || 20 - 1);

    // Get total count if requested
    let totalCount = null;
    if (filters.includeTotal) {
      let countQuery = supabase!.from("files").select("*", { count: "exact", head: true });

      if (filters.projectId) {
        countQuery = countQuery.eq("projectId", filters.projectId);
      }
      if (filters.fileName) {
        countQuery = countQuery.ilike("fileName", `%${filters.fileName}%`);
      }
      if (filters.fileType) {
        countQuery = countQuery.ilike("fileName", `%.${filters.fileType}`);
      }
      if (filters.isPrivate !== undefined) {
        countQuery = countQuery.eq("isPrivate", filters.isPrivate);
      }
      if (filters.authorId) {
        countQuery = countQuery.eq("authorId", filters.authorId);
      }

      const { count } = await countQuery;
      totalCount = count;
    }

    // Execute query
    const { data: files, error } = await query;

    if (error) {
      console.error("❌ [FILES-GET] Error fetching files:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch files",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const hasMore = files.length === filters.limit || 20;

    return new Response(
      JSON.stringify({
        data: files || [],
        pagination: {
          limit: filters.limit || 20,
          offset: filters.offset || 0,
          total: totalCount,
          hasMore,
        },
        filters: {
          projectId: filters.projectId,
          fileName: filters.fileName,
          fileType: filters.fileType,
          isPrivate: filters.isPrivate,
          authorId: filters.authorId,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [FILES-GET] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
