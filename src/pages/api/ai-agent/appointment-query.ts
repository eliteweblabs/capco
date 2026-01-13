import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * AI Agent Appointment Query API
 *
 * Natural language query interface for AI virtual agent
 *
 * POST Body:
 * - query: string (natural language query)
 * - context?: object (additional context for the AI agent)
 *
 * Examples:
 * - "What appointments do I have today?"
 * - "Book a meeting for tomorrow at 2 PM"
 * - "Cancel my appointment with John"
 * - "Show me all my appointments this week"
 */

interface AIQueryRequest {
  query: string;
  context?: {
    userId?: string;
    userEmail?: string;
    timeZone?: string;
    preferences?: Record<string, any>;
  };
}

interface AIQueryResponse {
  intent: string;
  action: string;
  data?: any;
  message: string;
  suggestions?: string[];
}

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

    const body: AIQueryRequest = await request.json();
    const { query, context } = body;

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`🤖 [AI-AGENT] Processing query:`, query);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Process the natural language query
    const response = await processAIQuery(query, currentUser, context);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [AI-AGENT] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Process natural language query and return structured response
async function processAIQuery(
  query: string,
  currentUser: any,
  context?: any
): Promise<AIQueryResponse> {
  const lowerQuery = query.toLowerCase();

  // Intent detection patterns
  if (
    lowerQuery.includes("book") ||
    lowerQuery.includes("schedule") ||
    lowerQuery.includes("appointment")
  ) {
    return await handleBookingQuery(query, currentUser, context);
  }

  if (lowerQuery.includes("cancel") || lowerQuery.includes("delete")) {
    return await handleCancellationQuery(query, currentUser, context);
  }

  if (
    lowerQuery.includes("show") ||
    lowerQuery.includes("list") ||
    lowerQuery.includes("what") ||
    lowerQuery.includes("when")
  ) {
    return await handleListingQuery(query, currentUser, context);
  }

  if (
    lowerQuery.includes("reschedule") ||
    lowerQuery.includes("change") ||
    lowerQuery.includes("move")
  ) {
    return await handleRescheduleQuery(query, currentUser, context);
  }

  if (
    lowerQuery.includes("available") ||
    lowerQuery.includes("free") ||
    lowerQuery.includes("open")
  ) {
    return await handleAvailabilityQuery(query, currentUser, context);
  }

  // Default response for unrecognized queries
  return {
    intent: "unknown",
    action: "clarify",
    message:
      "I'm not sure what you're asking about. Could you please clarify? I can help you with booking, viewing, canceling, or rescheduling appointments.",
    suggestions: [
      "Book an appointment",
      "Show my appointments",
      "Cancel an appointment",
      "Check availability",
      "Reschedule an appointment",
    ],
  };
}

// Handle booking-related queries
async function handleBookingQuery(
  query: string,
  currentUser: any,
  context?: any
): Promise<AIQueryResponse> {
  // Extract date and time from query
  const dateMatch = query.match(
    /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i
  );
  const timeMatch = query.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/i);

  const suggestedDate = dateMatch ? dateMatch[0] : "tomorrow";
  const suggestedTime = timeMatch ? timeMatch[0] : "2:00 PM";

  return {
    intent: "booking",
    action: "suggest_booking",
    message: `I can help you book an appointment. Based on your request, I suggest ${suggestedDate} at ${suggestedTime}. Would you like me to check availability for that time?`,
    suggestions: ["Yes, check availability", "Different date/time", "Show available slots"],
  };
}

// Handle cancellation queries
async function handleCancellationQuery(
  query: string,
  currentUser: any,
  context?: any
): Promise<AIQueryResponse> {
  // Get user's upcoming appointments
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("attendeeEmail", currentUser.email)
    .gte("startTime", new Date().toISOString())
    .order("startTime", { ascending: true })
    .limit(5);

  if (error || !appointments || appointments.length === 0) {
    return {
      intent: "cancellation",
      action: "no_appointments",
      message: "You don't have any upcoming appointments to cancel.",
      suggestions: ["Book an appointment", "View past appointments"],
    };
  }

  return {
    intent: "cancellation",
    action: "list_appointments_to_cancel",
    data: appointments,
    message: "Here are your upcoming appointments. Which one would you like to cancel?",
    suggestions: appointments.map(
      (apt) => `Cancel: ${apt.title} on ${new Date(apt.startTime).toLocaleDateString()}`
    ),
  };
}

// Handle listing queries
async function handleListingQuery(
  query: string,
  currentUser: any,
  context?: any
): Promise<AIQueryResponse> {
  // Determine time range
  let startDate: string;
  let endDate: string;

  if (query.includes("today")) {
    const today = new Date();
    startDate = today.toISOString().split("T")[0];
    endDate = today.toISOString().split("T")[0];
  } else if (query.includes("tomorrow")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    startDate = tomorrow.toISOString().split("T")[0];
    endDate = tomorrow.toISOString().split("T")[0];
  } else if (query.includes("week")) {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    startDate = weekStart.toISOString().split("T")[0];
    endDate = weekEnd.toISOString().split("T")[0];
  } else {
    // Default to next 7 days
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    startDate = today.toISOString().split("T")[0];
    endDate = nextWeek.toISOString().split("T")[0];
  }

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("attendeeEmail", currentUser.email)
    .gte("startTime", startDate)
    .lte("startTime", endDate + "T23:59:59Z")
    .order("startTime", { ascending: true });

  if (error) {
    return {
      intent: "listing",
      action: "error",
      message: "Sorry, I couldn't retrieve your appointments. Please try again.",
      suggestions: ["Try again", "Contact support"],
    };
  }

  if (!appointments || appointments.length === 0) {
    return {
      intent: "listing",
      action: "no_appointments",
      message: "You don't have any appointments in that time period.",
      suggestions: ["Book an appointment", "Check different dates"],
    };
  }

  return {
    intent: "listing",
    action: "show_appointments",
    data: appointments,
    message: `You have ${appointments.length} appointment(s) in that period:`,
    suggestions: ["Book another appointment", "Cancel an appointment", "Reschedule an appointment"],
  };
}

// Handle reschedule queries
async function handleRescheduleQuery(
  query: string,
  currentUser: any,
  context?: any
): Promise<AIQueryResponse> {
  // Get user's upcoming appointments
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("attendeeEmail", currentUser.email)
    .gte("startTime", new Date().toISOString())
    .order("startTime", { ascending: true })
    .limit(5);

  if (error || !appointments || appointments.length === 0) {
    return {
      intent: "reschedule",
      action: "no_appointments",
      message: "You don't have any upcoming appointments to reschedule.",
      suggestions: ["Book an appointment", "View past appointments"],
    };
  }

  return {
    intent: "reschedule",
    action: "list_appointments_to_reschedule",
    data: appointments,
    message: "Here are your upcoming appointments. Which one would you like to reschedule?",
    suggestions: appointments.map(
      (apt) => `Reschedule: ${apt.title} on ${new Date(apt.startTime).toLocaleDateString()}`
    ),
  };
}

// Handle availability queries
async function handleAvailabilityQuery(
  query: string,
  currentUser: any,
  context?: any
): Promise<AIQueryResponse> {
  // Extract date from query
  const dateMatch = query.match(/(today|tomorrow|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i);
  const suggestedDate = dateMatch ? dateMatch[0] : "tomorrow";

  return {
    intent: "availability",
    action: "check_availability",
    message: `I can check availability for ${suggestedDate}. Let me look up the available time slots.`,
    suggestions: ["Check availability", "Book an appointment", "Different date"],
  };
}
