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

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../supabase-admin';

export interface AgentRequest {
  message: string;
  context?: {
    projectId?: number;
    userId?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
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
    model: string;
    generatedAt: string;
  };
}

export class UnifiedFireProtectionAgent {
  private client: Anthropic;
  private model: string = 'claude-3-5-sonnet-20241022'; // Using latest Sonnet for better performance/cost

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Main agent method - handles any query and routes to appropriate capabilities
   */
  async processQuery(request: AgentRequest): Promise<AgentResponse> {
    const { message, context } = request;
    
    // Build comprehensive system prompt with all agent capabilities
    const systemPrompt = this.buildSystemPrompt(context);
    
    // Build conversation messages
    const messages = this.buildMessages(message, context);
    
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
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
      console.error('❌ [UNIFIED-AGENT] Error calling Anthropic API:', error);
      console.error('❌ [UNIFIED-AGENT] Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        type: error.type,
        cause: error.cause,
      });
      
      // Re-throw with more context
      if (error.status === 401) {
        throw new Error('Invalid API key. Please check ANTHROPIC_API_KEY configuration.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.message) {
        throw new Error(`Anthropic API error: ${error.message}`);
      } else {
        throw new Error('Failed to process query. Please check API configuration.');
      }
    }
  }

  /**
   * Build comprehensive system prompt that defines the agent's capabilities
   */
  private buildSystemPrompt(context?: any): string {
    return `You are an expert AI assistant specialized in fire protection engineering and project management. You help users with:

## Core Capabilities

### 1. Document Generation
- Generate fire protection documents (inspection reports, compliance certificates, design reports)
- Use templates and project data to create professional documents
- Ensure NFPA compliance and industry standards

### 2. Project Analysis
- Analyze project data and provide insights
- Review project status and suggest improvements
- Identify compliance issues or missing information

### 3. Code Compliance
- Check projects against NFPA standards (NFPA 13, NFPA 72, etc.)
- Identify code violations or compliance gaps
- Provide recommendations for compliance

### 4. Data Analysis
- Analyze project metrics and trends
- Generate reports on project status, timelines, or performance
- Provide insights from project data

### 5. General Assistance
- Answer questions about fire protection systems
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
- Always cite relevant codes or standards when applicable

## Available Tools
You have access to:
- Project database (can query project information)
- Document templates (can generate various document types)
- Historical data (can reference past projects or documents)

${context?.projectId ? `\n## Current Context\n- Working with Project ID: ${context.projectId}\n` : ''}
${context?.userId ? `- User ID: ${context.userId}\n` : ''}

Remember: Be helpful, accurate, and professional. If you need more information to complete a task, ask for it.`;
  }

  /**
   * Build conversation messages from history and current message
   */
  private buildMessages(
    currentMessage: string,
    context?: any
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add conversation history if provided
    if (context?.conversationHistory) {
      messages.push(...context.conversationHistory);
    }

    // Add current message with any relevant context
    let enrichedMessage = currentMessage;
    
    if (context?.projectId) {
      enrichedMessage += `\n\n[Context: Working with project ${context.projectId}]`;
    }

    messages.push({
      role: 'user',
      content: enrichedMessage,
    });

    return messages;
  }

  /**
   * Extract text content from Claude API response
   */
  private extractContent(message: any): string {
    const contentBlock = message.content.find(
      (block: any) => block.type === 'text'
    );
    return contentBlock?.text || '';
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
    const prompt = `Generate a fire protection document for project ${projectId} using template ${templateId}.

Project Data:
${JSON.stringify(projectData, null, 2)}

${requirements ? `Requirements:\n${requirements.join('\n')}\n` : ''}

Generate a professional, compliant document following NFPA standards.`;

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
      throw new Error('Database connection not available');
    }

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new Error('Project not found');
    }

    // Fetch related files
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('projectId', projectId);

    // Fetch generated documents
    const { data: documents } = await supabaseAdmin
      .from('ai_generated_documents')
      .select('*')
      .eq('projectId', projectId)
      .order('createdAt', { ascending: false })
      .limit(10);

    const prompt = `Analyze this fire protection project and provide comprehensive insights:

Project Data:
${JSON.stringify(project, null, 2)}

${files && files.length > 0 ? `\nFiles (${files.length}):\n${JSON.stringify(files.map(f => ({ name: f.file_path, status: f.status, uploadedAt: f.uploaded_at })), null, 2)}` : ''}

${documents && documents.length > 0 ? `\nGenerated Documents (${documents.length}):\n${documents.map(d => ({ template: d.templateId, createdAt: d.createdAt })).join('\n')}` : ''}

Please provide a comprehensive analysis:
1. **Project Status Assessment**
   - Current status and progress
   - Key milestones and deadlines
   - Overall health of the project

2. **Compliance Review**
   - NFPA code compliance status
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
   * Check project compliance against NFPA standards
   */
  async checkCompliance(projectId: number, standard?: string): Promise<AgentResponse> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new Error('Project not found');
    }

    // Fetch files and documents
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('projectId', projectId);

    const { data: documents } = await supabaseAdmin
      .from('ai_generated_documents')
      .select('*')
      .eq('projectId', projectId);

    const standardsToCheck = standard 
      ? [standard]
      : ['NFPA 13', 'NFPA 13R', 'NFPA 13D', 'NFPA 72', 'NFPA 25', 'NFPA 14'];

    const prompt = `Perform a comprehensive compliance check for this fire protection project against NFPA standards.

Project Information:
- Type: ${project.new_construction ? 'New Construction' : 'Existing Building'}
- Square Footage: ${project.sq_ft || 'Not specified'}
- Address: ${project.address || 'Not specified'}
- Status: ${project.status || 'Unknown'}

Files Available: ${files?.length || 0}
Documents Generated: ${documents?.length || 0}

Standards to Check: ${standardsToCheck.join(', ')}

Please provide:

1. **Compliance Status by Standard**
   For each applicable standard, indicate:
   - Compliance level (Compliant / Non-Compliant / Partial / Unknown)
   - Key requirements met
   - Key requirements missing
   - Evidence found (documents, files, etc.)

2. **Critical Issues**
   - Any critical violations or non-compliance
   - Safety concerns
   - Code violations that must be addressed

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

Be specific and reference actual NFPA code sections where applicable.`;

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
  async generateProjectReport(projectId: number, reportType: 'summary' | 'detailed' | 'compliance' = 'summary'): Promise<AgentResponse> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new Error('Project not found');
    }

    const { data: files } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('projectId', projectId);

    const { data: documents } = await supabaseAdmin
      .from('ai_generated_documents')
      .select('*')
      .eq('projectId', projectId);

    const prompt = `Generate a ${reportType} project report for this fire protection project.

Project Data:
${JSON.stringify(project, null, 2)}

Files: ${files?.length || 0} files
Documents: ${documents?.length || 0} generated documents

Create a professional ${reportType} report that includes:

${reportType === 'summary' ? `
- Executive Summary
- Project Overview
- Current Status
- Key Metrics
- Next Steps
` : reportType === 'detailed' ? `
- Executive Summary
- Project Overview and Background
- Detailed Status Analysis
- File and Document Inventory
- Timeline and Milestones
- Risk Assessment
- Recommendations
- Appendices
` : `
- Compliance Overview
- NFPA Standard Compliance Status
- Code Violations and Issues
- Required Documentation Status
- Compliance Recommendations
- Action Plan
`}

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

