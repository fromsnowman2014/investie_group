import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SupabaseService } from '../database/supabase.service';
import { FredApiService } from './services/fred-api.service';
import { FearGreedIndexService } from './services/fear-greed-index.service';
import { AlphaVantageService } from './services/alpha-vantage.service';
import { MarketCacheService } from './services/market-cache.service';
import { ScheduledMarketUpdatesService } from './services/scheduled-market-updates.service';
import { YahooFinanceService } from './services/yahoo-finance.service';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  private readonly alphaVantageBaseUrl = 'https://www.alphavantage.co/query';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly fredService: FredApiService,
    private readonly fearGreedService: FearGreedIndexService,
    private readonly alphaVantageService: AlphaVantageService,
    private readonly marketCacheService: MarketCacheService,
    private readonly scheduledUpdatesService: ScheduledMarketUpdatesService,
    private readonly yahooFinanceService: YahooFinanceService,
  ) {}

  async getMarketOverview(): Promise<any> {
    try {
      if (!this.alphaVantageApiKey) {
        this.logger.warn(
          'Alpha Vantage API key not configured, using mock data',
        );
        return this.getMockMarketOverview();
      }

      // Try to load from Supabase cache first
      const cachedData = await this.loadMarketDataFromSupabase();
      if (
        cachedData &&
        this.isDataFresh(cachedData.updated_at, 'market_data')
      ) {
        this.logger.log('Using cached market overview data');
        return {
          indices: cachedData.indices,
          sectors: cachedData.sectors || [],
          marketSentiment: cachedData.market_sentiment || 'neutral',
          volatilityIndex: cachedData.volatility_index || 20,
          source: 'supabase_cache',
        };
      }

      // Fetch fresh data from Alpha Vantage
      const [sp500Data, nasdaqData, dowData] = await Promise.allSettled([
        this.fetchIndexData('SPY'), // S&P 500 ETF
        this.fetchIndexData('QQQ'), // NASDAQ ETF
        this.fetchIndexData('DIA'), // Dow Jones ETF
      ]);

      const marketOverview = {
        indices: {
          sp500: this.extractIndexData(sp500Data, 'S&P 500'),
          nasdaq: this.extractIndexData(nasdaqData, 'NASDAQ'),
          dow: this.extractIndexData(dowData, 'Dow Jones'),
        },
        sectors: await this.fetchSectorData(),
        marketSentiment: this.calculateMarketSentiment([
          sp500Data,
          nasdaqData,
          dowData,
        ]),
        volatilityIndex: await this.fetchVolatilityIndex(),
        source: 'alpha_vantage',
      };

      // Store in Supabase for caching
      await this.storeMarketDataInSupabase(marketOverview);

      return marketOverview;
    } catch (error) {
      this.logger.error('Error fetching market overview:', error.message);
      return this.getMockMarketOverview();
    }
  }

  /**
   * Validate SPY price against real-time data sources
   */
  async validateSPYPrice(price: number): Promise<{
    isValid: boolean;
    actualPrice?: number;
    deviation?: number;
    source: string;
    timestamp: string;
  }> {
    try {
      // Get current price from Yahoo Finance
      const yahooQuote = await this.yahooFinanceService.getQuote('SPY');

      if (!yahooQuote) {
        return {
          isValid: true, // Don't block if validation fails
          source: 'validation_failed',
          timestamp: new Date().toISOString(),
        };
      }

      const actualPrice = yahooQuote.regularMarketPrice;
      const deviation = Math.abs(price - actualPrice);
      const percentDeviation = (deviation / actualPrice) * 100;

      // Consider valid if within 2% of actual price
      const isValid = percentDeviation <= 2;

      if (!isValid) {
        this.logger.warn(
          `⚠️ SPY price validation failed: Provided=${price}, Actual=${actualPrice}, Deviation=${percentDeviation.toFixed(2)}%`,
        );
      }

      return {
        isValid,
        actualPrice,
        deviation: percentDeviation,
        source: 'yahoo_finance',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('SPY price validation error:', error.message);
      return {
        isValid: true, // Don't block on validation errors
        source: 'validation_error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Enhanced Market Summary with all new features
   */
  async getEnhancedMarketSummary(): Promise<any> {
    try {
      // Try to get cached data first (for cost optimization)
      const cachedIntelligence =
        await this.marketCacheService.getCachedMarketIntelligence();
      if (cachedIntelligence) {
        this.logger.log('Using cached enhanced market summary');
        return cachedIntelligence;
      }

      // If no cache or expired, try to get individual cached components
      const [
        fearGreedData,
        economicData,
        sp500SparklineData,
        sectorData,
        vixData,
      ] = await Promise.allSettled([
        this.getCachedOrFetchFearGreed(),
        this.getCachedOrFetchEconomicIndicators(),
        this.getCachedOrFetchSP500Sparkline(),
        this.getCachedOrFetchSectorPerformance(),
        this.getCachedOrFetchVixData(),
      ]);

      // Get SP500 data and validate price
      const sp500Data =
        sp500SparklineData.status === 'fulfilled'
          ? sp500SparklineData.value
          : null;
      let priceValidation: Awaited<
        ReturnType<typeof this.validateSPYPrice>
      > | null = null;

      if (sp500Data?.currentPrice) {
        priceValidation = await this.validateSPYPrice(sp500Data.currentPrice);

        // If price is invalid and we have a better price from validation, update it
        if (
          priceValidation &&
          !priceValidation.isValid &&
          priceValidation.actualPrice
        ) {
          this.logger.log(
            `🔄 Updating SPY price from ${sp500Data.currentPrice} to ${priceValidation.actualPrice} based on validation`,
          );
          sp500Data.currentPrice = priceValidation.actualPrice;

          // Recalculate weekly change with correct current price
          if (sp500Data.data && sp500Data.data.length > 0) {
            const weekAgoPrice = sp500Data.data[0].price;
            sp500Data.weeklyChange =
              ((priceValidation.actualPrice - weekAgoPrice) / weekAgoPrice) *
              100;
          }
        }
      }

      const enhancedSummary = {
        fearGreedIndex:
          fearGreedData.status === 'fulfilled' ? fearGreedData.value : null,
        economicIndicators:
          economicData.status === 'fulfilled' ? economicData.value : null,
        sp500Sparkline: sp500Data,
        sectors: sectorData.status === 'fulfilled' ? sectorData.value : [],
        vix: vixData.status === 'fulfilled' ? vixData.value : null,
        // Legacy data for backward compatibility
        indices: {
          sp500: {
            value: sp500Data?.currentPrice || 4200,
            change: sp500Data?.weeklyChange || 0,
            changePercent: sp500Data?.weeklyChange || 0,
          },
          nasdaq: { value: 13000, change: 0, changePercent: 0 },
          dow: { value: 34000, change: 0, changePercent: 0 },
        },
        marketSentiment: sp500Data?.marketSentiment || 'neutral',
        volatilityIndex:
          vixData.status === 'fulfilled' ? vixData.value.value : 20,
        source: 'enhanced_cache',
        lastUpdated: new Date().toISOString(),
        // Add validation info for debugging
        priceValidation: priceValidation,
      };

      return enhancedSummary;
    } catch (error) {
      this.logger.error(
        'Error fetching enhanced market summary:',
        error.message,
      );
      return this.getFallbackEnhancedSummary();
    }
  }

  /**
   * Get cache-first Fear & Greed data
   */
  private async getCachedOrFetchFearGreed(): Promise<any> {
    const cached =
      await this.marketCacheService.getCachedMarketData('fear_greed_index');
    if (cached) return cached;

    return await this.fearGreedService.calculateFearGreedIndex();
  }

  /**
   * Get cache-first Economic Indicators
   */
  private async getCachedOrFetchEconomicIndicators(): Promise<any> {
    const cached = await this.marketCacheService.getCachedMarketData(
      'economic_indicators',
    );
    if (cached) return cached;

    const [interestRate, cpi, unemployment] = await Promise.allSettled([
      this.fredService.getInterestRateData(),
      this.fredService.getCPIData(),
      this.fredService.getUnemploymentData(),
    ]);

    return {
      interestRate:
        interestRate.status === 'fulfilled' ? interestRate.value : null,
      cpi: cpi.status === 'fulfilled' ? cpi.value : null,
      unemployment:
        unemployment.status === 'fulfilled' ? unemployment.value : null,
    };
  }

  /**
   * Get cache-first S&P 500 Sparkline
   */
  private async getCachedOrFetchSP500Sparkline(): Promise<any> {
    const cached =
      await this.marketCacheService.getCachedMarketData('sp500_sparkline');
    if (cached) return cached;

    return await this.alphaVantageService.getSP500SparklineData();
  }

  /**
   * Get cache-first Sector Performance
   */
  private async getCachedOrFetchSectorPerformance(): Promise<any> {
    const cached =
      await this.marketCacheService.getCachedMarketData('sector_performance');
    if (cached) return cached;

    return await this.alphaVantageService.getEnhancedSectorPerformance();
  }

  /**
   * Get cache-first VIX Data
   */
  private async getCachedOrFetchVixData(): Promise<any> {
    const cached =
      await this.marketCacheService.getCachedMarketData('vix_data');
    if (cached) return cached;

    return await this.alphaVantageService.getEnhancedVixData();
  }

  /**
   * Force update all market data (manual trigger)
   */
  async forceUpdateMarketData(): Promise<any> {
    this.logger.log('🔧 Manual market data update triggered');
    return await this.scheduledUpdatesService.executeImmediateUpdate();
  }

  /**
   * Get market update status
   */
  async getMarketUpdateStatus(): Promise<any> {
    return await this.scheduledUpdatesService.getUpdateStatus();
  }

  async getMarketMovers(): Promise<any> {
    try {
      if (!this.alphaVantageApiKey) {
        this.logger.warn(
          'Alpha Vantage API key not configured, using mock data',
        );
        return this.getMockMarketMovers();
      }

      // Fetch top gainers and losers
      const [gainersData, losersData, activeData] = await Promise.allSettled([
        this.fetchTopGainersLosers('gainers'),
        this.fetchTopGainersLosers('losers'),
        this.fetchMostActive(),
      ]);

      return {
        gainers: gainersData.status === 'fulfilled' ? gainersData.value : [],
        losers: losersData.status === 'fulfilled' ? losersData.value : [],
        mostActive: activeData.status === 'fulfilled' ? activeData.value : [],
        source: 'alpha_vantage',
      };
    } catch (error) {
      this.logger.error('Error fetching market movers:', error.message);
      return this.getMockMarketMovers();
    }
  }

  async getTrendingStocks(): Promise<any> {
    try {
      if (!this.alphaVantageApiKey) {
        this.logger.warn(
          'Alpha Vantage API key not configured, using mock data',
        );
        return this.getMockTrendingStocks();
      }

      // Use most active stocks as trending (Alpha Vantage doesn't have dedicated trending endpoint)
      const trendingData = await this.fetchMostActive();

      return {
        trending: trendingData.map((stock: any) => ({
          ...stock,
          reason: this.generateTrendingReason(stock),
        })),
        source: 'alpha_vantage',
      };
    } catch (error) {
      this.logger.error('Error fetching trending stocks:', error.message);
      return this.getMockTrendingStocks();
    }
  }

  // Alpha Vantage API methods
  private async fetchIndexData(symbol: string): Promise<any> {
    try {
      const response = await axios.get(this.alphaVantageBaseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.alphaVantageApiKey,
        },
        timeout: 10000,
      });

      return response.data['Global Quote'];
    } catch (error) {
      this.logger.error(
        `Error fetching index data for ${symbol}:`,
        error.message,
      );
      return null;
    }
  }

  private async fetchTopGainersLosers(
    type: 'gainers' | 'losers',
  ): Promise<any[]> {
    try {
      const response = await axios.get(this.alphaVantageBaseUrl, {
        params: {
          function: 'TOP_GAINERS_LOSERS',
          apikey: this.alphaVantageApiKey,
        },
        timeout: 15000,
      });

      const data = response.data[`top_${type}`] || [];
      return data.slice(0, 5).map((item: any) => ({
        symbol: item.ticker,
        name: item.ticker, // Alpha Vantage doesn't provide company names in this endpoint
        change: parseFloat(item.change_amount),
        changePercent: parseFloat(item.change_percentage.replace('%', '')),
      }));
    } catch (error) {
      this.logger.error(`Error fetching ${type}:`, error.message);
      return [];
    }
  }

  private async fetchMostActive(): Promise<any[]> {
    try {
      const response = await axios.get(this.alphaVantageBaseUrl, {
        params: {
          function: 'TOP_GAINERS_LOSERS',
          apikey: this.alphaVantageApiKey,
        },
        timeout: 15000,
      });

      const data = response.data.most_actively_traded || [];
      return data.slice(0, 5).map((item: any) => ({
        symbol: item.ticker,
        name: item.ticker,
        volume: parseInt(item.volume),
        change: parseFloat(item.change_amount),
        changePercent: parseFloat(item.change_percentage.replace('%', '')),
      }));
    } catch (error) {
      this.logger.error('Error fetching most active stocks:', error.message);
      return [];
    }
  }

  private async fetchSectorData(): Promise<any[]> {
    try {
      const response = await axios.get(this.alphaVantageBaseUrl, {
        params: {
          function: 'SECTOR',
          apikey: this.alphaVantageApiKey,
        },
        timeout: 10000,
      });

      const rankingData = response.data['Rank A: Real-Time Performance'] || {};
      return Object.entries(rankingData)
        .slice(0, 8)
        .map(([name, change]: [string, any]) => ({
          name: name.replace(/\s+/g, ' ').trim(),
          change: parseFloat(change.replace('%', '')),
          performance:
            parseFloat(change.replace('%', '')) > 0 ? 'positive' : 'negative',
        }));
    } catch (error) {
      this.logger.error('Error fetching sector data:', error.message);
      return this.getMockSectorData();
    }
  }

  private async fetchVolatilityIndex(): Promise<number> {
    try {
      // VIX data from Alpha Vantage (if available)
      const response = await axios.get(this.alphaVantageBaseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: 'VIX',
          apikey: this.alphaVantageApiKey,
        },
        timeout: 10000,
      });

      const vixData = response.data['Global Quote'];
      return parseFloat(vixData['05. price']) || 20;
    } catch (error) {
      this.logger.warn('Could not fetch VIX data, using default value');
      return 20; // Default VIX value
    }
  }

  // Helper methods
  private extractIndexData(indexData: any, indexName: string): any {
    if (indexData.status !== 'fulfilled' || !indexData.value) {
      return { value: 0, change: 0, changePercent: 0 };
    }

    const data = indexData.value;
    return {
      value: parseFloat(data['05. price']) || 0,
      change: parseFloat(data['09. change']) || 0,
      changePercent:
        parseFloat(data['10. change percent']?.replace('%', '')) || 0,
    };
  }

  private calculateMarketSentiment(indexData: any[]): string {
    const positiveCount = indexData.filter(
      (data) =>
        data.status === 'fulfilled' &&
        data.value &&
        parseFloat(data.value['09. change']) > 0,
    ).length;

    if (positiveCount >= 2) return 'bullish';
    if (positiveCount === 1) return 'neutral';
    return 'bearish';
  }

  private generateTrendingReason(stock: any): string {
    if (Math.abs(stock.changePercent) > 5) {
      return stock.changePercent > 0
        ? 'Strong momentum'
        : 'Heavy selling pressure';
    }
    if (stock.volume > 50000000) {
      return 'High trading volume';
    }
    return 'Market activity';
  }

  // Supabase storage methods
  private async loadMarketDataFromSupabase(): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('market_indicators')
        .select('*')
        .eq('date', today)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      this.logger.warn(
        'Failed to load market data from Supabase:',
        error.message,
      );
      return null;
    }
  }

  private async storeMarketDataInSupabase(marketData: any): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('market_indicators').upsert(
        {
          date: today,
          indices: marketData.indices,
          sectors: marketData.sectors,
          market_sentiment: marketData.marketSentiment,
          volatility_index: marketData.volatilityIndex,
          source: 'alpha_vantage',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'date',
        },
      );

      if (error) {
        this.logger.error('Failed to store market data in Supabase:', error);
      } else {
        this.logger.log('Market data stored successfully in Supabase');
      }
    } catch (error) {
      this.logger.error('Supabase store error for market data:', error.message);
    }
  }

  private isDataFresh(updatedAt: string, dataType?: string): boolean {
    const now = new Date();
    const dataTime = new Date(updatedAt);
    const diffMinutes = (now.getTime() - dataTime.getTime()) / (1000 * 60);

    // Dynamic freshness based on data type and market hours
    const isMarketHours = this.isMarketHours();

    // Different freshness thresholds based on data type
    let freshnessThreshold = 30; // Default 30 minutes

    if (dataType === 'sp500' || dataType === 'market_data') {
      freshnessThreshold = isMarketHours ? 5 : 15; // 5 minutes during market hours, 15 minutes after hours
    } else if (dataType === 'sector_data') {
      freshnessThreshold = isMarketHours ? 15 : 30; // 15 minutes during market hours, 30 minutes after hours
    }

    return diffMinutes < freshnessThreshold;
  }

  private isMarketHours(): boolean {
    const now = new Date();
    const easternTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
    );
    const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = easternTime.getHours();
    const minute = easternTime.getMinutes();

    // Market is open Monday-Friday (1-5), 9:30 AM - 4:00 PM EST
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false; // Weekend
    }

    const timeInMinutes = hour * 60 + minute;
    const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM
    const marketCloseMinutes = 16 * 60; // 4:00 PM

    return (
      timeInMinutes >= marketOpenMinutes && timeInMinutes <= marketCloseMinutes
    );
  }

  // Mock data methods (fallbacks)
  private getMockMarketOverview(): any {
    return {
      indices: {
        sp500: { value: 4150.23, change: 12.45, changePercent: 0.3 },
        nasdaq: { value: 12850.67, change: -23.12, changePercent: -0.18 },
        dow: { value: 34250.89, change: 45.67, changePercent: 0.13 },
      },
      sectors: this.getMockSectorData(),
      marketSentiment: 'neutral',
      volatilityIndex: 18.45,
      source: 'mock_data',
    };
  }

  private getMockSectorData(): any[] {
    return [
      { name: 'Technology', change: 0.25, performance: 'positive' },
      { name: 'Healthcare', change: -0.15, performance: 'negative' },
      { name: 'Energy', change: 1.23, performance: 'positive' },
      { name: 'Financial', change: 0.45, performance: 'positive' },
    ];
  }

  private getMockMarketMovers(): any {
    return {
      gainers: [
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corporation',
          change: 5.25,
          changePercent: 3.45,
        },
        {
          symbol: 'AMD',
          name: 'Advanced Micro Devices',
          change: 4.12,
          changePercent: 2.87,
        },
        {
          symbol: 'TSLA',
          name: 'Tesla, Inc.',
          change: 8.9,
          changePercent: 3.62,
        },
      ],
      losers: [
        {
          symbol: 'META',
          name: 'Meta Platforms',
          change: -6.78,
          changePercent: -2.31,
        },
        {
          symbol: 'NFLX',
          name: 'Netflix, Inc.',
          change: -12.45,
          changePercent: -2.74,
        },
        {
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          change: -3.21,
          changePercent: -2.31,
        },
      ],
      mostActive: [
        { symbol: 'AAPL', name: 'Apple Inc.', volume: 45230000 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', volume: 38920000 },
        { symbol: 'AMZN', name: 'Amazon.com, Inc.', volume: 42110000 },
      ],
      source: 'mock_data',
    };
  }

  private getMockTrendingStocks(): any {
    return {
      trending: [
        {
          symbol: 'AI',
          name: 'C3.ai, Inc.',
          change: 15.67,
          changePercent: 8.45,
          volume: 12340000,
          reason: 'AI sector momentum',
        },
        {
          symbol: 'PLTR',
          name: 'Palantir Technologies',
          change: 2.34,
          changePercent: 4.12,
          volume: 8920000,
          reason: 'Government contract wins',
        },
      ],
      source: 'mock_data',
    };
  }

  /**
   * Fallback enhanced summary when all services fail
   */
  private getFallbackEnhancedSummary(): any {
    return {
      fearGreedIndex: {
        value: 52,
        status: 'neutral',
        confidence: 60,
        components: {
          marketVolatility: 50,
          marketVolume: 50,
          marketMomentum: 55,
          stockPriceBreadth: 50,
          safehavenDemand: 50,
          junkBondDemand: 50,
          putCallRatio: 52,
        },
        methodology: 'Fallback calculation due to API limitations',
        lastUpdated: new Date().toISOString(),
        source: 'calculated',
      },
      economicIndicators: {
        interestRate: {
          value: 4.25,
          previousValue: 4.1,
          change: 0.15,
          percentChange: 3.66,
          basisPointsChange: 15,
          date: new Date().toISOString().split('T')[0],
          trend: 'rising',
          source: 'fred_api',
        },
        cpi: {
          value: 307.2,
          previousValue: 306.8,
          change: 0.4,
          percentChange: 0.13,
          monthOverMonth: 0.13,
          yearOverYear: 3.2,
          date: new Date().toISOString().split('T')[0],
          trend: 'rising',
          direction: 'up',
          inflationPressure: 'moderate',
          source: 'fred_api',
        },
        unemployment: {
          value: 3.8,
          previousValue: 3.9,
          change: -0.1,
          percentChange: -2.56,
          monthOverMonth: -0.1,
          date: new Date().toISOString().split('T')[0],
          trend: 'falling',
          employmentHealth: 'strong',
          source: 'fred_api',
        },
      },
      sp500Sparkline: {
        data: this.getMockSparklineData(),
        currentPrice: 4200,
        weeklyChange: 1.25,
        weeklyTrend: 'up',
        volatility: 'moderate',
        marketSentiment: 'bullish',
      },
      sectors: [
        {
          name: 'Technology',
          symbol: 'XLK',
          weeklyChange: 0.25,
          performance: 'neutral',
          momentum: 'stable',
          rotationSignal: 'stable',
          marketCap: 65000000000,
          volume: 5000000,
        },
        {
          name: 'Healthcare',
          symbol: 'XLV',
          weeklyChange: -0.15,
          performance: 'neutral',
          momentum: 'stable',
          rotationSignal: 'stable',
          marketCap: 35000000000,
          volume: 3000000,
        },
        {
          name: 'Financial Services',
          symbol: 'XLF',
          weeklyChange: 0.45,
          performance: 'neutral',
          momentum: 'stable',
          rotationSignal: 'stable',
          marketCap: 40000000000,
          volume: 4000000,
        },
        {
          name: 'Energy',
          symbol: 'XLE',
          weeklyChange: 1.23,
          performance: 'outperforming',
          momentum: 'stable',
          rotationSignal: 'stable',
          marketCap: 15000000000,
          volume: 2000000,
        },
      ],
      vix: {
        value: 18.45,
        change: -0.85,
        changePercent: -4.4,
        status: 'low',
        interpretation:
          'Low volatility environment suggesting market complacency',
      },
      // Legacy compatibility
      indices: {
        sp500: { value: 4200, change: 12.45, changePercent: 0.3 },
        nasdaq: { value: 13000, change: -23.12, changePercent: -0.18 },
        dow: { value: 34000, change: 45.67, changePercent: 0.13 },
      },
      marketSentiment: 'neutral',
      volatilityIndex: 18.45,
      source: 'enhanced_fallback',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Mock sparkline data
   */
  private getMockSparklineData(): Array<{
    timestamp: string;
    price: number;
    volume?: number;
  }> {
    const basePrice = 4200;
    const data: Array<{ timestamp: string; price: number; volume?: number }> =
      [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        timestamp: date.toISOString().split('T')[0],
        price: basePrice + (Math.random() - 0.5) * 50,
        volume: 45000000 + Math.floor(Math.random() * 10000000),
      });
    }

    return data;
  }
}
