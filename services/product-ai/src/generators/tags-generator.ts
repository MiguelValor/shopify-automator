import { GeminiClient, PromptTemplates } from '@shopify-automation/ai-core';

export class TagsGenerator {
  private gemini: GeminiClient;

  constructor(apiKey: string) {
    this.gemini = new GeminiClient(apiKey);
  }

  async suggestTags(product: {
    title: string;
    description?: string;
    productType?: string;
    vendor?: string;
  }): Promise<{
    tags: string[];
    reasoning: string;
    confidence: number;
  }> {
    try {
      const prompt = PromptTemplates.suggestTags(product);

      const result = await this.gemini.generateStructuredJSON<{
        tags: string[];
        reasoning: string;
      }>(prompt);

      // Clean and normalize tags
      const cleanTags = result.tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0 && tag.length < 50)
        .slice(0, 15);

      return {
        tags: [...new Set(cleanTags)], // Remove duplicates
        reasoning: result.reasoning,
        confidence: 0.8,
      };
    } catch (error) {
      throw new Error(
        `Tag generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async mergeTags(
    existingTags: string[],
    suggestedTags: string[]
  ): Promise<{
    mergedTags: string[];
    addedTags: string[];
    removedTags: string[];
  }> {
    // Normalize existing tags
    const normalizedExisting = existingTags.map((tag) =>
      tag.trim().toLowerCase()
    );

    // Normalize suggested tags
    const normalizedSuggested = suggestedTags.map((tag) =>
      tag.trim().toLowerCase()
    );

    // Find added and removed tags
    const addedTags = normalizedSuggested.filter(
      (tag) => !normalizedExisting.includes(tag)
    );

    const removedTags = normalizedExisting.filter(
      (tag) => !normalizedSuggested.includes(tag)
    );

    // Merge: keep existing + add new suggestions
    const mergedSet = new Set([...normalizedExisting, ...normalizedSuggested]);
    const mergedTags = Array.from(mergedSet).slice(0, 20); // Max 20 tags

    return {
      mergedTags,
      addedTags,
      removedTags,
    };
  }

  async categorizeTags(tags: string[]): Promise<{
    categories: Record<string, string[]>;
  }> {
    try {
      const prompt = `Categorize these product tags into logical groups:

Tags: ${tags.join(', ')}

Return JSON:
{
  "categories": {
    "product_type": ["tag1", "tag2"],
    "features": ["tag3", "tag4"],
    "use_case": ["tag5", "tag6"],
    "target_audience": ["tag7"],
    "seasonal": ["tag8"]
  }
}

Common categories:
- product_type: Product category/classification
- features: Product characteristics
- use_case: How/when to use
- target_audience: Who it's for
- seasonal: Time-based relevance
- other: Uncategorized`;

      const result = await this.gemini.generateStructuredJSON<{
        categories: Record<string, string[]>;
      }>(prompt);

      return result;
    } catch (error) {
      throw new Error(
        `Tag categorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async validateTags(tags: string[]): Promise<{
    validTags: string[];
    invalidTags: Array<{ tag: string; reason: string }>;
  }> {
    const validTags: string[] = [];
    const invalidTags: Array<{ tag: string; reason: string }> = [];

    for (const tag of tags) {
      const trimmed = tag.trim();

      // Validation rules
      if (trimmed.length === 0) {
        invalidTags.push({ tag, reason: 'Empty tag' });
      } else if (trimmed.length > 50) {
        invalidTags.push({ tag, reason: 'Tag too long (max 50 characters)' });
      } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
        invalidTags.push({
          tag,
          reason: 'Contains invalid characters',
        });
      } else {
        validTags.push(trimmed.toLowerCase());
      }
    }

    return {
      validTags: [...new Set(validTags)], // Remove duplicates
      invalidTags,
    };
  }
}
