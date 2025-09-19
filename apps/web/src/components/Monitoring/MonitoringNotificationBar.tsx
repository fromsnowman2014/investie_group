'use client';

import React, { useState } from 'react';
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';

export const MonitoringNotificationBar: React.FC = () => {
  const {
    healthData,
    isLoading,
    error,
    criticalAlerts,
    warningAlerts,
    isConnected,
    lastUpdate,
    acknowledgeAlert,
    forceRefresh
  } = useSystemMonitoring();

  const [collapsed, setCollapsed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Don't show anything if monitoring is disabled or loading
  if (isLoading && !healthData) return null;

  // Show error state
  if (error || !isConnected) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 p-2 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">🔌</span>
            <span className="text-red-800">
              Monitoring connection lost
            </span>
          </div>
          <button
            onClick={forceRefresh}
            className="text-red-600 hover:text-red-800 text-xs underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Don't show if system is healthy and no alerts
  if (healthData?.status === 'healthy' && criticalAlerts.length === 0 && warningAlerts.length === 0) {
    return null;
  }

  const totalAlerts = criticalAlerts.length + warningAlerts.length;
  const statusColor = healthData?.status === 'critical' ? 'red' : 'yellow';

  if (collapsed) {
    return (
      <div className={`bg-${statusColor}-100 border-l-4 border-${statusColor}-500 p-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {healthData?.status === 'critical' ? '🚨' : '⚠️'}
            </span>
            <span className={`text-${statusColor}-800 text-sm`}>
              {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => setCollapsed(false)}
            className={`text-${statusColor}-600 hover:text-${statusColor}-800 text-xs underline`}
          >
            Show
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-${statusColor}-100 border-l-4 border-${statusColor}-500 p-3`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">
              {healthData?.status === 'critical' ? '🚨' : '⚠️'}
            </span>
            <span className={`text-${statusColor}-800 font-medium`}>
              System Health: {healthData?.status?.toUpperCase()}
            </span>
            <span className={`text-${statusColor}-700 text-sm`}>
              ({totalAlerts} alert{totalAlerts !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Critical Alerts */}
          {criticalAlerts.length > 0 && (
            <div className="mb-2">
              <div className="text-red-800 font-medium text-sm mb-1">
                🔥 Critical ({criticalAlerts.length}):
              </div>
              {criticalAlerts.slice(0, showDetails ? criticalAlerts.length : 2).map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-red-50 p-2 rounded mb-1">
                  <div className="flex-1">
                    <span className="text-red-800 text-sm font-medium">{alert.component}:</span>
                    <span className="text-red-700 text-sm ml-2">{alert.message}</span>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="text-red-600 hover:text-red-800 text-xs ml-2 underline"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Warning Alerts */}
          {warningAlerts.length > 0 && (
            <div className="mb-2">
              <div className="text-yellow-800 font-medium text-sm mb-1">
                ⚠️ Warnings ({warningAlerts.length}):
              </div>
              {warningAlerts.slice(0, showDetails ? warningAlerts.length : 2).map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-yellow-50 p-2 rounded mb-1">
                  <div className="flex-1">
                    <span className="text-yellow-800 text-sm font-medium">{alert.component}:</span>
                    <span className="text-yellow-700 text-sm ml-2">{alert.message}</span>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="text-yellow-600 hover:text-yellow-800 text-xs ml-2 underline"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* System Metrics Summary */}
          {healthData?.metrics && (
            <div className={`text-${statusColor}-700 text-xs space-y-1`}>
              <div className="flex items-center space-x-4">
                <span>Cache: {healthData.metrics.cacheHitRate}%</span>
                <span>Data Age: {healthData.metrics.avgDataAge}h</span>
                <span>Response: {healthData.metrics.avgResponseTime}ms</span>
                {lastUpdate && (
                  <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          )}

          {/* Show more/less toggle */}
          {totalAlerts > 4 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`text-${statusColor}-600 hover:text-${statusColor}-800 text-xs underline mt-1`}
            >
              {showDetails ? 'Show less' : `Show ${totalAlerts - 4} more alerts`}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={forceRefresh}
            className={`text-${statusColor}-600 hover:text-${statusColor}-800 text-xs`}
            title="Refresh monitoring data"
          >
            🔄
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className={`text-${statusColor}-600 hover:text-${statusColor}-800 text-xs`}
            title="Minimize"
          >
            ➖
          </button>
        </div>
      </div>
    </div>
  );
};