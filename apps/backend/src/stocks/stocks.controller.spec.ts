import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { StockSymbol, StockCardData } from '../common/types';

describe('StocksController', () => {
  let controller: StocksController;
  let service: StocksService;

  // Mock stock data for testing
  const mockStockData: StockCardData = {
    symbol: 'AAPL' as StockSymbol,
    name: 'Apple Inc.',
    price: {
      current: 150.25,
      change: 2.45,
      changePercent: 1.66,
      source: 'mock'
    },
    fundamentals: {
      pe: 25.5,
      marketCap: 2500000000000,
      volume: 45000000,
      fiftyTwoWeekHigh: 180.0,
      fiftyTwoWeekLow: 120.0
    },
    aiEvaluation: {
      rating: 'buy',
      confidence: 85,
      summary: 'Strong performance expected',
      keyFactors: ['Innovation', 'Market position'],
      timeframe: '3M',
      source: 'claude_ai',
      lastUpdated: new Date().toISOString()
    },
    technicals: {
      rsi: 62.5,
      sma20: 148.3,
      sma50: 145.1,
      volume: 45000000,
      signals: {
        trend: 'bullish',
        strength: 'moderate'
      }
    },
    newsSummary: {
      headline: 'Apple reports strong quarterly results',
      sentiment: 'positive',
      source: 'financial_news'
    },
    sectorPerformance: {
      name: 'Technology',
      weeklyChange: 3.2
    }
  };

  const mockSearchResults = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      marketCap: 2500000000000,
      price: 150.25,
      change: 2.45,
      changePercent: 1.66
    }
  ];

  const mockStocksService = {
    getAllStocks: jest.fn(),
    getStock: jest.fn(),
    getStockChart: jest.fn(),
    searchStocks: jest.fn(),
    getBatchStocks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StocksController],
      providers: [
        {
          provide: StocksService,
          useValue: mockStocksService,
        },
      ],
    }).compile();

    controller = module.get<StocksController>(StocksController);
    service = module.get<StocksService>(StocksService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllStocks', () => {
    it('should return all stocks with success response', async () => {
      const mockStocks = [mockStockData];
      mockStocksService.getAllStocks.mockResolvedValue(mockStocks);

      const result = await controller.getAllStocks();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStocks);
      expect(result.count).toBe(1);
      expect(result.timestamp).toBeDefined();
      expect(mockStocksService.getAllStocks).toHaveBeenCalledWith();
    });

    it('should handle service errors', async () => {
      mockStocksService.getAllStocks.mockRejectedValue(new Error('Service error'));

      await expect(controller.getAllStocks()).rejects.toThrow(HttpException);
      expect(mockStocksService.getAllStocks).toHaveBeenCalledWith();
    });
  });

  describe('getStock', () => {
    it('should return stock data for valid symbol', async () => {
      mockStocksService.getStock.mockResolvedValue(mockStockData);

      const result = await controller.getStock('AAPL');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStockData);
      expect(result.timestamp).toBeDefined();
      expect(mockStocksService.getStock).toHaveBeenCalledWith('AAPL');
    });

    it('should reject invalid symbol format', async () => {
      await expect(controller.getStock('INVALID123'))
        .rejects
        .toThrow(HttpException);
      
      expect(mockStocksService.getStock).not.toHaveBeenCalled();
    });

    it('should handle stock not found', async () => {
      mockStocksService.getStock.mockResolvedValue(null);

      await expect(controller.getStock('XXXX'))
        .rejects
        .toThrow(HttpException);
    });

    it('should handle service errors', async () => {
      mockStocksService.getStock.mockRejectedValue(new Error('Service error'));

      await expect(controller.getStock('AAPL'))
        .rejects
        .toThrow(HttpException);
    });
  });

  describe('searchStocks', () => {
    it('should return search results for valid query', async () => {
      mockStocksService.searchStocks.mockResolvedValue(mockSearchResults);

      const result = await controller.searchStocks('apple', '5');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSearchResults);
      expect(result.count).toBe(1);
      expect(result.query).toBe('apple');
      expect(result.timestamp).toBeDefined();
      expect(mockStocksService.searchStocks).toHaveBeenCalledWith('apple', 5);
    });

    it('should use default limit when not provided', async () => {
      mockStocksService.searchStocks.mockResolvedValue(mockSearchResults);

      await controller.searchStocks('apple');

      expect(mockStocksService.searchStocks).toHaveBeenCalledWith('apple', 10);
    });

    it('should reject empty query', async () => {
      await expect(controller.searchStocks(''))
        .rejects
        .toThrow(HttpException);
      
      expect(mockStocksService.searchStocks).not.toHaveBeenCalled();
    });

    it('should reject invalid limit values', async () => {
      await expect(controller.searchStocks('apple', '0'))
        .rejects
        .toThrow(HttpException);

      await expect(controller.searchStocks('apple', '100'))
        .rejects
        .toThrow(HttpException);

      await expect(controller.searchStocks('apple', 'invalid'))
        .rejects
        .toThrow(HttpException);
    });

    it('should handle service errors', async () => {
      mockStocksService.searchStocks.mockRejectedValue(new Error('Service error'));

      await expect(controller.searchStocks('apple'))
        .rejects
        .toThrow(HttpException);
    });
  });

  describe('getBatchStocks', () => {
    it('should return batch stock data for valid symbols', async () => {
      const mockBatchData = {
        'AAPL': mockStockData,
        'MSFT': { ...mockStockData, symbol: 'MSFT' as StockSymbol }
      };
      mockStocksService.getBatchStocks.mockResolvedValue(mockBatchData);

      const result = await controller.getBatchStocks({ symbols: ['AAPL', 'MSFT'] });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBatchData);
      expect(result.count).toBe(2);
      expect(result.requested).toBe(2);
      expect(result.timestamp).toBeDefined();
      expect(mockStocksService.getBatchStocks).toHaveBeenCalledWith(['AAPL', 'MSFT']);
    });

    it('should reject invalid request body', async () => {
      await expect(controller.getBatchStocks({}))
        .rejects
        .toThrow(HttpException);

      await expect(controller.getBatchStocks({ symbols: 'not-array' } as any))
        .rejects
        .toThrow(HttpException);
      
      expect(mockStocksService.getBatchStocks).not.toHaveBeenCalled();
    });

    it('should reject empty symbols array', async () => {
      await expect(controller.getBatchStocks({ symbols: [] }))
        .rejects
        .toThrow(HttpException);
      
      expect(mockStocksService.getBatchStocks).not.toHaveBeenCalled();
    });

    it('should reject too many symbols', async () => {
      const tooManySymbols = Array(21).fill('AAPL');
      
      await expect(controller.getBatchStocks({ symbols: tooManySymbols }))
        .rejects
        .toThrow(HttpException);
      
      expect(mockStocksService.getBatchStocks).not.toHaveBeenCalled();
    });

    it('should reject invalid symbol formats', async () => {
      await expect(controller.getBatchStocks({ symbols: ['AAPL', 'INVALID123'] }))
        .rejects
        .toThrow(HttpException);
      
      expect(mockStocksService.getBatchStocks).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockStocksService.getBatchStocks.mockRejectedValue(new Error('Service error'));

      await expect(controller.getBatchStocks({ symbols: ['AAPL'] }))
        .rejects
        .toThrow(HttpException);
    });
  });

  describe('getStockChart', () => {
    const mockChartData = {
      symbol: 'AAPL',
      period: '1W',
      data: [
        { time: '2023-01-01', open: 150, high: 155, low: 148, close: 152, volume: 1000000 }
      ],
      technicalIndicators: {
        movingAverages: { ma20: [150], ma50: [148] },
        rsi: [65],
        volumeProfile: { totalVolume: 1000000, avgVolume: 1000000, volumeTrend: 'above_average' },
        bollinger: { upperBand: [155], lowerBand: [145], middleBand: [150] }
      },
      source: 'mock_data'
    };

    it('should return chart data for valid symbol', async () => {
      mockStocksService.getStockChart.mockResolvedValue(mockChartData);

      const result = await controller.getStockChart('AAPL', '1W');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockChartData);
      expect(result.timestamp).toBeDefined();
      expect(mockStocksService.getStockChart).toHaveBeenCalledWith('AAPL', '1W');
    });

    it('should use default period when not provided', async () => {
      mockStocksService.getStockChart.mockResolvedValue(mockChartData);

      await controller.getStockChart('AAPL');

      expect(mockStocksService.getStockChart).toHaveBeenCalledWith('AAPL', '1W');
    });

    it('should validate and normalize period values', async () => {
      mockStocksService.getStockChart.mockResolvedValue(mockChartData);

      await controller.getStockChart('AAPL', '1m');

      expect(mockStocksService.getStockChart).toHaveBeenCalledWith('AAPL', '1M');
    });

    it('should handle invalid periods', async () => {
      mockStocksService.getStockChart.mockResolvedValue(mockChartData);

      const result = await controller.getStockChart('AAPL', 'invalid');

      expect(mockStocksService.getStockChart).toHaveBeenCalledWith('AAPL', '1W'); // defaults to 1W
    });

    it('should handle service errors', async () => {
      mockStocksService.getStockChart.mockRejectedValue(new Error('Service error'));

      await expect(controller.getStockChart('AAPL'))
        .rejects
        .toThrow(HttpException);
    });
  });
});