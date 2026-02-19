import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

/**
 * Review Form Submission Handler
 * POST /api/reviews/submit
 *
 * Saves review submissions from the public review form.
 * Google does not allow programmatic submission of reviews - users must leave
 * reviews directly on Google. This endpoint stores reviews for display on-site
 * and can redirect users to the Google review URL after success.
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const authorName = (formData.get("authorName") || formData.get("name")) as string;
    const email = formData.get("email") as string;
    const ratingRaw = formData.get("rating");
    const reviewText = (formData.get("reviewText") || formData.get("message")) as string;
    const company = formData.get("company") as string | null;

    const rating = ratingRaw ? parseInt(String(ratingRaw)) : null;
    if (rating !== null && (rating < 1 || rating > 5)) {
      return new Response(
        JSON.stringify({ success: false, error: "Rating must be between 1 and 5" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!authorName?.trim() || !email?.trim() || !reviewText?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Name, email, and review text are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SECRET;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[REVIEWS] Supabase not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("reviewSubmissions")
      .insert({
        authorName: authorName.trim(),
        email: email.trim().toLowerCase(),
        rating: rating || null,
        reviewText: reviewText.trim(),
        company: company?.trim() || null,
        submittedAt: new Date().toISOString(),
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[REVIEWS] Database error:", error);
      if (error.code === "42P01") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Reviews system not configured. Run sql-queriers/create-review-submissions-table.sql in Supabase.",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save review" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: data?.id,
        message: "Thank you for your review!",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[REVIEWS] Submit error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
