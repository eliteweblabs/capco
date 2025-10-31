import type { APIRoute } from "astro";
// Re-export the contact submission handler from utils
// This allows the form to submit to /api/contact-submission (public endpoint, no auth required)
export { POST } from "./utils/contact-submission";

