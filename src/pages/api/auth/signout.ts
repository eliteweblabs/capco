import type { APIRoute } from "astro";
import { clearAuthCookies } from "../../../lib/auth-cookies";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  clearAuthCookies(cookies);
  return redirect("/");
};

export const POST: APIRoute = async ({ cookies }) => {
  clearAuthCookies(cookies);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
