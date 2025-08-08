import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!supabase) {
      // Return mock data when database is not configured
      const         mockStatuses = {
        10: {
          status_name: "Specs Received",
          email_content:
            "Your project specifications have been received and are being reviewed by our team.",
          est_time: "1-2 business days",
          notify: ["admin"],
        },
        20: {
          status_name: "Generating Proposal",
          email_content:
            "We are currently generating your detailed proposal based on the specifications provided.",
          est_time: "3-5 business days",
          notify: ["admin", "client"],
        },
        30: {
          status_name: "Proposal Shipped",
          email_content:
            "Your proposal has been completed and sent to you for review.",
          est_time: "1 business day",
          notify: ["admin", "client", "staff"],
        },
        40: {
          status_name: "Proposal Viewed",
          email_content:
            "We can see you have viewed the proposal. Please let us know if you have any questions.",
          est_time: "1-2 business days",
          notify: ["admin"],
        },
        50: {
          status_name: "Proposal Signed Off",
          email_content:
            "Thank you for signing off on the proposal. We will now proceed with the next phase.",
          est_time: "1 business day",
        },
        60: {
          status_name: "Generating Deposit Invoice",
          email_content:
            "We are preparing your deposit invoice for the approved proposal.",
          est_time: "1-2 business days",
        },
        70: {
          status_name: "Deposit Invoice Shipped",
          email_content:
            "Your deposit invoice has been sent. Please review and process payment.",
          est_time: "1 business day",
        },
        80: {
          status_name: "Deposit Invoice Viewed",
          email_content:
            "We can see you have viewed the deposit invoice. Please let us know if you have any questions.",
          est_time: "1-2 business days",
        },
        90: {
          status_name: "Deposit Invoice Paid",
          email_content:
            "Thank you for the deposit payment. We will now begin the detailed design phase.",
          est_time: "1 business day",
        },
        100: {
          status_name: "Generating Submittals",
          email_content:
            "We are preparing detailed submittal documents for your project.",
          est_time: "5-7 business days",
        },
        110: {
          status_name: "Submittals Shipped",
          email_content:
            "Your submittal documents have been completed and sent for review.",
          est_time: "1 business day",
        },
        120: {
          status_name: "Submittals Viewed",
          email_content:
            "We can see you have viewed the submittals. Please let us know if you have any questions.",
          est_time: "1-2 business days",
        },
        130: {
          status_name: "Submittals Signed Off",
          email_content:
            "Thank you for signing off on the submittals. We will now proceed with the final deliverables.",
          est_time: "1 business day",
        },
        140: {
          status_name: "Generating Final Invoice",
          email_content:
            "We are preparing your final invoice for the completed project.",
          est_time: "1-2 business days",
        },
        150: {
          status_name: "Final Invoice Shipped",
          email_content:
            "Your final invoice has been sent. Please review and process payment.",
          est_time: "1 business day",
        },
        160: {
          status_name: "Final Invoice Viewed",
          email_content:
            "We can see you have viewed the final invoice. Please let us know if you have any questions.",
          est_time: "1-2 business days",
        },
        170: {
          status_name: "Final Invoice Paid",
          email_content:
            "Thank you for the final payment. We will now prepare your final deliverables.",
          est_time: "1 business day",
        },
        180: {
          status_name: "Generating Final Deliverables",
          email_content:
            "We are preparing your final project deliverables and documentation.",
          est_time: "3-5 business days",
        },
        190: {
          status_name: "Stamping Final Deliverables",
          email_content:
            "We are applying professional stamps and certifications to your final deliverables.",
          est_time: "1-2 business days",
        },
        200: {
          status_name: "Final Deliverables Shipped",
          email_content:
            "Your final project deliverables have been completed and sent to you.",
          est_time: "1 business day",
        },
        210: {
          status_name: "Final Deliverables Viewed",
          email_content:
            "We can see you have viewed the final deliverables. Please let us know if you have any questions.",
          est_time: "1-2 business days",
        },
        220: {
          status_name: "Project Complete",
          email_content:
            "Congratulations! Your project has been successfully completed. Thank you for choosing CAPCo Fire Protection.",
          est_time: "N/A",
        },
      };

      return new Response(
        JSON.stringify({
          success: true,
          statuses: mockStatuses,
          message: "Mock statuses (no database interaction)",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Fetch all project statuses from database
    const { data: statuses, error } = await supabase
      .from("project_statuses")
      .select(
        "status_code, status_name, email_content, est_time, notify",
      )
      .order("status_code");

    if (error) {
      console.error("Error fetching project statuses:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Convert array to object with status_code as key
    const statusesObject = statuses.reduce(
      (acc, status) => {
        acc[status.status_code] = {
          status_name: status.status_name,
          email_content: status.email_content,
          est_time: status.est_time,
          notify: status.notify || ["admin"],
        };
        return acc;
      },
      {} as Record<
        number,
        {
          status_name: string;
          email_content: string;
          est_time: string;
          notify: string[];
        }
      >,
    );

    return new Response(
      JSON.stringify({
        success: true,
        statuses: statusesObject,
        count: statuses.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Get project statuses error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch project statuses",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
