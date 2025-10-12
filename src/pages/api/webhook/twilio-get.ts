import type { APIRoute } from "astro";

// Test webhook to verify N8N integration
export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`🔍 [TWILIO-GET-TEST-${requestId}] GET request received`);
  console.log(`🔍 [TWILIO-GET-TEST-${requestId}] URL:`, request.url);
  console.log(`🔍 [TWILIO-GET-TEST-${requestId}] Timestamp:`, new Date().toISOString());

  try {
    // Extract call information from query parameters
    const callSid = new URL(request.url).searchParams.get("CallSid");
    const from = new URL(request.url).searchParams.get("From");
    const to = new URL(request.url).searchParams.get("To");
    const callStatus = new URL(request.url).searchParams.get("CallStatus");

    console.log(`🔍 [TWILIO-GET-TEST-${requestId}] Call details:`, {
      callSid,
      from,
      to,
      callStatus,
    });

    // Test N8N integration
    const n8nWebhookUrl = "http://localhost:5678/webhook/incoming-call";
    console.log(`🔍 [TWILIO-GET-TEST-${requestId}] Testing N8N integration...`);
    console.log(`🔍 [TWILIO-GET-TEST-${requestId}] N8N URL:`, n8nWebhookUrl);

    const n8nPayload = {
      callSid,
      from,
      to,
      callStatus,
      timestamp: new Date().toISOString(),
      source: "twilio-get-test",
      requestId,
    };

    console.log(
      `🔍 [TWILIO-GET-TEST-${requestId}] N8N payload:`,
      JSON.stringify(n8nPayload, null, 2)
    );

    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(n8nPayload),
      });

      console.log(`🔍 [TWILIO-GET-TEST-${requestId}] N8N response status:`, n8nResponse.status);

      if (n8nResponse.ok) {
        const n8nData = await n8nResponse.json();
        console.log(
          `✅ [TWILIO-GET-TEST-${requestId}] N8N response:`,
          JSON.stringify(n8nData, null, 2)
        );

        // Parse N8N response
        let aiMessage = "Hello! This is your AI assistant. How can I help you today?";
        let voiceName = "alice"; // Default voice

        console.log(`🔍 [TWILIO-GET-TEST-${requestId}] Parsing N8N response...`);
        console.log(`🔍 [TWILIO-GET-TEST-${requestId}] Response type:`, typeof n8nData);
        console.log(`🔍 [TWILIO-GET-TEST-${requestId}] Is array:`, Array.isArray(n8nData));

        if (Array.isArray(n8nData) && n8nData.length > 0) {
          const responseData = n8nData[0];
          console.log(`🔍 [TWILIO-GET-TEST-${requestId}] First array item:`, responseData);
          console.log(
            `🔍 [TWILIO-GET-TEST-${requestId}] Has ncco:`,
            responseData && responseData.ncco
          );
          console.log(
            `🔍 [TWILIO-GET-TEST-${requestId}] Response keys:`,
            responseData ? Object.keys(responseData) : "null"
          );

          if (responseData && responseData.ncco) {
            console.log(`🔍 [TWILIO-GET-TEST-${requestId}] Found ncco data:`, responseData.ncco);
            let nccoArray;
            if (typeof responseData.ncco === "string") {
              nccoArray = JSON.parse(responseData.ncco);
            } else if (Array.isArray(responseData.ncco)) {
              nccoArray = responseData.ncco;
            }

            if (nccoArray && Array.isArray(nccoArray)) {
              const talkAction = nccoArray.find((action) => action && action.action === "talk");
              if (talkAction) {
                if (talkAction.text) {
                  aiMessage = talkAction.text;
                  console.log(
                    `✅ [TWILIO-GET-TEST-${requestId}] Found talk action text:`,
                    aiMessage
                  );
                }
                if (talkAction.voiceName || talkAction.voice) {
                  voiceName = talkAction.voiceName || talkAction.voice;
                  console.log(`✅ [TWILIO-GET-TEST-${requestId}] Found voice:`, voiceName);
                }
              }
            }
          } else {
            console.warn(`⚠️ [TWILIO-GET-TEST-${requestId}] No ncco data found in N8N response`);
            console.warn(
              `⚠️ [TWILIO-GET-TEST-${requestId}] This suggests N8N workflow is not configured correctly`
            );
          }
        } else {
          console.warn(`⚠️ [TWILIO-GET-TEST-${requestId}] N8N response is not in expected format`);
        }

        console.log(`✅ [TWILIO-GET-TEST-${requestId}] Final AI message:`, aiMessage);
        console.log(`✅ [TWILIO-GET-TEST-${requestId}] Final voice:`, voiceName);

        // Generate TwiML
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voiceName}">${aiMessage}</Say>
  <Record maxLength="30" action="https://capco-fire-dev.loca.lt/api/webhook/twilio-recording" method="POST" />
</Response>`;

        return new Response(twiml, {
          status: 200,
          headers: {
            "Content-Type": "text/xml",
          },
        });
      } else {
        console.error(`❌ [TWILIO-GET-TEST-${requestId}] N8N request failed:`, n8nResponse.status);
        const errorText = await n8nResponse.text();
        console.error(`❌ [TWILIO-GET-TEST-${requestId}] N8N error response:`, errorText);
      }
    } catch (n8nError) {
      console.error(`❌ [TWILIO-GET-TEST-${requestId}] Error calling N8N:`, n8nError);
    }

    // Fallback response
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! This is your AI assistant. How can I help you today?</Say>
  <Record maxLength="30" action="https://capco-fire-dev.loca.lt/api/webhook/twilio-recording" method="POST" />
</Response>`;

    return new Response(fallbackTwiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error(`❌ [TWILIO-GET-TEST-${requestId}] Error:`, error);

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error processing your request.</Say>
</Response>`;

    return new Response(errorTwiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
};
