import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = "3ae002d5-fe9c-4870-8034-4c66a9b43b51";

async function getAssistant() {
  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed: ${response.status} ${await response.text()}`);
    }

    const assistant = await response.json();
    console.log(JSON.stringify(assistant, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

getAssistant();
