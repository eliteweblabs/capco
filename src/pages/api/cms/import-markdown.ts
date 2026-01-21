import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { checkAuth } from "../../../lib/auth";

/**
 * Import Markdown File API
 * Imports a markdown file from content/pages/ into the CMS database
 */
export const GET: APIRoute = async ({ request, url, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const userRole = currentUser.profile?.role;
    if (userRole !== "Admin") {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slug = url.searchParams.get("slug");
    const filePath = url.searchParams.get("path"); // Optional: specific file path

    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Read markdown file (handle nested paths like "data/page")
    // If path is provided, use it; otherwise construct from slug
    let contentPath: string;
    if (filePath) {
      // Use the provided path directly
      contentPath = join(process.cwd(), "content", "pages", filePath);
    } else {
      // Convert slug back to file path (e.g., "data/page" -> "content/pages/data/page.md")
      const slugPath = slug.replace(/\//g, "/");
      contentPath = join(process.cwd(), "content", "pages", `${slugPath}.md`);
    }

    if (!existsSync(contentPath)) {
      // Try without subdirectory (flat structure)
      const flatPath = join(process.cwd(), "content", "pages", `${slug.split("/").pop()}.md`);
      if (existsSync(flatPath)) {
        // Use flat path
        const fileContent = readFileSync(flatPath, "utf-8");
        const { data, content } = matter(fileContent);
        const finalSlug = slug.split("/").pop() || slug;

        const clientId = process.env.RAILWAY_PROJECT_NAME || null;
        const { data: dbPage, error } = await supabaseAdmin
          .from("cmsPages")
          .upsert(
            {
              slug: finalSlug,
              title: data.title || finalSlug,
              description: data.description || null,
              content,
              frontmatter: data || {},
              template: data.template || "default",
              clientId: clientId,
              isActive: true,
              updatedAt: new Date().toISOString(),
            },
            {
              onConflict: "slug,clientId",
            }
          )
          .select()
          .single();

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify({
            page: dbPage,
            message: `Successfully imported "${finalSlug}" from markdown`,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ error: `Markdown file not found: ${slug}.md` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fileContent = readFileSync(contentPath, "utf-8");
    const { data, content } = matter(fileContent);

    const clientId = process.env.RAILWAY_PROJECT_NAME || null;

    // Upsert into database
    const { data: dbPage, error } = await supabaseAdmin
      .from("cmsPages")
      .upsert(
        {
          slug,
          title: data.title || slug,
          description: data.description || null,
          content,
          frontmatter: data || {},
          template: data.template || "default",
          clientId: clientId,
          isActive: true,
          updatedAt: new Date().toISOString(),
        },
        {
          onConflict: "slug,clientId",
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        page: dbPage,
        message: `Successfully imported "${slug}" from markdown`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [CMS-IMPORT] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to import markdown file" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
