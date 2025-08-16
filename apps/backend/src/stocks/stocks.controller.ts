import { Controller, Get, Post, Param, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { StockSymbol } from '../common/types';

@Controller('api/v1/stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  async getAllStocks() {
    try {
      const stocks = await this.stocksService.getAllStocks();
      return {
        success: true,
        data: stocks,
        timestamp: new Date().toISOString(),
        count: stocks.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch stock data',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('search')
  async searchStocks(
    @Query('q') query: string,
    @Query('limit') limit?: string
  ) {
    try {
      if (!query || query.trim().length === 0) {
        throw new HttpException(
          {
            success: false,
            error: 'Missing query parameter',
            message: 'Query parameter "q" is required'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const searchLimit = limit ? parseInt(limit, 10) : 10;
      if (isNaN(searchLimit) || searchLimit < 1 || searchLimit > 50) {
        throw new HttpException(
          {
            success: false,
            error: 'Invalid limit parameter',
            message: 'Limit must be a number between 1 and 50'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const results = await this.stocksService.searchStocks(query.trim(), searchLimit);
      
      return {
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
        count: results.length,
        query: query.trim()
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          error: 'Search failed',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('batch')
  async getBatchStocks(@Body() body: { symbols: string[] }) {
    try {
      if (!body.symbols || !Array.isArray(body.symbols)) {
        throw new HttpException(
          {
            success: false,
            error: 'Invalid request body',
            message: 'Request body must contain "symbols" array'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      if (body.symbols.length === 0) {
        throw new HttpException(
          {
            success: false,
            error: 'Empty symbols array',
            message: 'At least one symbol is required'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      if (body.symbols.length > 20) {
        throw new HttpException(
          {
            success: false,
            error: 'Too many symbols',
            message: 'Maximum 20 symbols allowed per batch request'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate and normalize symbols
      const validSymbols: StockSymbol[] = [];
      const invalidSymbols: string[] = [];

      body.symbols.forEach(symbol => {
        const upperSymbol = symbol.toUpperCase();
        if (/^[A-Z]{1,5}$/.test(upperSymbol)) {
          validSymbols.push(upperSymbol as StockSymbol);
        } else {
          invalidSymbols.push(symbol);
        }
      });

      if (invalidSymbols.length > 0) {
        throw new HttpException(
          {
            success: false,
            error: 'Invalid symbols',
            message: `Invalid symbol format: ${invalidSymbols.join(', ')}`
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const stockData = await this.stocksService.getBatchStocks(validSymbols);
      
      return {
        success: true,
        data: stockData,
        timestamp: new Date().toISOString(),
        count: Object.keys(stockData).length,
        requested: validSymbols.length
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          error: 'Batch request failed',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':symbol/chart')
  async getStockChart(
    @Param('symbol') symbol: string,
    @Query('period') period?: string
  ) {
    try {
      const upperSymbol = symbol.toUpperCase();
      const validPeriods = ['1W', '1M', '3M', '1Y'];
      const chartPeriod = period && validPeriods.includes(period.toUpperCase()) 
        ? period.toUpperCase() 
        : '1W';

      const chartData = await this.stocksService.getStockChart(
        upperSymbol as StockSymbol, 
        chartPeriod
      );

      return {
        success: true,
        data: chartData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch chart data',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':symbol')
  async getStock(@Param('symbol') symbol: string) {
    try {
      // Validate symbol format
      const upperSymbol = symbol.toUpperCase();
      if (!/^[A-Z]{1,5}$/.test(upperSymbol)) {
        throw new HttpException(
          {
            success: false,
            error: 'Invalid symbol format',
            message: 'Symbol must be 1-5 letters only'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const stock = await this.stocksService.getStock(upperSymbol as StockSymbol);
      
      if (!stock) {
        throw new HttpException(
          {
            success: false,
            error: 'Stock not found',
            message: `No data available for symbol ${upperSymbol}`
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: stock,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch stock data',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}