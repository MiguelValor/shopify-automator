import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIGenerationRequest, AIGenerationResponse } from '@shopify-automation/types';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string = 'gemini-2.0-flash-exp';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateText(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: request.model || this.defaultModel,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2048,
        },
      });

      const response = result.response;
      const text = response.text();

      return {
        content: text,
        model: request.model || this.defaultModel,
        confidence: this.calculateConfidence(response),
        finishReason: response.candidates?.[0]?.finishReason,
      };
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStructuredJSON<T = any>(
    prompt: string,
    schema?: string
  ): Promise<T> {
    const fullPrompt = schema
      ? `${prompt}\n\nReturn valid JSON matching this schema:\n${schema}`
      : `${prompt}\n\nReturn valid JSON only, no markdown code blocks.`;

    const response = await this.generateText({
      model: this.defaultModel,
      prompt: fullPrompt,
      temperature: 0.5,
    });

    try {
      const cleanedContent = response.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleanedContent);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeImage(imageData: {
    base64: string;
    mimeType: string;
    prompt: string;
  }): Promise<AIGenerationResponse> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
      });

      const result = await model.generateContent([
        imageData.prompt,
        {
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.base64,
          },
        },
      ]);

      const response = result.response;
      const text = response.text();

      return {
        content: text,
        model: 'gemini-2.0-flash-exp',
        confidence: this.calculateConfidence(response),
        finishReason: response.candidates?.[0]?.finishReason,
      };
    } catch (error) {
      throw new Error(`Gemini Vision API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateConfidence(response: any): number {
    // Simple confidence calculation based on safety ratings and finish reason
    if (response.candidates?.[0]?.finishReason === 'STOP') {
      return 0.85;
    }
    return 0.75;
  }
}

// Prompt templates for common operations
export const PromptTemplates = {
  generateSEO: (product: { title: string; description?: string; tags?: string[] }) => `
Analyze this Shopify product and generate SEO-optimized metadata:

Product Title: ${product.title}
Description: ${product.description || 'N/A'}
Current Tags: ${product.tags?.join(', ') || 'N/A'}

Generate a JSON response with:
{
  "metaTitle": "SEO-optimized title (max 60 characters)",
  "metaDescription": "Compelling meta description (max 160 characters)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "optimizedTags": ["tag1", "tag2", "tag3"]
}

Focus on:
- Include primary keywords naturally
- Make it compelling for click-through
- Follow SEO best practices
- Be specific and descriptive
`,

  generateDescription: (product: { title: string; vendor?: string; tags?: string[] }) => `
Write a compelling, SEO-friendly product description for this Shopify product:

Product Name: ${product.title}
Brand: ${product.vendor || 'N/A'}
Tags: ${product.tags?.join(', ') || 'N/A'}

Return JSON:
{
  "description": "Compelling product description (2-3 paragraphs)",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "confidence": 0.85
}

Make it:
- Engaging and persuasive
- Include key benefits
- SEO-optimized with natural keywords
- Professional tone
`,

  suggestTags: (product: { title: string; description?: string; productType?: string }) => `
Analyze this product and suggest relevant tags for better organization and discoverability:

Title: ${product.title}
Type: ${product.productType || 'N/A'}
Description: ${product.description || 'N/A'}

Return JSON array:
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "reasoning": "Brief explanation of tag selection"
}

Focus on:
- Product category/type
- Key features
- Use cases
- Target audience
- Seasonal relevance
`,

  generateAltText: (context: { productTitle: string; vendor?: string }) => `
Generate descriptive, SEO-friendly alt text for a product image.

Product: ${context.productTitle}
Brand: ${context.vendor || 'N/A'}

Return ONLY the alt text (max 125 characters).
Make it descriptive, specific, and accessible.
Include the product name and key visual elements.
`,

  forecastDemand: (data: { productTitle: string; salesHistory: number[]; currentStock: number }) => `
Analyze sales data and forecast demand:

Product: ${data.productTitle}
Sales History (last 30 days): ${data.salesHistory.join(', ')}
Current Stock: ${data.currentStock}

Return JSON:
{
  "forecastedDailyDemand": 0.0,
  "trendFactor": 1.0,
  "seasonalityFactor": 1.0,
  "confidence": 0.85,
  "reasoning": "Brief explanation"
}
`,

  calculatePrice: (data: {
    productTitle: string;
    currentPrice: number;
    cost: number;
    competitorPrices: number[];
    targetMargin: number;
  }) => `
Recommend optimal pricing for this product:

Product: ${data.productTitle}
Current Price: $${data.currentPrice}
Cost: $${data.cost}
Competitor Prices: $${data.competitorPrices.join(', $')}
Target Margin: ${data.targetMargin * 100}%

Return JSON:
{
  "suggestedPrice": 0.0,
  "priceChange": 0.0,
  "priceChangePercent": 0.0,
  "reasoning": {
    "strategy": "competitive|demand_based|margin_based",
    "competitorAvg": 0.0,
    "marginAchieved": 0.0
  },
  "confidence": 0.85
}

Ensure suggested price:
- Maintains minimum target margin
- Is competitive with market
- Accounts for positioning
`,
};

export default GeminiClient;
