# Cotypist-like AI Autocomplete (using your stack)

## What is Cotypist?

[Cotypist](https://cotypist.app/) is an AI autocomplete app for Mac: as you type in any app, it suggests the next words; you press **Tab** to accept. It runs locally and works in every app.

## Can we do that with VAPI?

- **VAPI** is **voice-first**: real-time calls, transcription, TTS, tool calling. It does not expose a “complete this text” API.
- So we **cannot** literally “use VAPI” for typing completion (no VAPI endpoint that takes text and returns the next words).

We **can** build a **Cotypist-like experience** that uses the **same LLM** as your stack (and thus the same “brain” as your VAPI assistant):

- Your VAPI assistant is backed by an LLM (e.g. configured in the VAPI dashboard; your app already uses **Anthropic** elsewhere).
- We added a **text completion API** that uses the same **Anthropic** key and a small “complete the following text” prompt.
- So: same model/knowledge as the rest of the app, just used for **text completion** instead of voice.

## What was added

1. **`/api/ai/complete`**
   - POST body: `{ text: string, maxTokens?: number }`
   - Returns: `{ completion: string }`
   - Uses Anthropic (e.g. `claude-3-5-haiku`) to return a short continuation of `text`.
   - Same env: `ANTHROPIC_API_KEY`.

2. **Test page: `/tests/ai-autocomplete`**
   - A text area; after you pause typing, the app requests a completion and shows it in a pill.
   - **Tab** accepts the suggestion and inserts it.
   - Explains that it uses the same brain as the VAPI assistant.

## How to use

- Open **/tests/ai-autocomplete** (authenticated).
- Type a few sentences, pause; a suggestion appears below.
- Press **Tab** to insert it.

## Going further

- **In-app only**: The current UX is “suggestion in a pill, Tab to accept.” You could refine it (e.g. ghost text inline in a contenteditable) on other pages (e.g. CMS, contact form).
- **“Works everywhere” like Cotypist**: That would require a **separate native Mac app** (or browser extension) that hooks into the system or into web text fields and calls your `/api/ai/complete` endpoint. That’s outside this Astro app but can still use the same API and key.
- **Voice + text**: You can keep VAPI for voice and use this completion for typed content (e.g. “dictate with VAPI, then refine with AI completions” in one flow).

## Summary

| Goal                        | Possible? | How                                                                       |
| --------------------------- | --------- | ------------------------------------------------------------------------- |
| Cotypist-like in this app   | Yes       | `/api/ai/complete` + test page (Tab to accept).                           |
| Same “brain” as VAPI        | Yes       | Same Anthropic key; VAPI uses its own config, we use ours for completion. |
| Use VAPI API for completion | No        | VAPI is voice-only; no text completion endpoint.                          |
| Native “everywhere” app     | Yes\*     | Separate Mac app or extension calling `/api/ai/complete`.                 |

_\* Separate project; this repo only provides the API and in-app demo._
