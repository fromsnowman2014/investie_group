import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  private readonly alphaVantageBaseUrl = 'https://www.alphavantage.co/query';

  constructor(private readonly supabaseService: SupabaseService) {}

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
      if (cachedData && this.isDataFresh(cachedData.updated_at)) {
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

  private isDataFresh(updatedAt: string): boolean {
    const now = new Date();
    const dataTime = new Date(updatedAt);
    const diffMinutes = (now.getTime() - dataTime.getTime()) / (1000 * 60);

    // Consider data fresh if it's less than 30 minutes old (market data changes slower)
    return diffMinutes < 30;
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
}
