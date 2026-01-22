export interface ReorderCalculation {
  reorderPoint: number;
  optimalStock: number;
  safetyStock: number;
  daysUntilStockout: number;
}

export class ReorderCalculator {
  calculateReorderPoint(params: {
    avgDailyDemand: number;
    leadTimeDays: number;
    safetyStockDays: number;
  }): number {
    // Reorder point = (Avg daily demand × Lead time) + Safety stock
    const leadTimeDemand = params.avgDailyDemand * params.leadTimeDays;
    const safetyStock = params.avgDailyDemand * params.safetyStockDays;

    return Math.ceil(leadTimeDemand + safetyStock);
  }

  calculateOptimalStock(params: {
    avgDailyDemand: number;
    reviewPeriodDays: number;
    leadTimeDays: number;
    safetyStockDays: number;
  }): number {
    // Optimal stock = (Avg demand × (Review period + Lead time)) + Safety stock
    const reviewLeadTime = params.reviewPeriodDays + params.leadTimeDays;
    const demandDuringPeriod = params.avgDailyDemand * reviewLeadTime;
    const safetyStock = params.avgDailyDemand * params.safetyStockDays;

    return Math.ceil(demandDuringPeriod + safetyStock);
  }

  calculateSafetyStock(params: {
    avgDailyDemand: number;
    demandVariability: number; // Standard deviation
    leadTimeDays: number;
    serviceLevel: number; // 0.95 for 95% service level
  }): number {
    // Safety stock = Z × σ × √L
    // Where Z = z-score for service level, σ = demand std dev, L = lead time

    const zScore = this.getZScore(params.serviceLevel);
    const safetyStock =
      zScore *
      params.demandVariability *
      Math.sqrt(params.leadTimeDays);

    return Math.ceil(safetyStock);
  }

  calculateDaysUntilStockout(
    currentStock: number,
    avgDailyDemand: number
  ): number {
    if (avgDailyDemand <= 0) {
      return 9999; // Essentially infinite
    }

    return Math.floor(currentStock / avgDailyDemand);
  }

  calculateEOQ(params: {
    annualDemand: number;
    orderingCost: number;
    holdingCost: number;
  }): number {
    // Economic Order Quantity = √((2 × D × S) / H)
    // D = annual demand, S = ordering cost, H = holding cost per unit per year

    const eoq = Math.sqrt(
      (2 * params.annualDemand * params.orderingCost) / params.holdingCost
    );

    return Math.ceil(eoq);
  }

  generateReorderRecommendation(params: {
    currentStock: number;
    avgDailyDemand: number;
    reorderPoint: number;
    optimalStock: number;
    leadTimeDays: number;
  }): {
    shouldReorder: boolean;
    urgency: 'critical' | 'high' | 'medium' | 'low' | 'none';
    recommendedOrderQuantity: number;
    reasoning: string;
  } {
    const daysUntilStockout = this.calculateDaysUntilStockout(
      params.currentStock,
      params.avgDailyDemand
    );

    let shouldReorder = params.currentStock <= params.reorderPoint;
    let urgency: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none';
    let reasoning = '';

    if (daysUntilStockout <= params.leadTimeDays) {
      urgency = 'critical';
      shouldReorder = true;
      reasoning = `Stock will run out in ${daysUntilStockout} days, which is less than lead time (${params.leadTimeDays} days). Order immediately!`;
    } else if (params.currentStock <= params.reorderPoint * 0.5) {
      urgency = 'high';
      reasoning = `Stock is at 50% or below reorder point. Place order soon.`;
    } else if (params.currentStock <= params.reorderPoint) {
      urgency = 'medium';
      reasoning = `Stock has reached reorder point. Consider placing order.`;
    } else if (params.currentStock < params.optimalStock) {
      urgency = 'low';
      reasoning = `Stock is below optimal level but above reorder point.`;
    } else {
      urgency = 'none';
      reasoning = `Stock levels are healthy. No immediate action needed.`;
    }

    // Calculate recommended order quantity
    const recommendedOrderQuantity = shouldReorder
      ? Math.max(0, params.optimalStock - params.currentStock)
      : 0;

    return {
      shouldReorder,
      urgency,
      recommendedOrderQuantity,
      reasoning,
    };
  }

  private getZScore(serviceLevel: number): number {
    // Common z-scores for service levels
    const zScores: Record<number, number> = {
      0.9: 1.28,
      0.95: 1.65,
      0.97: 1.88,
      0.99: 2.33,
    };

    return zScores[serviceLevel] || 1.65; // Default to 95%
  }

  calculateStockoutProbability(params: {
    currentStock: number;
    avgDailyDemand: number;
    demandStdDev: number;
    leadTimeDays: number;
  }): number {
    // Calculate probability of stockout during lead time
    const leadTimeDemand = params.avgDailyDemand * params.leadTimeDays;
    const leadTimeStdDev = params.demandStdDev * Math.sqrt(params.leadTimeDays);

    if (leadTimeStdDev === 0) {
      return params.currentStock < leadTimeDemand ? 1.0 : 0.0;
    }

    // Z-score
    const z = (params.currentStock - leadTimeDemand) / leadTimeStdDev;

    // Convert z-score to probability (simplified)
    // Positive z = lower stockout risk
    if (z >= 2.33) return 0.01; // 99% service level
    if (z >= 1.65) return 0.05; // 95% service level
    if (z >= 1.28) return 0.1; // 90% service level
    if (z >= 0) return 0.5;
    return 0.9; // High risk
  }
}
