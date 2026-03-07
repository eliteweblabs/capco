/**
 * Social media publish API - queues or publishes a post to selected platforms
 * POST /api/social/publish
 * Body: { postId, platforms?: ['instagram','facebook','tiktok','bluesky'] }
 *
 * Each platform requires its own OAuth/API setup. This provides the orchestration layer.
 * Platform-specific adapters (lib/social/*) implement the actual publish logic.
 */
import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { postId, platforms = ["instagram", "facebook", "tiktok", "bluesky"] } = body;

    if (!postId) {
      return new Response(JSON.stringify({ error: "postId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: post, error: postErr } = await supabaseAdmin
      .from("socialPosts")
      .select("id, content, mediaUrls, status")
      .eq("id", postId)
      .single();

    if (postErr || !post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validPlatforms = ["instagram", "facebook", "tiktok", "bluesky"];
    const toPublish = platforms.filter((p: string) => validPlatforms.includes(p));

    const results: Record<string, { status: string; error?: string; url?: string }> = {};

    for (const platform of toPublish) {
      try {
        // Platform adapters would be imported here, e.g.:
        // const adapter = await import(`../../../lib/social/${platform}.ts`);
        // const result = await adapter.publish(post);
        // For now, create target records and mark as "pending" - actual publish requires OAuth setup
        const { error: targetErr } = await supabaseAdmin.from("socialPostTargets").upsert(
          {
            postId: post.id,
            platform,
            status: "pending",
            updatedAt: new Date().toISOString(),
          },
          { onConflict: "postId,platform" }
        );

        if (targetErr) {
          results[platform] = { status: "failed", error: targetErr.message };
        } else {
          results[platform] = {
            status: "queued",
            error:
              "Platform adapter not configured. Add OAuth credentials and implement lib/social/*.ts",
          };
        }
      } catch (err) {
        results[platform] = {
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }

    await supabaseAdmin
      .from("socialPosts")
      .update({ status: "scheduled", updatedAt: new Date().toISOString() })
      .eq("id", postId);

    return new Response(
      JSON.stringify({
        success: true,
        postId,
        results,
        message:
          "Post queued. Configure platform OAuth (Instagram Graph API, Facebook, TikTok Content API, Bluesky AT Protocol) in lib/social/*.ts to enable auto-publish.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[SOCIAL-PUBLISH] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
