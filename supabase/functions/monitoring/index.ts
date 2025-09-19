// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Monitoring and alert interfaces
interface MonitoringQuery {
  action: string;
  timeRange?: number;    // Hours to look back
  alertLevel?: 'info' | 'warning' | 'error' | 'critical';
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  components: {
    database: ComponentHealth;
    dataCollection: ComponentHealth;
    cache: ComponentHealth;
    apis: ComponentHealth;
  };
  metrics: SystemMetrics;
  alerts: Alert[];
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'failed';
  lastCheck: string;
  uptime: number;
  metrics: Record<string, number>;
  issues: string[];
}

interface SystemMetrics {
  cacheHitRate: number;
  avgDataAge: number;
  totalIndicators: number;
  freshIndicators: number;
  staleIndicators: number;
  failedCollections: number;
  apiCalls24h: number;
  avgResponseTime: number;
}

interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  details: Record<string, unknown>;
}

interface PerformanceMetric {
  metric_name: string;
  metric_value: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://fwnmnjwtbggasmunsfyk.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Health check for database connectivity
async function checkDatabaseHealth(): Promise<ComponentHealth> {
  const startTime = Date.now();
  const issues: string[] = [];

  try {
    // Test basic connectivity
    const { data: connTest, error: connError } = await supabase
      .from('market_indicators_cache')
      .select('id')
      .limit(1);

    if (connError) {
      issues.push(`Database connection failed: ${connError.message}`);
      return {
        status: 'failed',
        lastCheck: new Date().toISOString(),
        uptime: 0,
        metrics: { responseTime: Date.now() - startTime },
        issues
      };
    }

    // Test cache function availability
    const { data: funcTest, error: funcError } = await supabase
      .rpc('get_latest_market_indicator', { p_indicator_type: 'sp500' });

    if (funcError) {
      issues.push(`Cache function unavailable: ${funcError.message}`);
    }

    const responseTime = Date.now() - startTime;
    const status = issues.length === 0 ? 'healthy' : 'degraded';

    return {
      status,
      lastCheck: new Date().toISOString(),
      uptime: responseTime < 1000 ? 100 : 80,
      metrics: {
        responseTime,
        connectionPoolSize: 10, // Default pool size
        activeConnections: 1
      },
      issues
    };

  } catch (error) {
    return {
      status: 'failed',
      lastCheck: new Date().toISOString(),
      uptime: 0,
      metrics: { responseTime: Date.now() - startTime },
      issues: [`Database health check failed: ${error.message}`]
    };
  }
}

// Health check for data collection system
async function checkDataCollectionHealth(): Promise<ComponentHealth> {
  const startTime = Date.now();
  const issues: string[] = [];

  try {
    // Check recent collection activity (last 24 hours)
    const { data: recentCollections, error: collectionError } = await supabase
      .from('market_indicators_cache')
      .select('created_at, indicator_type')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (collectionError) {
      issues.push(`Collection query failed: ${collectionError.message}`);
      return {
        status: 'failed',
        lastCheck: new Date().toISOString(),
        uptime: 0,
        metrics: { responseTime: Date.now() - startTime },
        issues
      };
    }

    const collectionsCount = recentCollections?.length || 0;
    const expectedDailyCollections = 12; // 2 times per day * 6 indicators
    const collectionRate = (collectionsCount / expectedDailyCollections) * 100;

    // Check if we have recent data (within last 12 hours)
    const lastCollection = recentCollections?.[0]?.created_at;
    const hoursSinceLastCollection = lastCollection
      ? (Date.now() - new Date(lastCollection).getTime()) / (1000 * 60 * 60)
      : 999;

    if (hoursSinceLastCollection > 12) {
      issues.push(`No data collection in ${Math.round(hoursSinceLastCollection)} hours`);
    }

    if (collectionRate < 50) {
      issues.push(`Low collection rate: ${Math.round(collectionRate)}% of expected`);
    }

    const status = issues.length === 0 ? 'healthy' :
                   issues.length === 1 ? 'degraded' : 'failed';

    return {
      status,
      lastCheck: new Date().toISOString(),
      uptime: Math.max(0, 100 - issues.length * 25),
      metrics: {
        responseTime: Date.now() - startTime,
        collectionsLast24h: collectionsCount,
        collectionRate: Math.round(collectionRate),
        hoursSinceLastCollection: Math.round(hoursSinceLastCollection)
      },
      issues
    };

  } catch (error) {
    return {
      status: 'failed',
      lastCheck: new Date().toISOString(),
      uptime: 0,
      metrics: { responseTime: Date.now() - startTime },
      issues: [`Data collection health check failed: ${error.message}`]
    };
  }
}

// Health check for cache performance
async function checkCacheHealth(): Promise<ComponentHealth> {
  const startTime = Date.now();
  const issues: string[] = [];

  try {
    // Get cache statistics
    const { data: cacheStats, error: statsError } = await supabase
      .from('market_indicators_cache')
      .select('indicator_type, created_at, age_seconds')
      .eq('is_active', true);

    if (statsError) {
      issues.push(`Cache stats query failed: ${statsError.message}`);
      return {
        status: 'failed',
        lastCheck: new Date().toISOString(),
        uptime: 0,
        metrics: { responseTime: Date.now() - startTime },
        issues
      };
    }

    const totalIndicators = cacheStats?.length || 0;
    const maxAge = 12 * 3600; // 12 hours in seconds

    let freshCount = 0;
    let staleCount = 0;
    let totalAge = 0;

    cacheStats?.forEach(indicator => {
      const age = indicator.age_seconds || 0;
      totalAge += age;

      if (age < maxAge) {
        freshCount++;
      } else {
        staleCount++;
      }
    });

    const avgAge = totalIndicators > 0 ? totalAge / totalIndicators : 0;
    const cacheHitRate = totalIndicators > 0 ? (freshCount / totalIndicators) * 100 : 0;

    if (cacheHitRate < 70) {
      issues.push(`Low cache hit rate: ${Math.round(cacheHitRate)}%`);
    }

    if (avgAge > maxAge) {
      issues.push(`High average data age: ${Math.round(avgAge / 3600)} hours`);
    }

    if (totalIndicators < 5) {
      issues.push(`Insufficient cached indicators: ${totalIndicators}`);
    }

    const status = issues.length === 0 ? 'healthy' :
                   issues.length <= 1 ? 'degraded' : 'failed';

    return {
      status,
      lastCheck: new Date().toISOString(),
      uptime: Math.max(0, 100 - issues.length * 20),
      metrics: {
        responseTime: Date.now() - startTime,
        totalIndicators,
        freshIndicators: freshCount,
        staleIndicators: staleCount,
        cacheHitRate: Math.round(cacheHitRate),
        avgDataAge: Math.round(avgAge / 3600)
      },
      issues
    };

  } catch (error) {
    return {
      status: 'failed',
      lastCheck: new Date().toISOString(),
      uptime: 0,
      metrics: { responseTime: Date.now() - startTime },
      issues: [`Cache health check failed: ${error.message}`]
    };
  }
}

// Health check for external APIs
async function checkApiHealth(): Promise<ComponentHealth> {
  const startTime = Date.now();
  const issues: string[] = [];

  try {
    // Check API availability by testing collection endpoints
    const testResults = {
      alphaVantage: false,
      fred: false,
      alternative: false
    };

    // Test Alpha Vantage (if key is available)
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=demo`,
        { signal: AbortSignal.timeout(5000) }
      );
      testResults.alphaVantage = response.ok;
    } catch {
      issues.push('Alpha Vantage API unreachable');
    }

    // Test FRED API
    try {
      const response = await fetch(
        'https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=demo&file_type=json&limit=1',
        { signal: AbortSignal.timeout(5000) }
      );
      testResults.fred = response.ok;
    } catch {
      issues.push('FRED API unreachable');
    }

    // Test Alternative.me API
    try {
      const response = await fetch(
        'https://api.alternative.me/fng/',
        { signal: AbortSignal.timeout(5000) }
      );
      testResults.alternative = response.ok;
    } catch {
      issues.push('Alternative.me API unreachable');
    }

    const apiCount = Object.values(testResults).filter(Boolean).length;
    const apiAvailability = (apiCount / 3) * 100;

    if (apiAvailability < 67) {
      issues.push(`Low API availability: ${Math.round(apiAvailability)}%`);
    }

    const status = apiAvailability >= 67 ? 'healthy' :
                   apiAvailability >= 33 ? 'degraded' : 'failed';

    return {
      status,
      lastCheck: new Date().toISOString(),
      uptime: Math.round(apiAvailability),
      metrics: {
        responseTime: Date.now() - startTime,
        apiAvailability: Math.round(apiAvailability),
        alphaVantageStatus: testResults.alphaVantage ? 1 : 0,
        fredStatus: testResults.fred ? 1 : 0,
        alternativeStatus: testResults.alternative ? 1 : 0
      },
      issues
    };

  } catch (error) {
    return {
      status: 'failed',
      lastCheck: new Date().toISOString(),
      uptime: 0,
      metrics: { responseTime: Date.now() - startTime },
      issues: [`API health check failed: ${error.message}`]
    };
  }
}

// Generate alerts based on component health
function generateAlerts(components: SystemHealth['components']): Alert[] {
  const alerts: Alert[] = [];

  Object.entries(components).forEach(([componentName, health]) => {
    health.issues.forEach((issue, index) => {
      const level: Alert['level'] =
        health.status === 'failed' ? 'critical' :
        health.status === 'degraded' ? 'warning' : 'info';

      alerts.push({
        id: `${componentName}-${index}-${Date.now()}`,
        level,
        component: componentName,
        message: issue,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        details: {
          componentStatus: health.status,
          uptime: health.uptime,
          metrics: health.metrics
        }
      });
    });
  });

  return alerts;
}

// Log performance metrics to database
async function logPerformanceMetric(name: string, value: number, metadata?: Record<string, unknown>) {
  try {
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        metric_name: name,
        metric_value: value,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error(`Failed to log metric ${name}:`, error.message);
    }
  } catch (error) {
    console.error(`Exception logging metric ${name}:`, error);
  }
}

// Comprehensive system health check
async function performSystemHealthCheck(): Promise<SystemHealth> {
  console.log('🔍 Starting comprehensive system health check...');

  const startTime = Date.now();

  // Run all health checks in parallel
  const [database, dataCollection, cache, apis] = await Promise.all([
    checkDatabaseHealth(),
    checkDataCollectionHealth(),
    checkCacheHealth(),
    checkApiHealth()
  ]);

  const components = { database, dataCollection, cache, apis };

  // Determine overall system status
  const componentStatuses = Object.values(components).map(c => c.status);
  const overallStatus: SystemHealth['status'] =
    componentStatuses.includes('failed') ? 'critical' :
    componentStatuses.includes('degraded') ? 'warning' : 'healthy';

  // Calculate system metrics
  const metrics: SystemMetrics = {
    cacheHitRate: cache.metrics.cacheHitRate || 0,
    avgDataAge: cache.metrics.avgDataAge || 0,
    totalIndicators: cache.metrics.totalIndicators || 0,
    freshIndicators: cache.metrics.freshIndicators || 0,
    staleIndicators: cache.metrics.staleIndicators || 0,
    failedCollections: 0, // Would be calculated from error logs
    apiCalls24h: dataCollection.metrics.collectionsLast24h || 0,
    avgResponseTime: Math.round((database.metrics.responseTime + cache.metrics.responseTime) / 2)
  };

  // Generate alerts
  const alerts = generateAlerts(components);

  // Log key metrics
  await Promise.all([
    logPerformanceMetric('system_health_check_duration', Date.now() - startTime),
    logPerformanceMetric('cache_hit_rate', metrics.cacheHitRate),
    logPerformanceMetric('avg_data_age_hours', metrics.avgDataAge),
    logPerformanceMetric('total_indicators', metrics.totalIndicators),
    logPerformanceMetric('system_alerts_count', alerts.length)
  ]);

  const healthReport: SystemHealth = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    components,
    metrics,
    alerts
  };

  console.log(`🏥 Health check completed in ${Date.now() - startTime}ms`);
  console.log(`📊 System status: ${overallStatus.toUpperCase()}`);
  console.log(`🚨 Active alerts: ${alerts.length}`);

  return healthReport;
}

// Get historical performance metrics
async function getPerformanceMetrics(timeRangeHours: number = 24): Promise<PerformanceMetric[]> {
  try {
    const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to retrieve performance metrics:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception retrieving performance metrics:', error);
    return [];
  }
}

// Main request handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const query: MonitoringQuery = await req.json();

    if (query.action === 'health_check') {
      const healthReport = await performSystemHealthCheck();

      return new Response(JSON.stringify(healthReport), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });

    } else if (query.action === 'performance_metrics') {
      const timeRange = query.timeRange || 24;
      const metrics = await getPerformanceMetrics(timeRange);

      return new Response(JSON.stringify({
        metrics,
        timeRange,
        count: metrics.length
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60'
        }
      });

    } else {
      return new Response(JSON.stringify({
        error: 'Invalid action. Use "health_check" or "performance_metrics"'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

  } catch (error) {
    console.error('Monitoring function error:', error.message);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});