# Admin Voice Assistant Widget

## Overview

The voice assistant (VAPI) is available as an **admin-only** floating widget. When an admin is logged in, the SpeedDial is replaced by this widget. New form submissions (contact and MEP) are polled and announced out loud by the agent.

**Admin mode** keeps all assistant logic and learning in one place: the same VAPI assistant can serve both **customer** and **admin** contexts. The widget always passes `metadata.mode = "admin"` when starting a call, and shows an **Admin** badge in the panel header. In the VAPI dashboard, configure the assistant to branch on `metadata.mode` or `metadata.userRole` (e.g. when mode is `"admin"`, offer form alerts, create project, check client, welcome email; otherwise use customer-handling behavior). The webhook receives `callMetadata.mode` and can use it for admin-only tool behavior.

## Behavior

- **Who sees it**: Only users with role `Admin`. Other users still see the SpeedDial.
- **Where**: Same position as SpeedDial (fixed bottom-right). Rendered inside the StickyActions portal.
- **Flow**:
  1. Admin clicks the mic FAB → panel opens with "Start Voice Assistant".
  2. On Start, VAPI call begins and **submission polling** starts (every 30s).
  3. When polling finds new **contact** or **MEP** submissions, the widget sends a system message to the agent with the text to speak. The agent should **read that message out loud** (see prompt below).
  4. Example announcements the agent will receive and should read aloud (format: user name, action, time, project/address when applicable):
     - *"Read aloud: Jane Doe submitted a new contact form at 2:30 PM."*
     - *"Read aloud: Client Joe submitted a new MEP project at 2:35 PM. Project: MEP Project - Warehouse. Address: 123 Main St."*
  5. After the agent reads them out, the assistant can then:
     - **Read it** → use tool `getContactSubmission(submissionId)` to get details.
     - **Create project** → use tool `createProjectFromContactSubmission(submissionId)` (creates user if needed, then project).
     - **Check client** → use tool `checkClientExists(email)` to see if an account exists.
     - **Send welcome email** → use tool `sendWelcomeEmail(email, name)` after creating an account.

## APIs

- **GET /api/admin/new-submissions?since=ISO_TIMESTAMP**  
  Admin-only. Returns `contactSubmissions` and `mepProjects` (projects with title like "MEP Project -%") since the given time. Used by the widget for polling.

- **POST /api/admin/create-project-from-contact**  
  Admin-only (or internal call with `X-Internal-Secret`). Body: `{ submissionId }`. Creates or finds user from contact submission, then creates a project. Used by VAPI webhook when the assistant says "create project".

## Agent: read announcements out loud

The widget sends system messages that start with **`Read aloud:`** when new submissions are detected. Each announcement includes: **user name**, **action/change**, **time**, and **project name** (or address) when applicable.

In the **VAPI dashboard** → your assistant → **System prompt** (or instructions), add:

- *"When you receive a system message that starts with 'Read aloud:', say the rest of that message out loud to the admin in a clear, natural way. Do not add extra commentary before or after unless the user asks."*

That way the polling layer (widget) only pushes the text; the agent (one place for logic and learning) handles how it’s read out.

## VAPI Webhook Tools (for assistant)

Configure these on the VAPI assistant so it can respond to "read it?", "create project?", "send welcome email?":

- **checkClientExists** – `{ email }` → "Yes, existing account for …" or "No existing account … Would you like to send a welcome email?"
- **getContactSubmission** – `{ submissionId }` → summary of that contact submission.
- **createProjectFromContactSubmission** – `{ submissionId }` → creates project (and user if needed); returns message suggesting sending welcome email.
- **sendWelcomeEmail** – `{ email, name? }` → sends welcome email via delivery API.

## Internal webhook secret

When the VAPI webhook calls `create-project-from-contact`, it has no user cookies. So the webhook sends **X-Internal-Secret** and the API accepts the request if it matches:

- `INTERNAL_WEBHOOK_SECRET` or `VAPI_WEBHOOK_SECRET` (set the same value in env and in VAPI dashboard if needed).

If not set, only cookie-authenticated admin requests can create projects from the API (e.g. from the dashboard); voice-driven creation will 403 until the secret is set.

## Files

- `src/components/admin/AdminVoiceAssistantWidget.astro` – Widget UI + VAPI init + submission polling.
- `src/components/project/StickyActions.astro` – Renders AdminVoiceAssistantWidget for Admin, SpeedDial otherwise.
- `src/pages/api/admin/new-submissions.ts` – Polling endpoint.
- `src/pages/api/admin/create-project-from-contact.ts` – Create project (and user) from a contact submission.
- `src/pages/api/vapi/webhook.ts` – Tool handlers: checkClientExists, getContactSubmission, createProjectFromContactSubmission, sendWelcomeEmail.

## Full-page voice assistant

The full page at **/voice-assistant-vapi** is unchanged and still available (e.g. for Gmail, file upload, full UI). The widget is a compact, admin-only replacement for the SpeedDial on all other pages.

## Local / offline development

**VAPI only tests when the app is reachable at a public URL.** On localhost the widget shows a blue hint: *"VAPI only works with a public URL. Test voice on your deployed site, or use a tunnel (e.g. ngrok) and add that URL to VAPI allowed origins."* You can still try Start; if you use ngrok (or similar) and add the tunnel URL to VAPI Dashboard → API Keys → Allowed origins, voice will work from local.

## "Failed to fetch" / Connection errors

If the widget shows **Connection failed** or the console shows `TypeError: Failed to fetch` for `POST https://api.vapi.ai/call/web`, the request is usually blocked by **VAPI API key origin restrictions**.

1. Open the **VAPI Dashboard** → **API Keys** (or your key’s settings).
2. Find **Allowed origins** (or similar) for the key used as `PUBLIC_VAPI_KEY`.
3. Add the exact origin the widget runs on, including protocol and port, e.g.:
   - `https://yourdomain.com`
   - `https://admin.yourdomain.com`
   - `http://localhost:4321` (for local dev)
4. Save and retry the widget. The panel will show a hint and a **Retry** button after a failed connection.
