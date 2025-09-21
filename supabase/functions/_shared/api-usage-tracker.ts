// API Usage Tracking System
// Professional-grade tracking for API key usage, rate limits, and performance

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Types for usage tracking
interface ApiUsageLog {
  api_provider: string;
  api_key_hash?: string;
  endpoint: string;
  indicator_type?: string;
  response_status?: number;
  response_time_ms?: number;
  success: boolean;
  rate_limit_remaining?: number;
  rate_limit_reset?: Date;
  error_type?: string;
  error_message?: string;
  function_name: string;
  user_agent?: string;
  source?: string;
}

interface ApiCallOptions {
  provider: string;
  endpoint: string;
  indicatorType?: string;
  apiKey?: string;
  functionName: string;
  userAgent?: string;
}

// Initialize Supabase client for logging
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://fwnmnjwtbggasmunsfyk.supabase.co';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || '';

  return createClient(supabaseUrl, serviceKey);
}

// Hash API key for privacy (only store hash, not actual key)
async function hashApiKey(apiKey: string): Promise<string> {
  if (!apiKey) return '';

  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 64);
}

// In-memory debug storage for production environments
interface DebugInfo {
  timestamp: string;
  provider: string;
  endpoint: string;
  indicatorType: string;
  functionName: string;
  success: boolean;
  responseTime: number;
  errorType?: string;
  rateLimitRemaining?: number;
  environment: string;
}

// Global debug storage (reset on function restart)
const debugLog: DebugInfo[] = [];
const MAX_DEBUG_ENTRIES = 100; // Keep last 100 entries

// Professional API usage tracker
export class ApiUsageTracker {
  private supabase;
  private isEnabled: boolean;

  constructor() {
    this.supabase = getSupabaseClient();
    this.isEnabled = Deno.env.get('DISABLE_API_TRACKING') !== 'true';
  }

  // Track API call with comprehensive metrics
  async trackApiCall<T>(
    options: ApiCallOptions,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const timestamp = new Date();

    let result: T;
    let success = false;
    let responseStatus: number | undefined;
    let errorType: string | undefined;
    let errorMessage: string | undefined;
    let rateLimitRemaining: number | undefined;
    let rateLimitReset: Date | undefined;

    try {
      console.log(`📡 API Call: ${options.provider} -> ${options.endpoint} (${options.indicatorType || 'unknown'})`);

      result = await apiCall();
      success = true;
      responseStatus = 200;

      console.log(`✅ API Success: ${options.provider} in ${Math.round(performance.now() - startTime)}ms`);

    } catch (error) {
      // Parse different error types
      if (error.message?.includes('rate limit') || error.message?.includes('Too Many Requests')) {
        errorType = 'rate_limit';
        responseStatus = 429;
        console.warn(`🚫 Rate Limit Hit: ${options.provider} -> ${options.endpoint}`);
      } else if (error.message?.includes('unauthorized') || error.message?.includes('Invalid API key')) {
        errorType = 'auth_error';
        responseStatus = 401;
        console.error(`🔑 Auth Error: ${options.provider} -> ${options.endpoint}`);
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorType = 'network_error';
        responseStatus = 0;
        console.error(`🌐 Network Error: ${options.provider} -> ${options.endpoint}`);
      } else {
        errorType = 'unknown_error';
        responseStatus = 500;
        console.error(`❌ Unknown Error: ${options.provider} -> ${error.message}`);
      }

      errorMessage = error.message;

      // Extract rate limit info from headers if available
      if (error.response?.headers) {
        const remaining = error.response.headers.get('x-ratelimit-remaining');
        const reset = error.response.headers.get('x-ratelimit-reset');

        if (remaining) rateLimitRemaining = parseInt(remaining);
        if (reset) rateLimitReset = new Date(parseInt(reset) * 1000);
      }

      throw error; // Re-throw to maintain original behavior
    } finally {
      const responseTime = Math.round(performance.now() - startTime);

      // Log usage to database (async, don't block)
      if (this.isEnabled) {
        this.logUsage({
          api_provider: options.provider,
          api_key_hash: options.apiKey ? await hashApiKey(options.apiKey) : undefined,
          endpoint: options.endpoint,
          indicator_type: options.indicatorType,
          response_status: responseStatus,
          response_time_ms: responseTime,
          success,
          rate_limit_remaining: rateLimitRemaining,
          rate_limit_reset: rateLimitReset,
          error_type: errorType,
          error_message: errorMessage,
          function_name: options.functionName,
          user_agent: options.userAgent,
          source: this.getEnvironmentSource()
        }).catch(logError => {
          console.error('Failed to log API usage:', logError.message);
        });
      }

      // Always log to console for immediate debugging
      this.logToConsole(options, responseTime, success, errorType, rateLimitRemaining);

      // Store debug info in memory for dashboard access (all environments)
      this.storeDebugInfo(options, responseTime, success, errorType, rateLimitRemaining);
    }

    return result!;
  }

  // Log to database
  private async logUsage(log: ApiUsageLog): Promise<void> {
    const { error } = await this.supabase
      .from('api_usage_log')
      .insert([log]);

    if (error) {
      throw new Error(`Failed to log API usage: ${error.message}`);
    }
  }

  // Enhanced console logging with structured format
  // Use console.info for better visibility in production environments
  private logToConsole(
    options: ApiCallOptions,
    responseTime: number,
    success: boolean,
    errorType?: string,
    rateLimitRemaining?: number
  ): void {
    const timestamp = new Date().toISOString();
    const status = success ? '✅ SUCCESS' : `❌ FAILED (${errorType})`;
    const environment = this.getEnvironmentSource();

    // Use console.info for production visibility, with fallback to console.log
    const logMessage = `
🔍 API USAGE DEBUG | ${timestamp}
   Provider: ${options.provider}
   Endpoint: ${options.endpoint}
   Indicator: ${options.indicatorType || 'N/A'}
   Function: ${options.functionName}
   Status: ${status}
   Response Time: ${responseTime}ms
   Rate Limit Remaining: ${rateLimitRemaining ?? 'Unknown'}
   Environment: ${environment}
   ----------------------------------------`;

    // Try different logging levels to ensure visibility in production
    try {
      if (environment === 'production') {
        // In production, use console.info for better visibility
        console.info(`[API_DEBUG]${logMessage}`);
        // Also log as warning for critical information
        if (!success || (rateLimitRemaining && rateLimitRemaining < 5)) {
          console.warn(`[API_ALERT] ${options.provider}: ${status} (${rateLimitRemaining} calls remaining)`);
        }
      } else {
        // In local/staging, use console.log as before
        console.log(logMessage);
      }
    } catch (e) {
      // Fallback to basic console.log if console.info fails
      console.log(logMessage);
    }
  }

  // Store debug info in memory for production dashboard access
  private storeDebugInfo(
    options: ApiCallOptions,
    responseTime: number,
    success: boolean,
    errorType?: string,
    rateLimitRemaining?: number
  ): void {
    const debugInfo: DebugInfo = {
      timestamp: new Date().toISOString(),
      provider: options.provider,
      endpoint: options.endpoint,
      indicatorType: options.indicatorType || 'N/A',
      functionName: options.functionName,
      success,
      responseTime,
      errorType,
      rateLimitRemaining,
      environment: this.getEnvironmentSource()
    };

    // Add to beginning of array
    debugLog.unshift(debugInfo);

    // Keep only the latest entries
    if (debugLog.length > MAX_DEBUG_ENTRIES) {
      debugLog.splice(MAX_DEBUG_ENTRIES);
    }
  }

  // Get recent debug logs (for dashboard)
  getRecentDebugLogs(limit: number = 50): DebugInfo[] {
    return debugLog.slice(0, limit);
  }

  // Get current environment
  private getEnvironmentSource(): string {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';

    if (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')) {
      return 'local';
    } else if (supabaseUrl.includes('staging')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  // Get daily usage statistics
  async getDailyUsageStats(provider?: string): Promise<any[]> {
    try {
      let query = this.supabase
        .from('api_usage_debug')
        .select('*')
        .order('date_tracked', { ascending: false });

      if (provider) {
        query = query.eq('api_provider', provider);
      }

      const { data, error } = await query;

      if (error) {
        console.warn(`Database query failed: ${error.message}. Returning empty data.`);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn(`getDailyUsageStats error: ${error.message}. Returning empty data.`);
      return [];
    }
  }

  // Get real-time usage
  async getRealtimeUsage(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('api_usage_realtime')
        .select('*')
        .order('last_request_at', { ascending: false });

      if (error) {
        console.warn(`Database query failed: ${error.message}. Returning empty data.`);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn(`getRealtimeUsage error: ${error.message}. Returning empty data.`);
      return [];
    }
  }

  // Check if API is rate limited
  async isRateLimited(provider: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('api_usage_realtime')
        .select('is_rate_limited, rate_limit_reset_at')
        .eq('api_provider', provider)
        .single();

      if (error || !data) {
        console.warn(`Could not check rate limit for ${provider}: ${error?.message || 'No data'}. Assuming not rate limited.`);
        return false;
      }

      // Check if still rate limited
      if (data.is_rate_limited && data.rate_limit_reset_at) {
        const resetTime = new Date(data.rate_limit_reset_at);
        return new Date() < resetTime;
      }

      return data.is_rate_limited || false;
    } catch (error) {
      console.warn(`isRateLimited error for ${provider}: ${error.message}. Assuming not rate limited.`);
      return false;
    }
  }

  // Get comprehensive usage summary with proper aggregation
  async getUsageSummary(): Promise<{
    today: any[],
    weekly: any[],
    monthly: any[],
    realtime: any[],
    rateLimited: string[]
  }> {
    const [todayStats, realtimeStats] = await Promise.all([
      this.getDailyUsageStats(),
      this.getRealtimeUsage()
    ]);

    const rateLimited = realtimeStats
      .filter(stat => stat.is_rate_limited)
      .map(stat => stat.api_provider);

    // Aggregate today's stats by provider to avoid duplicates
    const todayDate = new Date().toISOString().split('T')[0];
    const todayFiltered = todayStats.filter(stat => stat.date_tracked === todayDate);

    const todayAggregated = this.aggregateStatsByProvider(todayFiltered);

    // Get weekly and monthly aggregations
    const weeklyAggregated = this.getWeeklyAggregation(todayStats);
    const monthlyAggregated = this.getMonthlyAggregation(todayStats);

    return {
      today: todayAggregated,
      weekly: weeklyAggregated,
      monthly: monthlyAggregated,
      realtime: realtimeStats,
      rateLimited
    };
  }

  // Aggregate statistics by provider to remove duplicates
  private aggregateStatsByProvider(stats: any[]): any[] {
    const providerMap = new Map();

    stats.forEach(stat => {
      const key = stat.api_provider;
      if (providerMap.has(key)) {
        const existing = providerMap.get(key);
        existing.total_requests += stat.total_requests || 0;
        existing.successful_requests += stat.successful_requests || 0;
        existing.failed_requests += stat.failed_requests || 0;
        existing.rate_limited_requests += stat.rate_limited_requests || 0;

        // Average response time calculation
        const totalTime = (existing.avg_response_time_ms * existing.request_count) +
                         (stat.avg_response_time_ms * stat.total_requests);
        existing.request_count += stat.total_requests;
        existing.avg_response_time_ms = totalTime / existing.request_count;

        // Keep latest timestamp
        if (stat.last_request_at &&
            (!existing.last_request_at || stat.last_request_at > existing.last_request_at)) {
          existing.last_request_at = stat.last_request_at;
        }
      } else {
        providerMap.set(key, {
          ...stat,
          request_count: stat.total_requests || 0
        });
      }
    });

    return Array.from(providerMap.values()).map(stat => {
      // Calculate final metrics
      const successRate = stat.total_requests > 0
        ? (stat.successful_requests / stat.total_requests * 100).toFixed(1)
        : '0';

      // Calculate usage percentage based on known limits
      const dailyLimits = {
        'alpha_vantage': 25,
        'fred': 1000,
        'twelve_data': 100,
        'yahoo_finance': 10000,
        'alternative_me': 1000
      };

      const limit = dailyLimits[stat.api_provider] || null;
      const usage_percentage = limit ? (stat.total_requests / limit * 100).toFixed(1) : null;

      return {
        ...stat,
        success_rate: successRate,
        usage_percentage: usage_percentage,
        daily_limit: limit
      };
    });
  }

  // Get weekly aggregation (last 7 days)
  private getWeeklyAggregation(allStats: any[]): any[] {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const weeklyStats = allStats.filter(stat => stat.date_tracked >= weekAgoStr);
    return this.aggregateStatsByProvider(weeklyStats);
  }

  // Get monthly aggregation (last 30 days)
  private getMonthlyAggregation(allStats: any[]): any[] {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    const monthlyStats = allStats.filter(stat => stat.date_tracked >= monthAgoStr);
    return this.aggregateStatsByProvider(monthlyStats);
  }
}

// Singleton instance
export const apiTracker = new ApiUsageTracker();

// Convenience wrapper for tracking API calls
export async function trackApiCall<T>(
  provider: string,
  endpoint: string,
  functionName: string,
  apiCall: () => Promise<T>,
  options: {
    indicatorType?: string;
    apiKey?: string;
    userAgent?: string;
  } = {}
): Promise<T> {
  return apiTracker.trackApiCall(
    {
      provider,
      endpoint,
      functionName,
      ...options
    },
    apiCall
  );
}