import { Injectable, Logger } from '@nestjs/common';
import { StockTechnicals } from '../common/types';

@Injectable()
export class TechnicalAnalysisService {
  private readonly logger = new Logger(TechnicalAnalysisService.name);

  async getAnalysis(symbol: string): Promise<StockTechnicals> {
    // In a real implementation, this would calculate actual technical indicators
    // For now, providing mock data based on symbol
    return this.getMockTechnicalAnalysis(symbol);
  }

  calculateRSI(prices: number[], period = 14): number {
    if (prices.length < period + 1) {
      return 50; // Neutral RSI if insufficient data
    }

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change >= 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) {
      return 100;
    }

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices[prices.length - 1] || 0;
    }

    const recentPrices = prices.slice(-period);
    return recentPrices.reduce((sum, price) => sum + price, 0) / period;
  }

  private getMockTechnicalAnalysis(symbol: string): StockTechnicals {
    // Mock data based on symbol - in production, this would be calculated from real price data
    const mockData: Record<string, Partial<StockTechnicals>> = {
      'AAPL': {
        rsi: 65.2,
        sma20: 182.50,
        sma50: 178.20,
        volume: 45000000,
        signals: {
          trend: 'bullish',
          strength: 'moderate',
        },
      },
      'NVDA': {
        rsi: 72.8,
        sma20: 685.30,
        sma50: 620.15,
        volume: 38000000,
        signals: {
          trend: 'bullish',
          strength: 'strong',
        },
      },
      'TSLA': {
        rsi: 45.6,
        sma20: 245.80,
        sma50: 252.40,
        volume: 42000000,
        signals: {
          trend: 'bearish',
          strength: 'weak',
        },
      },
      'GOOGL': {
        rsi: 58.3,
        sma20: 138.90,
        sma50: 135.70,
        volume: 25000000,
        signals: {
          trend: 'bullish',
          strength: 'moderate',
        },
      },
      'MSFT': {
        rsi: 62.1,
        sma20: 378.20,
        sma50: 365.80,
        volume: 20000000,
        signals: {
          trend: 'bullish',
          strength: 'moderate',
        },
      },
    };

    const data = mockData[symbol] || {
      rsi: 50,
      sma20: 100,
      sma50: 100,
      volume: 1000000,
      signals: {
        trend: 'neutral',
        strength: 'weak',
      },
    };

    return {
      rsi: data.rsi || 50,
      sma20: data.sma20 || 100,
      sma50: data.sma50 || 100,
      volume: data.volume || 1000000,
      signals: data.signals || {
        trend: 'neutral',
        strength: 'weak',
      },
    };
  }
}