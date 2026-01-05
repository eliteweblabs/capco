import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

/**
 * Call Client API for Voice Assistant
 * Initiates a VAPI call to a client
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const { clientName, clientId, phoneNumber, message } = await request.json();

    // Get VAPI API key and assistant ID
    const vapiApiKey = process.env.VAPI_API_KEY;
    const assistantId =
      process.env.PUBLIC_VAPI_ASSISTANT_ID ||
      import.meta.env.PUBLIC_PUBLIC_VAPI_ASSISTANT_ID ||
      "3ae002d5-fe9c-4870-8034-4c66a9b43b51";

    if (!vapiApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VAPI API key not configured",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let phone = phoneNumber;
    let name = clientName;

    // If clientId or clientName provided, look up client in database
    if ((clientId || clientName) && !phoneNumber) {
      if (!supabase) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Database connection not available",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      let query = supabase.from("profiles").select("id, name, phone, email");

      if (clientId) {
        query = query.eq("id", clientId);
      } else if (clientName) {
        query = query.ilike("name", `%${clientName}%`);
      }

      const { data: clients, error } = await query.limit(10);

      if (error) {
        console.error("❌ [CALL-CLIENT] Database error:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to lookup client",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!clients || clients.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Client not found",
            message: `No client found with ${clientId ? `ID ${clientId}` : `name "${clientName}"`}`,
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      if (clients.length > 1) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Multiple clients found",
            clients: clients.map((c) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              email: c.email,
            })),
            message: `Found ${clients.length} clients. Please specify which one.`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const client = clients[0];
      phone = client.phone;
      name = client.name || clientName;

      if (!phone) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Client has no phone number",
            message: `Client "${name}" does not have a phone number on file.`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!phone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Phone number required",
          message: "Please provide a phone number or client name/ID",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Format phone number (ensure it's in E.164 format: +1234567890)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      // Remove all non-digit characters
      const digits = formattedPhone.replace(/\D/g, "");
      // Add +1 for US numbers if not present
      if (digits.length === 10) {
        formattedPhone = `+1${digits}`;
      } else if (digits.length === 11 && digits.startsWith("1")) {
        formattedPhone = `+${digits}`;
      } else {
        formattedPhone = `+${digits}`;
      }
    }

    console.log("📞 [CALL-CLIENT] Initiating VAPI call:", {
      assistantId,
      phone: formattedPhone,
      name,
      message: message ? "Custom message provided" : "No custom message",
    });

    // Create call with Vapi.ai
    const callResponse = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId,
        customer: {
          number: formattedPhone,
          name: name || "Client",
        },
        assistantOverrides: message
          ? {
              variableValues: {
                customMessage: message,
              },
            }
          : undefined,
        // Use Vapi's phone number service
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID || "678ddf24-3d7e-4d3a-9e28-620382e71f56",
        metadata: {
          source: "voice-assistant",
          clientName: name,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!callResponse.ok) {
      const error = await callResponse.text();
      console.error("❌ [CALL-CLIENT] Vapi.ai error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to start voice call",
          details: error,
        }),
        {
          status: callResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const call = await callResponse.json();
    console.log("✅ [CALL-CLIENT] Call initiated:", call.id);

    return new Response(
      JSON.stringify({
        success: true,
        call: {
          id: call.id,
          status: call.status,
          phone: formattedPhone,
          clientName: name,
          message: `Call initiated to ${name} at ${formattedPhone}`,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [CALL-CLIENT] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
