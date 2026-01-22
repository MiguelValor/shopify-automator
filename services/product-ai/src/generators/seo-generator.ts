import { GeminiClient, PromptTemplates } from '@shopify-automation/ai-core';
import type { SEOSuggestion, ShopifyProduct } from '@shopify-automation/types';

export class SEOGenerator {
  private gemini: GeminiClient;

  constructor(apiKey: string) {
    this.gemini = new GeminiClient(apiKey);
  }

  async generateSEO(product: {
    title: string;
    description?: string;
    tags?: string[];
    vendor?: string;
  }): Promise<SEOSuggestion> {
    try {
      const prompt = PromptTemplates.generateSEO(product);

      const result = await this.gemini.generateStructuredJSON<{
        metaTitle: string;
        metaDescription: string;
        keywords: string[];
        optimizedTags: string[];
      }>(prompt);

      // Validate and truncate if needed
      const seoSuggestion: SEOSuggestion = {
        metaTitle: result.metaTitle.slice(0, 60),
        metaDescription: result.metaDescription.slice(0, 160),
        keywords: result.keywords.slice(0, 10),
        optimizedTags: result.optimizedTags.slice(0, 15),
        confidence: 0.85,
      };

      return seoSuggestion;
    } catch (error) {
      throw new Error(
        `SEO generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generateBulkSEO(products: ShopifyProduct[]): Promise<
    Array<{
      productId: string;
      seo: SEOSuggestion;
      error?: string;
    }>
  > {
    const results = [];

    for (const product of products) {
      try {
        const seo = await this.generateSEO({
          title: product.title,
          description: product.description,
          tags: product.tags,
          vendor: product.vendor,
        });

        results.push({
          productId: product.id,
          seo,
        });
      } catch (error) {
        results.push({
          productId: product.id,
          seo: {
            metaTitle: product.title,
            metaDescription: '',
            keywords: [],
            optimizedTags: product.tags || [],
            confidence: 0,
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Rate limiting - wait 200ms between requests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return results;
  }

  async validateSEO(seo: SEOSuggestion): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    if (seo.metaTitle.length > 60) {
      issues.push('Meta title exceeds 60 characters');
    }

    if (seo.metaTitle.length < 30) {
      issues.push('Meta title is too short (minimum 30 characters)');
    }

    if (seo.metaDescription.length > 160) {
      issues.push('Meta description exceeds 160 characters');
    }

    if (seo.metaDescription.length < 50) {
      issues.push('Meta description is too short (minimum 50 characters)');
    }

    if (seo.keywords.length === 0) {
      issues.push('No keywords provided');
    }

    if (seo.optimizedTags.length === 0) {
      issues.push('No tags provided');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}
