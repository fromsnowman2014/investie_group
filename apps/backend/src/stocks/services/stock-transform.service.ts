import { Injectable } from '@nestjs/common';
import { StockCardData, StockSymbol } from '../../common/types';
import { IStockTransformService, StockPriceData } from '../interfaces';

@Injectable()
export class StockTransformService implements IStockTransformService {
  transformToStockCardData(
    stockData: StockPriceData,
    aiEvaluation: any,
    technicals: any,
    newsSummary: any,
    symbol: StockSymbol,
  ): StockCardData {
    return {
      symbol,
      name: this.getCompanyName(symbol),
      price: {
        current: stockData.price || 100,
        change: stockData.change || 0,
        changePercent: stockData.changePercent || 0,
        source: 'google_finance',
      },
      fundamentals: {
        pe: stockData.pe || 20,
        marketCap: stockData.marketCap || 1000000000,
        volume: stockData.volume || 1000000,
        fiftyTwoWeekHigh: stockData.fiftyTwoWeekHigh || 120,
        fiftyTwoWeekLow: stockData.fiftyTwoWeekLow || 80,
      },
      aiEvaluation,
      technicals,
      newsSummary,
      sectorPerformance: {
        name: this.getSectorName(symbol),
        weeklyChange: this.getMockSectorChange(),
      },
    };
  }

  getCompanyName(symbol: StockSymbol): string {
    const names: Record<StockSymbol, string> = {
      AAPL: 'Apple Inc.',
      TSLA: 'Tesla, Inc.',
      MSFT: 'Microsoft Corporation',
      GOOGL: 'Alphabet Inc.',
      AMZN: 'Amazon.com, Inc.',
      NVDA: 'NVIDIA Corporation',
      META: 'Meta Platforms, Inc.',
      NFLX: 'Netflix, Inc.',
      AVGO: 'Broadcom Inc.',
      AMD: 'Advanced Micro Devices, Inc.',
    };
    return names[symbol] || symbol;
  }

  getSectorName(symbol: StockSymbol): string {
    const sectors: Record<StockSymbol, string> = {
      AAPL: 'Technology',
      TSLA: 'Automotive',
      MSFT: 'Technology',
      GOOGL: 'Technology',
      AMZN: 'Consumer Discretionary',
      NVDA: 'Technology',
      META: 'Technology',
      NFLX: 'Communication Services',
      AVGO: 'Technology',
      AMD: 'Technology',
    };
    return sectors[symbol] || 'Technology';
  }

  extractSentimentFromOverview(
    overview: any,
  ): 'positive' | 'neutral' | 'negative' {
    if (!overview) return 'neutral';

    const text = (overview.overview || '').toLowerCase();
    if (
      text.includes('positive') ||
      text.includes('buy') ||
      text.includes('bullish')
    ) {
      return 'positive';
    }
    if (
      text.includes('negative') ||
      text.includes('sell') ||
      text.includes('bearish')
    ) {
      return 'negative';
    }
    return 'neutral';
  }

  parseMarketCap(marketCapString: string): number {
    if (!marketCapString || marketCapString === 'None') return 0;

    const cleanString = marketCapString.replace(/[^0-9.]/g, '');
    const value = parseFloat(cleanString);

    if (marketCapString.includes('T')) {
      return value * 1e12;
    } else if (marketCapString.includes('B')) {
      return value * 1e9;
    } else if (marketCapString.includes('M')) {
      return value * 1e6;
    }

    return value;
  }

  calculateChange(price: number, changePercent: number): number {
    return (price * changePercent) / 100;
  }

  private getMockSectorChange(): number {
    return (Math.random() - 0.5) * 10;
  }
}
