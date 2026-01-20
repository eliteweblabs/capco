import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { checkAuth } from "../../../lib/auth";

/**
 * Import All Markdown Files API
 * Imports all markdown files from content/pages/ into the CMS database
 */
export const POST: APIRoute = async ({ request, cookies }) => {
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

    const contentDir = join(process.cwd(), "content", "pages");
    if (!existsSync(contentDir)) {
      return new Response(JSON.stringify({ error: "Content directory not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Recursive function to find all markdown files
    function findMarkdownFiles(
      dir: string,
      basePath: string = ""
    ): Array<{ file: string; path: string }> {
      const results: Array<{ file: string; path: string }> = [];
      const items = readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = join(dir, item.name);
        const relativePath = basePath ? `${basePath}/${item.name}` : item.name;

        if (item.isDirectory()) {
          // Recursively search subdirectories
          results.push(...findMarkdownFiles(fullPath, relativePath));
        } else if (item.isFile() && item.name.endsWith(".md")) {
          results.push({ file: item.name, path: relativePath });
        }
      }

      return results;
    }

    const mdFiles = findMarkdownFiles(contentDir);
    const clientId = process.env.RAILWAY_PROJECT_NAME || null;
    const imported: Array<{ slug: string; title: string; success: boolean; error?: string }> = [];
    const errors: Array<{ slug: string; error: string }> = [];

    // Import each file
    for (const { file, path } of mdFiles) {
      try {
        const slug = path.replace(/\.md$/, "").replace(/\//g, "/");
        const filePath = join(contentDir, path);
        const fileContent = readFileSync(filePath, "utf-8");
        const { data, content } = matter(fileContent);

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
              client_id: clientId,
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "slug,client_id",
            }
          )
          .select()
          .single();

        if (error) {
          throw error;
        }

        imported.push({
          slug,
          title: data.title || slug,
          success: true,
        });
      } catch (error: any) {
        const slug = path.replace(/\.md$/, "").replace(/\//g, "/");
        const errorMsg = error.message || "Unknown error";
        errors.push({ slug, error: errorMsg });
        imported.push({
          slug,
          title: slug,
          success: false,
          error: errorMsg,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        imported: imported.length,
        total: mdFiles.length,
        pages: imported,
        errors: errors.length > 0 ? errors : undefined,
        message: `Imported ${imported.filter((p) => p.success).length} of ${mdFiles.length} markdown files`,
      }),
      {
        status: errors.length === 0 ? 200 : 207, // 207 Multi-Status if some failed
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [CMS-IMPORT-ALL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to import markdown files" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
