import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { verifyFileExistsAndCleanupIfMissing } from "../../../lib/media";
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
  bucketName?: string;
  targetLocation?: string;
  status?: string;
  metadata?: Record<string, any>;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
  includeTotal?: boolean;
  // Compound filter support
  andFilters?: Array<{
    field: string;
    value: any;
    operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in";
  }>;
}

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const traceId =
    request.headers.get("x-trace-id") ||
    `files-get-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const traceName = request.headers.get("x-trace-name") || "api.files.get";
  const json = (payload: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: {
        "Content-Type": "application/json",
        "x-trace-id": traceId,
        "x-trace-name": traceName,
      },
    });
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return json({ error: "Authentication required" }, 401);
    }

    // console.log("📁 [FILES-GET] Processing GET request");
    // console.log("📁 [FILES-GET] URL:", url.toString());
    // console.log("📁 [FILES-GET] Search params:", Object.fromEntries(url.searchParams.entries()));

    if (!supabase) {
      return json({ error: "Database connection not available" }, 500);
    }

    // Parse URL parameters
    const filters: FileFilters = {
      // Basic filters from URL parameters
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
      bucketName: url.searchParams.get("bucketName") || undefined,
      targetLocation: url.searchParams.get("targetLocation") || undefined,
      status: url.searchParams.get("status") || undefined,

      // Pagination and sorting
      limit: Math.min(parseInt(url.searchParams.get("limit") || "20"), 100),
      offset: parseInt(url.searchParams.get("offset") || "0"),
      sortBy: url.searchParams.get("sortBy") || "updatedAt",
      sortOrder: url.searchParams.get("sortOrder") || "desc",
      includeTotal: url.searchParams.get("includeTotal") === "true",
    };

    // console.log("📁 [FILES-GET] Parsed filters:", filters);

    // Validate projectId if provided
    if (filters.projectId) {
      const projectIdNum = parseInt(filters.projectId);
      if (isNaN(projectIdNum)) {
        return json(
          {
            error: "Invalid projectId",
            details: "projectId must be a valid integer",
            code: "INVALID_PROJECT_ID",
            hint: "Provide a numeric project ID",
          },
          400
        );
      }
    }

    // Build query for multiple files
    let query = supabase!.from("files").select("*").not("id", "is", null);
    // console.log("📁 [FILES-GET] Starting with base query");

    // Apply filters
    if (filters.projectId) {
      const projectIdNum = parseInt(filters.projectId);
      query = query.eq("projectId", projectIdNum);
      // console.log("📁 [FILES-GET] Added projectId filter:", projectIdNum);
    }

    if (filters.fileName) {
      query = query.ilike("fileName", `%${filters.fileName}%`);
      // console.log("📁 [FILES-GET] Added fileName filter:", filters.fileName);
    }

    if (filters.fileType) {
      query = query.ilike("fileName", `%.${filters.fileType}`);
      // console.log("📁 [FILES-GET] Added fileType filter:", filters.fileType);
    }

    if (filters.isPrivate !== undefined) {
      query = query.eq("isPrivate", filters.isPrivate);
      // console.log("📁 [FILES-GET] Added isPrivate filter:", filters.isPrivate);
    }

    if (filters.authorId) {
      query = query.eq("authorId", filters.authorId);
      // console.log("📁 [FILES-GET] Added authorId filter:", filters.authorId);
    }

    if (filters.targetLocation) {
      query = query.eq("targetLocation", filters.targetLocation);
      // console.log("📁 [FILES-GET] Added targetLocation filter:", filters.targetLocation);
    }

    if (filters.bucketName) {
      query = query.eq("bucketName", filters.bucketName);
      // console.log("📁 [FILES-GET] Added bucketName filter:", filters.bucketName);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
      // console.log("📁 [FILES-GET] Added status filter:", filters.status);
    }

    // Apply compound filters if provided
    if (filters.andFilters && filters.andFilters.length > 0) {
      for (const filter of filters.andFilters) {
        switch (filter.operator) {
          case "eq":
            query = query.eq(filter.field, filter.value);
            break;
          case "neq":
            query = query.neq(filter.field, filter.value);
            break;
          case "gt":
            query = query.gt(filter.field, filter.value);
            break;
          case "gte":
            query = query.gte(filter.field, filter.value);
            break;
          case "lt":
            query = query.lt(filter.field, filter.value);
            break;
          case "lte":
            query = query.lte(filter.field, filter.value);
            break;
          case "like":
            query = query.like(filter.field, filter.value);
            break;
          case "ilike":
            query = query.ilike(filter.field, filter.value);
            break;
          case "in":
            query = query.in(filter.field, filter.value);
            break;
        }
      }
    }

    // Apply sorting
    query = query.order(filters.sortBy || "updatedAt", {
      ascending: (filters.sortOrder || "desc") === "asc",
    });

    // Apply pagination
    query = query.range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

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
      if (filters.targetLocation) {
        countQuery = countQuery.eq("targetLocation", filters.targetLocation);
      }

      const { count } = await countQuery;
      totalCount = count;
    }

    // Execute query
    // console.log("📁 [FILES-GET] Executing query...");
    const { data: files, error } = await query;

    if (error) {
      console.error("❌ [FILES-GET] Database error:", error);
      return json(
        {
          error: "Database query failed",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        500
      );
    }

    // console.log(`✅ [FILES-GET] Retrieved ${files?.length || 0} files`);
    if (files && files.length > 0) {
      // console.log("📁 [FILES-GET] Sample file data:", files[0]);
    } else {
      console.log("📁 [FILES-GET] No files found with current filters");
    }

    // Get featured image ID from project to mark which file is featured
    let featuredImageId: number | null = null;
    if (filters.projectId && files && files.length > 0) {
      try {
        const { data: projectData } = await supabaseAdmin!
          .from("projects")
          .select("featuredImageData")
          .eq("id", parseInt(filters.projectId))
          .single();

        featuredImageId = projectData?.featuredImageData?.id ?? null;
        // console.log(`📁 [FILES-GET] Project ${filters.projectId} featuredImageId:`, featuredImageId);
      } catch (projectError) {
        console.warn("⚠️ [FILES-GET] Could not fetch project featured image:", projectError);
      }
    }

    // Get checkout status from files table (it already has checkedOutBy columns)
    // Enrich with user names for checked out files
    const fileIds = (files || []).map((f) => f.id);
    let checkoutMap = new Map();

    if (fileIds.length > 0 && files && files.some((f) => f.checkedOutBy)) {
      try {
        // Get unique user IDs who have files checked out
        const checkedOutByIds = [
          ...new Set((files || []).filter((f) => f.checkedOutBy).map((f) => f.checkedOutBy)),
        ];

        if (checkedOutByIds.length > 0) {
          const { data: profiles } = await supabaseAdmin!
            .from("profiles")
            .select("id, firstName, lastName, companyName, email")
            .in("id", checkedOutByIds);

          if (profiles) {
            profiles.forEach((profile) => {
              const displayName =
                profile.companyName ||
                `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
                profile.email;
              checkoutMap.set(profile.id, displayName);
            });
          }
        }
      } catch (profileError) {
        console.warn("⚠️ [FILES-GET] Could not fetch user profiles:", profileError);
        // Continue without profile names
      }
    }

    // Filter out any files with invalid IDs (safety check)
    const validFiles = (files || []).filter(
      (file) => file.id && Number.isInteger(file.id) && file.id > 0
    );

    if (validFiles.length < (files || []).length) {
      console.warn(
        `⚠️ [FILES-GET] Filtered out ${(files || []).length - validFiles.length} files with invalid IDs`
      );
    }

    // Generate signed URLs for each file and add checkout name + featured status
    // Verify each file exists in storage; remove orphaned DB records if missing
    const filesWithUrlsRaw = await Promise.all(
      validFiles.map(async (file) => {
        const checked_out_by_name = file.checkedOutBy
          ? checkoutMap.get(file.checkedOutBy) || "Unknown"
          : null;

        // Check if this file is the featured image
        const isFeatured = featuredImageId != null && file.id === featuredImageId;

        if (!file.bucketName || !file.filePath) {
          return { ...file, checked_out_by_name, isFeatured, publicUrl: null };
        }

        if (supabaseAdmin) {
          const exists = await verifyFileExistsAndCleanupIfMissing(supabaseAdmin, {
            id: file.id,
            bucketName: file.bucketName,
            filePath: file.filePath,
            projectId: file.projectId,
          });
          if (!exists) return null;
        }

        try {
          const { data: urlData } = supabaseAdmin!.storage
            .from(file.bucketName)
            .getPublicUrl(file.filePath);

          return {
            ...file,
            checked_out_by_name,
            isFeatured,
            publicUrl: urlData?.publicUrl || null,
          };
        } catch (urlError) {
          console.error(
            `❌ [FILES-GET] Failed to generate public URL for file ${file.id}:`,
            urlError
          );
          return { ...file, checked_out_by_name, isFeatured, publicUrl: null };
        }
      })
    );
    const filesWithUrls = filesWithUrlsRaw.filter((f): f is NonNullable<typeof f> => f != null);

    // Return response
    return json(
      {
        success: true,
        data: filesWithUrls || [],
        pagination: {
          limit: filters.limit || 20,
          offset: filters.offset || 0,
          total: totalCount,
          hasMore: totalCount ? (filters.offset || 0) + (filters.limit || 20) < totalCount : null,
        },
        filters: {
          projectId: filters.projectId,
          fileName: filters.fileName,
          fileType: filters.fileType,
          isPrivate: filters.isPrivate,
          authorId: filters.authorId,
          bucketName: filters.bucketName,
          targetLocation: filters.targetLocation,
          status: filters.status,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        },
      },
      200
    );
  } catch (error) {
    console.error("❌ [FILES-GET] Unexpected error:", error);
    return json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const traceId =
    request.headers.get("x-trace-id") ||
    `files-get-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const traceName = request.headers.get("x-trace-name") || "api.files.get.post";
  const json = (payload: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: {
        "Content-Type": "application/json",
        "x-trace-id": traceId,
        "x-trace-name": traceName,
      },
    });
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return json({ error: "Authentication required" }, 401);
    }

    // Parse request body and URL parameters
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // Merge URL parameters and body, with body taking precedence
    const filters: FileFilters = {
      // Basic filters - can come from either URL or body
      id: body.id || url.searchParams.get("id") || undefined,
      projectId: body.projectId || url.searchParams.get("projectId") || undefined,
      fileName: body.fileName || url.searchParams.get("fileName") || undefined,
      fileType: body.fileType || url.searchParams.get("fileType") || undefined,
      isPrivate:
        body.isPrivate !== undefined
          ? body.isPrivate
          : url.searchParams.get("isPrivate") === "true"
            ? true
            : url.searchParams.get("isPrivate") === "false"
              ? false
              : undefined,
      authorId: body.authorId || url.searchParams.get("authorId") || undefined,
      bucketName: body.bucketName || url.searchParams.get("bucketName") || undefined,
      targetLocation: body.targetLocation || url.searchParams.get("targetLocation") || undefined,
      status: body.status || url.searchParams.get("status") || undefined,

      // Pagination and sorting
      limit: Math.min(parseInt(body.limit || url.searchParams.get("limit") || "20"), 100),
      offset: parseInt(body.offset || url.searchParams.get("offset") || "0"),
      sortBy: body.sortBy || url.searchParams.get("sortBy") || "updatedAt",
      sortOrder: body.sortOrder || url.searchParams.get("sortOrder") || "desc",
      includeTotal: body.includeTotal || url.searchParams.get("includeTotal") === "true",

      // Complex filters - prefer body over URL params
      andFilters: body.andFilters || undefined,
      metadata: body.metadata || undefined,
    };

    console.log(`📁 [FILES-GET] Fetching files with filters:`, filters);

    if (!supabase) {
      return json({ error: "Database connection not available" }, 500);
    }

    // Check if requesting specific file
    if (filters.id) {
      const { data: file, error } = await supabase
        .from("files")
        .select("*")
        .eq("id", filters.id)
        .single();

      if (error || !file) {
        return json({ error: "File not found" }, 404);
      }

      return json(
        {
          data: file,
          pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
        },
        200
      );
    }

    // Build query for multiple files
    // Build query with all needed fields
    // Start with a simple query first
    let query = supabase!.from("files").select("*").not("id", "is", null);

    // Log the table structure to help debug
    // console.log("📁 [FILES-GET] Checking table structure...");
    const { data: tableInfo, error: tableError } = await supabase!
      .from("files")
      .select("*")
      .limit(1);

    if (tableError) {
      console.error("❌ [FILES-GET] Error checking table:", tableError);
    } else {
      // console.log(
      //   "📁 [FILES-GET] Table columns:",
      //   tableInfo ? Object.keys(tableInfo[0]) : "No data"
      // );
    }

    // Apply basic filters
    if (filters.projectId) {
      const projectIdNum = parseInt(filters.projectId);
      if (isNaN(projectIdNum)) {
        console.error("❌ [FILES-GET] Invalid projectId:", filters.projectId);
        return json(
          {
            error: "Invalid project ID",
            details: "Project ID must be a number",
            value: filters.projectId,
          },
          400
        );
      }
      query = query.eq("projectId", projectIdNum);
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

    if (filters.targetLocation) {
      query = query.eq("targetLocation", filters.targetLocation);
    }

    if (filters.bucketName) {
      query = query.eq("bucketName", filters.bucketName);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    // Apply metadata filters if provided
    if (filters.metadata) {
      for (const [key, value] of Object.entries(filters.metadata)) {
        query = query.eq(`metadata->>${key}`, value);
      }
    }

    // Apply compound filters if provided
    if (filters.andFilters?.length) {
      for (const filter of filters.andFilters) {
        switch (filter.operator) {
          case "eq":
            query = query.eq(filter.field, filter.value);
            break;
          case "neq":
            query = query.neq(filter.field, filter.value);
            break;
          case "gt":
            query = query.gt(filter.field, filter.value);
            break;
          case "gte":
            query = query.gte(filter.field, filter.value);
            break;
          case "lt":
            query = query.lt(filter.field, filter.value);
            break;
          case "lte":
            query = query.lte(filter.field, filter.value);
            break;
          case "like":
            query = query.like(filter.field, filter.value);
            break;
          case "ilike":
            query = query.ilike(filter.field, filter.value);
            break;
          case "in":
            query = query.in(filter.field, filter.value);
            break;
        }
      }
    }

    // Apply sorting
    const ascending = filters.sortOrder === "asc";
    query = query.order(filters.sortBy || "updatedAt", { ascending });

    // Apply pagination
    const startRange = filters.offset || 0;
    const endRange = startRange + (filters.limit || 20) - 1;
    query = query.range(startRange, endRange);

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
      if (filters.targetLocation) {
        countQuery = countQuery.eq("targetLocation", filters.targetLocation);
      }

      const { count } = await countQuery;
      totalCount = count;
    }

    // Execute query
    // console.log("📁 [FILES-GET] Executing query with filters:", {
    //   filters,
    //   projectId: filters.projectId,
    //   authorId: filters.authorId,
    // });

    const { data: files, error } = await query;

    if (error) {
      console.error("❌ [FILES-GET] Error fetching files:", error);
      console.error("❌ [FILES-GET] Query details:", {
        filters,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return json(
        {
          error: "Failed to fetch files",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        500
      );
    }

    // console.log("📁 [FILES-GET] Files fetched:", {
    //   count: files?.length || 0,
    //   firstFile: files?.[0],
    //   filters,
    // });

    // Filter out any files with invalid IDs (safety check)
    const validFiles = (files || []).filter(
      (file) => file.id && Number.isInteger(file.id) && file.id > 0
    );

    if (validFiles.length < (files || []).length) {
      console.warn(
        `⚠️ [FILES-GET] Filtered out ${(files || []).length - validFiles.length} files with invalid IDs`
      );
    }

    // Generate signed URLs for each file; verify exists in storage, remove orphans
    const filesWithUrlsRaw = await Promise.all(
      validFiles.map(async (file) => {
        if (!file.bucketName || !file.filePath) {
          return { ...file, publicUrl: null };
        }

        if (supabaseAdmin) {
          const exists = await verifyFileExistsAndCleanupIfMissing(supabaseAdmin, {
            id: file.id,
            bucketName: file.bucketName,
            filePath: file.filePath,
            projectId: file.projectId,
          });
          if (!exists) return null;
        }

        try {
          const { data: urlData } = supabaseAdmin!.storage
            .from(file.bucketName)
            .getPublicUrl(file.filePath);

          const projectData = file.projects || {};
          const profileData = file.profiles || {};

          return {
            ...file,
            publicUrl: urlData?.publicUrl || null,
            uploadedByName: profileData.companyName,
            projectTitle: projectData.title,
            projects: undefined,
            profiles: undefined,
          };
        } catch (urlError) {
          console.error(
            `❌ [FILES-GET] Failed to generate public URL for file ${file.id}:`,
            urlError
          );
          return { ...file, publicUrl: null };
        }
      })
    );
    const filesWithUrls = filesWithUrlsRaw.filter((f): f is NonNullable<typeof f> => f != null);

    const hasMore = filesWithUrls.length === filters.limit || 20;

    return json(
      {
        data: filesWithUrls || [],
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
          bucketName: filters.bucketName,
          status: filters.status,
          metadata: filters.metadata,
          andFilters: filters.andFilters,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        },
      },
      200
    );
  } catch (error: any) {
    console.error("❌ [FILES-GET] Unexpected error:", error);
    return json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};
