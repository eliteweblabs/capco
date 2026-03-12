# Email -> n8n -> PHONE-INBOX.md

This sets up a low-friction path so text from your phone lands in `markdowns/PHONE-INBOX.md`.

## Goal

- Send email from phone to a dedicated inbox (for example `ai-inbox@yourdomain.com`)
- Auto-forward into an n8n workflow
- n8n appends a task line into `markdowns/PHONE-INBOX.md`

## 1) Create a dedicated inbox

- Create a mailbox/address you can email from your phone.
- In your email provider, create a filter/forwarding rule so messages sent to that address are forwarded to n8n trigger email (IMAP/Gmail trigger) or routed into webhook processing.

## 2) Create n8n workflow

Recommended workflow nodes:

1. **Trigger**: `Gmail Trigger` (or IMAP Email Trigger)
2. **Function**: normalize payload (subject/body/sender/date)
3. **Execute Command**: append to `PHONE-INBOX.md`

If your n8n instance runs on this same machine, use this command in `Execute Command`:

```bash
cd /Users/4rgd/Astro/rothcobuilt && \
msg="$(printf "%s" "{{$json.subject}} | {{$json.from}} | {{$json.text}}" | tr '\n' ' ' | sed 's/  */ /g' | sed 's/"/\\"/g')" && \
printf -- "- [ ] %s\n" "$msg" >> markdowns/PHONE-INBOX.md
```

Notes:
- This appends each incoming email as one unchecked task.
- It strips newlines to keep each item single-line and easy to process.

## 3) Optional: only parse a prefix

If you want cleaner tasks, text from phone can start with `TODO:` and your Function node can keep only content after that prefix.

## 4) Test flow

1. Send an email from your phone to the dedicated address.
2. Confirm n8n workflow run succeeds.
3. Open `markdowns/PHONE-INBOX.md` and verify a new `- [ ]` line was appended.

## 5) Cursor behavior

A project rule now tells the assistant to:
- read `markdowns/PHONE-INBOX.md` at the start of each user session,
- treat unchecked items as actionable requests,
- strike through completed items (or move them to completed).

Because the assistant only acts when you send a message in Cursor, the normal pattern is:

- "Check my phone inbox and process new items."

