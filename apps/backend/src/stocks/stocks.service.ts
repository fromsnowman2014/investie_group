import { Injectable, Logger } from '@nestjs/common';
import { AIEvaluationService } from '../ai/ai-evaluation.service';
import { TechnicalAnalysisService } from '../ai/technical-analysis.service';
import { NewsService } from '../news/news.service';
import { StockCardData, StockSymbol } from '../common/types';
import {
  StockDataService,
  StockCacheService,
  StockTransformService,
  StockValidationService,
} from './services';

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);

  constructor(
    private readonly stockDataService: StockDataService,
    private readonly stockCacheService: StockCacheService,
    private readonly stockTransformService: StockTransformService,
    private readonly stockValidationService: StockValidationService,
    private readonly aiEvaluationService: AIEvaluationService,
    private readonly technicalAnalysisService: TechnicalAnalysisService,
    private readonly newsService: NewsService,
  ) {}

  async getAllStocks(): Promise<StockCardData[]> {
    const targetSymbols = this.stockValidationService.getSupportedSymbols();

    const stockPromises = targetSymbols.map((symbol) => this.getStock(symbol));
    const results = await Promise.allSettled(stockPromises);

    return results
      .filter(
        (result) => result.status === 'fulfilled' && result.value !== null,
      )
      .map((result) => (result as PromiseFulfilledResult<StockCardData>).value);
  }

  async getStock(symbol: StockSymbol): Promise<StockCardData | null> {
    if (!this.stockValidationService.validateSymbol(symbol)) {
      this.logger.warn(`Invalid stock symbol: ${symbol}`);
      return null;
    }

    try {
      // Check cache first
      const cachedData = await this.stockCacheService.loadStockDataFromCache(symbol);
      let stockData;
      
      if (cachedData && this.stockCacheService.isDataFresh(cachedData.updated_at)) {
        this.logger.log(`Using cached stock data for ${symbol}`);
        stockData = {
          price: cachedData.current_price,
          change: this.stockTransformService.calculateChange(
            cachedData.current_price,
            cachedData.change_percent,
          ),
          changePercent: cachedData.change_percent,
          marketCap: cachedData.market_cap ? parseInt(cachedData.market_cap) : undefined,
          volume: cachedData.volume ? parseInt(cachedData.volume) : undefined,
          pe: cachedData.pe_ratio,
          source: cachedData.source,
        };
      } else {
        // Fetch fresh data
        stockData = await this.stockDataService.getStockData(symbol);
        
        // Cache the fresh data
        if (stockData.source !== 'mock_data') {
          await this.stockCacheService.storeStockDataInCache(symbol, stockData);
        }
      }

      // Fetch all additional data in parallel
      const [aiEvaluation, technicalData, newsData] = await Promise.allSettled([
        this.aiEvaluationService.generateEvaluation(symbol),
        this.technicalAnalysisService.getAnalysis(symbol),
        this.newsService.processStockNews(symbol),
      ]);

      // Extract results with fallbacks
      const evaluation =
        aiEvaluation.status === 'fulfilled'
          ? aiEvaluation.value
          : this.getMockAIEvaluation(symbol);
      const technicals =
        technicalData.status === 'fulfilled'
          ? technicalData.value
          : this.getMockTechnicals();
      const newsSummary =
        newsData.status === 'fulfilled' && newsData.value.isValid
          ? {
              headline:
                newsData.value.overview?.overview || 'No news available',
              sentiment: this.stockTransformService.extractSentimentFromOverview(
                newsData.value.overview,
              ),
              source: newsData.value.overview?.source || 'fallback_data',
            }
          : this.getMockNewsSummary(symbol);

      return this.stockTransformService.transformToStockCardData(
        stockData,
        evaluation,
        technicals,
        newsSummary,
        symbol,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get stock data for ${symbol}: ${error.message}`,
      );
      return null;
    }
  }

  async getStockChart(
    symbol: StockSymbol,
    period: string = '1W',
  ): Promise<any> {
    if (!this.stockValidationService.validateSymbol(symbol)) {
      throw new Error(`Invalid stock symbol: ${symbol}`);
    }
    
    return this.getMockChartData(symbol, period);
  }

  async searchStocks(query: string, limit: number = 10): Promise<any[]> {
    try {
      const allStocks = await this.getAllStocks();

      const filtered = allStocks
        .filter(
          (stock) =>
            stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
            stock.name.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, limit);

      return filtered.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sectorPerformance.name,
        marketCap: stock.fundamentals.marketCap,
        price: stock.price.current,
        change: stock.price.change,
        changePercent: stock.price.changePercent,
      }));
    } catch (error) {
      this.logger.error(`Search failed for query "${query}": ${error.message}`);
      return [];
    }
  }

  async getBatchStocks(
    symbols: StockSymbol[],
  ): Promise<Record<string, StockCardData | null>> {
    try {
      const validSymbols = symbols.filter(symbol => 
        this.stockValidationService.validateSymbol(symbol)
      );

      const stockPromises = validSymbols.map(async (symbol) => {
        try {
          const stock = await this.getStock(symbol);
          return { symbol, stock };
        } catch (error) {
          this.logger.warn(`Failed to fetch ${symbol}: ${error.message}`);
          return { symbol, stock: null };
        }
      });

      const results = await Promise.allSettled(stockPromises);
      const stockData: Record<string, StockCardData | null> = {};

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { symbol, stock } = result.value;
          stockData[symbol] = stock;
        }
      });

      return stockData;
    } catch (error) {
      this.logger.error(`Batch request failed: ${error.message}`);
      throw error;
    }
  }

  // Mock data methods (preserved from original for backward compatibility)
  private getMockAIEvaluation(symbol: StockSymbol) {
    return {
      rating: 'hold' as const,
      confidence: 70,
      summary: `Mock evaluation for ${symbol}. Please configure API keys for real analysis.`,
      keyFactors: [
        'Mock data',
        'API configuration needed',
        'Real-time analysis pending',
      ],
      timeframe: '3M' as const,
      source: 'claude_ai' as const,
      lastUpdated: new Date().toISOString(),
    };
  }

  private getMockTechnicals() {
    return {
      rsi: 50 + Math.random() * 30,
      sma20: 100 + Math.random() * 50,
      sma50: 100 + Math.random() * 50,
      volume: Math.random() * 50000000,
      signals: {
        trend: 'neutral' as const,
        strength: 'moderate' as const,
      },
    };
  }

  private getMockNewsSummary(symbol: StockSymbol) {
    return {
      headline: `Latest ${symbol} market updates and analysis`,
      sentiment: 'neutral' as const,
      source: 'mock_data',
    };
  }

  private getMockChartData(symbol: StockSymbol, period: string) {
    const basePrice = 100;
    const dataPoints = period === '1W' ? 7 : period === '1M' ? 30 : 365;
    const data: any[] = [];

    for (let i = 0; i < dataPoints; i++) {
      const close = basePrice + Math.random() * 10;
      data.push({
        time: new Date(
          Date.now() - (dataPoints - i) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        open: basePrice + Math.random() * 10,
        high: basePrice + Math.random() * 15,
        low: basePrice - Math.random() * 10,
        close,
        volume: Math.random() * 1000000,
      });
    }

    const technicalIndicators = this.calculateTechnicalIndicators(data);

    return {
      symbol,
      period,
      data,
      technicalIndicators,
      source: 'mock_data',
    };
  }

  private calculateTechnicalIndicators(data: any[]) {
    const closePrices = data.map((item) => item.close);

    return {
      movingAverages: {
        ma20: this.calculateMovingAverage(closePrices, 20),
        ma50: this.calculateMovingAverage(closePrices, 50),
      },
      rsi: this.calculateRSI(closePrices),
      volumeProfile: this.calculateVolumeProfile(data),
      bollinger: this.calculateBollingerBands(closePrices, 20),
    };
  }

  private calculateMovingAverage(
    prices: number[],
    period: number,
  ): (number | null)[] {
    const ma: (number | null)[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        ma.push(null);
      } else {
        const sum = prices
          .slice(i - period + 1, i + 1)
          .reduce((a, b) => a + b, 0);
        ma.push(sum / period);
      }
    }

    return ma;
  }

  private calculateRSI(prices: number[], period: number = 14): number[] {
    if (prices.length < period + 1) return [];

    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = period - 1; i < gains.length; i++) {
      if (i === period - 1) {
        const avgGain =
          gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        const avgLoss =
          losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      } else {
        const prevAvgGain =
          rsi.length > 0
            ? gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) /
              period
            : 0;
        const prevAvgLoss =
          rsi.length > 0
            ? losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) /
              period
            : 0;
        const rs = prevAvgLoss === 0 ? 100 : prevAvgGain / prevAvgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }

    const paddedRsi = new Array(period).fill(null).concat(rsi);
    return paddedRsi.slice(0, prices.length);
  }

  private calculateVolumeProfile(data: any[]) {
    const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
    const avgVolume = totalVolume / data.length;

    return {
      totalVolume,
      avgVolume,
      volumeTrend:
        data.slice(-5).reduce((sum, item) => sum + item.volume, 0) / 5 >
        avgVolume
          ? 'above_average'
          : 'below_average',
    };
  }

  private calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDev: number = 2,
  ) {
    const ma = this.calculateMovingAverage(prices, period);
    const upperBand: (number | null)[] = [];
    const lowerBand: (number | null)[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1 || ma[i] === null) {
        upperBand.push(null);
        lowerBand.push(null);
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = ma[i] as number;
        const variance =
          slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
          period;
        const standardDeviation = Math.sqrt(variance);

        upperBand.push(mean + standardDeviation * stdDev);
        lowerBand.push(mean - standardDeviation * stdDev);
      }
    }

    return {
      upperBand,
      lowerBand,
      middleBand: ma,
    };
  }
}