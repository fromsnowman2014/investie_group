import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * 배치 대시보드 데이터 조회
   * POST /api/v1/dashboard/batch
   */
  @Post('batch')
  async getBatchDashboardData(@Body() batchRequest: { symbols: string[] }) {
    try {
      const { symbols } = batchRequest;

      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        throw new HttpException(
          {
            success: false,
            error: 'Invalid symbols array',
            details: 'symbols must be a non-empty array',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (symbols.length > 10) {
        throw new HttpException(
          {
            success: false,
            error: 'Too many symbols',
            details: 'Maximum 10 symbols allowed per batch request',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const batchData =
        await this.dashboardService.getBatchDashboardData(symbols);
      return {
        success: true,
        data: batchData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch batch dashboard data',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 실시간 데이터 업데이트 조회 (경량)
   * GET /api/v1/dashboard/:symbol/realtime
   */
  @Get(':symbol/realtime')
  async getRealtimeData(@Param('symbol') symbol: string) {
    try {
      const realtimeData = await this.dashboardService.getRealtimeData(symbol);
      return {
        success: true,
        data: realtimeData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch realtime data',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 데이터 가용성 확인 API
   * GET /api/v1/dashboard/:symbol/data-availability
   */
  @Get(':symbol/data-availability')
  async getDataAvailability(@Param('symbol') symbol: string) {
    try {
      const availabilityData =
        await this.dashboardService.getDataAvailability(symbol);
      return {
        success: true,
        data: availabilityData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch data availability',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 통합 대시보드 데이터 조회
   * GET /api/v1/dashboard/:symbol
   */
  @Get(':symbol')
  async getDashboardData(@Param('symbol') symbol: string) {
    try {
      const dashboardData =
        await this.dashboardService.getDashboardData(symbol);
      return {
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch dashboard data',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
