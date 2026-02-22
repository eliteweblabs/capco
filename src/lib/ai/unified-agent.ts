/**
 * Unified AI Agent Platform
 *
 * A comprehensive AI agent similar to Claude.ai that can handle multiple tasks:
 * - Document generation
 * - Project analysis
 * - Code compliance checking
 * - Data analysis
 * - And more...
 *
 * This is the core agent that powers the marketable product.
 */

import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "../supabase-admin";

export interface AgentRequest {
  message: string;
  images?: string[]; // Array of image URLs
  context?: {
    projectId?: number;
    userId?: string;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    images?: string[];
    [key: string]: any;
  };
}

export interface AgentResponse {
  content: string;
  actions?: Array<{
    type: string;
    data: any;
  }>;
  metadata: {
    tokensUsed: number;
    inputTokens?: number;
    outputTokens?: number;
    model: string;
    generatedAt: string;
  };
}

export class UnifiedFireProtectionAgent {
  private client: Anthropic;
  // Using Claude 3 Haiku - confirmed working model for this account
  private model: string = "claude-3-haiku-20240307";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Anthropic API key is required");
    }

    // Validate API key format
    if (!apiKey.startsWith("sk-ant-")) {
      console.warn("[---UNIFIED-AGENT] API key format warning - should start with sk-ant-");
    }

    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey,
    });

    console.log("[---UNIFIED-AGENT] Anthropic client initialized:", {
      keyPrefix: apiKey.substring(0, 12) + "...",
      keyLength: apiKey.length,
      keyFormat: apiKey.startsWith("sk-ant-") ? "valid" : "unexpected",
    });
  }

  /**
   * Main agent method - handles any query and routes to appropriate capabilities
   */
  async processQuery(request: AgentRequest): Promise<AgentResponse> {
    const { message, context, images } = request;

    // Build comprehensive system prompt with all agent capabilities and knowledge base
    const systemPrompt = await this.buildSystemPrompt(context);

    // Build conversation messages (including images)
    const messages = this.buildMessages(message, context, images);

    // Log API call details (without exposing sensitive data)
    console.log("[---UNIFIED-AGENT] Making Anthropic API call:", {
      model: this.model,
      messageCount: messages.length,
      systemPromptLength: systemPrompt.length,
      hasApiKey: !!this.client, // Client exists if API key was provided
      hasImages: images && images.length > 0,
      imageCount: images?.length || 0,
    });

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
      });

      console.log("[---UNIFIED-AGENT] API call successful:", {
        hasResponse: !!response,
        hasUsage: !!response.usage,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      });

      const content = this.extractContent(response);
      const tokensUsed = this.calculateTokens(response);

      // Parse any actions from the response
      const actions = this.extractActions(content);

      // Extract actual token counts from Claude API response
      const inputTokens = response.usage?.input_tokens || 0;
      const outputTokens = response.usage?.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;

      return {
        content,
        actions,
        metadata: {
          tokensUsed: totalTokens,
          inputTokens,
          outputTokens,
          model: this.model,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      console.error("❌ [UNIFIED-AGENT] Error calling Anthropic API:", error);
      console.error("❌ [UNIFIED-AGENT] Error details:", {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        type: error.type,
        cause: error.cause,
      });

      // Re-throw with more context
      if (error.status === 401) {
        throw new Error("Invalid API key. Please check ANTHROPIC_API_KEY configuration.");
      } else if (error.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (error.message) {
        throw new Error(`Anthropic API error: ${error.message}`);
      } else {
        throw new Error("Failed to process query. Please check API configuration.");
      }
    }
  }

  /**
   * Load knowledge base entries for agent context
   */
  private async loadKnowledgeBase(
    category?: string,
    projectId?: number
  ): Promise<Array<{ title: string; content: string; category?: string }>> {
    if (!supabaseAdmin) {
      console.warn("⚠️ [UNIFIED-AGENT] Supabase admin client not available for knowledge base");
      return [];
    }

    try {
      let query = supabaseAdmin
        .from("ai_agent_knowledge")
        .select("title, content, category")
        .eq("isActive", true);

      // Filter by project if specified, or get global knowledge
      if (projectId) {
        // Get both global knowledge (projectId is null) and project-specific knowledge
        query = query.or(`projectId.is.null,projectId.eq.${projectId}`);
      } else {
        // Only get global knowledge (no project-specific)
        query = query.is("projectId", null);
      }

      if (category) {
        query = query.eq("category", category);
      }

      // Order by priority (descending) then by createdAt (descending)
      query = query
        .order("priority", { ascending: false })
        .order("createdAt", { ascending: false })
        .limit(50); // Increased limit to get more knowledge

      const { data: entries, error } = await query;

      if (error) {
        console.error("❌ [UNIFIED-AGENT] Error loading knowledge base:", error);
        return [];
      }

      console.log(`✅ [UNIFIED-AGENT] Loaded ${entries?.length || 0} knowledge entries`, {
        category,
        projectId,
        entryCount: entries?.length || 0,
      });

      return entries || [];
    } catch (error) {
      console.error("❌ [UNIFIED-AGENT] Exception loading knowledge base:", error);
      return [];
    }
  }

  /**
   * Load AI agent settings from globalSettings (keys prefixed with aiAgent_)
   */
  private async loadAgentSettings(): Promise<Record<string, string>> {
    if (!supabaseAdmin) return {};
    try {
      const { data, error } = await supabaseAdmin
        .from("globalSettings")
        .select("key, value")
        .like("key", "aiAgent_%");
      if (error || !data) return {};
      return (data as Array<{ key: string; value: string }>).reduce(
        (acc, row) => {
          acc[row.key] = row.value ?? "";
          return acc;
        },
        {} as Record<string, string>
      );
    } catch {
      return {};
    }
  }

  /**
   * Load project-specific memory (like Claude.ai's project memory)
   */
  private async loadProjectMemory(
    projectId: number
  ): Promise<{ purposeContext?: string; currentState?: string } | null> {
    if (!supabaseAdmin) {
      console.warn("⚠️ [UNIFIED-AGENT] Supabase admin client not available for project memory");
      return null;
    }

    if (!projectId) {
      return null;
    }

    try {
      const { data: memory, error } = await supabaseAdmin
        .from("ai_agent_project_memory")
        .select("purposeContext, currentState")
        .eq("projectId", projectId)
        .single();

      if (error) {
        // If no rows found, that's okay - project might not have memory yet
        if (error.code === "PGRST116") {
          console.log(`ℹ️ [UNIFIED-AGENT] No project memory found for project ${projectId}`);
          return null;
        }
        console.error("❌ [UNIFIED-AGENT] Error loading project memory:", error);
        return null;
      }

      if (memory) {
        console.log(`✅ [UNIFIED-AGENT] Loaded project memory for project ${projectId}`, {
          hasPurposeContext: !!memory.purposeContext,
          hasCurrentState: !!memory.currentState,
        });
      }

      return memory || null;
    } catch (error) {
      console.error("❌ [UNIFIED-AGENT] Exception loading project memory:", error);
      return null;
    }
  }

  /**
   * Default system prompt template. Used when aiAgent_systemPromptTemplate is not set in globalSettings.
   * Placeholders: {{specialization}}, {{standardsLine}}, {{additionalInstructions}}, {{projectMemory}}, {{knowledgeBase}}, {{currentContext}}
   */
  private static readonly DEFAULT_SYSTEM_PROMPT_TEMPLATE = `You are an expert AI assistant specialized in {{specialization}}. You help users with:

## Core Capabilities

### 1. Document Generation
- Generate documents using templates and project data
- Create professional, well-formatted output
- Follow any applicable industry or regulatory standards

### 2. Project Analysis
- Analyze project data and provide insights
- Review project status and suggest improvements
- Identify compliance issues or missing information

### 3. Compliance Review
- Check projects against applicable standards
- Identify compliance gaps or violations
- Provide recommendations for compliance

### 4. Data Analysis
- Analyze project metrics and trends
- Generate reports on project status, timelines, or performance
- Provide insights from project data

### 5. Image Analysis
- Analyze images of plans, systems, or documents
- Extract information from photos, diagrams, or technical drawings
- Review uploaded documents or images for technical details

### 6. General Assistance
- Answer questions about the domain
- Explain technical concepts
- Provide guidance on best practices

## Your Personality
- Professional and knowledgeable
- Clear and concise in explanations
- Proactive in identifying issues
- Helpful and solution-oriented

## Response Format
- Provide clear, actionable responses
- When generating documents, use proper formatting
- When analyzing data, include specific findings
- {{standardsLine}}

## Available Tools
You have access to:
- Project database (can query project information)
- Document templates (can generate various document types)
- Historical data (can reference past projects or documents)

{{additionalInstructions}}{{projectMemory}}{{knowledgeBase}}{{currentContext}}

Remember: Be helpful, accurate, and professional. If you need more information to complete a task, ask for it.`;

  /**
   * Build comprehensive system prompt that defines the agent's capabilities
   */
  private async buildSystemPrompt(context?: any): Promise<string> {
    console.log(`🔍 [UNIFIED-AGENT] Building system prompt`, {
      hasContext: !!context,
      projectId: context?.projectId,
      userId: context?.userId,
    });

    // Load project-specific memory (like Claude.ai's project memory)
    const projectMemory = context?.projectId
      ? await this.loadProjectMemory(context.projectId)
      : null;

    // Load knowledge base entries (global + project-specific)
    const knowledgeEntries = await this.loadKnowledgeBase(undefined, context?.projectId);

    // Load agent settings from database (admin-editable)
    const agentSettings = await this.loadAgentSettings();
    const specialization =
      agentSettings.aiAgent_specialization?.trim() || "project management and document review";
    const standards = agentSettings.aiAgent_standards?.trim() || "";
    const systemPromptExtra = agentSettings.aiAgent_systemPromptExtra?.trim() || "";

    // Format project memory (like Claude.ai)
    let projectMemorySection = "";
    if (projectMemory) {
      projectMemorySection = "\n\n## Project Memory\n";
      if (projectMemory.purposeContext) {
        projectMemorySection += `\n### Purpose & Context\n${projectMemory.purposeContext}\n`;
      }
      if (projectMemory.currentState) {
        projectMemorySection += `\n### Current State\n${projectMemory.currentState}\n`;
      }
      console.log(`📝 [UNIFIED-AGENT] Added project memory to system prompt`);
    } else {
      console.log(`ℹ️ [UNIFIED-AGENT] No project memory to add`);
    }

    // Format knowledge base for system prompt
    let knowledgeSection = "";
    if (knowledgeEntries.length > 0) {
      knowledgeSection = "\n\n## Knowledge Base\n";
      knowledgeEntries.forEach((entry) => {
        knowledgeSection += `\n### ${entry.title}${entry.category ? ` (${entry.category})` : ""}\n${entry.content}\n`;
      });
      console.log(
        `📚 [UNIFIED-AGENT] Added ${knowledgeEntries.length} knowledge entries to system prompt`
      );
    } else {
      console.warn(
        `⚠️ [UNIFIED-AGENT] No knowledge entries found! Check database and RLS policies.`
      );
    }

    const standardsLine = standards
      ? `When relevant, apply or reference these standards: ${standards}.`
      : "When applicable, cite relevant codes or standards.";

    const additionalInstructionsSection = systemPromptExtra
      ? `\n## Additional Instructions\n${systemPromptExtra}\n`
      : "";

    const currentContextSection =
      context?.projectId || context?.userId
        ? `\n## Current Context\n${context?.projectId ? `- Working with Project ID: ${context.projectId}\n` : ""}${context?.userId ? `- User ID: ${context.userId}\n` : ""}`
        : "";

    const template =
      agentSettings.aiAgent_systemPromptTemplate?.trim() ||
      UnifiedFireProtectionAgent.DEFAULT_SYSTEM_PROMPT_TEMPLATE;

    return template
      .replace(/\{\{specialization\}\}/g, specialization)
      .replace(/\{\{standardsLine\}\}/g, standardsLine)
      .replace(/\{\{additionalInstructions\}\}/g, additionalInstructionsSection)
      .replace(/\{\{projectMemory\}\}/g, projectMemorySection)
      .replace(/\{\{knowledgeBase\}\}/g, knowledgeSection)
      .replace(/\{\{currentContext\}\}/g, currentContextSection);
  }

  /**
   * Build conversation messages from history and current message
   */
  private buildMessages(currentMessage: string, context?: any, imageUrls?: string[]): any[] {
    const messages: Array<{
      role: "user" | "assistant";
      content:
        | string
        | Array<{ type: "text" | "image"; text?: string; source?: { type: "url"; url: string } }>;
    }> = [];

    const hasImages = imageUrls && imageUrls.length > 0;

    // Add conversation history if provided
    // Note: Assistant messages can have string content, but user messages with images need array format
    if (context?.conversationHistory) {
      context.conversationHistory.forEach((msg: any) => {
        // Assistant messages can be strings, user messages should match current format if we have images
        if (msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: typeof msg.content === "string" ? msg.content : msg.content,
          });
        } else {
          // User messages: if we have images in current message, ensure format consistency
          // But historical user messages can remain as strings if they didn't have images
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
    }

    // Add current message with any relevant context
    let enrichedMessage = (currentMessage || "").trim();

    if (context?.projectId) {
      enrichedMessage += `\n\n[Context: Working with project ${context.projectId}]`;
    }

    // Build content array - include text and images if present
    // Anthropic API: content can be string OR array of objects (not mixed strings/objects)
    const contentBlocks: Array<{
      type: "text" | "image";
      text?: string;
      source?: { type: "url"; url: string };
    }> = [];

    // Add text message if present
    if (enrichedMessage) {
      // Always use object format when building array
      contentBlocks.push({
        type: "text",
        text: enrichedMessage,
      });
    }

    // Add images if present
    if (hasImages) {
      console.log("[---UNIFIED-AGENT] Adding images to message:", {
        imageCount: imageUrls.length,
        imageUrls: imageUrls.map((url) => url.substring(0, 50) + "..."), // Log partial URLs
      });
      imageUrls.forEach((url) => {
        contentBlocks.push({
          type: "image" as const,
          source: {
            type: "url" as const,
            url: url,
          },
        } as any); // Type assertion needed due to SDK type definitions
      });
    }

    // Ensure we always have content
    if (contentBlocks.length === 0) {
      const defaultMessage = hasImages ? "Please analyze these images" : "Hello";
      contentBlocks.push({ type: "text", text: defaultMessage });
    }

    // Format content based on whether we have images
    // Anthropic API:
    // - With images: content MUST be array of objects [{type: 'text', text: '...'}, {type: 'image', ...}]
    // - Without images: content can be string OR array of objects
    let finalContent:
      | string
      | Array<{ type: "text" | "image"; text?: string; source?: { type: "url"; url: string } }>;

    if (hasImages) {
      // With images: content MUST be array of objects
      finalContent = contentBlocks;
    } else {
      // Without images: use string if single text block, otherwise array of objects
      if (contentBlocks.length === 1 && contentBlocks[0].type === "text") {
        finalContent = contentBlocks[0].text || "";
      } else {
        // Multiple blocks - keep as array of objects
        finalContent = contentBlocks;
      }
    }

    console.log("[---UNIFIED-AGENT] Message content format:", {
      hasImages,
      hasText: !!enrichedMessage,
      contentType: typeof finalContent,
      isArray: Array.isArray(finalContent),
      arrayLength: Array.isArray(finalContent) ? finalContent.length : 0,
      firstItemType:
        Array.isArray(finalContent) && finalContent.length > 0
          ? typeof finalContent[0] === "string"
            ? "string"
            : typeof finalContent[0]
          : "N/A",
    });

    messages.push({
      role: "user",
      content: finalContent,
    });

    return messages;
  }

  /**
   * Extract text content from Claude API response
   */
  private extractContent(message: any): string {
    const contentBlock = message.content.find((block: any) => block.type === "text");
    return contentBlock?.text || "";
  }

  /**
   * Calculate tokens used
   */
  private calculateTokens(message: any): number {
    return (message.usage?.output_tokens || 0) + (message.usage?.input_tokens || 0);
  }

  /**
   * Extract any structured actions from the response
   * Looks for JSON action blocks in the response
   */
  private extractActions(content: string): Array<{ type: string; data: any }> {
    const actions: Array<{ type: string; data: any }> = [];

    // Look for action blocks in format: <action type="..." data="...">
    const actionRegex = /<action\s+type="([^"]+)"\s+data="([^"]+)">/g;
    let match;

    while ((match = actionRegex.exec(content)) !== null) {
      try {
        actions.push({
          type: match[1],
          data: JSON.parse(match[2]),
        });
      } catch (e) {
        // Ignore malformed actions
      }
    }

    return actions;
  }

  /**
   * Generate document using the agent (delegates to document generation capability)
   */
  async generateDocument(
    projectId: number,
    templateId: string,
    projectData: Record<string, any>,
    requirements?: string[]
  ): Promise<AgentResponse> {
    const prompt = `Generate a document for project ${projectId} using template ${templateId}.

Project Data:
${JSON.stringify(projectData, null, 2)}

${requirements ? `Requirements:\n${requirements.join("\n")}\n` : ""}

Generate a professional document following any applicable standards for this project.`;

    return this.processQuery({
      message: prompt,
      context: { projectId },
    });
  }

  /**
   * Analyze a project and provide insights
   */
  async analyzeProject(projectId: number): Promise<AgentResponse> {
    // Fetch project data
    if (!supabaseAdmin) {
      throw new Error("Database connection not available");
    }

    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new Error("Project not found");
    }

    // Fetch related files
    const { data: files } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("projectId", projectId);

    // Fetch generated documents
    const { data: documents } = await supabaseAdmin
      .from("ai_generated_documents")
      .select("*")
      .eq("projectId", projectId)
      .order("createdAt", { ascending: false })
      .limit(10);

    const prompt = `Analyze this project and provide comprehensive insights:

Project Data:
${JSON.stringify(project, null, 2)}

${
  files && files.length > 0
    ? `\nFiles (${files.length}):\n${JSON.stringify(
        files.map((f) => ({ name: f.file_path, status: f.status, uploadedAt: f.uploaded_at })),
        null,
        2
      )}`
    : ""
}

${documents && documents.length > 0 ? `\nGenerated Documents (${documents.length}):\n${documents.map((d) => ({ template: d.templateId, createdAt: d.createdAt })).join("\n")}` : ""}

Please provide a comprehensive analysis:
1. **Project Status Assessment**
   - Current status and progress
   - Key milestones and deadlines
   - Overall health of the project

2. **Compliance Review**
   - Compliance status against applicable standards
   - Missing required documents or certifications
   - Potential violations or gaps

3. **Documentation Review**
   - What documents exist
   - What documents are missing
   - Recommendations for required documents

4. **Actionable Recommendations**
   - Immediate next steps
   - Priority items to address
   - Best practices for this project type

5. **Risk Assessment**
   - Potential risks or issues
   - Areas requiring attention
   - Mitigation strategies

Format your response clearly with sections and bullet points.`;

    return this.processQuery({
      message: prompt,
      context: { projectId, projectData: project, files, documents },
    });
  }

  /**
   * Check project compliance against applicable or specified standards
   */
  async checkCompliance(projectId: number, standard?: string): Promise<AgentResponse> {
    if (!supabaseAdmin) {
      throw new Error("Database connection not available");
    }

    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new Error("Project not found");
    }

    // Fetch files and documents
    const { data: files } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("projectId", projectId);

    const { data: documents } = await supabaseAdmin
      .from("ai_generated_documents")
      .select("*")
      .eq("projectId", projectId);

    const standardsToCheck = standard ? [standard] : [];

    const prompt = `Perform a comprehensive compliance check for this project.${
      standardsToCheck.length > 0
        ? ` Standards to check: ${standardsToCheck.join(", ")}.`
        : " Apply any relevant standards for this type of project."
    }

Project Information:
- Type: ${project.new_construction ? "New Construction" : "Existing Building"}
- Square Footage: ${project.sq_ft || "Not specified"}
- Address: ${project.address || "Not specified"}
- Status: ${project.status || "Unknown"}

Files Available: ${files?.length || 0}
Documents Generated: ${documents?.length || 0}

${standardsToCheck.length > 0 ? `Standards to Check: ${standardsToCheck.join(", ")}\n\n` : ""}Please provide:

1. **Compliance Status**
   For each applicable standard or requirement, indicate:
   - Compliance level (Compliant / Non-Compliant / Partial / Unknown)
   - Key requirements met
   - Key requirements missing
   - Evidence found (documents, files, etc.)

2. **Critical Issues**
   - Any critical violations or non-compliance
   - Concerns that must be addressed
   - Gaps that should be remedied

3. **Missing Documentation**
   - Required documents not present
   - Certifications needed
   - Inspection reports required

4. **Recommendations**
   - Steps to achieve full compliance
   - Priority actions
   - Documentation to generate

5. **Compliance Score**
   - Overall compliance percentage
   - Breakdown by standard

Be specific and reference actual code sections or standards where applicable.`;

    return this.processQuery({
      message: prompt,
      context: {
        projectId,
        projectData: project,
        files,
        documents,
        complianceCheck: true,
        standards: standardsToCheck,
      },
    });
  }

  /**
   * Generate project report
   */
  async generateProjectReport(
    projectId: number,
    reportType: "summary" | "detailed" | "compliance" = "summary"
  ): Promise<AgentResponse> {
    if (!supabaseAdmin) {
      throw new Error("Database connection not available");
    }

    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new Error("Project not found");
    }

    const { data: files } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("projectId", projectId);

    const { data: documents } = await supabaseAdmin
      .from("ai_generated_documents")
      .select("*")
      .eq("projectId", projectId);

    const prompt = `Generate a ${reportType} project report for this project.

Project Data:
${JSON.stringify(project, null, 2)}

Files: ${files?.length || 0} files
Documents: ${documents?.length || 0} generated documents

Create a professional ${reportType} report that includes:

${
  reportType === "summary"
    ? `
- Executive Summary
- Project Overview
- Current Status
- Key Metrics
- Next Steps
`
    : reportType === "detailed"
      ? `
- Executive Summary
- Project Overview and Background
- Detailed Status Analysis
- File and Document Inventory
- Timeline and Milestones
- Risk Assessment
- Recommendations
- Appendices
`
      : `
- Compliance Overview
- Standard Compliance Status
- Violations and Issues
- Required Documentation Status
- Compliance Recommendations
- Action Plan
`
}

Format the report professionally with clear sections, headings, and bullet points.`;

    return this.processQuery({
      message: prompt,
      context: {
        projectId,
        projectData: project,
        files,
        documents,
        reportType,
      },
    });
  }
}
