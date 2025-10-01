import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

export interface CacheEntry {
  id?: string;
  data_type: string;
  data_payload: any;
  market_session: string;
  cache_timestamp: string;
  expiry_timestamp: string;
  api_source: string;
  data_quality_score: number;
  created_at?: string;
  updated_at?: string;
}

export interface MarketIntelligenceCache {
  id?: string;
  market_date: string;
  session_type: string;
  market_summary: any;
  ai_insights?: string;
  confidence_score: number;
  data_sources: string[];
  generation_duration_ms: number;
  created_at?: string;
}

@Injectable()
export class MarketCacheService {
  private readonly logger = new Logger(MarketCacheService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Store market data in cache
   */
  async cacheMarketData(cacheData: {
    dataType: string;
    dataPayload: any;
    marketSession: string;
    apiSource: string;
    expiryTimestamp: Date;
    dataQualityScore?: number;
  }): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      const cacheEntry: CacheEntry = {
        data_type: cacheData.dataType,
        data_payload: cacheData.dataPayload,
        market_session: cacheData.marketSession,
        cache_timestamp: new Date().toISOString(),
        expiry_timestamp: cacheData.expiryTimestamp.toISOString(),
        api_source: cacheData.apiSource,
        data_quality_score:
          cacheData.dataQualityScore ||
          this.calculateDataQualityScore(cacheData.dataPayload),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('market_data_cache')
        .upsert(cacheEntry, {
          onConflict: 'data_type,market_session',
        });

      if (error) {
        this.logger.error('Failed to cache market data:', error.message);
        throw new Error(`Supabase cache error: ${error.message}`);
      }

      this.logger.log(
        `Successfully cached ${cacheData.dataType} data for ${cacheData.marketSession}`,
      );
    } catch (error) {
      this.logger.error('Error caching market data:', error.message);
      throw error;
    }
  }

  /**
   * Retrieve cached market data
   */
  async getCachedMarketData(
    dataType: string,
    marketSession?: string,
  ): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();

      let query = supabase
        .from('market_data_cache')
        .select('*')
        .eq('data_type', dataType);

      if (marketSession) {
        query = query.eq('market_session', marketSession);
      }

      query = query
        .gt('expiry_timestamp', new Date().toISOString())
        .order('cache_timestamp', { ascending: false })
        .limit(1);

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw error;
      }

      if (!this.isCacheValid(data)) {
        this.logger.warn(`Expired cache data found for ${dataType}`);
        return null;
      }

      this.logger.log(`Cache hit for ${dataType}`);
      await this.logCacheHit(dataType);

      return data.data_payload;
    } catch (error) {
      this.logger.warn(`Cache miss for ${dataType}:`, error.message);
      await this.logCacheMiss(dataType);
      return null;
    }
  }

  /**
   * Store market intelligence summary
   */
  async cacheMarketIntelligence(intelligenceData: {
    marketDate: string;
    sessionType: string;
    marketSummary: any;
    aiInsights?: string;
    confidenceScore: number;
    dataSources: string[];
    generationDuration: number;
  }): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      const intelligenceEntry: MarketIntelligenceCache = {
        market_date: intelligenceData.marketDate,
        session_type: intelligenceData.sessionType,
        market_summary: intelligenceData.marketSummary,
        ai_insights: intelligenceData.aiInsights,
        confidence_score: intelligenceData.confidenceScore,
        data_sources: intelligenceData.dataSources,
        generation_duration_ms: intelligenceData.generationDuration,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('market_intelligence_cache')
        .upsert(intelligenceEntry, {
          onConflict: 'market_date,session_type',
        });

      if (error) {
        this.logger.error(
          'Failed to cache market intelligence:',
          error.message,
        );
        throw new Error(`Intelligence cache error: ${error.message}`);
      }

      this.logger.log(
        `Successfully cached market intelligence for ${intelligenceData.marketDate} ${intelligenceData.sessionType}`,
      );
    } catch (error) {
      this.logger.error('Error caching market intelligence:', error.message);
      throw error;
    }
  }

  /**
   * Get cached market intelligence
   */
  async getCachedMarketIntelligence(marketDate?: string): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();
      const targetDate = marketDate || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('market_intelligence_cache')
        .select('*')
        .eq('market_date', targetDate)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw error;
      }

      this.logger.log(`Retrieved cached market intelligence for ${targetDate}`);
      return {
        ...data.market_summary,
        aiInsights: data.ai_insights,
        confidenceScore: data.confidence_score,
        cacheTimestamp: data.created_at,
        dataSources: data.data_sources,
      };
    } catch (error) {
      this.logger.warn(
        `No cached intelligence found for ${marketDate}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const supabase = this.supabaseService.getClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('market_data_cache')
        .delete()
        .lt('expiry_timestamp', now)
        .select('id');

      if (error) {
        this.logger.error('Failed to clean expired cache:', error.message);
        return 0;
      }

      const cleanedCount = data?.length || 0;
      this.logger.log(`Cleaned ${cleanedCount} expired cache entries`);
      return cleanedCount;
    } catch (error) {
      this.logger.error('Error cleaning expired cache:', error.message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    hitRate: number;
    expiredEntries: number;
    dataTypes: string[];
  }> {
    try {
      const supabase = this.supabaseService.getClient();

      // Get total cache entries
      const { count: totalEntries } = await supabase
        .from('market_data_cache')
        .select('*', { count: 'exact', head: true });

      // Get expired entries
      const { count: expiredEntries } = await supabase
        .from('market_data_cache')
        .select('*', { count: 'exact', head: true })
        .lt('expiry_timestamp', new Date().toISOString());

      // Get unique data types using distinct
      const { data: dataTypesData } = await supabase
        .from('market_data_cache')
        .select('data_type')
        .limit(100);

      const uniqueDataTypes = [
        ...new Set(dataTypesData?.map((row) => row.data_type) || []),
      ];
      const dataTypes = uniqueDataTypes;

      // Calculate hit rate from API usage logs
      const hitRate = await this.calculateHitRate();

      return {
        totalEntries: totalEntries || 0,
        hitRate,
        expiredEntries: expiredEntries || 0,
        dataTypes,
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error.message);
      return {
        totalEntries: 0,
        hitRate: 0,
        expiredEntries: 0,
        dataTypes: [],
      };
    }
  }

  /**
   * Check if current market session requires data update
   */
  isUpdateRequired(): boolean {
    const now = new Date();
    const easternTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
    );
    const currentHour = easternTime.getHours();
    const currentMinute = easternTime.getMinutes();
    const dayOfWeek = easternTime.getDay();

    // Only update during weekdays
    if (dayOfWeek < 1 || dayOfWeek > 5) {
      return false;
    }

    // Check if we're near market open (9:30 AM ET) or close (4:00 PM ET)
    const isNearMarketOpen =
      (currentHour === 9 && currentMinute >= 25) ||
      (currentHour === 10 && currentMinute <= 5);
    const isNearMarketClose =
      (currentHour === 15 && currentMinute >= 55) ||
      (currentHour === 16 && currentMinute <= 10);

    return isNearMarketOpen || isNearMarketClose;
  }

  /**
   * Get current market session
   */
  getCurrentMarketSession(): 'market_open' | 'market_close' | 'after_hours' {
    const now = new Date();
    const easternTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
    );
    const currentHour = easternTime.getHours();
    const currentMinute = easternTime.getMinutes();

    if (currentHour < 12) {
      return 'market_open';
    } else if (currentHour < 17) {
      return 'market_close';
    } else {
      return 'after_hours';
    }
  }

  /**
   * Helper methods
   */
  private isCacheValid(cacheData: CacheEntry): boolean {
    const now = new Date();
    const expiryTime = new Date(cacheData.expiry_timestamp);
    return now < expiryTime;
  }

  private calculateDataQualityScore(data: any): number {
    if (!data) return 0;

    let score = 50; // Base score

    // Check for presence of key data fields
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      score += Math.min(keys.length * 5, 30); // Up to 30 points for data completeness

      // Check for null/undefined values
      const validValues = keys.filter((key) => data[key] != null).length;
      const completenessRatio = validValues / keys.length;
      score += completenessRatio * 20; // Up to 20 points for data completeness
    }

    return Math.min(100, Math.max(0, score));
  }

  private async logCacheHit(dataType: string): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();
      await supabase.from('api_usage_log').insert({
        api_service: 'cache',
        endpoint: `/market/${dataType}`,
        cache_hit: true,
        cost_estimate: 0,
        user_trigger: true,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Don't let logging errors affect main functionality
      this.logger.warn('Failed to log cache hit:', error.message);
    }
  }

  private async logCacheMiss(dataType: string): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();
      await supabase.from('api_usage_log').insert({
        api_service: 'direct_api',
        endpoint: `/market/${dataType}`,
        cache_hit: false,
        cost_estimate: 0.02, // Estimated cost per API call
        user_trigger: true,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Don't let logging errors affect main functionality
      this.logger.warn('Failed to log cache miss:', error.message);
    }
  }

  private async calculateHitRate(): Promise<number> {
    try {
      const supabase = this.supabaseService.getClient();
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data } = await supabase
        .from('api_usage_log')
        .select('cache_hit')
        .gte('created_at', oneDayAgo.toISOString());

      if (!data || data.length === 0) return 0;

      const hits = data.filter((log) => log.cache_hit).length;
      return (hits / data.length) * 100;
    } catch (error) {
      this.logger.warn('Failed to calculate hit rate:', error.message);
      return 0;
    }
  }
}
