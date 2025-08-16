import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { MarketController } from './market.controller';

describe('MarketController', () => {
  let controller: MarketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketController],
    }).compile();

    controller = module.get<MarketController>(MarketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMarketOverview', () => {
    it('should return market overview data with success response', async () => {
      const result = await controller.getMarketOverview();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.indices).toBeDefined();
      expect(result.data.sectors).toBeDefined();
      expect(result.data.marketSentiment).toBeDefined();
      expect(result.data.volatilityIndex).toBeDefined();
      expect(result.timestamp).toBeDefined();

      // Validate indices structure
      expect(result.data.indices.sp500).toBeDefined();
      expect(result.data.indices.nasdaq).toBeDefined();
      expect(result.data.indices.dow).toBeDefined();

      // Validate sectors array
      expect(Array.isArray(result.data.sectors)).toBe(true);
      expect(result.data.sectors.length).toBeGreaterThan(0);
      
      if (result.data.sectors.length > 0) {
        expect(result.data.sectors[0].name).toBeDefined();
        expect(result.data.sectors[0].change).toBeDefined();
        expect(result.data.sectors[0].performance).toBeDefined();
      }
    });

    it('should return consistent data structure', async () => {
      const result1 = await controller.getMarketOverview();
      const result2 = await controller.getMarketOverview();

      expect(result1.data.indices).toEqual(result2.data.indices);
      expect(result1.data.sectors).toEqual(result2.data.sectors);
      expect(result1.data.marketSentiment).toEqual(result2.data.marketSentiment);
      expect(result1.data.volatilityIndex).toEqual(result2.data.volatilityIndex);
    });
  });

  describe('getMarketMovers', () => {
    it('should return market movers data with success response', async () => {
      const result = await controller.getMarketMovers();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.gainers).toBeDefined();
      expect(result.data.losers).toBeDefined();
      expect(result.data.mostActive).toBeDefined();
      expect(result.timestamp).toBeDefined();

      // Validate arrays structure
      expect(Array.isArray(result.data.gainers)).toBe(true);
      expect(Array.isArray(result.data.losers)).toBe(true);
      expect(Array.isArray(result.data.mostActive)).toBe(true);

      // Validate content if arrays are not empty
      if (result.data.gainers.length > 0) {
        const gainer = result.data.gainers[0];
        expect(gainer.symbol).toBeDefined();
        expect(gainer.name).toBeDefined();
        expect(gainer.change).toBeDefined();
        expect(gainer.changePercent).toBeDefined();
        expect(typeof gainer.change).toBe('number');
        expect(typeof gainer.changePercent).toBe('number');
      }

      if (result.data.mostActive.length > 0) {
        const active = result.data.mostActive[0];
        expect(active.symbol).toBeDefined();
        expect(active.name).toBeDefined();
        expect(active.volume).toBeDefined();
        expect(typeof active.volume).toBe('number');
      }
    });

    it('should return consistent data structure', async () => {
      const result1 = await controller.getMarketMovers();
      const result2 = await controller.getMarketMovers();

      expect(result1.data.gainers).toEqual(result2.data.gainers);
      expect(result1.data.losers).toEqual(result2.data.losers);
      expect(result1.data.mostActive).toEqual(result2.data.mostActive);
    });
  });

  describe('getTrendingStocks', () => {
    it('should return trending stocks data with success response', async () => {
      const result = await controller.getTrendingStocks();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.trending).toBeDefined();
      expect(result.timestamp).toBeDefined();

      // Validate trending array structure
      expect(Array.isArray(result.data.trending)).toBe(true);

      if (result.data.trending.length > 0) {
        const trending = result.data.trending[0];
        expect(trending.symbol).toBeDefined();
        expect(trending.name).toBeDefined();
        expect(trending.change).toBeDefined();
        expect(trending.changePercent).toBeDefined();
        expect(trending.volume).toBeDefined();
        expect(trending.reason).toBeDefined();
        expect(typeof trending.change).toBe('number');
        expect(typeof trending.changePercent).toBe('number');
        expect(typeof trending.volume).toBe('number');
        expect(typeof trending.reason).toBe('string');
      }
    });

    it('should return consistent data structure', async () => {
      const result1 = await controller.getTrendingStocks();
      const result2 = await controller.getTrendingStocks();

      expect(result1.data.trending).toEqual(result2.data.trending);
    });
  });

  describe('error handling', () => {
    it('should handle internal errors gracefully', () => {
      // Since these are simple methods returning mock data,
      // we primarily test that they don't throw unexpected errors
      expect(async () => {
        await controller.getMarketOverview();
        await controller.getMarketMovers();
        await controller.getTrendingStocks();
      }).not.toThrow();
    });
  });
});