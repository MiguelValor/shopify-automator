// Shared TypeScript types for the Shopify Automation Platform

export interface ShopifyProduct {
  id: string;
  title: string;
  description?: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  handle: string;
  status: 'active' | 'draft' | 'archived';
  images?: ShopifyImage[];
  variants?: ShopifyVariant[];
  seo?: {
    title?: string;
    description?: string;
  };
}

export interface ShopifyVariant {
  id: string;
  productId: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  sku?: string;
  barcode?: string;
  inventoryQuantity?: number;
  weight?: number;
  weightUnit?: string;
}

export interface ShopifyImage {
  id: string;
  productId: string;
  src: string;
  altText?: string;
  position: number;
}

export interface SEOSuggestion {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  optimizedTags: string[];
  confidence?: number;
}

export interface ProductOptimization {
  id: string;
  shopId: string;
  shopifyProductId: string;
  optimizationType: 'description' | 'seo' | 'title' | 'tags';
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  originalValue?: any;
  suggestedValue: any;
  appliedValue?: any;
  confidence?: number;
  aiModel: string;
  generatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  appliedAt?: Date;
}

export interface InventoryForecast {
  id: string;
  shopId: string;
  shopifyProductId: string;
  shopifyVariantId?: string;
  currentStock: number;
  forecastedDemand: number;
  reorderPoint: number;
  optimalStock: number;
  daysUntilStockout?: number;
  seasonalityFactor: number;
  trendFactor: number;
  confidence?: number;
  forecastPeriodDays: number;
  calculatedAt: Date;
  nextReviewAt: Date;
}

export interface PricingStrategy {
  type: 'competitive' | 'demand_based' | 'margin_based';
  competitorWeight?: number;
  demandWeight?: number;
  inventoryWeight?: number;
  targetMarginMin?: number;
  targetMarginMax?: number;
  priceFloorPercent?: number;
  priceCeilingPercent?: number;
}

export interface PriceOptimization {
  id: string;
  pricingRuleId: string;
  shopifyProductId: string;
  shopifyVariantId: string;
  currentPrice: number;
  suggestedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  reasoning: {
    strategy: string;
    competitorAvg?: number;
    demandFactor?: number;
    inventoryLevel?: number;
    marginProtection?: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  confidence?: number;
  generatedAt: Date;
  reviewedAt?: Date;
  appliedAt?: Date;
}

export interface ImageOptimization {
  id: string;
  shopId: string;
  shopifyProductId: string;
  shopifyImageId: string;
  imageUrl: string;
  optimizationType: 'alt_text' | 'tags' | 'quality';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  originalAltText?: string;
  suggestedAltText?: string;
  aiTags?: string[];
  processedImageUrl?: string;
  errorMessage?: string;
  queuedAt: Date;
  processedAt?: Date;
}

export interface AutomationRule {
  id: string;
  shopId: string;
  ruleType: 'seo' | 'inventory' | 'pricing' | 'image';
  isActive: boolean;
  autoApprove: boolean;
  trigger: {
    event: string;
    conditions?: Record<string, any>;
  };
  actions: Array<{
    type: string;
    params?: Record<string, any>;
  }>;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalQueue {
  id: string;
  shopId: string;
  actionType: 'product_update' | 'price_change' | 'inventory_adjust';
  entityType: 'product' | 'variant';
  entityId: string;
  currentData: any;
  proposedData: any;
  reasoning?: string;
  confidence?: number;
  priority: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface BackgroundJob {
  id: string;
  jobType: 'product_scan' | 'inventory_forecast' | 'price_monitor' | 'image_process';
  shopId?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  payload?: any;
  progress: number;
  result?: any;
  errorMessage?: string;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AIGenerationRequest {
  model: string;
  prompt: string;
  context?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
}

export interface AIGenerationResponse {
  content: string;
  model: string;
  confidence?: number;
  tokensUsed?: number;
  finishReason?: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
