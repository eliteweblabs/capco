/**
 * API Route: Generate Document via AI Agent
 * POST /api/documents/generate
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { FireProtectionAgent } from '../../lib/ai/agent';
import { createServerClient } from '../../lib/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId, templateId, projectData, requirements } = req.body;

    // Validate input
    if (!projectId || !templateId || !projectData) {
      return res.status(400).json({ 
        error: 'Missing required fields: projectId, templateId, projectData' 
      });
    }

    // Initialize AI agent
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AI API key not configured' });
    }

    const agent = new FireProtectionAgent(apiKey);

    // Generate document
    const result = await agent.generateDocument({
      projectId,
      templateId,
      projectData,
      requirements,
    });

    // Save to Supabase
    const supabase = createServerClient();
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        project_id: projectId,
        template_id: templateId,
        content: result.content,
        metadata: result.metadata,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to save document' });
    }

    // Save AI generation history
    await supabase.from('ai_generations').insert({
      document_id: document.id,
      prompt: `Generated document for project ${projectId}`,
      response: result.content,
      model: result.metadata.model,
      tokens_used: result.metadata.tokensUsed,
    });

    return res.status(200).json({
      success: true,
      document: {
        id: document.id,
        content: result.content,
        metadata: result.metadata,
      },
    });
  } catch (error: any) {
    console.error('Generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate document',
      message: error.message,
    });
  }
}

