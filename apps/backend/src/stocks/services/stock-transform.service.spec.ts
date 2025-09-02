import { Test, TestingModule } from '@nestjs/testing';
import { StockTransformService } from './stock-transform.service';
import { StockPriceData } from '../interfaces';

describe('StockTransformService', () => {
  let service: StockTransformService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockTransformService],
    }).compile();

    service = module.get<StockTransformService>(StockTransformService);
  });

  describe('transformToStockCardData', () => {
    it('should transform data correctly', () => {
      const stockData: StockPriceData = {
        price: 150.50,
        change: 2.25,
        changePercent: 1.5,
        pe: 25.5,
        marketCap: 2400000000000,
        volume: 50000000,
        fiftyTwoWeekHigh: 180.00,
        fiftyTwoWeekLow: 120.00,
        source: 'alpha_vantage',
      };

      const aiEvaluation = {
        rating: 'buy',
        confidence: 85,
        summary: 'Strong buy',
        keyFactors: ['Growth', 'Market position'],
        timeframe: '3M',
        source: 'claude_ai',
        lastUpdated: new Date().toISOString(),
      };

      const technicals = {
        rsi: 65,
        sma20: 150,
        sma50: 145,
        volume: 50000000,
        signals: { trend: 'bullish', strength: 'strong' },
      };

      const newsSummary = {
        headline: 'Strong earnings report',
        sentiment: 'positive',
        source: 'claude_ai_analysis',
      };

      const result = service.transformToStockCardData(
        stockData,
        aiEvaluation,
        technicals,
        newsSummary,
        'AAPL'
      );

      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.name).toBe('Apple Inc.');
      expect(result.price.current).toBe(150.50);
      expect(result.price.change).toBe(2.25);
      expect(result.price.changePercent).toBe(1.5);
      expect(result.fundamentals.pe).toBe(25.5);
      expect(result.fundamentals.marketCap).toBe(2400000000000);
      expect(result.aiEvaluation).toEqual(aiEvaluation);
      expect(result.technicals).toEqual(technicals);
      expect(result.newsSummary).toEqual(newsSummary);
    });

    it('should use fallback values when data is missing', () => {
      const stockData: StockPriceData = {
        price: 150.50,
        change: 2.25,
        changePercent: 1.5,
        source: 'mock_data',
      };

      const result = service.transformToStockCardData(
        stockData,
        {},
        {},
        {},
        'TSLA'
      );

      expect(result.symbol).toBe('TSLA');
      expect(result.name).toBe('Tesla, Inc.');
      expect(result.fundamentals.pe).toBe(20);
      expect(result.fundamentals.marketCap).toBe(1000000000);
      expect(result.fundamentals.fiftyTwoWeekHigh).toBe(120);
      expect(result.fundamentals.fiftyTwoWeekLow).toBe(80);
    });
  });

  describe('getCompanyName', () => {
    it('should return correct company names for supported symbols', () => {
      expect(service.getCompanyName('AAPL')).toBe('Apple Inc.');
      expect(service.getCompanyName('TSLA')).toBe('Tesla, Inc.');
      expect(service.getCompanyName('MSFT')).toBe('Microsoft Corporation');
      expect(service.getCompanyName('GOOGL')).toBe('Alphabet Inc.');
    });

    it('should return symbol when company name not found', () => {
      expect(service.getCompanyName('UNKNOWN' as any)).toBe('UNKNOWN');
    });
  });

  describe('getSectorName', () => {
    it('should return correct sector names', () => {
      expect(service.getSectorName('AAPL')).toBe('Technology');
      expect(service.getSectorName('TSLA')).toBe('Automotive');
      expect(service.getSectorName('AMZN')).toBe('Consumer Discretionary');
      expect(service.getSectorName('NFLX')).toBe('Communication Services');
    });

    it('should return Technology as default sector', () => {
      expect(service.getSectorName('UNKNOWN' as any)).toBe('Technology');
    });
  });

  describe('extractSentimentFromOverview', () => {
    it('should return positive sentiment for positive keywords', () => {
      const overview1 = { overview: 'This is a positive buy recommendation' };
      const overview2 = { overview: 'Strong bullish signals detected' };
      
      expect(service.extractSentimentFromOverview(overview1)).toBe('positive');
      expect(service.extractSentimentFromOverview(overview2)).toBe('positive');
    });

    it('should return negative sentiment for negative keywords', () => {
      const overview1 = { overview: 'This is a negative sell signal' };
      const overview2 = { overview: 'Bearish trend continues' };
      
      expect(service.extractSentimentFromOverview(overview1)).toBe('negative');
      expect(service.extractSentimentFromOverview(overview2)).toBe('negative');
    });

    it('should return neutral sentiment by default', () => {
      const overview1 = { overview: 'Regular market activity' };
      const overview2 = null;
      const overview3 = {};
      
      expect(service.extractSentimentFromOverview(overview1)).toBe('neutral');
      expect(service.extractSentimentFromOverview(overview2)).toBe('neutral');
      expect(service.extractSentimentFromOverview(overview3)).toBe('neutral');
    });
  });

  describe('parseMarketCap', () => {
    it('should parse trillion dollar market caps', () => {
      expect(service.parseMarketCap('2.4T')).toBe(2.4e12);
      expect(service.parseMarketCap('1.5T')).toBe(1.5e12);
    });

    it('should parse billion dollar market caps', () => {
      expect(service.parseMarketCap('500B')).toBe(500e9);
      expect(service.parseMarketCap('50.5B')).toBe(50.5e9);
    });

    it('should parse million dollar market caps', () => {
      expect(service.parseMarketCap('100M')).toBe(100e6);
      expect(service.parseMarketCap('25.5M')).toBe(25.5e6);
    });

    it('should return 0 for invalid formats', () => {
      expect(service.parseMarketCap('None')).toBe(0);
      expect(service.parseMarketCap('')).toBe(0);
      expect(service.parseMarketCap(null as any)).toBe(0);
      expect(service.parseMarketCap(undefined as any)).toBe(0);
    });
  });

  describe('calculateChange', () => {
    it('should calculate change correctly', () => {
      expect(service.calculateChange(100, 5)).toBe(5);
      expect(service.calculateChange(200, 2.5)).toBe(5);
      expect(service.calculateChange(150, -3)).toBe(-4.5);
    });
  });
});