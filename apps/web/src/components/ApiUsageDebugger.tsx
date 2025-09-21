'use client';

import React, { useState, useEffect } from 'react';
import { edgeFunctionFetcher } from '@/lib/api-utils';

interface ApiUsageStats {
  api_provider: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  usage_percentage: number;
  last_request_at: string;
}

interface RealtimeData {
  api_provider: string;
  requests_today: number;
  requests_this_hour: number;
  health_status: string;
}

interface ApiUsageData {
  today: ApiUsageStats[];
  weekly: ApiUsageStats[];
  monthly: ApiUsageStats[];
  realtime: RealtimeData[];
  rateLimited: string[];
}

interface FormattedApiUsageStats {
  provider: string;
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  usagePercentage: number;
  lastRequest: string;
  status: 'healthy' | 'warning' | 'error';
}

type TimePeriod = 'today' | 'weekly' | 'monthly';

export default function ApiUsageDebugger() {
  const [usageData, setUsageData] = useState<ApiUsageData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchUsageData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch from local first, then production
      let data: ApiUsageData;
      try {
        data = await edgeFunctionFetcher<ApiUsageData>('api-usage-dashboard', {
          action: 'summary'
        });
      } catch {
        console.warn('Local API failed, trying alternative methods');
        // Alternative: direct database query or mock data
        data = await getMockUsageData();
      }

      setUsageData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage data');
      console.error('API Usage fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for testing when API is not available
  const getMockUsageData = async (): Promise<ApiUsageData> => {
    const todayData = [
      {
        api_provider: 'alternative_me',
        total_requests: 5,
        successful_requests: 5,
        failed_requests: 0,
        avg_response_time_ms: 350,
        usage_percentage: 5.0,
        last_request_at: new Date().toISOString()
      },
      {
        api_provider: 'alpha_vantage',
        total_requests: 3,
        successful_requests: 2,
        failed_requests: 1,
        avg_response_time_ms: 1200,
        usage_percentage: 12.0,
        last_request_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    return {
      today: todayData,
      weekly: todayData.map(item => ({
        ...item,
        total_requests: item.total_requests * 7,
        successful_requests: item.successful_requests * 7,
        failed_requests: item.failed_requests * 7
      })),
      monthly: todayData.map(item => ({
        ...item,
        total_requests: item.total_requests * 30,
        successful_requests: item.successful_requests * 30,
        failed_requests: item.failed_requests * 30
      })),
      realtime: [
        {
          api_provider: 'alternative_me',
          requests_today: 5,
          requests_this_hour: 2,
          health_status: 'healthy'
        },
        {
          api_provider: 'alpha_vantage',
          requests_today: 3,
          requests_this_hour: 1,
          health_status: 'warning'
        }
      ],
      rateLimited: []
    };
  };

  const fetchUsageDataCallback = React.useCallback(fetchUsageData, []);

  useEffect(() => {
    fetchUsageDataCallback();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchUsageDataCallback, 30000);
    return () => clearInterval(interval);
  }, [fetchUsageDataCallback]);

  const formatUsageStats = (data: ApiUsageData, period: TimePeriod = 'today'): FormattedApiUsageStats[] => {
    const statsData = data[period] || data.today;
    return statsData.map(item => ({
      provider: item.api_provider,
      totalRequests: item.total_requests || 0,
      successRate: item.total_requests > 0
        ? Math.round((item.successful_requests / item.total_requests) * 100)
        : 0,
      avgResponseTime: Math.round(item.avg_response_time_ms || 0),
      usagePercentage: item.usage_percentage || 0,
      lastRequest: item.last_request_at ? formatCompactTime(new Date(item.last_request_at)) : 'Never',
      status: item.failed_requests > item.successful_requests ? 'error'
             : item.usage_percentage > 80 ? 'warning'
             : 'healthy'
    }));
  };

  // Enhanced time formatting with date and relative time
  const formatDetailedTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Show relative time if recent
    let relativeTime = '';
    if (diffMinutes < 1) {
      relativeTime = 'just now';
    } else if (diffMinutes < 60) {
      relativeTime = `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      relativeTime = `${diffDays}d ago`;
    }

    // Format date and time
    const isToday = date.toDateString() === now.toDateString();
    const dateStr = isToday ? 'Today' : date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return `${dateStr} ${timeStr} (${relativeTime})`;
  };

  // Compact time format for provider cards
  const formatCompactTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    }
  };

  // Predict next update time based on provider patterns
  const getNextUpdateInfo = (provider: string, lastRequest: string): string => {
    if (!lastRequest || lastRequest === 'Never') return 'Unknown';

    const lastUpdate = new Date(lastRequest);
    const now = new Date();

    // Provider-specific update intervals
    const intervals = {
      'alternative_me': 24 * 60 * 60 * 1000, // 24 hours
      'alpha_vantage': 12 * 60 * 60 * 1000,  // 12 hours
      'yahoo_finance': 6 * 60 * 60 * 1000,    // 6 hours
      'default': 12 * 60 * 60 * 1000           // 12 hours default
    };

    const interval = intervals[provider as keyof typeof intervals] || intervals.default;
    const nextUpdate = new Date(lastUpdate.getTime() + interval);

    // Check if next update is due
    if (now >= nextUpdate) {
      return 'Due now';
    }

    const timeUntil = nextUpdate.getTime() - now.getTime();
    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursUntil > 0) {
      return `${hoursUntil}h ${minutesUntil}m`;
    } else {
      return `${minutesUntil}m`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  // Calculate overall success rate for a period
  const calculateOverallSuccessRate = (stats: ApiUsageStats[]): number => {
    const totalRequests = stats.reduce((sum, item) => sum + (item.total_requests || 0), 0);
    const totalSuccess = stats.reduce((sum, item) => sum + (item.successful_requests || 0), 0);
    return totalRequests > 0 ? Math.round((totalSuccess / totalRequests) * 100) : 0;
  };

  // Analyze usage trends between periods
  const getTrendAnalysis = (data: ApiUsageData, period: TimePeriod) => {
    const currentData = data[period] || [];
    const todayData = data.today || [];

    return currentData.map(item => {
      const todayItem = todayData.find(t => t.api_provider === item.api_provider);
      if (!todayItem) {
        return { provider: item.api_provider, trend: 'stable', change: 'N/A' };
      }

      const periodAverage = period === 'weekly'
        ? (item.total_requests || 0) / 7
        : (item.total_requests || 0) / 30;

      const todayRequests = todayItem.total_requests || 0;
      const difference = todayRequests - periodAverage;
      const percentChange = periodAverage > 0 ? Math.round((difference / periodAverage) * 100) : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(percentChange) > 20) {
        trend = percentChange > 0 ? 'up' : 'down';
      }

      return {
        provider: item.api_provider,
        trend,
        change: `${percentChange > 0 ? '+' : ''}${percentChange}%`
      };
    });
  };

  if (loading && !usageData) {
    return (
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Loading API usage data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">🚀 API Usage Debug</h3>
          <button
            onClick={fetchUsageData}
            disabled={loading}
            className="text-white hover:text-gray-200 transition-colors"
          >
            {loading ? '🔄' : '↻'}
          </button>
        </div>
        {lastUpdate && (
          <p className="text-xs opacity-90">
            Last update: {formatDetailedTime(lastUpdate)}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {error ? (
          <div className="text-red-600 text-sm">
            <p className="font-medium">Error:</p>
            <p className="text-xs">{error}</p>
            <button
              onClick={fetchUsageData}
              className="mt-2 text-blue-600 hover:text-blue-800 text-xs underline"
            >
              Retry
            </button>
          </div>
        ) : usageData ? (
          <div className="space-y-3">
            {/* Time Period Selector */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 text-xs">
              {(['today', 'weekly', 'monthly'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`flex-1 py-1 px-2 rounded-md font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {period === 'today' ? 'Today' : period === 'weekly' ? 'Week' : 'Month'}
                </button>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <p className="font-medium text-gray-700">
                  {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'weekly' ? 'This Week' : 'This Month'}
                </p>
                <p className="text-lg font-bold text-blue-600">
                  {(usageData[selectedPeriod] || usageData.today).reduce((sum, item) => sum + (item.total_requests || 0), 0)}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="font-medium text-gray-700">Success Rate</p>
                <p className="text-lg font-bold text-green-600">
                  {calculateOverallSuccessRate(usageData[selectedPeriod] || usageData.today)}%
                </p>
              </div>
            </div>

            {/* Provider Details */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 text-sm">Provider Status</h4>
              {formatUsageStats(usageData, selectedPeriod).map((stat, index) => (
                <div key={index} className="border border-gray-100 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-800">
                      {stat.provider}
                    </span>
                    <span className={`text-sm ${getStatusColor(stat.status)}`}>
                      {getStatusIcon(stat.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Requests: {stat.totalRequests}</div>
                    <div>Success: {stat.successRate}%</div>
                    <div>Avg Time: {stat.avgResponseTime}ms</div>
                    <div>Usage: {stat.usagePercentage.toFixed(1)}%</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Last update:</span>
                      <span className="font-medium">{stat.lastRequest}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Next update:</span>
                      <span className="font-medium text-blue-600">
                        {getNextUpdateInfo(stat.provider, (usageData[selectedPeriod] || usageData.today).find(item => item.api_provider === stat.provider)?.last_request_at || '')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rate Limited Providers */}
            {usageData.rateLimited.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-sm font-medium text-red-800">Rate Limited:</p>
                <p className="text-xs text-red-600">
                  {usageData.rateLimited.join(', ')}
                </p>
              </div>
            )}

            {/* Usage Trend Indicator */}
            {selectedPeriod !== 'today' && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <p className="text-sm font-medium text-blue-800">Trend Analysis:</p>
                <div className="text-xs text-blue-600 space-y-1">
                  {getTrendAnalysis(usageData, selectedPeriod).map((trend, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{trend.provider}:</span>
                      <span className={`font-medium ${
                        trend.trend === 'up' ? 'text-green-600' :
                        trend.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {trend.trend === 'up' ? '↗️' : trend.trend === 'down' ? '↘️' : '→'} {trend.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center py-4">
            No usage data available
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-2 rounded-b-lg">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Auto-refresh: 30s</span>
          <span className="flex items-center space-x-1">
            <span>Period: {selectedPeriod}</span>
            {usageData?.rateLimited.length === 0 && (
              <span className="text-green-600">🟢</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}