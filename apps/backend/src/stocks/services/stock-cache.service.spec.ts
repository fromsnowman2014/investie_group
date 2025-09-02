import { Test, TestingModule } from '@nestjs/testing';
import { StockCacheService } from './stock-cache.service';
import { SupabaseService } from '../../database/supabase.service';
import { Logger } from '@nestjs/common';
import { StockPriceData } from '../interfaces';

describe('StockCacheService', () => {
  let service: StockCacheService;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockSupabaseClient = {
    from: jest.fn(),
  };

  beforeEach(async () => {
    const mockSupabaseService = {
      getClient: jest.fn(() => mockSupabaseClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockCacheService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<StockCacheService>(StockCacheService);
    supabaseService = module.get(SupabaseService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('loadStockDataFromCache', () => {
    it('should return cached data when available', async () => {
      const mockCachedData = {
        symbol: 'AAPL',
        current_price: 150.50,
        change_percent: 1.5,
        market_cap: '2.4T',
        pe_ratio: 25.5,
        volume: '50000000',
        source: 'alpha_vantage',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCachedData, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await service.loadStockDataFromCache('AAPL');

      expect(result).toEqual(mockCachedData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stock_profiles');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('symbol', 'AAPL');
      expect(mockQuery.order).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(mockQuery.limit).toHaveBeenCalledWith(1);
    });

    it('should return null when no data is found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await service.loadStockDataFromCache('AAPL');

      expect(result).toBeNull();
    });

    it('should return null when error occurs', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await service.loadStockDataFromCache('AAPL');

      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await service.loadStockDataFromCache('AAPL');

      expect(result).toBeNull();
    });
  });

  describe('storeStockDataInCache', () => {
    it('should store stock data successfully', async () => {
      const stockData: StockPriceData = {
        price: 150.50,
        changePercent: 1.5,
        marketCap: 2400000000000,
        pe: 25.5,
        volume: 50000000,
        source: 'alpha_vantage',
        change: 2.25,
      };

      const mockQuery = {
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await service.storeStockDataInCache('AAPL', stockData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stock_profiles');
      expect(mockQuery.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'AAPL',
          current_price: 150.50,
          change_percent: 1.5,
          market_cap: '2400000000000',
          pe_ratio: 25.5,
          volume: '50000000',
          source: 'alpha_vantage',
        }),
        { onConflict: 'symbol' }
      );
    });

    it('should handle storage errors gracefully', async () => {
      const stockData: StockPriceData = {
        price: 150.50,
        changePercent: 1.5,
        source: 'alpha_vantage',
        change: 2.25,
      };

      const mockQuery = {
        upsert: jest.fn().mockResolvedValue({ data: null, error: new Error('Storage failed') }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Should not throw error
      await expect(service.storeStockDataInCache('AAPL', stockData)).resolves.toBeUndefined();
    });

    it('should handle exceptions gracefully', async () => {
      const stockData: StockPriceData = {
        price: 150.50,
        changePercent: 1.5,
        source: 'alpha_vantage',
        change: 2.25,
      };

      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      // Should not throw error
      await expect(service.storeStockDataInCache('AAPL', stockData)).resolves.toBeUndefined();
    });
  });

  describe('isDataFresh', () => {
    beforeAll(() => {
      // Mock Date.now() to return a consistent timestamp
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should return true for fresh data (less than 15 minutes old)', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      expect(service.isDataFresh(tenMinutesAgo)).toBe(true);
    });

    it('should return false for stale data (more than 15 minutes old)', () => {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      
      expect(service.isDataFresh(twentyMinutesAgo)).toBe(false);
    });

    it('should return false for exactly 15 minutes old data', () => {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      expect(service.isDataFresh(fifteenMinutesAgo)).toBe(false);
    });
  });
});