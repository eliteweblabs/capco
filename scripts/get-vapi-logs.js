/**
 * Get VAPI Call Logs
 *
 * Fetches recent call logs and transcripts from VAPI.ai
 */

import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = "3ae002d5-fe9c-4870-8034-4c66a9b43b51";

async function getRecentCalls(limit = 10) {
  try {
    console.log("📞 Fetching recent VAPI calls...\n");

    const response = await fetch(
      `https://api.vapi.ai/call?assistantId=${ASSISTANT_ID}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch calls: ${response.status} ${error}`);
    }

    const calls = await response.json();

    if (!calls || calls.length === 0) {
      console.log("No calls found.");
      return;
    }

    console.log(`Found ${calls.length} calls:\n`);

    calls.forEach((call, index) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Call #${index + 1}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`ID: ${call.id}`);
      console.log(`Status: ${call.status}`);
      console.log(`Started: ${call.startedAt ? new Date(call.startedAt).toLocaleString() : "N/A"}`);
      console.log(`Ended: ${call.endedAt ? new Date(call.endedAt).toLocaleString() : "N/A"}`);

      if (call.endedAt && call.startedAt) {
        const duration = Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000);
        console.log(`Duration: ${duration}s`);
      }

      if (call.cost) {
        console.log(`Cost: $${call.cost.toFixed(4)}`);
      }

      if (call.endedReason) {
        console.log(`End Reason: ${call.endedReason}`);
      }

      // Show transcript if available
      if (call.transcript) {
        console.log(`\n📝 Transcript:`);
        if (typeof call.transcript === "string") {
          console.log(call.transcript);
        } else if (Array.isArray(call.transcript)) {
          call.transcript.forEach((msg, i) => {
            const speaker = msg.role === "user" ? "👤 CALLER" : "🤖 ASSISTANT";
            console.log(`\n${i + 1}. ${speaker}:`);
            console.log(`   ${msg.message || msg.content || JSON.stringify(msg)}`);
          });
        } else {
          console.log(JSON.stringify(call.transcript, null, 2));
        }
      }

      // Show function calls if available
      if (call.messages) {
        const functionCalls = call.messages.filter(
          (m) => m.type === "function-call" || m.functionCall
        );
        if (functionCalls.length > 0) {
          console.log(`\n🔧 Function Calls:`);
          functionCalls.forEach((fc, i) => {
            const funcCall = fc.functionCall || fc;
            console.log(`\n${i + 1}. ${funcCall.name || "unknown"}`);
            if (funcCall.parameters) {
              console.log(`   Parameters:`, JSON.stringify(funcCall.parameters, null, 2));
            }
            if (funcCall.result) {
              console.log(`   Result:`, JSON.stringify(funcCall.result, null, 2));
            }
          });
        }
      }

      // Show analysis if available
      if (call.analysis) {
        console.log(`\n📊 Analysis:`);
        if (call.analysis.summary) {
          console.log(`Summary: ${call.analysis.summary}`);
        }
        if (call.analysis.successEvaluation) {
          console.log(`Success: ${call.analysis.successEvaluation}`);
        }
      }
    });

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return calls;
  } catch (error) {
    console.error("❌ Error fetching calls:", error.message);
    throw error;
  }
}

async function getCallDetails(callId) {
  try {
    console.log(`📞 Fetching details for call ${callId}...\n`);

    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch call: ${response.status} ${error}`);
    }

    const call = await response.json();
    console.log(JSON.stringify(call, null, 2));

    return call;
  } catch (error) {
    console.error("❌ Error fetching call details:", error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const value = args[1];

  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_API_KEY not found in environment");
    console.error("Please set VAPI_API_KEY in your .env file");
    process.exit(1);
  }

  try {
    if (command === "call" && value) {
      // Get specific call details
      await getCallDetails(value);
    } else {
      // Get recent calls (default 10, or custom limit)
      const limit = value ? parseInt(value) : 10;
      await getRecentCalls(limit);
    }
  } catch (error) {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { getRecentCalls, getCallDetails };
