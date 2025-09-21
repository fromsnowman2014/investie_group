'use client';

import { useState, useEffect } from 'react';
import { edgeFunctionFetcher } from '@/lib/api-utils';

interface ApiUsageData {
  today: any[];
  realtime: any[];
  rateLimited: string[];
}

interface ApiUsageStats {
  provider: string;
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  usagePercentage: number;
  lastRequest: string;
  status: 'healthy' | 'warning' | 'error';
}

export default function ApiUsageDebugger() {
  const [usageData, setUsageData] = useState<ApiUsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchUsageData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch from local first, then production
      let data;
      try {
        data = await edgeFunctionFetcher('api-usage-dashboard', {
          action: 'summary'
        });
      } catch (localError) {
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
    return {
      today: [
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
      ],
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

  useEffect(() => {
    fetchUsageData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchUsageData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUsageStats = (data: ApiUsageData): ApiUsageStats[] => {
    return data.today.map(item => ({
      provider: item.api_provider,
      totalRequests: item.total_requests || 0,
      successRate: item.total_requests > 0
        ? Math.round((item.successful_requests / item.total_requests) * 100)
        : 0,
      avgResponseTime: Math.round(item.avg_response_time_ms || 0),
      usagePercentage: item.usage_percentage || 0,
      lastRequest: item.last_request_at ? new Date(item.last_request_at).toLocaleTimeString() : 'Never',
      status: item.failed_requests > item.successful_requests ? 'error'
             : item.usage_percentage > 80 ? 'warning'
             : 'healthy'
    }));
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
            Last update: {lastUpdate.toLocaleTimeString()}
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
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <p className="font-medium text-gray-700">Total Requests</p>
                <p className="text-lg font-bold text-blue-600">
                  {usageData.today.reduce((sum, item) => sum + (item.total_requests || 0), 0)}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="font-medium text-gray-700">Rate Limited</p>
                <p className="text-lg font-bold text-red-600">
                  {usageData.rateLimited.length}
                </p>
              </div>
            </div>

            {/* Provider Details */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 text-sm">Provider Status</h4>
              {formatUsageStats(usageData).map((stat, index) => (
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
                  <div className="text-xs text-gray-500 mt-1">
                    Last: {stat.lastRequest}
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
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center py-4">
            No usage data available
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-2 rounded-b-lg">
        <p className="text-xs text-gray-500 text-center">
          Auto-refresh every 30s | Debug Mode
        </p>
      </div>
    </div>
  );
}