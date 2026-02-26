#!/usr/bin/env node
/**
 * Update VAPI assistants from a single master config.
 * Per-instance data lives in scripts/data/vapi-master.json; prompts in scripts/data/vapi-prompts/.
 *
 * Usage:
 *   node scripts/update-vapi-from-master.js [instance-id|all]
 *   node scripts/update-vapi-from-master.js capco
 *   node scripts/update-vapi-from-master.js innercity
 *   node scripts/update-vapi-from-master.js all
 *
 * Env: VAPI_API_KEY required. Per-instance webhook/company from master (webhookDomainEnv, companyNameEnv, etc.).
 */

import "dotenv/config";
import fetch from "node-fetch";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const MASTER_PATH = path.join(DATA_DIR, "vapi-master.json");
const PROMPTS_DIR = path.join(DATA_DIR, "vapi-prompts");

const VAPI_API_KEY = process.env.VAPI_API_KEY;

function ensureProtocol(url) {
  if (!url || typeof url !== "string") return url;
  const s = url.trim().replace(/\/$/, "");
  if (!s.startsWith("http://") && !s.startsWith("https://")) return `https://${s}`;
  return s;
}

function loadMaster() {
  const raw = fs.readFileSync(MASTER_PATH, "utf8");
  return JSON.parse(raw);
}

function loadPromptTemplate(templateName) {
  const base = path.join(PROMPTS_DIR, templateName);
  for (const ext of [".md", ".txt", ""]) {
    const p = ext ? base + ext : base;
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
  }
  throw new Error(`Prompt template not found: ${templateName} in ${PROMPTS_DIR}`);
}

function replacePlaceholders(text, vars) {
  if (!text || typeof text !== "string") return text;
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    if (value != null) out = out.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), String(value));
  }
  return out;
}

function resolveWebhook(instance) {
  const envNames = Array.isArray(instance.webhookDomainEnv)
    ? instance.webhookDomainEnv
    : [instance.webhookDomainEnv].filter(Boolean);
  for (const name of envNames) {
    const v = process.env[name];
    if (v && !v.includes("${") && !v.includes("{{")) return ensureProtocol(v);
  }
  return ensureProtocol(instance.webhookFallback || "");
}

function resolveCompanyName(instance) {
  if (instance.companyName) return instance.companyName;
  const envName = instance.companyNameEnv;
  if (envName && process.env[envName]) return process.env[envName];
  return instance.companyNameFallback || "Company";
}

function getVars(instance) {
  const companyName = resolveCompanyName(instance);
  return {
    COMPANY_NAME: companyName,
    OWNER_NAME: instance.ownerName ?? "",
  };
}

async function listVapiTools(apiKey, functionName = null) {
  const res = await fetch("https://api.vapi.ai/tool", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`List tools failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  const tools = Array.isArray(body) ? body : body?.tools ?? body?.data ?? [];
  const list = Array.isArray(tools) ? tools : [];
  if (!functionName) return list;
  return list.filter((t) => t?.function?.name === functionName);
}

async function ensureProcessFileTool(apiKey, webhookUrl, logPrefix) {
  const existing = await listVapiTools(apiKey, "processFile");
  if (existing.length > 0) {
    console.log(`${logPrefix} Using existing processFile tool: ${existing[0].id}`);
    return existing[0].id;
  }
  const toolConfig = {
    type: "function",
    async: false,
    function: {
      name: "processFile",
      description:
        "Process an uploaded PDF or image file. Extract text content using OCR for images or text extraction for PDFs. Use this when the user uploads a document or image file.",
      parameters: {
        type: "object",
        properties: {
          fileUrl: {
            type: "string",
            description: "The URL of the uploaded file (provided by VAPI when user uploads a file)",
          },
          fileName: { type: "string", description: "The name of the file" },
          fileType: {
            type: "string",
            description:
              "The MIME type of the file (e.g., 'application/pdf', 'image/png', 'image/jpeg')",
          },
          saveToKnowledge: {
            type: "boolean",
            description:
              "Whether to save the extracted content to the knowledge base for future reference",
            default: false,
          },
        },
        required: ["fileUrl", "fileName", "fileType"],
      },
    },
    server: { url: webhookUrl, timeoutSeconds: 60 },
    messages: [
      { type: "request-start", content: "Let me process that file for you." },
      { type: "request-complete", content: "File processed successfully!" },
      {
        type: "request-failed",
        content: "I'm having trouble processing that file right now. Please try again.",
      },
    ],
  };
  const res = await fetch("https://api.vapi.ai/tool", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toolConfig),
  });
  if (!res.ok) throw new Error(`Create processFile tool failed: ${res.status} ${await res.text()}`);
  const tool = await res.json();
  console.log(`${logPrefix} processFile tool created: ${tool.id}`);
  return tool.id;
}

function buildAssistantConfig(instance, shared, webhookUrl, systemPrompt, toolIds) {
  const vars = getVars(instance);
  const name = replacePlaceholders("{{COMPANY_NAME}} Receptionist", vars);
  const firstMessage = replacePlaceholders(instance.firstMessage || "Thank you for calling {{COMPANY_NAME}}. How may I help you?", vars);
  const endCallMessage = replacePlaceholders(
    instance.endCallMessage || "Thanks for calling {{COMPANY_NAME}}. Have a great day!",
    vars
  );

  const config = {
    name,
    serverUrl: webhookUrl,
    functions: [],
    model: {
      ...shared.model,
      messages: [{ role: "system", content: systemPrompt }],
      toolIds: toolIds || [],
    },
    voice: instance.voice || shared.voice || { provider: "11labs", voiceId: "paula" },
    firstMessage,
    endCallMessage,
    maxDurationSeconds: shared.maxDurationSeconds ?? 300,
    endCallPhrases: shared.endCallPhrases ?? ["goodbye", "bye", "that's all", "finished", "end call", "hangup"],
    backgroundSound: shared.backgroundSound ?? "office",
    silenceTimeoutSeconds: shared.silenceTimeoutSeconds ?? 15,
  };
  return config;
}

async function updateAssistant(apiKey, assistantId, config) {
  const res = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`Update assistant failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function runInstance(master, instanceId) {
  const instance = master.instances[instanceId];
  if (!instance) {
    console.error(`Unknown instance: ${instanceId}. Known: ${Object.keys(master.instances).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const logPrefix = instance.logPrefix || `[VAPI-${instanceId.toUpperCase()}]`;
  const shared = master.shared || {};

  const webhookBase = resolveWebhook(instance);
  if (!webhookBase) {
    console.error(`${logPrefix} No webhook domain (set one of: ${(instance.webhookDomainEnv || []).join(", ")})`);
    process.exitCode = 1;
    return;
  }

  let webhookUrl = `${webhookBase.replace(/\/$/, "")}/api/vapi/webhook`;
  const params = new URLSearchParams();
  if (instance.calendarType) params.set("calendarType", instance.calendarType);
  if (instance.defaultUsername) params.set("defaultUsername", instance.defaultUsername);
  if (params.toString()) webhookUrl += `?${params.toString()}`;

  const companyName = resolveCompanyName(instance);
  console.log(`${logPrefix} Company: ${companyName}`);
  console.log(`${logPrefix} Webhook: ${webhookUrl}`);

  const templateName = instance.systemPromptTemplate;
  if (!templateName) {
    console.error(`${logPrefix} systemPromptTemplate required in master`);
    process.exitCode = 1;
    return;
  }

  const promptRaw = loadPromptTemplate(templateName);
  const vars = getVars(instance);
  const systemPrompt = replacePlaceholders(promptRaw, vars);

  let toolIds = Array.isArray(instance.toolIds) ? [...instance.toolIds] : [];
  if (instance.ensureProcessFile) {
    const processFileId = await ensureProcessFileTool(VAPI_API_KEY, webhookUrl, logPrefix);
    if (processFileId) toolIds.push(processFileId);
  }

  const config = buildAssistantConfig(instance, shared, webhookUrl, systemPrompt, toolIds);

  if (!instance.assistantId) {
    console.error(`${logPrefix} assistantId required in master`);
    process.exitCode = 1;
    return;
  }

  await updateAssistant(VAPI_API_KEY, instance.assistantId, config);
  console.log(`${logPrefix} Assistant updated: ${instance.assistantId}`);
}

async function main() {
  const instanceArg = process.argv[2] || "all";

  if (!VAPI_API_KEY) {
    console.warn("VAPI_API_KEY not set. Set it in .env or environment.");
    process.exit(1);
  }

  const master = loadMaster();
  const instanceIds =
    instanceArg === "all" ? Object.keys(master.instances || {}) : [instanceArg];

  for (const id of instanceIds) {
    try {
      await runInstance(master, id);
    } catch (err) {
      console.error(`Error running instance ${id}:`, err.message);
      process.exitCode = 1;
    }
  }
}

main();
