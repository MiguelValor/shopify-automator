import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SEOGenerator } from './generators/seo-generator.js';
import { DescriptionGenerator } from './generators/description-generator.js';
import { TagsGenerator } from './generators/tags-generator.js';
import type { ServiceResponse } from '@shopify-automation/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize generators
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const seoGenerator = new SEOGenerator(GEMINI_API_KEY);
const descriptionGenerator = new DescriptionGenerator(GEMINI_API_KEY);
const tagsGenerator = new TagsGenerator(GEMINI_API_KEY);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'product-ai', port: PORT });
});

// SEO Generation Endpoints

app.post('/generate-seo', async (req: Request, res: Response) => {
  try {
    const { title, description, tags, vendor } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TITLE',
          message: 'Product title is required',
        },
      } as ServiceResponse);
    }

    const seo = await seoGenerator.generateSEO({
      title,
      description,
      tags,
      vendor,
    });

    res.json({
      success: true,
      data: seo,
    } as ServiceResponse);
  } catch (error) {
    console.error('SEO generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'SEO generation failed',
      },
    } as ServiceResponse);
  }
});

app.post('/generate-seo/bulk', async (req: Request, res: Response) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Products array is required',
        },
      } as ServiceResponse);
    }

    const results = await seoGenerator.generateBulkSEO(products);

    res.json({
      success: true,
      data: results,
    } as ServiceResponse);
  } catch (error) {
    console.error('Bulk SEO generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Bulk SEO generation failed',
      },
    } as ServiceResponse);
  }
});

app.post('/validate-seo', async (req: Request, res: Response) => {
  try {
    const seo = req.body;

    const validation = await seoGenerator.validateSEO(seo);

    res.json({
      success: true,
      data: validation,
    } as ServiceResponse);
  } catch (error) {
    console.error('SEO validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: error instanceof Error ? error.message : 'SEO validation failed',
      },
    } as ServiceResponse);
  }
});

// Description Generation Endpoints

app.post('/generate-description', async (req: Request, res: Response) => {
  try {
    const { title, vendor, tags, productType } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TITLE',
          message: 'Product title is required',
        },
      } as ServiceResponse);
    }

    const result = await descriptionGenerator.generateDescription({
      title,
      vendor,
      tags,
      productType,
    });

    res.json({
      success: true,
      data: result,
    } as ServiceResponse);
  } catch (error) {
    console.error('Description generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Description generation failed',
      },
    } as ServiceResponse);
  }
});

app.post('/enhance-description', async (req: Request, res: Response) => {
  try {
    const { currentDescription, title, vendor, tags } = req.body;

    if (!currentDescription || !title) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Current description and title are required',
        },
      } as ServiceResponse);
    }

    const result = await descriptionGenerator.enhanceExistingDescription(
      currentDescription,
      { title, vendor, tags }
    );

    res.json({
      success: true,
      data: result,
    } as ServiceResponse);
  } catch (error) {
    console.error('Description enhancement error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ENHANCEMENT_FAILED',
        message: error instanceof Error ? error.message : 'Description enhancement failed',
      },
    } as ServiceResponse);
  }
});

app.post('/generate-features', async (req: Request, res: Response) => {
  try {
    const { title, description, tags } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TITLE',
          message: 'Product title is required',
        },
      } as ServiceResponse);
    }

    const features = await descriptionGenerator.generateKeyFeatures({
      title,
      description,
      tags,
    });

    res.json({
      success: true,
      data: { features },
    } as ServiceResponse);
  } catch (error) {
    console.error('Feature generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Feature generation failed',
      },
    } as ServiceResponse);
  }
});

// Tags Generation Endpoints

app.post('/suggest-tags', async (req: Request, res: Response) => {
  try {
    const { title, description, productType, vendor } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TITLE',
          message: 'Product title is required',
        },
      } as ServiceResponse);
    }

    const result = await tagsGenerator.suggestTags({
      title,
      description,
      productType,
      vendor,
    });

    res.json({
      success: true,
      data: result,
    } as ServiceResponse);
  } catch (error) {
    console.error('Tag suggestion error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUGGESTION_FAILED',
        message: error instanceof Error ? error.message : 'Tag suggestion failed',
      },
    } as ServiceResponse);
  }
});

app.post('/merge-tags', async (req: Request, res: Response) => {
  try {
    const { existingTags, suggestedTags } = req.body;

    if (!Array.isArray(existingTags) || !Array.isArray(suggestedTags)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Both existingTags and suggestedTags arrays are required',
        },
      } as ServiceResponse);
    }

    const result = await tagsGenerator.mergeTags(existingTags, suggestedTags);

    res.json({
      success: true,
      data: result,
    } as ServiceResponse);
  } catch (error) {
    console.error('Tag merge error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MERGE_FAILED',
        message: error instanceof Error ? error.message : 'Tag merge failed',
      },
    } as ServiceResponse);
  }
});

app.post('/categorize-tags', async (req: Request, res: Response) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Tags array is required',
        },
      } as ServiceResponse);
    }

    const result = await tagsGenerator.categorizeTags(tags);

    res.json({
      success: true,
      data: result,
    } as ServiceResponse);
  } catch (error) {
    console.error('Tag categorization error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORIZATION_FAILED',
        message: error instanceof Error ? error.message : 'Tag categorization failed',
      },
    } as ServiceResponse);
  }
});

app.post('/validate-tags', async (req: Request, res: Response) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Tags array is required',
        },
      } as ServiceResponse);
    }

    const result = await tagsGenerator.validateTags(tags);

    res.json({
      success: true,
      data: result,
    } as ServiceResponse);
  } catch (error) {
    console.error('Tag validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: error instanceof Error ? error.message : 'Tag validation failed',
      },
    } as ServiceResponse);
  }
});

// Bulk Optimization Endpoint

app.post('/bulk-optimize', async (req: Request, res: Response) => {
  try {
    const { products, optimizationTypes } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Products array is required',
        },
      } as ServiceResponse);
    }

    const types = optimizationTypes || ['seo', 'description', 'tags'];
    const results = [];

    for (const product of products) {
      const optimization: any = {
        productId: product.id,
        optimizations: {},
      };

      try {
        if (types.includes('seo')) {
          optimization.optimizations.seo = await seoGenerator.generateSEO(product);
        }

        if (types.includes('description')) {
          optimization.optimizations.description =
            await descriptionGenerator.generateDescription(product);
        }

        if (types.includes('tags')) {
          optimization.optimizations.tags = await tagsGenerator.suggestTags(product);
        }

        results.push(optimization);
      } catch (error) {
        results.push({
          productId: product.id,
          error: error instanceof Error ? error.message : 'Optimization failed',
        });
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    res.json({
      success: true,
      data: results,
    } as ServiceResponse);
  } catch (error) {
    console.error('Bulk optimization error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_OPTIMIZATION_FAILED',
        message: error instanceof Error ? error.message : 'Bulk optimization failed',
      },
    } as ServiceResponse);
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  } as ServiceResponse);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Product AI Service running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
