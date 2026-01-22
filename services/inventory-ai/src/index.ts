import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DemandForecaster } from './forecasting/demand-forecaster.js';
import { ReorderCalculator } from './calculators/reorder-calculator.js';
import type { ServiceResponse } from '@shopify-automation/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const demandForecaster = new DemandForecaster(GEMINI_API_KEY);
const reorderCalculator = new ReorderCalculator();

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'inventory-ai', port: PORT });
});

// Forecast demand
app.post('/forecast-demand', async (req: Request, res: Response) => {
  try {
    const { productTitle, salesHistory, currentStock, forecastDays } = req.body;

    if (!productTitle || !salesHistory || !Array.isArray(salesHistory)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product title and sales history are required',
        },
      } as ServiceResponse);
    }

    const forecast = await demandForecaster.forecastDemand({
      productTitle,
      salesHistory,
      currentStock: currentStock || 0,
      forecastDays: forecastDays || 30,
    });

    res.json({
      success: true,
      data: forecast,
    } as ServiceResponse);
  } catch (error) {
    console.error('Demand forecast error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FORECAST_FAILED',
        message: error instanceof Error ? error.message : 'Forecast failed',
      },
    } as ServiceResponse);
  }
});

// Calculate reorder point
app.post('/calculate-reorder', async (req: Request, res: Response) => {
  try {
    const {
      avgDailyDemand,
      currentStock,
      leadTimeDays,
      safetyStockDays,
      reviewPeriodDays,
    } = req.body;

    if (avgDailyDemand === undefined || currentStock === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'avgDailyDemand and currentStock are required',
        },
      } as ServiceResponse);
    }

    const reorderPoint = reorderCalculator.calculateReorderPoint({
      avgDailyDemand,
      leadTimeDays: leadTimeDays || 7,
      safetyStockDays: safetyStockDays || 3,
    });

    const optimalStock = reorderCalculator.calculateOptimalStock({
      avgDailyDemand,
      reviewPeriodDays: reviewPeriodDays || 30,
      leadTimeDays: leadTimeDays || 7,
      safetyStockDays: safetyStockDays || 3,
    });

    const daysUntilStockout = reorderCalculator.calculateDaysUntilStockout(
      currentStock,
      avgDailyDemand
    );

    const recommendation = reorderCalculator.generateReorderRecommendation({
      currentStock,
      avgDailyDemand,
      reorderPoint,
      optimalStock,
      leadTimeDays: leadTimeDays || 7,
    });

    res.json({
      success: true,
      data: {
        reorderPoint,
        optimalStock,
        daysUntilStockout,
        recommendation,
      },
    } as ServiceResponse);
  } catch (error) {
    console.error('Reorder calculation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CALCULATION_FAILED',
        message: error instanceof Error ? error.message : 'Calculation failed',
      },
    } as ServiceResponse);
  }
});

// Calculate safety stock
app.post('/calculate-safety-stock', async (req: Request, res: Response) => {
  try {
    const { avgDailyDemand, demandVariability, leadTimeDays, serviceLevel } =
      req.body;

    if (
      avgDailyDemand === undefined ||
      demandVariability === undefined ||
      leadTimeDays === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message:
            'avgDailyDemand, demandVariability, and leadTimeDays are required',
        },
      } as ServiceResponse);
    }

    const safetyStock = reorderCalculator.calculateSafetyStock({
      avgDailyDemand,
      demandVariability,
      leadTimeDays,
      serviceLevel: serviceLevel || 0.95,
    });

    res.json({
      success: true,
      data: { safetyStock },
    } as ServiceResponse);
  } catch (error) {
    console.error('Safety stock calculation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CALCULATION_FAILED',
        message: error instanceof Error ? error.message : 'Calculation failed',
      },
    } as ServiceResponse);
  }
});

// Calculate EOQ
app.post('/calculate-eoq', async (req: Request, res: Response) => {
  try {
    const { annualDemand, orderingCost, holdingCost } = req.body;

    if (
      annualDemand === undefined ||
      orderingCost === undefined ||
      holdingCost === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'annualDemand, orderingCost, and holdingCost are required',
        },
      } as ServiceResponse);
    }

    const eoq = reorderCalculator.calculateEOQ({
      annualDemand,
      orderingCost,
      holdingCost,
    });

    res.json({
      success: true,
      data: { eoq },
    } as ServiceResponse);
  } catch (error) {
    console.error('EOQ calculation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CALCULATION_FAILED',
        message: error instanceof Error ? error.message : 'Calculation failed',
      },
    } as ServiceResponse);
  }
});

// Detect seasonality
app.post('/detect-seasonality', async (req: Request, res: Response) => {
  try {
    const { salesHistory } = req.body;

    if (!salesHistory || !Array.isArray(salesHistory)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Sales history array is required',
        },
      } as ServiceResponse);
    }

    const seasonality = demandForecaster.detectSeasonality(salesHistory);

    res.json({
      success: true,
      data: seasonality,
    } as ServiceResponse);
  } catch (error) {
    console.error('Seasonality detection error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DETECTION_FAILED',
        message: error instanceof Error ? error.message : 'Detection failed',
      },
    } as ServiceResponse);
  }
});

// Calculate stockout probability
app.post('/stockout-probability', async (req: Request, res: Response) => {
  try {
    const { currentStock, avgDailyDemand, demandStdDev, leadTimeDays } = req.body;

    if (
      currentStock === undefined ||
      avgDailyDemand === undefined ||
      demandStdDev === undefined ||
      leadTimeDays === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'All parameters are required',
        },
      } as ServiceResponse);
    }

    const probability = reorderCalculator.calculateStockoutProbability({
      currentStock,
      avgDailyDemand,
      demandStdDev,
      leadTimeDays,
    });

    res.json({
      success: true,
      data: { probability, risk: probability > 0.5 ? 'high' : 'low' },
    } as ServiceResponse);
  } catch (error) {
    console.error('Stockout probability error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CALCULATION_FAILED',
        message: error instanceof Error ? error.message : 'Calculation failed',
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
  console.log(`🚀 Inventory AI Service running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
