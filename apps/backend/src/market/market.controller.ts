import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('api/v1/market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('overview')
  async getMarketOverview() {
    try {
      const marketOverview = await this.marketService.getMarketOverview();

      return {
        success: true,
        data: marketOverview,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch market overview',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('movers')
  async getMarketMovers() {
    try {
      const marketMovers = await this.marketService.getMarketMovers();

      return {
        success: true,
        data: marketMovers,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch market movers',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('trending')
  async getTrendingStocks() {
    try {
      const trendingData = await this.marketService.getTrendingStocks();

      return {
        success: true,
        data: trendingData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch trending stocks',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
