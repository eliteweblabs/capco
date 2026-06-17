# Generate a Vapi assistant (generic, portable)

Use this guide in **any** project directory. It describes how to create or update a **Vapi assistant** (their term for the voice agent) via the REST API so you can version-control config and reproduce it across environments.

**Official reference:** [Vapi API docs](https://docs.vapi.ai/) (assistant and tool shapes can change; always confirm field names against the latest docs).

---

## What you need first

1. **Vapi account** and a **private API key** (`VAPI_API_KEY`). Never commit it; load from `.env` or your host’s secret store.
2. **Public HTTPS base URL** where your app will receive **server webhooks** (e.g. production `https://yourdomain.com`, or a tunnel such as ngrok during local dev). Vapi must be able to `POST` to this URL from the internet.
3. **Node.js 18+** (has built-in `fetch`). For older Node, install `node-fetch` and adjust the script imports.
4. **Optional:** `dotenv` (`npm i dotenv`) so a local `.env` file is loaded automatically.

---

## Environment variables (template)

Create `.env` in the project root (or export in CI):

```bash
# Required for API scripts
VAPI_API_KEY=sk-...

# Public origin of YOUR app (no trailing slash)
PUBLIC_APP_ORIGIN=https://your-app.example.com

# After first create — paste ID from script output
# VAPI_ASSISTANT_ID=uuid-from-dashboard-or-create-response
```

**Naming:** Keep `VAPI_API_KEY` **server-side only**. Client widgets use Vapi’s **public** key (`PUBLIC_VAPI_KEY` or similar), which is safe to expose in the browser—do not put the private API key in frontend code.

---

## URLs Vapi will call

Point the assistant at **one** server URL Vapi uses for tool/function execution (name in dashboard vs API may vary; in this codebase the assistant payload uses `serverUrl`):

```text
{PUBLIC_APP_ORIGIN}/api/vapi/webhook
```

Add query parameters if your backend routes by tenant (example from this repo):

```text
{PUBLIC_APP_ORIGIN}/api/vapi/webhook?calendarType=calcom&defaultUsername=mybrand
```

Your webhook handler must validate requests (Vapi signing / secrets per their docs) and return the shapes they expect for each tool.

---

## REST endpoints (minimal mental model)

| Action | Method | URL |
|--------|--------|-----|
| Create assistant | `POST` | `https://api.vapi.ai/assistant` |
| Update assistant | `PATCH` | `https://api.vapi.ai/assistant/{id}` |
| Get assistant | `GET` | `https://api.vapi.ai/assistant/{id}` |
| Create tool (function + server URL) | `POST` | `https://api.vapi.ai/tool` |
| List tools | `GET` | `https://api.vapi.ai/tool` |
| Start test call (optional) | `POST` | `https://api.vapi.ai/call` |

All requests: header `Authorization: Bearer ${VAPI_API_KEY}` and `Content-Type: application/json` where a body is sent.

---

## Recommended workflow

1. **Implement the webhook** on your app first (even a stub that logs payload and returns a safe error), and deploy or tunnel so the URL is reachable.
2. **Create tools** (if you use custom tools) with `POST /tool`—each response includes an `id`. Collect those UUIDs.
3. **Create the assistant** with `POST /assistant` using a minimal config (below). Save the returned `id` into `.env` as `VAPI_ASSISTANT_ID`.
4. **Iterate** with `PATCH /assistant/{id}` whenever you change prompts, voice, `toolIds`, or `serverUrl`.
5. **Wire the client** (phone, web widget, or your own UI) with the **assistant id** and Vapi **public** credentials per their widget/SDK docs.

---

## Generic assistant payload (starting point)

The exact JSON schema is defined by Vapi; treat this as a **template** and adjust after reading their current assistant object reference.

```json
{
  "name": "Acme Receptionist",
  "serverUrl": "https://your-app.example.com/api/vapi/webhook",
  "model": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "temperature": 0.7,
    "maxTokens": 1000,
    "messages": [
      {
        "role": "system",
        "content": "You are a concise phone receptionist for Acme. Book appointments when asked. Be brief."
      }
    ],
    "toolIds": []
  },
  "voice": {
    "provider": "11labs",
    "voiceId": "paula"
  },
  "firstMessage": "Thanks for calling Acme. How can I help?",
  "maxDurationSeconds": 300,
  "endCallMessage": "Goodbye!",
  "endCallPhrases": ["goodbye", "bye", "hang up"],
  "backgroundSound": "office",
  "silenceTimeoutSeconds": 15
}
```

- **`toolIds`:** UUIDs from `POST /tool` (empty array if you only use dashboard-defined behavior and no custom tools yet).
- **Runtime variables:** Vapi supports template variables in prompts (e.g. `{{now}}`). Some teams also replace their own placeholders (e.g. `{{COMPANY_NAME}}`) in a script before `POST`/`PATCH`.
- **`functions`:** Older or mixed configs sometimes use a top-level `functions` array; prefer whatever the latest docs recommend for new assistants.

---

## Drop-in script (any repo)

Save as `scripts/vapi-spinup.mjs` (or `.cjs` with `require` if you prefer CommonJS). Copy the **whole file** into the target directory; set `PUBLIC_APP_ORIGIN` in `.env`.

```javascript
/**
 * Generic Vapi assistant create / update.
 * Usage:
 *   node scripts/vapi-spinup.mjs          # PATCH if VAPI_ASSISTANT_ID set, else POST create
 *   node scripts/vapi-spinup.mjs create   # force POST (new assistant)
 *
 * Env: VAPI_API_KEY, PUBLIC_APP_ORIGIN
 * Optional: VAPI_ASSISTANT_ID, WEBHOOK_PATH (default /api/vapi/webhook)
 */
import "dotenv/config";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ORIGIN = (process.env.PUBLIC_APP_ORIGIN || "").replace(/\/$/, "");
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || "/api/vapi/webhook";
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || "";
const FORCE_CREATE = process.argv.includes("create");

function buildAssistantBody() {
  const serverUrl = `${ORIGIN}${WEBHOOK_PATH.startsWith("/") ? "" : "/"}${WEBHOOK_PATH}`;
  const company = process.env.COMPANY_NAME || "Your Company";

  return {
    name: `${company} Assistant`,
    serverUrl,
    model: {
      provider: process.env.VAPI_MODEL_PROVIDER || "anthropic",
      model: process.env.VAPI_MODEL_NAME || "claude-3-5-sonnet-20241022",
      temperature: Number(process.env.VAPI_TEMPERATURE || 0.7),
      maxTokens: Number(process.env.VAPI_MAX_TOKENS || 1000),
      messages: [
        {
          role: "system",
          content:
            process.env.VAPI_SYSTEM_PROMPT ||
            `You are a helpful voice assistant for ${company}. Keep answers short unless the caller asks for detail.`,
        },
      ],
      toolIds: (process.env.VAPI_TOOL_IDS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    },
    voice: {
      provider: process.env.VAPI_VOICE_PROVIDER || "11labs",
      voiceId: process.env.VAPI_VOICE_ID || "paula",
    },
    firstMessage:
      process.env.VAPI_FIRST_MESSAGE || `Thank you for calling ${company}. How may I help you?`,
    maxDurationSeconds: Number(process.env.VAPI_MAX_DURATION_SECONDS || 300),
    endCallMessage: process.env.VAPI_END_CALL_MESSAGE || `Thanks for calling ${company}. Goodbye!`,
    endCallPhrases: ["goodbye", "bye", "hang up", "that's all"],
    backgroundSound: process.env.VAPI_BACKGROUND_SOUND || "office",
    silenceTimeoutSeconds: Number(process.env.VAPI_SILENCE_TIMEOUT_SECONDS || 15),
  };
}

async function main() {
  if (!VAPI_API_KEY) {
    console.error("Missing VAPI_API_KEY");
    process.exit(1);
  }
  if (!ORIGIN) {
    console.error("Missing PUBLIC_APP_ORIGIN (https://... no trailing slash)");
    process.exit(1);
  }

  const body = buildAssistantBody();
  const headers = {
    Authorization: `Bearer ${VAPI_API_KEY}`,
    "Content-Type": "application/json",
  };

  if (ASSISTANT_ID && !FORCE_CREATE) {
    const res = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("PATCH failed:", res.status, text);
      process.exit(1);
    }
    console.log("Updated assistant:", ASSISTANT_ID);
    return;
  }

  const res = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("POST failed:", res.status, text);
    process.exit(1);
  }
  const created = JSON.parse(text);
  console.log("Created assistant id:", created.id);
  console.log("Add to .env: VAPI_ASSISTANT_ID=" + created.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

**`package.json` snippet:**

```json
{
  "type": "module",
  "scripts": {
    "vapi:spinup": "node scripts/vapi-spinup.mjs"
  },
  "dependencies": {
    "dotenv": "^16.4.5"
  }
}
```

**Optional tool IDs:** set `VAPI_TOOL_IDS=id1,id2,id3` after you create tools via API or copy IDs from the Vapi dashboard.

---

## Creating one custom tool (pattern)

Tools are created **per Vapi account**; each tool’s `server.url` should hit the same (or a dedicated) webhook path your code understands.

Example shape (adjust to match [Vapi tool API](https://docs.vapi.ai/)):

```javascript
const toolConfig = {
  type: "function",
  async: false,
  function: {
    name: "myAction",
    description: "Does something when the user asks.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "User intent or search string" },
      },
      required: ["query"],
    },
  },
  server: {
    url: `${process.env.PUBLIC_APP_ORIGIN}/api/vapi/webhook`,
    timeoutSeconds: 30,
  },
  messages: [
    { type: "request-start", content: "One moment." },
    { type: "request-complete", content: "Done." },
    { type: "request-failed", content: "That did not work. Try again?" },
  ],
};

const res = await fetch("https://api.vapi.ai/tool", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(toolConfig),
});
const tool = await res.json();
console.log("New tool id:", tool.id);
```

Add `tool.id` to `VAPI_TOOL_IDS` or to the assistant’s `model.toolIds` array, then `PATCH` the assistant.

---

## Alternative: dashboard-only

You can create an assistant entirely in the [Vapi dashboard](https://dashboard.vapi.ai) and paste the assistant ID into your app. Scripts are still useful to **reapply** prompts and tool lists consistently across staging and production.

---

## Checklist before you call it “done”

- [ ] Webhook URL returns 200 from the public internet (use curl from outside your LAN or Vapi’s test tools).
- [ ] Private `VAPI_API_KEY` is not in git or client bundles.
- [ ] Assistant ID and public widget key are in the correct env vars for each environment.
- [ ] Model / voice IDs are valid for your Vapi plan.
- [ ] You re-ran `PATCH` after any prompt or `toolIds` change.

---

## How this maps to *this* repo (optional)

If you merge this into `astro-supabase-main` later:

- Per-client examples: `scripts/vapi-*-config.js` (create + update + tool helpers).
- Multi-tenant updates from one JSON file: `scripts/update-vapi-from-master.js` + `scripts/data/vapi-master.json`.
- Runtime handler: `src/pages/api/vapi/webhook.ts`.

The file you are reading is **intentionally generic** so it stays valid as a copy-paste playbook in other directories.
