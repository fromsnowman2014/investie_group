import { Injectable, Logger } from '@nestjs/common';
import { NewsService } from '../news/news.service';

export interface RealtimeResponse {
  symbol: string;
  currentPrice: number;
  changePercent: number;
  volume: string;
  marketStatus: 'open' | 'closed' | 'pre_market' | 'after_hours';
  lastUpdated: string;
  newsHeadlines?: string[];  // 최신 헤드라인만
}

export interface DataAvailabilityResponse {
  symbol: string;
  dataServices: {
    aiAnalysis: {
      available: boolean;
      lastUpdated: string;
      freshness: 'fresh' | 'recent' | 'moderate' | 'stale';
      source: string;
    };
    stockPrice: {
      available: boolean;
      lastUpdated: string;
      freshness: 'fresh' | 'recent' | 'moderate' | 'stale';
      source: string;
    };
    newsData: {
      available: boolean;
      lastUpdated: string;
      freshness: 'fresh' | 'recent' | 'moderate' | 'stale';
      source: string;
      articleCount: number;
    };
    marketIndicators: {
      available: boolean;
      lastUpdated: string;
      freshness: 'fresh' | 'recent' | 'moderate' | 'stale';
      source: string;
    };
  };
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  recommendedActions: string[];
  checkTime: string;
}

export interface BatchDashboardResponse {
  symbols: string[];
  dashboards: { [symbol: string]: DashboardResponse | { error: string } };
  successCount: number;
  errorCount: number;
  executionTime: number;
  batchId: string;
  timestamp: string;
}

export interface DashboardResponse {
  // AI Investment Analysis Section
  aiAnalysis: {
    overview: string;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
    keyFactors: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: string;
    timestamp: string;
  };
  
  // Stock Profile Section  
  stockProfile: {
    symbol: string;
    currentPrice: number;
    changePercent: number;
    marketCap: string;
    pe: number;
    volume: string;
    lastUpdated: string;
  };
  
  // News Analysis Section
  newsAnalysis: {
    stockNews: {
      headline: string;
      articles: any[];
      sentiment: 'positive' | 'neutral' | 'negative';
    };
    macroNews: {
      topHeadline: string;
      articles: any[];
      marketImpact: 'bullish' | 'neutral' | 'bearish';
    };
  };
  
  // Market Indicators Section
  marketIndicators: {
    indices: {
      sp500: { value: number; change: number; changePercent: number; };
      nasdaq: { value: number; change: number; changePercent: number; };
      dow: { value: number; change: number; changePercent: number; };
    };
    sectors: Array<{
      name: string;
      change: number;
      performance: 'positive' | 'negative';
    }>;
    marketSentiment: string;
    volatilityIndex: number;
    // Phase 2 확장: FRED API 데이터
    macroEconomicData?: any;
  };
  
  // 메타데이터 및 데이터 신선도
  lastUpdated: string;
  dataFreshness: {
    aiAnalysis: string;
    stockProfile: string;
    newsAnalysis: string;
    marketIndicators: string;
  };
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly newsService: NewsService,
  ) {}

  async getDashboardData(symbol: string): Promise<DashboardResponse> {
    try {
      this.logger.log(`Fetching dashboard data for symbol: ${symbol}`);

      // 병렬로 모든 데이터 페칭
      const [newsData, marketData] = await Promise.allSettled([
        this.getNewsData(symbol),
        this.getMarketData(),
      ]);

      // 뉴스 데이터 처리
      const processedNewsData = (newsData.status === 'fulfilled' && newsData.value.isValid) 
        ? newsData.value 
        : this.getEmptyNewsData(symbol);

      // 마켓 데이터 처리
      const processedMarketData = marketData.status === 'fulfilled' 
        ? marketData.value 
        : this.getEmptyMarketData();

      // 통합 대시보드 응답 구성
      const dashboardResponse: DashboardResponse = {
        // AI Investment Analysis Section
        aiAnalysis: {
          overview: processedNewsData.overview?.overview || 'Analysis not available',
          recommendation: processedNewsData.overview?.recommendation || 'HOLD',
          confidence: processedNewsData.overview?.confidence || 0,
          keyFactors: processedNewsData.overview?.keyFactors || [],
          riskLevel: processedNewsData.overview?.riskLevel || 'MEDIUM',
          timeHorizon: processedNewsData.overview?.timeHorizon || 'N/A',
          timestamp: processedNewsData.overview?.timestamp || new Date().toISOString(),
        },
        
        // Stock Profile Section (현재는 Mock 데이터, 향후 실제 API 연동)
        stockProfile: {
          symbol: symbol,
          currentPrice: 0, // TradingView에서 가져올 예정
          changePercent: 0,
          marketCap: 'N/A',
          pe: 0,
          volume: 'N/A',
          lastUpdated: new Date().toISOString(),
        },
        
        // News Analysis Section
        newsAnalysis: {
          stockNews: {
            headline: processedNewsData.stockNews?.headline || 'No recent news',
            articles: processedNewsData.stockNews?.articles || [],
            sentiment: this.determineSentiment(processedNewsData.stockNews?.headline),
          },
          macroNews: {
            topHeadline: processedNewsData.macroNews?.topHeadline || 'No macro news',
            articles: processedNewsData.macroNews?.articles || [],
            marketImpact: this.determineMarketImpact(processedNewsData.macroNews?.topHeadline),
          },
        },
        
        // Market Indicators Section
        marketIndicators: processedMarketData,
        
        // 메타데이터
        lastUpdated: new Date().toISOString(),
        dataFreshness: {
          aiAnalysis: this.calculateDataAge(processedNewsData.overview?.timestamp),
          stockProfile: 'external', // TradingView 연동 시 변경
          newsAnalysis: this.calculateDataAge(processedNewsData.timestamp),
          marketIndicators: 'fresh',
        },
      };

      this.logger.log(`Successfully compiled dashboard data for ${symbol}`);
      return dashboardResponse;

    } catch (error) {
      this.logger.error(`Failed to fetch dashboard data for ${symbol}:`, error);
      throw error;
    }
  }

  private async getNewsData(symbol: string): Promise<any> {
    try {
      const newsData = await this.newsService.processStockNews(symbol);
      return newsData;
    } catch (error) {
      this.logger.warn(`Failed to fetch news data for ${symbol}:`, error.message);
      return this.getEmptyNewsData(symbol);
    }
  }

  private async getMarketData(): Promise<any> {
    try {
      // Mock market overview data (same as MarketController)
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

      return marketOverview;
    } catch (error) {
      this.logger.warn(`Failed to fetch market data:`, error.message);
      return this.getEmptyMarketData();
    }
  }

  private getEmptyNewsData(symbol: string): any {
    return {
      symbol,
      overview: {
        overview: 'Analysis temporarily unavailable',
        recommendation: 'HOLD',
        confidence: 0,
        keyFactors: ['Data temporarily unavailable'],
        riskLevel: 'MEDIUM',
        timeHorizon: 'N/A',
        timestamp: new Date().toISOString(),
      },
      stockNews: {
        headline: 'No recent stock news available',
        articles: [],
      },
      macroNews: {
        topHeadline: 'No recent macro news available',
        articles: [],
      },
      timestamp: new Date().toISOString(),
    };
  }

  private getEmptyMarketData(): any {
    return {
      indices: {
        sp500: { value: 0, change: 0, changePercent: 0 },
        nasdaq: { value: 0, change: 0, changePercent: 0 },
        dow: { value: 0, change: 0, changePercent: 0 },
      },
      sectors: [],
      marketSentiment: 'neutral',
      volatilityIndex: 0,
    };
  }

  private determineSentiment(headline: string): 'positive' | 'neutral' | 'negative' {
    if (!headline) return 'neutral';
    
    const positiveWords = ['growth', 'surge', 'gains', 'success', 'record', 'strong', 'expansion'];
    const negativeWords = ['decline', 'fall', 'loss', 'concern', 'weak', 'drop', 'struggle'];
    
    const lowerHeadline = headline.toLowerCase();
    
    if (positiveWords.some(word => lowerHeadline.includes(word))) {
      return 'positive';
    }
    if (negativeWords.some(word => lowerHeadline.includes(word))) {
      return 'negative';
    }
    
    return 'neutral';
  }

  private determineMarketImpact(headline: string): 'bullish' | 'neutral' | 'bearish' {
    if (!headline) return 'neutral';
    
    const bullishWords = ['optimism', 'growth', 'recovery', 'positive', 'strong', 'boost'];
    const bearishWords = ['uncertainty', 'concern', 'decline', 'weak', 'volatility', 'risk'];
    
    const lowerHeadline = headline.toLowerCase();
    
    if (bullishWords.some(word => lowerHeadline.includes(word))) {
      return 'bullish';
    }
    if (bearishWords.some(word => lowerHeadline.includes(word))) {
      return 'bearish';
    }
    
    return 'neutral';
  }

  async getRealtimeData(symbol: string): Promise<RealtimeResponse> {
    try {
      this.logger.log(`Fetching realtime data for symbol: ${symbol}`);

      // 병렬로 실시간 데이터 페칭
      const [stockPrice, newsHeadlines] = await Promise.allSettled([
        this.getRealtimeStockPrice(symbol),
        this.getLatestNewsHeadlines(symbol),
      ]);

      // 주식 가격 데이터 처리
      const priceData = stockPrice.status === 'fulfilled' 
        ? stockPrice.value 
        : this.getMockRealtimePrice(symbol);

      // 뉴스 헤드라인 처리
      const headlines = newsHeadlines.status === 'fulfilled' 
        ? newsHeadlines.value 
        : [];

      // 실시간 응답 구성
      const realtimeResponse: RealtimeResponse = {
        symbol: symbol,
        currentPrice: priceData.currentPrice,
        changePercent: priceData.changePercent,
        volume: priceData.volume,
        marketStatus: this.getCurrentMarketStatus(),
        lastUpdated: new Date().toISOString(),
        newsHeadlines: headlines.slice(0, 3), // 최신 3개만
      };

      this.logger.log(`Successfully fetched realtime data for ${symbol}`);
      return realtimeResponse;

    } catch (error) {
      this.logger.error(`Failed to fetch realtime data for ${symbol}:`, error);
      throw error;
    }
  }

  private async getRealtimeStockPrice(symbol: string): Promise<any> {
    try {
      // 현재는 Mock 데이터, 향후 TradingView API 연동 예정
      return this.getMockRealtimePrice(symbol);
    } catch (error) {
      this.logger.warn(`Failed to fetch realtime price for ${symbol}:`, error.message);
      return this.getMockRealtimePrice(symbol);
    }
  }

  private getMockRealtimePrice(symbol: string): any {
    // Mock 실시간 주식 데이터 (실제 API 연동 전)
    const basePrice = 150 + Math.random() * 200; // $150-350 범위
    const changePercent = (Math.random() - 0.5) * 10; // -5% ~ +5% 범위
    const volume = Math.floor(Math.random() * 10000000) + 1000000; // 1M-11M 범위

    return {
      currentPrice: parseFloat(basePrice.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: volume.toLocaleString(),
    };
  }

  private async getLatestNewsHeadlines(symbol: string): Promise<string[]> {
    try {
      const newsData = await this.newsService.processStockNews(symbol);
      
      // 뉴스 데이터에서 헤드라인 추출
      const headlines: string[] = [];
      
      if (newsData && newsData.stockNews && newsData.stockNews.articles) {
        headlines.push(...newsData.stockNews.articles.slice(0, 2).map(article => article.title));
      }
      
      if (newsData && newsData.macroNews && newsData.macroNews.articles) {
        headlines.push(...newsData.macroNews.articles.slice(0, 1).map(article => article.title));
      }

      return headlines.filter(headline => headline && headline.length > 0);
    } catch (error) {
      this.logger.warn(`Failed to fetch news headlines for ${symbol}:`, error.message);
      return []; // 빈 배열 반환
    }
  }

  private getCurrentMarketStatus(): 'open' | 'closed' | 'pre_market' | 'after_hours' {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // 주말인지 확인
    if (day === 0 || day === 6) {
      return 'closed';
    }

    // 평일 시장 시간 (EST 기준)
    if (hour >= 9 && hour < 16) {
      return 'open';
    } else if (hour >= 4 && hour < 9) {
      return 'pre_market';
    } else if (hour >= 16 && hour < 20) {
      return 'after_hours';
    } else {
      return 'closed';
    }
  }

  async getDataAvailability(symbol: string): Promise<DataAvailabilityResponse> {
    try {
      this.logger.log(`Checking data availability for symbol: ${symbol}`);

      // 병렬로 모든 데이터 소스 상태 확인
      const [aiStatus, stockStatus, newsStatus, marketStatus] = await Promise.allSettled([
        this.checkAIAnalysisAvailability(symbol),
        this.checkStockPriceAvailability(symbol),
        this.checkNewsDataAvailability(symbol),
        this.checkMarketIndicatorsAvailability(),
      ]);

      // 각 서비스 상태 처리
      const aiAnalysis = aiStatus.status === 'fulfilled' ? aiStatus.value : this.getUnavailableStatus('ai_analysis');
      const stockPrice = stockStatus.status === 'fulfilled' ? stockStatus.value : this.getUnavailableStatus('stock_price');
      const newsData = newsStatus.status === 'fulfilled' ? newsStatus.value : this.getUnavailableStatus('news_data');
      const marketIndicators = marketStatus.status === 'fulfilled' ? marketStatus.value : this.getUnavailableStatus('market_indicators');

      // 전체 건강도 평가
      const overallHealth = this.calculateOverallHealth([aiAnalysis, stockPrice, newsData, marketIndicators]);
      
      // 권장 액션 생성
      const recommendedActions = this.generateRecommendedActions([aiAnalysis, stockPrice, newsData, marketIndicators]);

      const availabilityResponse: DataAvailabilityResponse = {
        symbol,
        dataServices: {
          aiAnalysis,
          stockPrice,
          newsData,
          marketIndicators,
        },
        overallHealth,
        recommendedActions,
        checkTime: new Date().toISOString(),
      };

      this.logger.log(`Data availability check completed for ${symbol} - Health: ${overallHealth}`);
      return availabilityResponse;

    } catch (error) {
      this.logger.error(`Failed to check data availability for ${symbol}:`, error);
      throw error;
    }
  }

  private async checkAIAnalysisAvailability(symbol: string): Promise<any> {
    try {
      const newsData = await this.newsService.processStockNews(symbol);
      const isAvailable = newsData && newsData.isValid && newsData.overview;
      const lastUpdated = newsData?.overview?.timestamp || new Date().toISOString();
      
      return {
        available: isAvailable,
        lastUpdated,
        freshness: this.calculateDataAge(lastUpdated),
        source: 'claude_ai',
      };
    } catch (error) {
      return this.getUnavailableStatus('ai_analysis');
    }
  }

  private async checkStockPriceAvailability(symbol: string): Promise<any> {
    try {
      // 현재는 Mock 데이터이므로 항상 사용 가능
      return {
        available: true,
        lastUpdated: new Date().toISOString(),
        freshness: 'fresh',
        source: 'mock_data', // 향후 'tradingview' 또는 실제 API로 변경
      };
    } catch (error) {
      return this.getUnavailableStatus('stock_price');
    }
  }

  private async checkNewsDataAvailability(symbol: string): Promise<any> {
    try {
      const newsData = await this.newsService.processStockNews(symbol);
      const isAvailable = newsData && newsData.isValid;
      
      // 타임스탬프는 macroNews에서 가져오거나 현재 시간 사용
      const lastUpdated = newsData?.macroNews?.timestamp || new Date().toISOString();
      const articleCount = (newsData?.stockNews?.articles?.length || 0) + (newsData?.macroNews?.articles?.length || 0);
      
      return {
        available: isAvailable,
        lastUpdated,
        freshness: this.calculateDataAge(lastUpdated),
        source: 'serpapi',
        articleCount,
      };
    } catch (error) {
      return {
        ...this.getUnavailableStatus('news_data'),
        articleCount: 0,
      };
    }
  }

  private async checkMarketIndicatorsAvailability(): Promise<any> {
    try {
      // 현재는 Mock 데이터이므로 항상 사용 가능
      return {
        available: true,
        lastUpdated: new Date().toISOString(),
        freshness: 'fresh',
        source: 'mock_data', // 향후 실제 API로 변경
      };
    } catch (error) {
      return this.getUnavailableStatus('market_indicators');
    }
  }

  private getUnavailableStatus(serviceType: string): any {
    return {
      available: false,
      lastUpdated: 'never',
      freshness: 'stale',
      source: 'unavailable',
    };
  }

  private calculateOverallHealth(services: any[]): 'excellent' | 'good' | 'fair' | 'poor' {
    const availableCount = services.filter(service => service.available).length;
    const freshCount = services.filter(service => service.freshness === 'fresh' || service.freshness === 'recent').length;
    
    if (availableCount === 4 && freshCount >= 3) return 'excellent';
    if (availableCount >= 3 && freshCount >= 2) return 'good';
    if (availableCount >= 2) return 'fair';
    return 'poor';
  }

  private generateRecommendedActions(services: any[]): string[] {
    const actions: string[] = [];
    
    if (!services[0].available) { // AI Analysis
      actions.push('AI analysis service unavailable - check Claude API configuration');
    }
    
    if (!services[1].available) { // Stock Price
      actions.push('Stock price data unavailable - check TradingView API connection');
    }
    
    if (!services[2].available) { // News Data
      actions.push('News data unavailable - check SerpAPI configuration');
    } else if (services[2].articleCount === 0) {
      actions.push('No recent news articles found - data may be stale');
    }
    
    if (!services[3].available) { // Market Indicators
      actions.push('Market indicators unavailable - check market data API connection');
    }
    
    const staleServices = services.filter(service => service.freshness === 'stale').length;
    if (staleServices > 0) {
      actions.push(`${staleServices} data source(s) have stale data - consider refreshing`);
    }
    
    if (actions.length === 0) {
      actions.push('All systems operational - no action required');
    }
    
    return actions;
  }

  async getBatchDashboardData(symbols: string[]): Promise<BatchDashboardResponse> {
    const startTime = Date.now();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.logger.log(`Processing batch dashboard request for ${symbols.length} symbols: ${symbols.join(', ')}`);

      // 병렬로 모든 심볼의 대시보드 데이터 요청
      const dashboardPromises = symbols.map(async (symbol) => {
        try {
          const dashboardData = await this.getDashboardData(symbol);
          return { symbol, data: dashboardData, success: true };
        } catch (error) {
          this.logger.warn(`Failed to fetch dashboard data for ${symbol}:`, error.message);
          return { 
            symbol, 
            data: { error: error.message || 'Unknown error occurred' }, 
            success: false 
          };
        }
      });

      // Promise.allSettled를 사용하여 일부 실패해도 계속 진행
      const results = await Promise.allSettled(dashboardPromises);

      // 결과 처리
      const dashboards: { [symbol: string]: DashboardResponse | { error: string } } = {};
      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        const symbol = symbols[index];
        
        if (result.status === 'fulfilled') {
          const { data, success } = result.value;
          dashboards[symbol] = data;
          
          if (success) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          // Promise 자체가 실패한 경우
          dashboards[symbol] = { error: result.reason?.message || 'Promise failed' };
          errorCount++;
        }
      });

      const executionTime = Date.now() - startTime;

      const batchResponse: BatchDashboardResponse = {
        symbols,
        dashboards,
        successCount,
        errorCount,
        executionTime,
        batchId,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`Batch request ${batchId} completed - Success: ${successCount}, Errors: ${errorCount}, Time: ${executionTime}ms`);
      return batchResponse;

    } catch (error) {
      this.logger.error(`Batch dashboard request failed for batch ${batchId}:`, error);
      throw error;
    }
  }

  private calculateDataAge(timestamp: string): string {
    if (!timestamp) return 'unknown';
    
    const now = new Date();
    const dataTime = new Date(timestamp);
    const ageInMinutes = Math.floor((now.getTime() - dataTime.getTime()) / (1000 * 60));
    
    if (ageInMinutes < 5) return 'fresh';
    if (ageInMinutes < 30) return 'recent';
    if (ageInMinutes < 120) return 'moderate';
    return 'stale';
  }
}