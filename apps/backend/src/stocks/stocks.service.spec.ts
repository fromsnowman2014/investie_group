import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { StocksService } from './stocks.service';
import { AIEvaluationService } from '../ai/ai-evaluation.service';
import { TechnicalAnalysisService } from '../ai/technical-analysis.service';
import { NewsService } from '../news/news.service';
import { SupabaseService } from '../database/supabase.service';
import {
  StockDataService,
  StockCacheService,
  StockTransformService,
  StockValidationService,
} from './services';

describe('StocksService', () => {
  let service: StocksService;
  let stockDataService: jest.Mocked<StockDataService>;
  let stockCacheService: jest.Mocked<StockCacheService>;
  let stockTransformService: jest.Mocked<StockTransformService>;
  let stockValidationService: jest.Mocked<StockValidationService>;
  let aiEvaluationService: jest.Mocked<AIEvaluationService>;
  let technicalAnalysisService: jest.Mocked<TechnicalAnalysisService>;
  let newsService: jest.Mocked<NewsService>;

  beforeEach(async () => {
    const mockStockDataService = {
      getStockData: jest.fn(),
      getAlphaVantageQuote: jest.fn(),
      getAlphaVantageOverview: jest.fn(),
    };

    const mockStockCacheService = {
      loadStockDataFromCache: jest.fn(),
      storeStockDataInCache: jest.fn(),
      isDataFresh: jest.fn(),
    };

    const mockStockTransformService = {
      transformToStockCardData: jest.fn(),
      getCompanyName: jest.fn(),
      getSectorName: jest.fn(),
      extractSentimentFromOverview: jest.fn(),
      parseMarketCap: jest.fn(),
      calculateChange: jest.fn(),
    };

    const mockStockValidationService = {
      validateSymbol: jest.fn(),
      validateStockData: jest.fn(),
      isValidMarketCapFormat: jest.fn(),
      getSupportedSymbols: jest.fn().mockReturnValue(['AAPL', 'TSLA', 'MSFT']),
    };

    const mockAIEvaluationService = {
      generateEvaluation: jest.fn(),
    };

    const mockTechnicalAnalysisService = {
      getAnalysis: jest.fn(),
    };

    const mockNewsService = {
      processStockNews: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({
          ttl: 300,
          max: 100,
        }),
      ],
      providers: [
        StocksService,
        {
          provide: StockDataService,
          useValue: mockStockDataService,
        },
        {
          provide: StockCacheService,
          useValue: mockStockCacheService,
        },
        {
          provide: StockTransformService,
          useValue: mockStockTransformService,
        },
        {
          provide: StockValidationService,
          useValue: mockStockValidationService,
        },
        {
          provide: AIEvaluationService,
          useValue: mockAIEvaluationService,
        },
        {
          provide: TechnicalAnalysisService,
          useValue: mockTechnicalAnalysisService,
        },
        {
          provide: NewsService,
          useValue: mockNewsService,
        },
      ],
    }).compile();

    service = module.get<StocksService>(StocksService);
    stockDataService = module.get(StockDataService);
    stockCacheService = module.get(StockCacheService);
    stockTransformService = module.get(StockTransformService);
    stockValidationService = module.get(StockValidationService);
    aiEvaluationService = module.get(AIEvaluationService);
    technicalAnalysisService = module.get(TechnicalAnalysisService);
    newsService = module.get(NewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllStocks', () => {
    it('should return array of stock data', async () => {
      const mockStockCardData = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: { current: 150, change: 2.5, changePercent: 1.5, source: 'google_finance' },
        fundamentals: { pe: 25, marketCap: 2000000000000, volume: 50000000, fiftyTwoWeekHigh: 180, fiftyTwoWeekLow: 120 },
        aiEvaluation: { rating: 'buy', confidence: 85, summary: 'Strong buy' },
        technicals: { rsi: 65, signals: { trend: 'bullish', strength: 'strong' } },
        newsSummary: { headline: 'Strong earnings', sentiment: 'positive', source: 'claude_ai' },
        sectorPerformance: { name: 'Technology', weeklyChange: 2.5 },
      };

      // Mock the services
      stockValidationService.validateSymbol.mockReturnValue(true);
      stockCacheService.loadStockDataFromCache.mockResolvedValue(null);
      stockDataService.getStockData.mockResolvedValue({
        price: 150,
        change: 2.5,
        changePercent: 1.5,
        source: 'mock_data',
      });
      stockTransformService.transformToStockCardData.mockReturnValue(mockStockCardData);
      
      aiEvaluationService.generateEvaluation.mockResolvedValue({
        rating: 'buy',
        confidence: 85,
        summary: 'Strong buy recommendation',
        keyFactors: ['Strong growth', 'Market leadership'],
        timeframe: '3M',
        source: 'claude_ai',
        lastUpdated: new Date().toISOString(),
      });

      technicalAnalysisService.getAnalysis.mockResolvedValue({
        rsi: 65,
        sma20: 150,
        sma50: 145,
        volume: 50000000,
        signals: {
          trend: 'bullish',
          strength: 'strong',
        },
      });

      newsService.processStockNews.mockResolvedValue({
        isValid: true,
        symbol: 'AAPL',
        overview: {
          symbol: 'AAPL',
          overview: 'Strong earnings report',
          recommendation: 'BUY',
          confidence: 90,
          keyFactors: ['Revenue growth', 'Market expansion'],
          riskLevel: 'LOW',
          timeHorizon: '3-6 months',
          source: 'claude_ai_analysis',
          timestamp: new Date().toISOString(),
        },
      });

      const result = await service.getAllStocks();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check structure of first stock
      if (result.length > 0) {
        const stock = result[0];
        expect(stock.symbol).toBeDefined();
        expect(stock.name).toBeDefined();
        expect(stock.price).toBeDefined();
        expect(stock.price.current).toBeDefined();
        expect(stock.fundamentals).toBeDefined();
        expect(stock.aiEvaluation).toBeDefined();
      }
    });
  });

  describe('getStock', () => {
    it('should return stock data for valid symbol', async () => {
      const mockSymbol = 'AAPL';
      const mockStockCardData = {
        symbol: mockSymbol,
        name: 'Apple Inc.',
        price: { current: 150, change: 2.5, changePercent: 1.5, source: 'google_finance' },
        fundamentals: { pe: 25, marketCap: 2000000000000, volume: 50000000, fiftyTwoWeekHigh: 180, fiftyTwoWeekLow: 120 },
        aiEvaluation: { rating: 'buy', confidence: 85, summary: 'Strong buy' },
        technicals: { rsi: 65, signals: { trend: 'bullish', strength: 'strong' } },
        newsSummary: { headline: 'Strong earnings', sentiment: 'positive', source: 'claude_ai' },
        sectorPerformance: { name: 'Technology', weeklyChange: 2.5 },
      };

      // Mock the services
      stockValidationService.validateSymbol.mockReturnValue(true);
      stockCacheService.loadStockDataFromCache.mockResolvedValue(null);
      stockDataService.getStockData.mockResolvedValue({
        price: 150,
        change: 2.5,
        changePercent: 1.5,
        source: 'mock_data',
      });
      stockTransformService.extractSentimentFromOverview.mockReturnValue('positive');
      stockTransformService.transformToStockCardData.mockReturnValue(mockStockCardData);

      // Mock successful responses
      aiEvaluationService.generateEvaluation.mockResolvedValue({
        rating: 'buy',
        confidence: 85,
        summary: 'Strong buy recommendation',
        keyFactors: ['Strong growth', 'Market leadership'],
        timeframe: '3M',
        source: 'claude_ai',
        lastUpdated: new Date().toISOString(),
      });

      technicalAnalysisService.getAnalysis.mockResolvedValue({
        rsi: 65,
        sma20: 150,
        sma50: 145,
        volume: 50000000,
        signals: {
          trend: 'bullish',
          strength: 'strong',
        },
      });

      newsService.processStockNews.mockResolvedValue({
        isValid: true,
        symbol: mockSymbol,
        overview: {
          symbol: mockSymbol,
          overview: 'Strong earnings report',
          recommendation: 'BUY',
          confidence: 90,
          keyFactors: ['Revenue growth'],
          riskLevel: 'LOW',
          timeHorizon: '3-6 months',
          source: 'claude_ai_analysis',
          timestamp: new Date().toISOString(),
        },
      });

      const result = await service.getStock(mockSymbol);

      expect(result).toBeDefined();
      expect(result.symbol).toBe(mockSymbol);
      expect(result.name).toBe('Apple Inc.');
      expect(result.price).toBeDefined();
      expect(result.aiEvaluation).toBeDefined();
      expect(result.technicals).toBeDefined();
      expect(result.newsSummary).toBeDefined();
    });

    it('should handle service failures gracefully', async () => {
      const mockSymbol = 'TSLA';
      const mockStockCardData = {
        symbol: mockSymbol,
        name: 'Tesla, Inc.',
        price: { current: 245, change: -1.5, changePercent: -0.6, source: 'google_finance' },
        fundamentals: { pe: 30, marketCap: 800000000000, volume: 30000000, fiftyTwoWeekHigh: 300, fiftyTwoWeekLow: 200 },
        aiEvaluation: { rating: 'hold', confidence: 70, summary: 'Mock evaluation' },
        technicals: { rsi: 55, signals: { trend: 'neutral', strength: 'moderate' } },
        newsSummary: { headline: 'Latest TSLA updates', sentiment: 'neutral', source: 'mock_data' },
        sectorPerformance: { name: 'Automotive', weeklyChange: -0.5 },
      };

      // Mock the services
      stockValidationService.validateSymbol.mockReturnValue(true);
      stockCacheService.loadStockDataFromCache.mockResolvedValue(null);
      stockDataService.getStockData.mockResolvedValue({
        price: 245,
        change: -1.5,
        changePercent: -0.6,
        source: 'mock_data',
      });
      stockTransformService.extractSentimentFromOverview.mockReturnValue('neutral');
      stockTransformService.transformToStockCardData.mockReturnValue(mockStockCardData);

      // Mock service failures
      aiEvaluationService.generateEvaluation.mockRejectedValue(
        new Error('AI service unavailable'),
      );
      technicalAnalysisService.getAnalysis.mockRejectedValue(
        new Error('Technical analysis failed'),
      );
      newsService.processStockNews.mockRejectedValue(
        new Error('News service error'),
      );

      const result = await service.getStock(mockSymbol);

      expect(result).toBeDefined();
      expect(result.symbol).toBe(mockSymbol);
      // Should still return mock/fallback data
      expect(result.price).toBeDefined();
      expect(result.aiEvaluation).toBeDefined();
    });
  });

  describe('getStockChart', () => {
    it('should return chart data for valid symbol and period', async () => {
      stockValidationService.validateSymbol.mockReturnValue(true);
      
      const result = await service.getStockChart('AAPL', '1W');

      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.period).toBe('1W');
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.source).toBe('mock_data');
    });

    it('should handle different time periods', async () => {
      stockValidationService.validateSymbol.mockReturnValue(true);
      const periods = ['1W', '1M', '3M', '1Y'];

      for (const period of periods) {
        const result = await service.getStockChart('AAPL', period);
        expect(result.period).toBe(period);
        expect(result.data.length).toBeGreaterThan(0);
      }
    });
  });
});
