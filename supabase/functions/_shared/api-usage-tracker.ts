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
  private logToConsole(
    options: ApiCallOptions,
    responseTime: number,
    success: boolean,
    errorType?: string,
    rateLimitRemaining?: number
  ): void {
    const timestamp = new Date().toISOString();
    const status = success ? '✅ SUCCESS' : `❌ FAILED (${errorType})`;

    console.log(`
🔍 API USAGE DEBUG | ${timestamp}
   Provider: ${options.provider}
   Endpoint: ${options.endpoint}
   Indicator: ${options.indicatorType || 'N/A'}
   Function: ${options.functionName}
   Status: ${status}
   Response Time: ${responseTime}ms
   Rate Limit Remaining: ${rateLimitRemaining ?? 'Unknown'}
   Environment: ${this.getEnvironmentSource()}
   ----------------------------------------`);
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
    let query = this.supabase
      .from('api_usage_debug')
      .select('*')
      .order('date_tracked', { ascending: false });

    if (provider) {
      query = query.eq('api_provider', provider);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get usage stats: ${error.message}`);
    }

    return data || [];
  }

  // Get real-time usage
  async getRealtimeUsage(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('api_usage_realtime')
      .select('*')
      .order('last_request_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get realtime usage: ${error.message}`);
    }

    return data || [];
  }

  // Check if API is rate limited
  async isRateLimited(provider: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('api_usage_realtime')
      .select('is_rate_limited, rate_limit_reset_at')
      .eq('api_provider', provider)
      .single();

    if (error || !data) return false;

    // Check if still rate limited
    if (data.is_rate_limited && data.rate_limit_reset_at) {
      const resetTime = new Date(data.rate_limit_reset_at);
      return new Date() < resetTime;
    }

    return data.is_rate_limited || false;
  }

  // Get usage summary for debugging
  async getUsageSummary(): Promise<{
    today: any[],
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

    return {
      today: todayStats.filter(stat =>
        stat.date_tracked === new Date().toISOString().split('T')[0]
      ),
      realtime: realtimeStats,
      rateLimited
    };
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