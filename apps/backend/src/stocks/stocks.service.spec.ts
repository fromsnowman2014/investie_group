import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { StocksService } from './stocks.service';
import { AIEvaluationService } from '../ai/ai-evaluation.service';
import { TechnicalAnalysisService } from '../ai/technical-analysis.service';
import { NewsService } from '../news/news.service';

describe('StocksService', () => {
  let service: StocksService;
  let aiEvaluationService: jest.Mocked<AIEvaluationService>;
  let technicalAnalysisService: jest.Mocked<TechnicalAnalysisService>;
  let newsService: jest.Mocked<NewsService>;

  beforeEach(async () => {
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
    aiEvaluationService = module.get(AIEvaluationService);
    technicalAnalysisService = module.get(TechnicalAnalysisService);
    newsService = module.get(NewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllStocks', () => {
    it('should return array of stock data', async () => {
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
      
      // Mock service failures
      aiEvaluationService.generateEvaluation.mockRejectedValue(new Error('AI service unavailable'));
      technicalAnalysisService.getAnalysis.mockRejectedValue(new Error('Technical analysis failed'));
      newsService.processStockNews.mockRejectedValue(new Error('News service error'));

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
      const result = await service.getStockChart('AAPL', '1W');

      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.period).toBe('1W');
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.source).toBe('mock_data');
    });

    it('should handle different time periods', async () => {
      const periods = ['1W', '1M', '3M', '1Y'];
      
      for (const period of periods) {
        const result = await service.getStockChart('AAPL', period);
        expect(result.period).toBe(period);
        expect(result.data.length).toBeGreaterThan(0);
      }
    });
  });
});