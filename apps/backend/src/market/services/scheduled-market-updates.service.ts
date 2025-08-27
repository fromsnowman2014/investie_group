import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FredApiService, InterestRateData, CPIData, UnemploymentData } from './fred-api.service';
import { FearGreedIndexService, FearGreedIndex } from './fear-greed-index.service';
import { AlphaVantageService, SP500SparklineData, EnhancedSectorPerformance, VixData } from './alpha-vantage.service';
import { MarketCacheService } from './market-cache.service';

export interface ScheduledUpdateResult {
  success: boolean;
  dataType: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface UpdateSummary {
  session: 'market_open' | 'market_close';
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  duration: number;
  timestamp: string;
  results: ScheduledUpdateResult[];
}

@Injectable()
export class ScheduledMarketUpdatesService {
  private readonly logger = new Logger(ScheduledMarketUpdatesService.name);
  
  // Cache TTL values (in seconds)
  private readonly CACHE_TTL = {
    fearGreedIndex: 12 * 60 * 60,      // 12 hours
    economicIndicators: 12 * 60 * 60,   // 12 hours (FRED data updated daily)
    sp500Sparkline: 15 * 60,           // 15 minutes - real-time market data
    sectorPerformance: 30 * 60,        // 30 minutes - sector data
    vixData: 15 * 60                   // 15 minutes - volatility data
  };

  constructor(
    private readonly fredService: FredApiService,
    private readonly fearGreedService: FearGreedIndexService,
    private readonly alphaVantageService: AlphaVantageService,
    private readonly marketCacheService: MarketCacheService
  ) {}

  /**
   * Market Open Update - 9:30 AM EST weekdays
   */
  @Cron('30 9 * * 1-5', {
    name: 'market-open-update',
    timeZone: 'America/New_York'
  })
  async marketOpenUpdate(): Promise<UpdateSummary> {
    this.logger.log('🔔 Starting market open data update - 9:30 AM EST');
    
    try {
      const summary = await this.executeScheduledUpdate('market_open');
      this.logger.log(`✅ Market open update completed successfully in ${summary.duration}ms`);
      return summary;
    } catch (error) {
      this.logger.error('❌ Market open update failed:', error.message);
      await this.notifyUpdateFailure('market_open', error);
      throw error;
    }
  }

  /**
   * Market Close Update - 4:00 PM EST weekdays
   */
  @Cron('0 16 * * 1-5', {
    name: 'market-close-update', 
    timeZone: 'America/New_York'
  })
  async marketCloseUpdate(): Promise<UpdateSummary> {
    this.logger.log('🔔 Starting market close data update - 4:00 PM EST');
    
    try {
      const summary = await this.executeScheduledUpdate('market_close');
      this.logger.log(`✅ Market close update completed successfully in ${summary.duration}ms`);
      return summary;
    } catch (error) {
      this.logger.error('❌ Market close update failed:', error.message);
      await this.notifyUpdateFailure('market_close', error);
      throw error;
    }
  }

  /**
   * Intraday updates every 15 minutes during market hours (9:30 AM - 4:00 PM EST)
   */
  @Cron('*/15 9-15 * * 1-5', {
    name: 'intraday-market-update',
    timeZone: 'America/New_York'
  })
  async intradayMarketUpdate(): Promise<void> {
    // Only run during market hours
    if (!this.isMarketHours()) {
      return;
    }

    this.logger.log('⚡ Starting intraday market update (15-minute interval)');
    
    try {
      // Only update critical real-time data during market hours
      const updates = [
        this.updateSP500SparklineOnly(),
        this.updateVixDataOnly()
      ];

      const results = await Promise.allSettled(updates);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      this.logger.log(`⚡ Intraday update completed: ${successful}/${results.length} successful`);
    } catch (error) {
      this.logger.error('❌ Intraday market update failed:', error.message);
    }
  }

  /**
   * Cache cleanup - Daily at 2 AM EST
   */
  @Cron('0 2 * * *', {
    name: 'cache-cleanup',
    timeZone: 'America/New_York'
  })
  async dailyCacheCleanup(): Promise<void> {
    this.logger.log('🧹 Starting daily cache cleanup - 2:00 AM EST');
    
    try {
      const cleanedCount = await this.marketCacheService.cleanExpiredCache();
      this.logger.log(`✅ Cache cleanup completed: ${cleanedCount} entries removed`);
    } catch (error) {
      this.logger.error('❌ Cache cleanup failed:', error.message);
    }
  }

  /**
   * Execute immediate update (for manual triggers)
   */
  async executeImmediateUpdate(session?: 'market_open' | 'market_close'): Promise<UpdateSummary> {
    const rawSession = session || this.marketCacheService.getCurrentMarketSession();
    const currentSession: 'market_open' | 'market_close' = rawSession === 'after_hours' ? 'market_close' : rawSession;
    this.logger.log(`🚀 Executing immediate update for session: ${currentSession}`);
    
    return await this.executeScheduledUpdate(currentSession);
  }

  /**
   * Core scheduled update execution
   */
  private async executeScheduledUpdate(session: 'market_open' | 'market_close'): Promise<UpdateSummary> {
    const updateStartTime = Date.now();
    const results: ScheduledUpdateResult[] = [];

    // Execute all updates in parallel for speed
    const updatePromises = [
      this.updateFearGreedIndex(session),
      this.updateEconomicIndicators(session),
      this.updateSP500Sparkline(session),
      this.updateSectorPerformance(session),
      this.updateVixData(session)
    ];

    const settledResults = await Promise.allSettled(updatePromises);

    // Process results
    const dataTypes = ['fear_greed_index', 'economic_indicators', 'sp500_sparkline', 'sector_performance', 'vix_data'];
    
    settledResults.forEach((result, index) => {
      const dataType = dataTypes[index];
      
      if (result.status === 'fulfilled') {
        results.push({
          success: true,
          dataType,
          data: result.value,
          timestamp: new Date().toISOString()
        });
      } else {
        results.push({
          success: false,
          dataType,
          error: result.reason.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    const duration = Date.now() - updateStartTime;
    const successfulUpdates = results.filter(r => r.success).length;
    const failedUpdates = results.filter(r => !r.success).length;

    const summary: UpdateSummary = {
      session,
      totalUpdates: results.length,
      successfulUpdates,
      failedUpdates,
      duration,
      timestamp: new Date().toISOString(),
      results
    };

    // Log summary
    this.logger.log(`📊 Update Summary - ${session}:`);
    this.logger.log(`  ✅ Successful: ${successfulUpdates}/${results.length}`);
    this.logger.log(`  ❌ Failed: ${failedUpdates}/${results.length}`);
    this.logger.log(`  ⏱️  Duration: ${duration}ms`);

    return summary;
  }

  /**
   * Individual update methods
   */
  private async updateFearGreedIndex(session: string): Promise<FearGreedIndex> {
    try {
      const fearGreedData = await this.fearGreedService.calculateFearGreedIndex();
      
      await this.marketCacheService.cacheMarketData({
        dataType: 'fear_greed_index',
        dataPayload: fearGreedData,
        marketSession: session,
        apiSource: 'calculated',
        expiryTimestamp: new Date(Date.now() + this.CACHE_TTL.fearGreedIndex * 1000),
        dataQualityScore: fearGreedData.confidence
      });

      this.logger.log(`📊 Fear & Greed Index updated: ${fearGreedData.value} (${fearGreedData.status})`);
      return fearGreedData;
    } catch (error) {
      this.logger.error('Fear & Greed Index update failed:', error.message);
      throw error;
    }
  }

  private async updateEconomicIndicators(session: string): Promise<{
    interestRate: InterestRateData;
    cpi: CPIData;
    unemployment: UnemploymentData;
  }> {
    try {
      const [interestRateResult, cpiResult, unemploymentResult] = await Promise.allSettled([
        this.fredService.getInterestRateData(),
        this.fredService.getCPIData(),
        this.fredService.getUnemploymentData()
      ]);

      const economicData = {
        interestRate: interestRateResult.status === 'fulfilled' ? interestRateResult.value : await this.fredService.getInterestRateData(),
        cpi: cpiResult.status === 'fulfilled' ? cpiResult.value : await this.fredService.getCPIData(),
        unemployment: unemploymentResult.status === 'fulfilled' ? unemploymentResult.value : await this.fredService.getUnemploymentData()
      };

      await this.marketCacheService.cacheMarketData({
        dataType: 'economic_indicators',
        dataPayload: economicData,
        marketSession: session,
        apiSource: 'fred_api',
        expiryTimestamp: new Date(Date.now() + this.CACHE_TTL.economicIndicators * 1000)
      });

      this.logger.log(`📈 Economic indicators updated: Interest Rate ${economicData.interestRate?.value}%, CPI ${economicData.cpi?.value}, Unemployment ${economicData.unemployment?.value}%`);
      return economicData;
    } catch (error) {
      this.logger.error('Economic indicators update failed:', error.message);
      throw error;
    }
  }

  private async updateSP500Sparkline(session: string): Promise<SP500SparklineData> {
    try {
      const sp500Data = await this.alphaVantageService.getSP500SparklineData();
      
      await this.marketCacheService.cacheMarketData({
        dataType: 'sp500_sparkline',
        dataPayload: sp500Data,
        marketSession: session,
        apiSource: 'alpha_vantage',
        expiryTimestamp: new Date(Date.now() + this.CACHE_TTL.sp500Sparkline * 1000)
      });

      this.logger.log(`📊 S&P 500 sparkline updated: $${sp500Data.currentPrice} (${sp500Data.weeklyChange.toFixed(2)}%)`);
      return sp500Data;
    } catch (error) {
      this.logger.error('S&P 500 sparkline update failed:', error.message);
      throw error;
    }
  }

  private async updateSectorPerformance(session: string): Promise<EnhancedSectorPerformance[]> {
    try {
      const sectorData = await this.alphaVantageService.getEnhancedSectorPerformance();
      
      await this.marketCacheService.cacheMarketData({
        dataType: 'sector_performance',
        dataPayload: sectorData,
        marketSession: session,
        apiSource: 'alpha_vantage',
        expiryTimestamp: new Date(Date.now() + this.CACHE_TTL.sectorPerformance * 1000)
      });

      this.logger.log(`🏭 Sector performance updated: ${sectorData.length} sectors`);
      return sectorData;
    } catch (error) {
      this.logger.error('Sector performance update failed:', error.message);
      throw error;
    }
  }

  private async updateVixData(session: string): Promise<VixData> {
    try {
      const vixData = await this.alphaVantageService.getEnhancedVixData();
      
      await this.marketCacheService.cacheMarketData({
        dataType: 'vix_data',
        dataPayload: vixData,
        marketSession: session,
        apiSource: 'alpha_vantage',
        expiryTimestamp: new Date(Date.now() + this.CACHE_TTL.vixData * 1000)
      });

      this.logger.log(`📊 VIX data updated: ${vixData.value} (${vixData.status})`);
      return vixData;
    } catch (error) {
      this.logger.error('VIX data update failed:', error.message);
      throw error;
    }
  }

  /**
   * Get update status and statistics
   */
  async getUpdateStatus(): Promise<{
    lastUpdate: string | null;
    nextUpdate: string;
    cacheStats: any;
    isUpdateRequired: boolean;
  }> {
    try {
      const cacheStats = await this.marketCacheService.getCacheStats();
      const isUpdateRequired = this.marketCacheService.isUpdateRequired();
      
      // Calculate next update time
      const now = new Date();
      const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      
      let nextUpdate: Date;
      if (easternTime.getHours() < 9 || (easternTime.getHours() === 9 && easternTime.getMinutes() < 30)) {
        // Before market open
        nextUpdate = new Date(easternTime);
        nextUpdate.setHours(9, 30, 0, 0);
      } else if (easternTime.getHours() < 16) {
        // Between market open and close
        nextUpdate = new Date(easternTime);
        nextUpdate.setHours(16, 0, 0, 0);
      } else {
        // After market close, next update is next day's market open
        nextUpdate = new Date(easternTime);
        nextUpdate.setDate(nextUpdate.getDate() + 1);
        nextUpdate.setHours(9, 30, 0, 0);
        
        // Skip weekends
        if (nextUpdate.getDay() === 6) { // Saturday
          nextUpdate.setDate(nextUpdate.getDate() + 2);
        } else if (nextUpdate.getDay() === 0) { // Sunday
          nextUpdate.setDate(nextUpdate.getDate() + 1);
        }
      }

      return {
        lastUpdate: null, // Would get from cache/database
        nextUpdate: nextUpdate.toISOString(),
        cacheStats,
        isUpdateRequired
      };
    } catch (error) {
      this.logger.error('Error getting update status:', error.message);
      throw error;
    }
  }

  /**
   * Notify about update failures (could integrate with monitoring systems)
   */
  private async notifyUpdateFailure(session: string, error: Error): Promise<void> {
    // In production, this would integrate with monitoring systems like:
    // - Slack notifications
    // - Email alerts
    // - PagerDuty incidents
    // - Sentry error tracking
    
    this.logger.error(`🚨 ALERT: Scheduled update failed for ${session}:`, {
      session,
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
    
    // Future: Add actual notification logic here
    // await this.slackService.sendAlert(`Market data update failed for ${session}: ${error.message}`);
    // await this.emailService.sendAlert(error);
  }

  /**
   * Manual method to force update all data (for debugging)
   */
  async forceUpdateAll(): Promise<UpdateSummary> {
    this.logger.warn('🔧 Manual force update triggered');
    return await this.executeScheduledUpdate('market_close');
  }

  /**
   * Check if market is currently open (9:30 AM - 4:00 PM EST, Monday-Friday)
   */
  private isMarketHours(): boolean {
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = easternTime.getHours();
    const minute = easternTime.getMinutes();
    
    // Market is open Monday-Friday (1-5), 9:30 AM - 4:00 PM EST
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false; // Weekend
    }
    
    const timeInMinutes = hour * 60 + minute;
    const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM
    const marketCloseMinutes = 16 * 60;     // 4:00 PM
    
    return timeInMinutes >= marketOpenMinutes && timeInMinutes <= marketCloseMinutes;
  }

  /**
   * Update only S&P 500 sparkline data (for intraday updates)
   */
  private async updateSP500SparklineOnly(): Promise<SP500SparklineData> {
    try {
      const sp500Data = await this.alphaVantageService.getSP500SparklineData();
      
      await this.marketCacheService.cacheMarketData({
        dataType: 'sp500_sparkline',
        dataPayload: sp500Data,
        marketSession: 'intraday',
        apiSource: 'yahoo_finance_backup',
        expiryTimestamp: new Date(Date.now() + this.CACHE_TTL.sp500Sparkline * 1000)
      });

      this.logger.log(`⚡ SP500 intraday update: $${sp500Data.currentPrice} (${sp500Data.weeklyChange.toFixed(2)}%)`);
      return sp500Data;
    } catch (error) {
      this.logger.error('SP500 intraday update failed:', error.message);
      throw error;
    }
  }

  /**
   * Update only VIX data (for intraday updates)
   */
  private async updateVixDataOnly(): Promise<VixData> {
    try {
      const vixData = await this.alphaVantageService.getEnhancedVixData();
      
      await this.marketCacheService.cacheMarketData({
        dataType: 'vix_data',
        dataPayload: vixData,
        marketSession: 'intraday',
        apiSource: 'alpha_vantage',
        expiryTimestamp: new Date(Date.now() + this.CACHE_TTL.vixData * 1000)
      });

      this.logger.log(`⚡ VIX intraday update: ${vixData.value} (${vixData.status})`);
      return vixData;
    } catch (error) {
      this.logger.error('VIX intraday update failed:', error.message);
      throw error;
    }
  }
}