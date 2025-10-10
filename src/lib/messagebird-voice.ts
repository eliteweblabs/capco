// MessageBird Voice API utilities for voice channel management

export interface MessageBirdVoiceConfig {
  accessKey: string;
  workspaceId: string;
  baseUrl?: string;
}

export interface CreateVoiceConnectorRequest {
  name: string;
  phoneNumberId: string;
  connectorTemplateRef?: string;
}

export interface VoiceConnector {
  id: string;
  workspaceId: string;
  name: string;
  channel?: {
    channelId: string;
    platform: string;
  };
  number?: {
    numberId: string;
    phoneNumber: string;
    profileId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export class MessageBirdVoiceAPI {
  private config: MessageBirdVoiceConfig;

  constructor(config: MessageBirdVoiceConfig) {
    this.config = {
      baseUrl: "https://api.bird.com",
      ...config,
    };
  }

  /**
   * Create a new voice connector
   */
  async createVoiceConnector(request: CreateVoiceConnectorRequest): Promise<VoiceConnector> {
    const url = `${this.config.baseUrl}/workspaces/${this.config.workspaceId}/connectors`;

    const payload = {
      connectorTemplateRef: request.connectorTemplateRef || "voice-messagebird:1",
      name: request.name,
      arguments: {
        phoneNumberId: request.phoneNumberId,
      },
    };

    console.log("🔧 [MESSAGEBIRD-VOICE] Creating voice connector:", payload);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `AccessKey ${this.config.accessKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create voice connector: ${response.status} ${error}`);
    }

    const connector = await response.json();
    console.log("✅ [MESSAGEBIRD-VOICE] Voice connector created:", connector.id);

    return connector;
  }

  /**
   * Get voice connector details including channel ID
   */
  async getVoiceConnector(connectorId: string): Promise<VoiceConnector> {
    const url = `${this.config.baseUrl}/workspaces/${this.config.workspaceId}/connectors/${connectorId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `AccessKey ${this.config.accessKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get voice connector: ${response.status} ${error}`);
    }

    const connector = await response.json();
    console.log("✅ [MESSAGEBIRD-VOICE] Voice connector retrieved:", connector.id);

    return connector;
  }

  /**
   * Get channel ID from connector
   */
  async getChannelId(connectorId: string): Promise<string | null> {
    const connector = await this.getVoiceConnector(connectorId);
    return connector.channel?.channelId || null;
  }

  /**
   * List all voice connectors
   */
  async listVoiceConnectors(): Promise<VoiceConnector[]> {
    const url = `${this.config.baseUrl}/workspaces/${this.config.workspaceId}/connectors`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `AccessKey ${this.config.accessKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list voice connectors: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.connectors || [];
  }
}

/**
 * Initialize MessageBird Voice API with environment variables
 */
export function createMessageBirdVoiceAPI(): MessageBirdVoiceAPI {
  const accessKey = import.meta.env.BIRD_ACCESS_KEY;
  const workspaceId = import.meta.env.BIRD_WORKSPACE_ID;

  if (!accessKey) {
    throw new Error("BIRD_ACCESS_KEY environment variable is required");
  }

  if (!workspaceId) {
    throw new Error("BIRD_WORKSPACE_ID environment variable is required");
  }

  return new MessageBirdVoiceAPI({
    accessKey,
    workspaceId,
  });
}

/**
 * Helper function to create a voice connector for fire protection system
 */
export async function setupFireProtectionVoiceChannel(
  phoneNumberId: string,
  connectorName: string = "CAPCo Fire Protection Voice Channel"
): Promise<{ connectorId: string; channelId: string }> {
  const api = createMessageBirdVoiceAPI();

  console.log("🔥 [FIRE-PROTECTION-VOICE] Setting up voice channel for fire protection system");

  // Create voice connector
  const connector = await api.createVoiceConnector({
    name: connectorName,
    phoneNumberId,
  });

  // Get channel ID
  const channelId = await api.getChannelId(connector.id);

  if (!channelId) {
    throw new Error("Failed to get channel ID from connector");
  }

  console.log("✅ [FIRE-PROTECTION-VOICE] Voice channel setup complete:", {
    connectorId: connector.id,
    channelId,
  });

  return {
    connectorId: connector.id,
    channelId,
  };
}
