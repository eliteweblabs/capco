/**
 * Twilio SMS Helper
 * Sends SMS via Twilio REST API (no SDK needed)
 */

const TWILIO_SID = import.meta.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = import.meta.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = import.meta.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER;

export interface SmsResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.error("[OPS-SMS] Twilio not configured");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_FROM,
        Body: body,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[OPS-SMS] Twilio error:", data);
      return { success: false, error: data.message || "Twilio API error" };
    }

    return { success: true, sid: data.sid };
  } catch (err: any) {
    console.error("[OPS-SMS] Send failed:", err);
    return { success: false, error: err.message };
  }
}
