import type { APIRoute } from "astro";

// Twilio webhook that uses GET requests to bypass CSRF protection
export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`🔍 [TWILIO-GET-${requestId}] GET request received (RESTARTED)`);
  console.log(`🔍 [TWILIO-GET-${requestId}] URL:`, request.url);
  console.log(`🔍 [TWILIO-GET-${requestId}] Timestamp:`, new Date().toISOString());

  try {
    // Extract call information from query parameters
    const callSid = new URL(request.url).searchParams.get("CallSid");
    const from = new URL(request.url).searchParams.get("From");
    const to = new URL(request.url).searchParams.get("To");
    const callStatus = new URL(request.url).searchParams.get("CallStatus");
    const queryParams = Object.fromEntries(new URL(request.url).searchParams.entries());

    console.log(`🔍 [TWILIO-GET-${requestId}] Call details:`, {
      callSid,
      from,
      to,
      callStatus,
    });
    console.log(`🔍 [TWILIO-GET-${requestId}] All query params:`, queryParams);

    // Validate required parameters
    if (!callSid || !from || !to) {
      console.warn(`⚠️ [TWILIO-GET-${requestId}] Missing required call parameters:`, {
        callSid,
        from,
        to,
      });
      return createFallbackResponse(requestId, "Missing required call parameters");
    }

    // Forward to n8n webhook for Claude → ElevenLabs processing
    try {
      // Use the N8N tunnel URL
      // Use environment-based N8N URL
      // Check if we're running through a tunnel (LocalTunnel) vs local development
      const isTunneled =
        request.url.includes("loca.lt") ||
        request.url.includes("ngrok") ||
        request.url.includes("tunnel");
      const n8nWebhookUrl =
        import.meta.env.N8N_WEBHOOK_URL ||
        (import.meta.env.PROD
          ? "https://your-domain.com:5678/webhook/incoming-call"
          : isTunneled
            ? "https://capco-fire-n8n.loca.lt/webhook/incoming-call"
            : "http://localhost:5678/webhook/incoming-call");
      console.log(`🔍 [TWILIO-GET-${requestId}] Starting N8N integration... (UPDATED)`);
      console.log(`🔍 [TWILIO-GET-${requestId}] Request URL:`, request.url);
      console.log(`🔍 [TWILIO-GET-${requestId}] Is tunneled:`, isTunneled);
      console.log(`🔍 [TWILIO-GET-${requestId}] N8N URL:`, n8nWebhookUrl);

      const n8nPayload = {
        callSid,
        from,
        to,
        callStatus,
        timestamp: new Date().toISOString(),
        source: "twilio-get",
        requestId,
        webhookData: queryParams,
      };

      console.log(`🔍 [TWILIO-GET-${requestId}] Forwarding to n8n:`, n8nWebhookUrl);
      console.log(`🔍 [TWILIO-GET-${requestId}] N8N payload:`, JSON.stringify(n8nPayload, null, 2));

      // Wait for N8N response and use it for TwiML
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.N8N_WEBHOOK_TOKEN || ""}`,
        },
        body: JSON.stringify(n8nPayload),
      });

      console.log(`🔍 [TWILIO-GET-${requestId}] N8N response status:`, n8nResponse.status);
      console.log(
        `🔍 [TWILIO-GET-${requestId}] N8N response headers:`,
        Object.fromEntries(n8nResponse.headers.entries())
      );

      if (n8nResponse.ok) {
        let n8nData;
        try {
          n8nData = await n8nResponse.json();
          console.log(
            `✅ [TWILIO-GET-${requestId}] N8N response:`,
            JSON.stringify(n8nData, null, 2)
          );
          console.log(`🔍 [TWILIO-GET-${requestId}] N8N response type:`, typeof n8nData);
          console.log(`🔍 [TWILIO-GET-${requestId}] N8N response keys:`, Object.keys(n8nData));
        } catch (parseError) {
          console.error(
            `❌ [TWILIO-GET-${requestId}] Failed to parse N8N JSON response:`,
            parseError
          );
          console.log(`🔍 [TWILIO-GET-${requestId}] Raw response text:`, await n8nResponse.text());
          throw new Error(`Failed to parse N8N response: ${parseError.message}`);
        }

        // Use N8N's processed response for TwiML
        let aiMessage = "Hello! This is your AI assistant. How can I help you today?";
        let messageSource = "fallback";

        try {
          // Handle different N8N response formats
          console.log(`🔍 [TWILIO-GET-${requestId}] Processing N8N response for AI message...`);

          // Check if response is an array and get the first item
          let responseData = n8nData;
          if (Array.isArray(n8nData) && n8nData.length > 0) {
            responseData = n8nData[0];
            console.log(`🔍 [TWILIO-GET-${requestId}] Using first array item:`, responseData);
          }

          if (responseData && responseData.ncco) {
            console.log(`🔍 [TWILIO-GET-${requestId}] Found ncco data:`, responseData.ncco);
            // Check if ncco is a string (needs parsing) or already an array
            let nccoArray;
            if (typeof responseData.ncco === "string") {
              try {
                nccoArray = JSON.parse(responseData.ncco);
                console.log(`🔍 [TWILIO-GET-${requestId}] Parsed ncco string:`, nccoArray);
              } catch (parseError) {
                console.error(
                  `❌ [TWILIO-GET-${requestId}] Failed to parse ncco string:`,
                  parseError
                );
                console.log(`🔍 [TWILIO-GET-${requestId}] Raw ncco string:`, responseData.ncco);
                throw new Error(`Failed to parse ncco string: ${parseError.message}`);
              }
            } else if (Array.isArray(responseData.ncco)) {
              nccoArray = responseData.ncco;
              console.log(`🔍 [TWILIO-GET-${requestId}] Using ncco array directly:`, nccoArray);
            }

            if (nccoArray && Array.isArray(nccoArray)) {
              const talkAction = nccoArray.find((action) => action && action.action === "talk");
              if (talkAction && talkAction.text) {
                aiMessage = talkAction.text;
                messageSource = "ncco-talk-action";
                console.log(`✅ [TWILIO-GET-${requestId}] Found talk action text:`, aiMessage);
              } else {
                console.warn(
                  `⚠️ [TWILIO-GET-${requestId}] No talk action found in ncco array:`,
                  nccoArray
                );
              }
            } else {
              console.warn(`⚠️ [TWILIO-GET-${requestId}] ncco is not a valid array:`, nccoArray);
            }
          } else if (responseData && responseData.message) {
            aiMessage = responseData.message;
            messageSource = "n8n-message";
            console.log(`✅ [TWILIO-GET-${requestId}] Using message:`, aiMessage);
          } else if (responseData && responseData.response) {
            aiMessage = responseData.response;
            messageSource = "n8n-response";
            console.log(`✅ [TWILIO-GET-${requestId}] Using response:`, aiMessage);
          } else if (responseData && responseData.text) {
            aiMessage = responseData.text;
            messageSource = "n8n-text";
            console.log(`✅ [TWILIO-GET-${requestId}] Using text:`, aiMessage);
          } else {
            console.warn(
              `⚠️ [TWILIO-GET-${requestId}] No recognized message format found in N8N response`
            );
            console.log(
              `🔍 [TWILIO-GET-${requestId}] Available responseData keys:`,
              responseData ? Object.keys(responseData) : "null"
            );
          }
        } catch (processingError) {
          console.error(
            `❌ [TWILIO-GET-${requestId}] Error processing N8N response:`,
            processingError
          );
          console.log(`🔍 [TWILIO-GET-${requestId}] Falling back to default message`);
        }

        console.log(
          `✅ [TWILIO-GET-${requestId}] Final AI message (source: ${messageSource}):`,
          aiMessage
        );

        const processingTime = Date.now() - startTime;
        console.log(`⏱️ [TWILIO-GET-${requestId}] Total processing time: ${processingTime}ms`);

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${aiMessage}</Say>
  <Record maxLength="30" action="${import.meta.env.RAILWAY_PUBLIC_DOMAIN}/api/webhook/twilio-recording" method="POST" />
</Response>`,
          {
            status: 200,
            headers: {
              "Content-Type": "text/xml",
            },
          }
        );
      } else {
        console.error(`❌ [TWILIO-GET-${requestId}] N8N response failed:`, n8nResponse.status);
        console.error(
          `❌ [TWILIO-GET-${requestId}] N8N response status text:`,
          n8nResponse.statusText
        );
        try {
          const errorText = await n8nResponse.text();
          console.error(`❌ [TWILIO-GET-${requestId}] N8N error response body:`, errorText);
        } catch (errorTextError) {
          console.error(
            `❌ [TWILIO-GET-${requestId}] Failed to read error response body:`,
            errorTextError
          );
        }
        return createFallbackResponse(
          requestId,
          `N8N response failed with status ${n8nResponse.status}`
        );
      }
    } catch (n8nError) {
      console.error(`❌ [TWILIO-GET-${requestId}] Error forwarding to n8n:`, n8nError);
      console.error(`❌ [TWILIO-GET-${requestId}] Error stack:`, n8nError.stack);
      console.error(`❌ [TWILIO-GET-${requestId}] Error name:`, n8nError.name);
      console.error(`❌ [TWILIO-GET-${requestId}] Error message:`, n8nError.message);
      return createFallbackResponse(requestId, `N8N integration error: ${n8nError.message}`);
    }
  } catch (generalError) {
    console.error(`❌ [TWILIO-GET-${requestId}] General error:`, generalError);
    console.error(`❌ [TWILIO-GET-${requestId}] General error stack:`, generalError.stack);
    return createFallbackResponse(requestId, `General error: ${generalError.message}`);
  }

  // Fallback TwiML response if N8N fails
  return createFallbackResponse(requestId, "No call parameters provided");
};

// Helper function to create fallback responses
function createFallbackResponse(requestId: string, reason: string) {
  console.log(`🔄 [TWILIO-GET-${requestId}] Using fallback response. Reason: ${reason}`);

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! This is your AI assistant. How can I help you today?</Say>
  <Record maxLength="30" action="${import.meta.env.RAILWAY_PUBLIC_DOMAIN}/api/webhook/twilio-recording" method="POST" />
</Response>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    }
  );
}
