import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface YahooFinanceQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  preMarketPrice?: number;
  postMarketPrice?: number;
}

export interface YahooHistoricalData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

@Injectable()
export class YahooFinanceService {
  private readonly logger = new Logger(YahooFinanceService.name);
  private readonly baseUrl = 'https://query1.finance.yahoo.com';

  /**
   * Get real-time quote for a symbol (free, no API key required)
   */
  async getQuote(symbol: string): Promise<YahooFinanceQuote | null> {
    try {
      const url = `${this.baseUrl}/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        throw new Error('No data received from Yahoo Finance');
      }

      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];

      if (!meta || !quote) {
        throw new Error('Invalid data structure from Yahoo Finance');
      }

      return {
        symbol: meta.symbol,
        regularMarketPrice: meta.regularMarketPrice,
        regularMarketChange: meta.regularMarketPrice - meta.previousClose,
        regularMarketChangePercent:
          ((meta.regularMarketPrice - meta.previousClose) /
            meta.previousClose) *
          100,
        regularMarketTime: meta.regularMarketTime,
        regularMarketVolume: meta.regularMarketVolume,
        regularMarketPreviousClose: meta.previousClose,
        preMarketPrice: meta.preMarketPrice,
        postMarketPrice: meta.postMarketPrice,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching Yahoo Finance quote for ${symbol}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Get historical data for sparkline (last 7 days)
   */
  async getHistoricalData(
    symbol: string,
    days: number = 7,
  ): Promise<YahooHistoricalData[]> {
    try {
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - days * 24 * 60 * 60;

      const url = `${this.baseUrl}/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        params: {
          period1: startDate,
          period2: endDate,
          interval: '1d',
          includePrePost: false,
        },
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        throw new Error('No historical data received from Yahoo Finance');
      }

      const timestamps = result.timestamp;
      const quote = result.indicators?.quote?.[0];

      if (!timestamps || !quote) {
        throw new Error('Invalid historical data structure from Yahoo Finance');
      }

      const historicalData: YahooHistoricalData[] = [];

      for (let i = 0; i < timestamps.length; i++) {
        if (quote.close[i] !== null) {
          historicalData.push({
            timestamp: timestamps[i],
            open: quote.open[i] || quote.close[i],
            high: quote.high[i] || quote.close[i],
            low: quote.low[i] || quote.close[i],
            close: quote.close[i],
            volume: quote.volume[i] || 0,
          });
        }
      }

      return historicalData;
    } catch (error) {
      this.logger.error(
        `Error fetching Yahoo Finance historical data for ${symbol}:`,
        error.message,
      );
      return [];
    }
  }

  /**
   * Get SPY sparkline data compatible with existing interface
   */
  async getSPYSparklineData(): Promise<any> {
    try {
      const [quote, historicalData] = await Promise.all([
        this.getQuote('SPY'),
        this.getHistoricalData('SPY', 7),
      ]);

      if (!quote) {
        throw new Error('Failed to get SPY quote data');
      }

      // Convert historical data to sparkline format
      const sparklineData = historicalData.map((data) => ({
        timestamp: new Date(data.timestamp * 1000).toISOString().split('T')[0],
        price: data.close,
        volume: data.volume,
      }));

      // Calculate weekly change
      const currentPrice = quote.regularMarketPrice;
      const weekAgoPrice =
        sparklineData.length > 0 ? sparklineData[0].price : currentPrice;
      const weeklyChange = ((currentPrice - weekAgoPrice) / weekAgoPrice) * 100;

      // Determine trend and volatility
      const weeklyTrend = this.determineTrend(weeklyChange);
      const volatility = this.calculateVolatility(sparklineData);
      const marketSentiment = this.determineSentiment(weeklyChange, volatility);

      return {
        data: sparklineData,
        currentPrice,
        weeklyChange,
        weeklyTrend,
        volatility,
        marketSentiment,
        lastUpdated: new Date().toISOString(),
        source: 'yahoo_finance',
      };
    } catch (error) {
      this.logger.error(
        'Error creating SPY sparkline data from Yahoo Finance:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Validate if current price is reasonable (not stale or erroneous)
   */
  async validateSPYPrice(price: number): Promise<boolean> {
    try {
      const quote = await this.getQuote('SPY');
      if (!quote) {
        return false;
      }

      const yahooPrice = quote.regularMarketPrice;
      const priceDifference = Math.abs(price - yahooPrice);
      const percentDifference = (priceDifference / yahooPrice) * 100;

      // Consider price valid if within 2% of Yahoo Finance price
      return percentDifference <= 2;
    } catch (error) {
      this.logger.warn(
        'Could not validate SPY price against Yahoo Finance:',
        error.message,
      );
      return true; // Don't block on validation errors
    }
  }

  /**
   * Helper methods for analysis
   */
  private determineTrend(change: number): 'up' | 'down' | 'flat' {
    if (Math.abs(change) < 0.1) return 'flat';
    return change > 0 ? 'up' : 'down';
  }

  private calculateVolatility(
    data: Array<{ price: number }>,
  ): 'low' | 'moderate' | 'high' {
    if (data.length < 2) return 'moderate';

    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].price - data[i - 1].price) / data[i - 1].price);
    }

    const stdDev = this.standardDeviation(returns);

    if (stdDev < 0.01) return 'low';
    if (stdDev < 0.02) return 'moderate';
    return 'high';
  }

  private determineSentiment(
    change: number,
    volatility: string,
  ): 'bullish' | 'neutral' | 'bearish' {
    if (change > 1 && volatility !== 'high') return 'bullish';
    if (change < -1 || volatility === 'high') return 'bearish';
    return 'neutral';
  }

  private standardDeviation(values: number[]): number {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      values.length;
    return Math.sqrt(variance);
  }
}
