// Environment variables will be passed as parameters to avoid build-time issues

const MESSAGEBIRD_API_BASE_URL = 'https://api.bird.com';

interface WebhookSubscription {
  service: string;
  event: string;
  url: string;
  signingKey: string;
  eventFilters?: Array<{
    key: string;
    value: string;
  }>;
}

interface CreateWebhookResponse {
  id: string;
  service: string;
  event: string;
  url: string;
  signingKey: string;
  eventFilters?: Array<{
    key: string;
    value: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates a webhook subscription for voice inbound calls
 * @param accessKey The MessageBird access key
 * @param siteUrl The site URL for the webhook endpoint
 * @param channelId The channel ID to filter by (optional)
 * @param signingKey The signing key for webhook validation
 * @returns The created webhook subscription or an error
 */
export async function createVoiceInboundWebhook(
  accessKey: string,
  siteUrl: string,
  channelId?: string,
  signingKey: string = 'voice-webhook-secret'
): Promise<{ success: true; webhook: CreateWebhookResponse } | { success: false; error: string }> {
  if (!accessKey) {
    return { success: false, error: "MessageBird API key is not configured." };
  }

  const url = `${MESSAGEBIRD_API_BASE_URL}/webhook-subscriptions`;
  
  const webhookData: WebhookSubscription = {
    service: "channels",
    event: "voice.inbound",
    url: `${siteUrl}/api/webhook/incoming-call`,
    signingKey: signingKey,
    eventFilters: [
      {
        key: "status",
        value: "starting"
      },
      {
        key: "status", 
        value: "ringing"
      },
      {
        key: "status",
        value: "ongoing"
      },
      {
        key: "status",
        value: "completed"
      }
    ]
  };

  // Add channel filter if provided
  if (channelId) {
    webhookData.eventFilters?.push({
      key: "channelId",
      value: channelId
    });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `AccessKey ${accessKey}`,
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`❌ [MESSAGEBIRD-WEBHOOK] Failed to create webhook: ${response.status} - ${errorBody.message}`);
      return { success: false, error: errorBody.message || `Failed to create webhook: ${response.status}` };
    }

    const webhook: CreateWebhookResponse = await response.json();
    console.log(`✅ [MESSAGEBIRD-WEBHOOK] Voice inbound webhook created with ID: ${webhook.id}`);
    return { success: true, webhook };
  } catch (error) {
    console.error("❌ [MESSAGEBIRD-WEBHOOK] Error creating webhook:", error);
    return { success: false, error: `Network error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Lists all webhook subscriptions
 * @param accessKey The MessageBird access key
 * @returns Array of webhook subscriptions or an error
 */
export async function listWebhookSubscriptions(accessKey: string): Promise<{ success: true; webhooks: CreateWebhookResponse[] } | { success: false; error: string }> {
  if (!accessKey) {
    return { success: false, error: "MessageBird API key is not configured." };
  }

  const url = `${MESSAGEBIRD_API_BASE_URL}/webhook-subscriptions`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `AccessKey ${accessKey}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`❌ [MESSAGEBIRD-WEBHOOK] Failed to list webhooks: ${response.status} - ${errorBody.message}`);
      return { success: false, error: errorBody.message || `Failed to list webhooks: ${response.status}` };
    }

    const webhooks: CreateWebhookResponse[] = await response.json();
    console.log(`✅ [MESSAGEBIRD-WEBHOOK] Retrieved ${webhooks.length} webhook subscriptions.`);
    return { success: true, webhooks };
  } catch (error) {
    console.error("❌ [MESSAGEBIRD-WEBHOOK] Error listing webhooks:", error);
    return { success: false, error: `Network error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Deletes a webhook subscription
 * @param accessKey The MessageBird access key
 * @param webhookId The ID of the webhook to delete
 * @returns Success or error
 */
export async function deleteWebhookSubscription(accessKey: string, webhookId: string): Promise<{ success: true } | { success: false; error: string }> {
  if (!accessKey) {
    return { success: false, error: "MessageBird API key is not configured." };
  }

  const url = `${MESSAGEBIRD_API_BASE_URL}/webhook-subscriptions/${webhookId}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `AccessKey ${accessKey}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`❌ [MESSAGEBIRD-WEBHOOK] Failed to delete webhook: ${response.status} - ${errorBody.message}`);
      return { success: false, error: errorBody.message || `Failed to delete webhook: ${response.status}` };
    }

    console.log(`✅ [MESSAGEBIRD-WEBHOOK] Webhook ${webhookId} deleted successfully.`);
    return { success: true };
  } catch (error) {
    console.error("❌ [MESSAGEBIRD-WEBHOOK] Error deleting webhook:", error);
    return { success: false, error: `Network error: ${error instanceof Error ? error.message : String(error)}` };
  }
}
