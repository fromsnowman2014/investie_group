import { Controller, Post, Get, Body, Param, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { NewsService } from './news.service';

interface NewsArticle {
  title: string;
  link: string;
  snippet?: string;
  date: string;
  source: string;
}

interface ProcessNewsRequest {
  symbol: string;
}

interface ProcessNewsResponse {
  success: boolean;
  data?: {
    symbol: string;
    overview?: {
      overview: string;
      recommendation: 'BUY' | 'HOLD' | 'SELL';
      confidence: number;
      keyFactors: string[];
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      timeHorizon: string;
      timestamp: string;
    };
    stockNews?: {
      headline: string;
      articles: NewsArticle[];
      query?: string;
      fetchedAt: string;
      totalArticles: number;
      dateRange?: {
        oldest: string;
        newest: string;
      };
    };
    macroNews?: {
      topHeadline: string;
      articles: NewsArticle[];
      totalArticles: number;
      fetchedAt: string;
      query?: string;
    };
    validationResult?: {
      isValid: boolean;
      method: string;
      price?: number;
    };
  };
  error?: string;
  suggestions?: string[];
}

interface NewsResponse {
  symbol: string;
  overview?: {
    overview: string;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
    keyFactors: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: string;
    timestamp: string;
  };
  stockNews?: {
    headline: string;
    articles: NewsArticle[];
    query?: string;
    fetchedAt: string;
    totalArticles: number;
    dateRange?: {
      oldest: string;
      newest: string;
    };
  };
  macroNews?: {
    topHeadline: string;
    articles: NewsArticle[];
    totalArticles: number;
    fetchedAt: string;
    query?: string;
  };
  validationResult?: {
    isValid: boolean;
    method: string;
    price?: number;
  };
  timestamp: string;
}

@Controller('api/v1/news')
export class NewsController {
  private readonly logger = new Logger(NewsController.name);

  constructor(private readonly newsService: NewsService) {}

  // Helper method to calculate date range from articles
  private calculateDateRange(articles: NewsArticle[]): { oldest: string; newest: string } | undefined {
    if (!articles || articles.length === 0) return undefined;

    const dates = articles
      .map(article => new Date(article.date))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) return undefined;

    return {
      oldest: dates[0].toISOString(),
      newest: dates[dates.length - 1].toISOString()
    };
  }

  // Helper method to transform stockNews response
  private transformStockNews(stockNews: any, currentTime: string) {
    if (!stockNews) return undefined;

    return {
      headline: stockNews.headline,
      articles: stockNews.articles,
      query: stockNews.query,
      fetchedAt: currentTime,
      totalArticles: stockNews.articles?.length || 0,
      dateRange: this.calculateDateRange(stockNews.articles)
    };
  }

  // Helper method to transform macroNews response
  private transformMacroNews(macroNews: any, currentTime: string) {
    if (!macroNews) return undefined;

    return {
      topHeadline: macroNews.topHeadline,
      articles: macroNews.articles,
      totalArticles: macroNews.totalArticles,
      fetchedAt: currentTime,
      query: macroNews.query || 'stock market economy finance business'
    };
  }

  @Post('process')
  async processStockNews(@Body() request: ProcessNewsRequest): Promise<ProcessNewsResponse> {
    this.logger.log(`Processing news request for symbol: ${request.symbol}`);

    try {
      // Validate request
      if (!request.symbol || typeof request.symbol !== 'string') {
        throw new HttpException('Symbol is required and must be a string', HttpStatus.BAD_REQUEST);
      }

      const symbol = request.symbol.trim();
      if (!symbol) {
        throw new HttpException('Symbol cannot be empty', HttpStatus.BAD_REQUEST);
      }

      // Process the stock news using the complete workflow
      const result = await this.newsService.processStockNews(symbol);

      if (!result.isValid) {
        // Return error with suggestions if symbol is invalid
        return {
          success: false,
          error: result.error,
          suggestions: result.suggestions
        };
      }

      // Return success response
      const currentTime = new Date().toISOString();
      return {
        success: true,
        data: {
          symbol: result.symbol!,
          overview: result.overview,
          stockNews: this.transformStockNews(result.stockNews, currentTime),
          macroNews: this.transformMacroNews(result.macroNews, currentTime),
          validationResult: result.validationResult
        }
      };

    } catch (error) {
      this.logger.error(`Error processing news for symbol ${request.symbol}:`, error instanceof Error ? error.message : 'Unknown error');
      
      throw new HttpException(
        `Failed to process news: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':symbol')
  async getStockNews(@Param('symbol') symbol: string): Promise<NewsResponse> {
    this.logger.log(`Getting news data for symbol: ${symbol}`);

    try {
      if (!symbol || typeof symbol !== 'string') {
        throw new HttpException('Symbol is required', HttpStatus.BAD_REQUEST);
      }

      const cleanSymbol = symbol.trim().toUpperCase();
      if (!cleanSymbol) {
        throw new HttpException('Symbol cannot be empty', HttpStatus.BAD_REQUEST);
      }

      // Process the stock news to get comprehensive data
      const result = await this.newsService.processStockNews(cleanSymbol);

      if (!result.isValid) {
        throw new HttpException(
          result.error || 'Invalid symbol or unable to fetch news',
          HttpStatus.NOT_FOUND
        );
      }

      const currentTime = new Date().toISOString();

      return {
        symbol: result.symbol!,
        overview: result.overview,
        stockNews: this.transformStockNews(result.stockNews, currentTime),
        macroNews: this.transformMacroNews(result.macroNews, currentTime),
        validationResult: result.validationResult,
        timestamp: currentTime
      };

    } catch (error) {
      this.logger.error(`Error getting news for symbol ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to get news: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('macro/today')
  async getTodayMacroNews() {
    this.logger.log('Getting today\'s macro news');

    try {
      // Use a placeholder symbol to trigger macro news fetching
      await this.newsService.processStockNews('AAPL');
      
      return {
        success: true,
        message: 'Macro news processing initiated. Check data directory for results.',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Error getting macro news:', error instanceof Error ? error.message : 'Unknown error');
      
      throw new HttpException(
        `Failed to get macro news: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}