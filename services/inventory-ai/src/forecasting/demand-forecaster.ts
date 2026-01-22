import { GeminiClient, PromptTemplates } from '@shopify-automation/ai-core';

export interface SalesHistory {
  date: string;
  quantity: number;
}

export interface ForecastResult {
  forecastedDailyDemand: number;
  trendFactor: number;
  seasonalityFactor: number;
  confidence: number;
  reasoning: string;
}

export class DemandForecaster {
  private gemini: GeminiClient;

  constructor(apiKey: string) {
    this.gemini = new GeminiClient(apiKey);
  }

  async forecastDemand(params: {
    productTitle: string;
    salesHistory: SalesHistory[];
    currentStock: number;
    forecastDays?: number;
  }): Promise<ForecastResult> {
    try {
      // Calculate basic statistics
      const stats = this.calculateStatistics(params.salesHistory);

      // Use AI for advanced pattern detection
      const salesData = params.salesHistory.map((s) => s.quantity);
      const prompt = PromptTemplates.forecastDemand({
        productTitle: params.productTitle,
        salesHistory: salesData,
        currentStock: params.currentStock,
      });

      const aiResult = await this.gemini.generateStructuredJSON<{
        forecastedDailyDemand: number;
        trendFactor: number;
        seasonalityFactor: number;
        confidence: number;
        reasoning: string;
      }>(prompt);

      // Combine statistical analysis with AI insights
      const forecastedDemand = this.combineForecast(stats.avgDailyDemand, aiResult.forecastedDailyDemand);

      return {
        forecastedDailyDemand: forecastedDemand,
        trendFactor: aiResult.trendFactor,
        seasonalityFactor: aiResult.seasonalityFactor,
        confidence: Math.min(aiResult.confidence, stats.confidence),
        reasoning: aiResult.reasoning,
      };
    } catch (error) {
      // Fallback to statistical method
      const stats = this.calculateStatistics(params.salesHistory);
      return {
        forecastedDailyDemand: stats.avgDailyDemand,
        trendFactor: stats.trendFactor,
        seasonalityFactor: 1.0,
        confidence: stats.confidence * 0.7, // Lower confidence without AI
        reasoning: 'Statistical forecast (AI unavailable)',
      };
    }
  }

  private calculateStatistics(salesHistory: SalesHistory[]): {
    avgDailyDemand: number;
    trendFactor: number;
    confidence: number;
  } {
    if (salesHistory.length === 0) {
      return {
        avgDailyDemand: 0,
        trendFactor: 1.0,
        confidence: 0,
      };
    }

    // Calculate average daily demand
    const totalQuantity = salesHistory.reduce((sum, s) => sum + s.quantity, 0);
    const avgDailyDemand = totalQuantity / salesHistory.length;

    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(salesHistory.length / 2);
    const firstHalf = salesHistory.slice(0, midPoint);
    const secondHalf = salesHistory.slice(midPoint);

    const firstHalfAvg =
      firstHalf.reduce((sum, s) => sum + s.quantity, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, s) => sum + s.quantity, 0) / secondHalf.length;

    const trendFactor = firstHalfAvg > 0 ? secondHalfAvg / firstHalfAvg : 1.0;

    // Calculate confidence based on data consistency
    const variance =
      salesHistory.reduce(
        (sum, s) => sum + Math.pow(s.quantity - avgDailyDemand, 2),
        0
      ) / salesHistory.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgDailyDemand > 0 ? stdDev / avgDailyDemand : 1;

    // Lower CV = higher confidence
    const confidence = Math.max(0.5, 1 - coefficientOfVariation * 0.5);

    return {
      avgDailyDemand,
      trendFactor,
      confidence: Math.min(confidence, 0.9),
    };
  }

  private combineForecast(statisticalForecast: number, aiForecast: number): number {
    // Weight: 60% statistical, 40% AI
    return statisticalForecast * 0.6 + aiForecast * 0.4;
  }

  calculateMovingAverage(salesHistory: SalesHistory[], windowSize: number): number[] {
    const sales = salesHistory.map((s) => s.quantity);
    const movingAverages: number[] = [];

    for (let i = 0; i <= sales.length - windowSize; i++) {
      const window = sales.slice(i, i + windowSize);
      const avg = window.reduce((sum, val) => sum + val, 0) / windowSize;
      movingAverages.push(avg);
    }

    return movingAverages;
  }

  detectSeasonality(salesHistory: SalesHistory[]): {
    hasSeasonality: boolean;
    pattern: string;
    factor: number;
  } {
    if (salesHistory.length < 14) {
      return { hasSeasonality: false, pattern: 'none', factor: 1.0 };
    }

    // Simple weekly pattern detection
    const salesByDayOfWeek: Record<number, number[]> = {};

    salesHistory.forEach((sale) => {
      const date = new Date(sale.date);
      const dayOfWeek = date.getDay();
      if (!salesByDayOfWeek[dayOfWeek]) {
        salesByDayOfWeek[dayOfWeek] = [];
      }
      salesByDayOfWeek[dayOfWeek].push(sale.quantity);
    });

    // Calculate average for each day
    const avgByDay: Record<number, number> = {};
    Object.keys(salesByDayOfWeek).forEach((day) => {
      const dayNum = parseInt(day);
      const sales = salesByDayOfWeek[dayNum];
      avgByDay[dayNum] = sales.reduce((sum, s) => sum + s, 0) / sales.length;
    });

    // Check if there's significant variation
    const overallAvg = Object.values(avgByDay).reduce((sum, v) => sum + v, 0) / Object.values(avgByDay).length;
    const maxDeviation = Math.max(...Object.values(avgByDay).map((v) => Math.abs(v - overallAvg)));

    const hasSeasonality = maxDeviation > overallAvg * 0.3;

    return {
      hasSeasonality,
      pattern: hasSeasonality ? 'weekly' : 'none',
      factor: hasSeasonality ? 1.2 : 1.0,
    };
  }
}
