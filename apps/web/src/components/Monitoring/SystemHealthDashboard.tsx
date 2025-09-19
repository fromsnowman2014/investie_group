'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { edgeFunctionFetcher } from '@/lib/api-utils';

// Types for monitoring data
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

interface PerformanceMetric {
  metric_name: string;
  metric_value: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface PerformanceMetricsResponse {
  metrics: PerformanceMetric[];
  timeRange: number;
  count: number;
}

const StatusBadge: React.FC<{ status: ComponentHealth['status'] }> = ({ status }) => {
  const colors = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    failed: 'bg-red-100 text-red-800 border-red-200'
  };

  const icons = {
    healthy: '✅',
    degraded: '⚠️',
    failed: '❌'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status]}`}>
      {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const AlertBadge: React.FC<{ level: Alert['level'] }> = ({ level }) => {
  const colors = {
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '🚨',
    critical: '🔥'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${colors[level]}`}>
      {icons[level]} {level.toUpperCase()}
    </span>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}> = ({ title, value, subtitle, trend, className = '' }) => {
  const trendIcons = {
    up: '📈',
    down: '📉',
    stable: '➡️'
  };

  return (
    <div className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {trend && <span className="text-lg">{trendIcons[trend]}</span>}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

const ComponentHealthCard: React.FC<{
  name: string;
  health: ComponentHealth;
}> = ({ name, health }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-medium text-gray-900">{name}</h3>
          <StatusBadge status={health.status} />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{health.uptime}% uptime</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(health.metrics).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="text-gray-500">{key}:</span>
                <span className="ml-2 font-medium">{value}</span>
              </div>
            ))}
          </div>

          {health.issues.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-red-700 mb-2">Issues:</h4>
              <ul className="space-y-1">
                {health.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-red-600 flex items-start">
                    <span className="mr-2">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Last checked: {new Date(health.lastCheck).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export const SystemHealthDashboard: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch system health data
  const { data: healthData, error: healthError, mutate: refreshHealth } = useSWR<SystemHealth>(
    'monitoring-health',
    () => edgeFunctionFetcher<SystemHealth>('monitoring', {
      action: 'health_check'
    }),
    {
      refreshInterval: autoRefresh ? refreshInterval : 0,
      revalidateOnFocus: false,
      errorRetryInterval: 10000
    }
  );

  // Fetch performance metrics
  const { data: metricsData, error: metricsError } = useSWR<PerformanceMetricsResponse>(
    'monitoring-metrics',
    () => edgeFunctionFetcher<PerformanceMetricsResponse>('monitoring', {
      action: 'performance_metrics',
      timeRange: 24
    }),
    {
      refreshInterval: autoRefresh ? 60000 : 0, // Refresh every minute
      revalidateOnFocus: false
    }
  );

  const handleRefresh = () => {
    refreshHealth();
  };

  if (healthError || metricsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Monitoring Dashboard Error</h3>
        <p className="text-red-600 text-sm mt-1">
          {healthError?.message || metricsError?.message || 'Failed to load monitoring data'}
        </p>
        <button
          onClick={handleRefresh}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const overallStatusColors = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  const criticalAlerts = healthData.alerts.filter(alert => alert.level === 'critical');
  const warningAlerts = healthData.alerts.filter(alert => alert.level === 'warning');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Health Dashboard</h2>
          <p className="text-gray-600">
            Last updated: {new Date(healthData.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Auto-refresh:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`text-center py-4 rounded-lg border-2 ${
        healthData.status === 'healthy' ? 'bg-green-50 border-green-200' :
        healthData.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <h3 className={`text-3xl font-bold ${overallStatusColors[healthData.status]}`}>
          System Status: {healthData.status.toUpperCase()}
        </h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cache Hit Rate"
          value={`${healthData.metrics.cacheHitRate}%`}
          subtitle="Data served from cache"
          trend={healthData.metrics.cacheHitRate >= 80 ? 'up' : 'down'}
        />
        <MetricCard
          title="Data Freshness"
          value={`${healthData.metrics.avgDataAge}h`}
          subtitle="Average data age"
          trend={healthData.metrics.avgDataAge <= 6 ? 'up' : 'down'}
        />
        <MetricCard
          title="Active Indicators"
          value={healthData.metrics.totalIndicators}
          subtitle={`${healthData.metrics.freshIndicators} fresh, ${healthData.metrics.staleIndicators} stale`}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${healthData.metrics.avgResponseTime}ms`}
          subtitle="System response time"
          trend={healthData.metrics.avgResponseTime <= 500 ? 'up' : 'down'}
        />
      </div>

      {/* Alerts */}
      {healthData.alerts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Active Alerts ({healthData.alerts.length})
          </h3>
          <div className="space-y-3">
            {healthData.alerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertBadge level={alert.level} />
                    <span className="text-sm font-medium text-gray-900">{alert.component}</span>
                  </div>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Component Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(healthData.components).map(([name, health]) => (
          <ComponentHealthCard key={name} name={name} health={health} />
        ))}
      </div>

      {/* Performance Metrics Summary */}
      {metricsData && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Performance Metrics (Last 24h)
          </h3>
          <div className="text-sm text-gray-600">
            <p>Total metrics collected: {metricsData.count}</p>
            <p>Time range: {metricsData.timeRange} hours</p>
          </div>
        </div>
      )}
    </div>
  );
};