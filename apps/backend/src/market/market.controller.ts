import {
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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

  /**
   * Enhanced Market Summary - New comprehensive endpoint
   */
  @Get('enhanced-summary')
  async getEnhancedMarketSummary() {
    try {
      const enhancedData = await this.marketService.getEnhancedMarketSummary();

      return {
        success: true,
        data: enhancedData,
        timestamp: new Date().toISOString(),
        source: 'enhanced-market-service',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch enhanced market summary',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Force market data update (manual trigger)
   */
  @Post('force-update')
  async forceUpdateMarketData() {
    try {
      const updateResult = await this.marketService.forceUpdateMarketData();

      return {
        success: true,
        data: updateResult,
        message: 'Market data update triggered successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to trigger market data update',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get market update status and statistics
   */
  @Get('update-status')
  async getMarketUpdateStatus() {
    try {
      const statusData = await this.marketService.getMarketUpdateStatus();

      return {
        success: true,
        data: statusData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch market update status',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check with service status
   */
  @Get('health')
  async getHealthStatus() {
    try {
      const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          market: 'operational',
          cache: 'operational',
          scheduler: 'operational',
        },
        environment: process.env.NODE_ENV || 'development',
      };

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Health check failed',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
