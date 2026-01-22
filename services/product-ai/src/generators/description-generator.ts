import { GeminiClient, PromptTemplates } from '@shopify-automation/ai-core';
import type { ShopifyProduct } from '@shopify-automation/types';

export class DescriptionGenerator {
  private gemini: GeminiClient;

  constructor(apiKey: string) {
    this.gemini = new GeminiClient(apiKey);
  }

  async generateDescription(product: {
    title: string;
    vendor?: string;
    tags?: string[];
    productType?: string;
  }): Promise<{
    description: string;
    keyFeatures: string[];
    confidence: number;
  }> {
    try {
      const prompt = PromptTemplates.generateDescription(product);

      const result = await this.gemini.generateStructuredJSON<{
        description: string;
        keyFeatures: string[];
        confidence: number;
      }>(prompt);

      return {
        description: result.description,
        keyFeatures: result.keyFeatures || [],
        confidence: result.confidence || 0.8,
      };
    } catch (error) {
      throw new Error(
        `Description generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async enhanceExistingDescription(
    currentDescription: string,
    product: {
      title: string;
      vendor?: string;
      tags?: string[];
    }
  ): Promise<{
    enhancedDescription: string;
    improvements: string[];
    confidence: number;
  }> {
    try {
      const prompt = `Enhance this product description to be more compelling and SEO-friendly:

Product: ${product.title}
Brand: ${product.vendor || 'N/A'}
Tags: ${product.tags?.join(', ') || 'N/A'}

Current Description:
${currentDescription}

Return JSON:
{
  "enhancedDescription": "Improved description",
  "improvements": ["improvement1", "improvement2"],
  "confidence": 0.85
}

Focus on:
- Make it more engaging and persuasive
- Add sensory details and benefits
- Improve SEO with natural keywords
- Maintain professional tone
- Keep it concise (2-3 paragraphs)`;

      const result = await this.gemini.generateStructuredJSON<{
        enhancedDescription: string;
        improvements: string[];
        confidence: number;
      }>(prompt);

      return result;
    } catch (error) {
      throw new Error(
        `Description enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generateKeyFeatures(product: {
    title: string;
    description?: string;
    tags?: string[];
  }): Promise<string[]> {
    try {
      const prompt = `Extract or generate key features for this product:

Product: ${product.title}
Description: ${product.description || 'N/A'}
Tags: ${product.tags?.join(', ') || 'N/A'}

Return JSON:
{
  "features": ["feature1", "feature2", "feature3", "feature4", "feature5"]
}

Make features:
- Specific and concrete
- Benefit-focused
- Concise (one line each)
- Maximum 5 features`;

      const result = await this.gemini.generateStructuredJSON<{
        features: string[];
      }>(prompt);

      return result.features;
    } catch (error) {
      throw new Error(
        `Feature generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
