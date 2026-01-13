/**
 * Fire Protection Document Generation AI Agent
 * Uses Anthropic Claude API to generate compliant fire protection documents
 * Adapted for Astro framework
 */

import Anthropic from "@anthropic-ai/sdk";

interface DocumentGenerationRequest {
  projectId: number; // Changed from string to number to match existing projects table (serial id)
  templateId: string;
  projectData: Record<string, any>;
  requirements?: string[];
}

interface DocumentGenerationResponse {
  content: string;
  metadata: {
    tokensUsed: number;
    model: string;
    generatedAt: string;
  };
}

export class FireProtectionAgent {
  private client: Anthropic;
  private model: string = "claude-3-opus-20240229";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Anthropic API key is required");
    }
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Generate a fire protection document based on template and project data
   */
  async generateDocument(request: DocumentGenerationRequest): Promise<DocumentGenerationResponse> {
    const prompt = this.buildPrompt(request);

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = this.extractContent(message);
      const tokensUsed = this.calculateTokens(message);

      return {
        content,
        metadata: {
          tokensUsed,
          model: this.model,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ [AI-AGENT] AI generation error:", error);
      throw new Error("Failed to generate document");
    }
  }

  /**
   * Build the prompt for document generation
   */
  private buildPrompt(request: DocumentGenerationRequest): string {
    const { projectData, requirements } = request;

    return `You are an expert fire protection engineer and document specialist. Generate a professional, compliant fire protection document based on the following information:

PROJECT DATA:
${JSON.stringify(projectData, null, 2)}

${requirements ? `SPECIFIC REQUIREMENTS:\n${requirements.join("\n")}\n` : ""}

GUIDELINES:
1. Ensure compliance with NFPA (National Fire Protection Association) standards
2. Include all required sections: scope, methodology, findings, recommendations
3. Use professional technical language appropriate for fire protection industry
4. Format the document clearly with proper headings and sections
5. Include relevant codes and standards references
6. Ensure accuracy and completeness

Generate a comprehensive, professional document that meets fire protection industry standards.`;
  }

  /**
   * Extract text content from Claude API response
   */
  private extractContent(message: any): string {
    const contentBlock = message.content.find((block: any) => block.type === "text");
    return contentBlock?.text || "";
  }

  /**
   * Calculate tokens used (approximate)
   */
  private calculateTokens(message: any): number {
    // Claude API provides usage info in message.usage
    return (message.usage?.output_tokens || 0) + (message.usage?.input_tokens || 0);
  }

  /**
   * Generate document with multi-step refinement
   */
  async generateWithRefinement(
    request: DocumentGenerationRequest,
    refinementSteps: number = 2
  ): Promise<DocumentGenerationResponse> {
    let currentContent = "";
    let totalTokens = 0;

    for (let step = 0; step < refinementSteps; step++) {
      const prompt =
        step === 0
          ? this.buildPrompt(request)
          : this.buildRefinementPrompt(request, currentContent, step);

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      currentContent = this.extractContent(message);
      totalTokens += this.calculateTokens(message);
    }

    return {
      content: currentContent,
      metadata: {
        tokensUsed: totalTokens,
        model: this.model,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private buildRefinementPrompt(
    request: DocumentGenerationRequest,
    currentContent: string,
    step: number
  ): string {
    return `Review and refine the following fire protection document. This is refinement step ${step + 1}.

CURRENT DOCUMENT:
${currentContent}

Please:
1. Check for completeness and accuracy
2. Ensure all technical details are correct
3. Verify compliance with fire protection standards
4. Improve clarity and professional presentation
5. Add any missing critical information

Provide the refined, improved version of the document.`;
  }
}
