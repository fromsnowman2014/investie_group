import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';

@Controller('api/v1/market')
export class MarketController {
  constructor() {}

  @Get('overview')
  async getMarketOverview() {
    try {
      // Mock market overview data
      const marketOverview = {
        indices: {
          sp500: {
            value: 4150.23,
            change: 12.45,
            changePercent: 0.30
          },
          nasdaq: {
            value: 12850.67,
            change: -23.12,
            changePercent: -0.18
          },
          dow: {
            value: 34250.89,
            change: 45.67,
            changePercent: 0.13
          }
        },
        sectors: [
          {
            name: 'Technology',
            change: 0.25,
            performance: 'positive'
          },
          {
            name: 'Healthcare',
            change: -0.15,
            performance: 'negative'
          },
          {
            name: 'Energy',
            change: 1.23,
            performance: 'positive'
          },
          {
            name: 'Financial',
            change: 0.45,
            performance: 'positive'
          }
        ],
        marketSentiment: 'neutral',
        volatilityIndex: 18.45,
        source: 'mock_data'
      };

      return {
        success: true,
        data: marketOverview,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch market overview',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('movers')
  async getMarketMovers() {
    try {
      // Mock market movers data
      const marketMovers = {
        gainers: [
          { symbol: 'NVDA', name: 'NVIDIA Corporation', change: 5.25, changePercent: 3.45 },
          { symbol: 'AMD', name: 'Advanced Micro Devices', change: 4.12, changePercent: 2.87 },
          { symbol: 'TSLA', name: 'Tesla, Inc.', change: 8.90, changePercent: 3.62 }
        ],
        losers: [
          { symbol: 'META', name: 'Meta Platforms', change: -6.78, changePercent: -2.31 },
          { symbol: 'NFLX', name: 'Netflix, Inc.', change: -12.45, changePercent: -2.74 },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', change: -3.21, changePercent: -2.31 }
        ],
        mostActive: [
          { symbol: 'AAPL', name: 'Apple Inc.', volume: 45230000 },
          { symbol: 'MSFT', name: 'Microsoft Corporation', volume: 38920000 },
          { symbol: 'AMZN', name: 'Amazon.com, Inc.', volume: 42110000 }
        ],
        source: 'mock_data'
      };

      return {
        success: true,
        data: marketMovers,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch market movers',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('trending')
  async getTrendingStocks() {
    try {
      // Mock trending stocks data
      const trendingStocks = [
        {
          symbol: 'AI',
          name: 'C3.ai, Inc.',
          change: 15.67,
          changePercent: 8.45,
          volume: 12340000,
          reason: 'AI sector momentum'
        },
        {
          symbol: 'PLTR',
          name: 'Palantir Technologies',
          change: 2.34,
          changePercent: 4.12,
          volume: 8920000,
          reason: 'Government contract wins'
        },
        {
          symbol: 'RIVN',
          name: 'Rivian Automotive',
          change: -1.23,
          changePercent: -3.45,
          volume: 15670000,
          reason: 'EV market volatility'
        }
      ];

      return {
        success: true,
        data: {
          trending: trendingStocks,
          source: 'mock_data'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch trending stocks',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}