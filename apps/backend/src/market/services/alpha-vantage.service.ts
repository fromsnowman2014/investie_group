import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { YahooFinanceService } from './yahoo-finance.service';

export interface SP500SparklineData {
  data: Array<{
    timestamp: string;
    price: number;
    volume?: number;
  }>;
  currentPrice: number;
  weeklyChange: number;
  weeklyTrend: 'up' | 'down' | 'flat';
  volatility: 'low' | 'moderate' | 'high';
  marketSentiment: 'bullish' | 'neutral' | 'bearish';
}

export interface EnhancedSectorPerformance {
  name: string;
  symbol: string;           // Sector ETF symbol
  weeklyChange: number;
  performance: 'outperforming' | 'underperforming' | 'neutral';
  momentum: 'accelerating' | 'decelerating' | 'stable';
  rotationSignal: 'rotating-in' | 'rotating-out' | 'stable';
  marketCap: number;
  volume: number;
}

export interface VixData {
  value: number;
  change: number;
  changePercent: number;
  status: 'low' | 'medium' | 'high';
  interpretation: string;
}

@Injectable()
export class AlphaVantageService {
  private readonly logger = new Logger(AlphaVantageService.name);
  private readonly alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  private readonly alphaVantageBaseUrl = 'https://www.alphavantage.co/query';

  // Sector ETF mappings
  private readonly sectorETFs = {
    'Technology': 'XLK',
    'Healthcare': 'XLV', 
    'Financial Services': 'XLF',
    'Energy': 'XLE',
    'Industrials': 'XLI',
    'Consumer Discretionary': 'XLY',
    'Consumer Staples': 'XLP',
    'Real Estate': 'XLRE',
    'Materials': 'XLB',
    'Utilities': 'XLU',
    'Communication Services': 'XLC'
  };

  constructor(private readonly yahooFinanceService: YahooFinanceService) {
    if (!this.alphaVantageApiKey) {
      this.logger.warn('Alpha Vantage API key not configured');
    }
  }

  /**
   * Get S&P 500 sparkline data with 7-day mini chart
   * Uses Yahoo Finance as backup when Alpha Vantage fails
   */
  async getSP500SparklineData(): Promise<SP500SparklineData> {
    try {
      // Try Alpha Vantage first if API key is available and not demo
      if (this.alphaVantageApiKey && this.alphaVantageApiKey !== 'demo') {
        try {
          const alphaVantageData = await this.fetchSP500FromAlphaVantage();
          this.logger.log('✅ SPY data fetched from Alpha Vantage');
          return alphaVantageData;
        } catch (alphaVantageError) {
          this.logger.warn('Alpha Vantage failed, falling back to Yahoo Finance:', alphaVantageError.message);
        }
      }

      // Fallback to Yahoo Finance (free, no API key required)
      try {
        const yahooData = await this.yahooFinanceService.getSPYSparklineData();
        this.logger.log('✅ SPY data fetched from Yahoo Finance (backup)');
        return yahooData;
      } catch (yahooError) {
        this.logger.error('Yahoo Finance backup failed:', yahooError.message);
      }

      // Final fallback to mock data with warning
      this.logger.warn('⚠️ All real-time data sources failed, using mock data');
      return this.getMockSP500SparklineData();
    } catch (error) {
      this.logger.error('Error in getSP500SparklineData:', error.message);
      return this.getMockSP500SparklineData();
    }
  }

  /**
   * Fetch S&P 500 data from Alpha Vantage
   */
  private async fetchSP500FromAlphaVantage(): Promise<SP500SparklineData> {
    // Fetch daily time series for SPY
    const response = await axios.get(this.alphaVantageBaseUrl, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: 'SPY',
        apikey: this.alphaVantageApiKey,
        outputsize: 'compact' // Last 100 data points
      },
      timeout: 15000
    });

    const timeSeries = response.data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error('No time series data received from Alpha Vantage');
    }

    // Extract last 7 days of data
    const dates = Object.keys(timeSeries).sort().reverse().slice(0, 7);
    const sparklineData = dates.map(date => ({
      timestamp: date,
      price: parseFloat(timeSeries[date]['4. close']),
      volume: parseInt(timeSeries[date]['5. volume'])
    })).reverse(); // Reverse to chronological order

    // Calculate metrics
    const currentPrice = sparklineData[sparklineData.length - 1].price;
    const weekAgoPrice = sparklineData[0].price;
    const weeklyChange = ((currentPrice - weekAgoPrice) / weekAgoPrice) * 100;
    const weeklyTrend = this.determineTrend(weeklyChange);
    const volatility = this.calculateVolatility(sparklineData);
    const marketSentiment = this.determineSentiment(weeklyChange, volatility);

    return {
      data: sparklineData,
      currentPrice,
      weeklyChange,
      weeklyTrend,
      volatility,
      marketSentiment
    };
  }

  /**
   * Get enhanced VIX data with interpretation
   */
  async getEnhancedVixData(): Promise<VixData> {
    try {
      if (!this.alphaVantageApiKey) {
        return this.getMockVixData();
      }

      const response = await axios.get(this.alphaVantageBaseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: 'VIX',
          apikey: this.alphaVantageApiKey
        },
        timeout: 10000
      });

      const quote = response.data['Global Quote'];
      const value = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

      return {
        value,
        change,
        changePercent,
        status: this.classifyVixLevel(value),
        interpretation: this.interpretVix(value, change)
      };
    } catch (error) {
      this.logger.error('Error fetching enhanced VIX data:', error.message);
      return this.getMockVixData();
    }
  }

  /**
   * Get enhanced sector performance with detailed analysis
   */
  async getEnhancedSectorPerformance(): Promise<EnhancedSectorPerformance[]> {
    try {
      if (!this.alphaVantageApiKey) {
        return this.getMockEnhancedSectorData();
      }

      const sectorPromises = Object.entries(this.sectorETFs).map(async ([sectorName, symbol]) => {
        try {
          // Get current quote
          const quoteResponse = await axios.get(this.alphaVantageBaseUrl, {
            params: {
              function: 'GLOBAL_QUOTE',
              symbol: symbol,
              apikey: this.alphaVantageApiKey
            },
            timeout: 8000
          });

          // Get weekly performance data
          const weeklyResponse = await axios.get(this.alphaVantageBaseUrl, {
            params: {
              function: 'TIME_SERIES_WEEKLY',
              symbol: symbol,
              apikey: this.alphaVantageApiKey
            },
            timeout: 8000
          });

          return this.processSectorData(sectorName, symbol, quoteResponse.data, weeklyResponse.data);
        } catch (error) {
          this.logger.warn(`Failed to fetch data for sector ${sectorName}:`, error.message);
          return this.getMockSectorData(sectorName, symbol);
        }
      });

      // Execute requests with some delay to avoid rate limiting
      const results: EnhancedSectorPerformance[] = [];
      for (let i = 0; i < sectorPromises.length; i++) {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        }
        results.push(await sectorPromises[i]);
      }

      return results.filter(Boolean); // Remove any null results
    } catch (error) {
      this.logger.error('Error fetching enhanced sector performance:', error.message);
      return this.getMockEnhancedSectorData();
    }
  }

  /**
   * Process individual sector data
   */
  private processSectorData(
    sectorName: string, 
    symbol: string, 
    quoteData: any, 
    weeklyData: any
  ): EnhancedSectorPerformance {
    try {
      const quote = quoteData['Global Quote'];
      const timeSeries = weeklyData['Weekly Time Series'];
      
      if (!quote || !timeSeries) {
        return this.getMockSectorData(sectorName, symbol);
      }

      // Get weekly performance
      const weeks = Object.keys(timeSeries).sort().reverse().slice(0, 2);
      const currentWeekClose = parseFloat(timeSeries[weeks[0]]['4. close']);
      const lastWeekClose = parseFloat(timeSeries[weeks[1]]['4. close']);
      const weeklyChange = ((currentWeekClose - lastWeekClose) / lastWeekClose) * 100;

      // Calculate additional metrics
      const volume = parseInt(quote['06. volume']) || 1000000;
      const marketCap = this.estimateMarketCap(symbol, currentWeekClose);
      const performance = this.categorizePerformance(weeklyChange);
      const momentum = this.analyzeMomentum(timeSeries, weeks);
      const rotationSignal = this.analyzeRotation(weeklyChange, volume);

      return {
        name: sectorName,
        symbol,
        weeklyChange,
        performance,
        momentum,
        rotationSignal,
        marketCap,
        volume
      };
    } catch (error) {
      this.logger.warn(`Error processing sector data for ${sectorName}:`, error.message);
      return this.getMockSectorData(sectorName, symbol);
    }
  }

  /**
   * Helper methods for analysis
   */
  private determineTrend(change: number): 'up' | 'down' | 'flat' {
    if (Math.abs(change) < 0.1) return 'flat';
    return change > 0 ? 'up' : 'down';
  }

  private calculateVolatility(data: Array<{ price: number }>): 'low' | 'moderate' | 'high' {
    if (data.length < 2) return 'moderate';
    
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].price - data[i-1].price) / data[i-1].price);
    }
    
    const stdDev = this.standardDeviation(returns);
    
    if (stdDev < 0.01) return 'low';
    if (stdDev < 0.02) return 'moderate';
    return 'high';
  }

  private determineSentiment(change: number, volatility: string): 'bullish' | 'neutral' | 'bearish' {
    if (change > 1 && volatility !== 'high') return 'bullish';
    if (change < -1 || volatility === 'high') return 'bearish';
    return 'neutral';
  }

  private classifyVixLevel(vix: number): 'low' | 'medium' | 'high' {
    if (vix < 20) return 'low';
    if (vix < 30) return 'medium';
    return 'high';
  }

  private interpretVix(vix: number, change: number): string {
    const level = this.classifyVixLevel(vix);
    const direction = change > 0 ? 'rising' : change < 0 ? 'falling' : 'stable';
    
    const interpretations = {
      'low-rising': 'Complacency decreasing, volatility may increase',
      'low-falling': 'Market complacency increasing',
      'low-stable': 'Low volatility environment',
      'medium-rising': 'Uncertainty increasing in markets',
      'medium-falling': 'Market stress subsiding',
      'medium-stable': 'Moderate market volatility',
      'high-rising': 'High fear and uncertainty in markets',
      'high-falling': 'Fear subsiding but volatility remains elevated',
      'high-stable': 'Sustained high volatility environment'
    };

    return interpretations[`${level}-${direction}`] || 'Market volatility monitoring required';
  }

  private categorizePerformance(change: number): 'outperforming' | 'underperforming' | 'neutral' {
    if (change > 1) return 'outperforming';
    if (change < -1) return 'underperforming';
    return 'neutral';
  }

  private analyzeMomentum(timeSeries: any, weeks: string[]): 'accelerating' | 'decelerating' | 'stable' {
    if (weeks.length < 2) return 'stable';
    
    try {
      const recentWeeks = weeks.slice(0, 3);
      const changes: number[] = [];
      
      for (let i = 1; i < recentWeeks.length; i++) {
        const current = parseFloat(timeSeries[recentWeeks[i-1]]['4. close']);
        const previous = parseFloat(timeSeries[recentWeeks[i]]['4. close']);
        changes.push((current - previous) / previous);
      }
      
      if (changes.length < 2) return 'stable';
      
      const trend = changes[0] - changes[1];
      if (Math.abs(trend) < 0.005) return 'stable';
      return trend > 0 ? 'accelerating' : 'decelerating';
    } catch {
      return 'stable';
    }
  }

  private analyzeRotation(change: number, volume: number): 'rotating-in' | 'rotating-out' | 'stable' {
    const avgVolume = 5000000; // Approximate average sector ETF volume
    const volumeRatio = volume / avgVolume;
    
    if (change > 1 && volumeRatio > 1.2) return 'rotating-in';
    if (change < -1 && volumeRatio > 1.2) return 'rotating-out';
    return 'stable';
  }

  private estimateMarketCap(symbol: string, price: number): number {
    // Rough estimates for sector ETF market caps (in billions)
    const estimates = {
      'XLK': 65, 'XLV': 35, 'XLF': 40, 'XLE': 15,
      'XLI': 25, 'XLY': 20, 'XLP': 15, 'XLRE': 12,
      'XLB': 8, 'XLU': 15, 'XLC': 18
    };
    
    return (estimates[symbol] || 20) * 1000000000; // Convert to dollars
  }

  private standardDeviation(values: number[]): number {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Mock data methods
   */
  private getMockSP500SparklineData(): SP500SparklineData {
    const basePrice = 4200;
    const data: Array<{timestamp: string, price: number, volume?: number}> = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        timestamp: date.toISOString().split('T')[0],
        price: basePrice + (Math.random() - 0.5) * 50,
        volume: 45000000 + Math.floor(Math.random() * 10000000)
      });
    }

    return {
      data,
      currentPrice: data[data.length - 1].price!,
      weeklyChange: 1.25,
      weeklyTrend: 'up',
      volatility: 'moderate',
      marketSentiment: 'bullish'
    };
  }

  private getMockVixData(): VixData {
    return {
      value: 18.45,
      change: -0.85,
      changePercent: -4.4,
      status: 'low',
      interpretation: 'Low volatility environment suggesting market complacency'
    };
  }

  private getMockSectorData(sectorName: string, symbol: string): EnhancedSectorPerformance {
    return {
      name: sectorName,
      symbol,
      weeklyChange: (Math.random() - 0.5) * 4, // -2% to +2%
      performance: 'neutral',
      momentum: 'stable',
      rotationSignal: 'stable',
      marketCap: 20000000000, // 20B default
      volume: 5000000
    };
  }

  private getMockEnhancedSectorData(): EnhancedSectorPerformance[] {
    return Object.entries(this.sectorETFs).map(([name, symbol]) => 
      this.getMockSectorData(name, symbol)
    );
  }
}