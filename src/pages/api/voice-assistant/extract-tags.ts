import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Extract Tags API
 * Uses Claude API to intelligently extract relevant tags from conversation text
 * Focuses on industry-specific terms, proper nouns, and non-basic vocabulary
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Anthropic client
    const client = new Anthropic({ apiKey });
    const model = "claude-3-haiku-20240307"; // Fast and cost-effective

    // Build prompt for tag extraction
    const systemPrompt = `You are a tag extraction assistant. Extract relevant tags from conversation text.

Rules:
1. Extract industry-specific terms (e.g., "sprinklers", "nfpa", "fire alarm", "hydrant")
2. Extract proper nouns (e.g., "Boston", "NFPA", "California")
3. Extract technical terms and jargon
4. Skip common/basic words (e.g., "the", "is", "be", "would", "for", "a", "in", "according", "to", "standards")
5. Extract nouns, proper nouns, and technical terms only
6. Return tags in lowercase
7. Return as a JSON array of strings
8. Maximum 10 tags
9. Focus on terms that would be useful for searching/filtering knowledge

Examples:
- "There would be 5 sprinklers needed for a 2000 square foot room in a boston apartment according to nfpa standards"
  → ["sprinklers", "boston", "apartment", "nfpa", "square foot", "room"]

- "What are the fire protection requirements for a warehouse?"
  → ["fire protection", "warehouse", "requirements"]

- "NFPA 13 covers sprinkler systems in commercial buildings"
  → ["nfpa 13", "sprinklers", "sprinkler systems", "commercial buildings"]

Return ONLY a JSON array, no other text.`;

    const response = await client.messages.create({
      model,
      max_tokens: 200,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Extract tags from this text: "${text}"`,
        },
      ],
    });

    // Extract response content
    let tagsText = "";
    if (response.content && response.content.length > 0) {
      const firstBlock = response.content[0];
      if (firstBlock.type === "text") {
        tagsText = firstBlock.text.trim();
      }
    }

    // Parse JSON array from response
    let tags: string[] = [];
    try {
      // Remove markdown code blocks if present
      tagsText = tagsText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Try to parse as JSON
      const parsed = JSON.parse(tagsText);
      if (Array.isArray(parsed)) {
        tags = parsed.map((tag) => tag.toLowerCase().trim()).filter((tag) => tag.length > 0);
      }
    } catch (error) {
      // If JSON parsing fails, try to extract array from text
      const arrayMatch = tagsText.match(/\[(.*?)\]/);
      if (arrayMatch) {
        try {
          tags = JSON.parse(arrayMatch[0]);
        } catch (e) {
          // Fallback: split by comma and clean
          tags = arrayMatch[1]
            .split(",")
            .map((tag) => tag.trim().replace(/['"]/g, "").toLowerCase())
            .filter((tag) => tag.length > 0);
        }
      }
    }

    // Remove duplicates and limit to 10
    tags = Array.from(new Set(tags)).slice(0, 10);

    return new Response(
      JSON.stringify({
        tags,
        count: tags.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [VOICE-ASSISTANT-EXTRACT-TAGS] Error:", error);

    return new Response(
      JSON.stringify({ error: error.message || "Tag extraction failed", tags: [] }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
