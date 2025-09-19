'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { edgeFunctionFetcher } from '@/lib/api-utils';

// Types for monitoring data
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

interface MonitoringConfig {
  enabled: boolean;
  refreshInterval: number; // milliseconds
  alertThresholds: {
    cacheHitRate: number;
    maxDataAge: number; // hours
    maxResponseTime: number; // milliseconds
  };
  notificationSettings: {
    desktop: boolean;
    sound: boolean;
    criticalOnly: boolean;
  };
}

interface MonitoringHookResult {
  healthData: SystemHealth | undefined;
  isLoading: boolean;
  error: Error | undefined;
  alerts: Alert[];
  criticalAlerts: Alert[];
  warningAlerts: Alert[];
  config: MonitoringConfig;
  updateConfig: (newConfig: Partial<MonitoringConfig>) => void;
  acknowledgeAlert: (alertId: string) => void;
  forceRefresh: () => Promise<void>;
  isConnected: boolean;
  lastUpdate: Date | null;
}

const DEFAULT_CONFIG: MonitoringConfig = {
  enabled: true,
  refreshInterval: 30000, // 30 seconds
  alertThresholds: {
    cacheHitRate: 70, // Alert if below 70%
    maxDataAge: 12, // Alert if data older than 12 hours
    maxResponseTime: 2000 // Alert if response time > 2 seconds
  },
  notificationSettings: {
    desktop: true,
    sound: false,
    criticalOnly: true
  }
};

// Local storage key for monitoring configuration
const CONFIG_STORAGE_KEY = 'investie-monitoring-config';
const ACKNOWLEDGED_ALERTS_KEY = 'investie-acknowledged-alerts';

// Desktop notification utility
const showDesktopNotification = (alert: Alert) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(`${alert.level.toUpperCase()}: ${alert.component}`, {
      body: alert.message,
      icon: '/favicon.ico',
      tag: alert.id,
      timestamp: new Date(alert.timestamp).getTime()
    });

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  }
};

// Sound notification utility
const playAlertSound = (level: Alert['level']) => {
  try {
    const audio = new Audio();
    // Different sounds for different alert levels
    const soundUrls = {
      info: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdCSF+Ou8eA==',
      warning: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdCSF+Ou8eA==',
      error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdCSF+Ou8eA==',
      critical: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdCSF+Ou8eA=='
    };

    audio.src = soundUrls[level];
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore audio playback errors
    });
  } catch (error) {
    // Ignore audio setup errors
  }
};

export const useSystemMonitoring = (): MonitoringHookResult => {
  // Load configuration from localStorage
  const [config, setConfig] = useState<MonitoringConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
        return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  // Track acknowledged alerts
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(ACKNOWLEDGED_ALERTS_KEY);
        return new Set(stored ? JSON.parse(stored) : []);
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [previousAlerts, setPreviousAlerts] = useState<Alert[]>([]);

  // Fetch system health data
  const { data: healthData, error, isLoading, mutate } = useSWR<SystemHealth>(
    config.enabled ? 'monitoring-health' : null,
    () => edgeFunctionFetcher<SystemHealth>('monitoring', {
      action: 'health_check'
    }),
    {
      refreshInterval: config.enabled ? config.refreshInterval : 0,
      revalidateOnFocus: false,
      errorRetryInterval: 10000,
      onSuccess: (data) => {
        setLastUpdate(new Date());
        setIsConnected(true);
      },
      onError: () => {
        setIsConnected(false);
      }
    }
  );

  // Request desktop notification permission
  useEffect(() => {
    if (config.notificationSettings.desktop && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [config.notificationSettings.desktop]);

  // Handle new alerts
  useEffect(() => {
    if (healthData?.alerts && config.enabled) {
      const currentAlerts = healthData.alerts;

      // Find new alerts (not in previous alerts and not acknowledged)
      const newAlerts = currentAlerts.filter(alert =>
        !previousAlerts.find(prev => prev.id === alert.id) &&
        !acknowledgedAlerts.has(alert.id)
      );

      // Process new alerts
      newAlerts.forEach(alert => {
        const shouldNotify = !config.notificationSettings.criticalOnly ||
                           alert.level === 'critical' ||
                           alert.level === 'error';

        if (shouldNotify) {
          // Desktop notification
          if (config.notificationSettings.desktop) {
            showDesktopNotification(alert);
          }

          // Sound notification
          if (config.notificationSettings.sound) {
            playAlertSound(alert.level);
          }
        }
      });

      setPreviousAlerts(currentAlerts);
    }
  }, [healthData?.alerts, config, acknowledgedAlerts, previousAlerts]);

  // Save configuration to localStorage
  const updateConfig = useCallback((newConfig: Partial<MonitoringConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    if (typeof window !== 'undefined') {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));
    }
  }, [config]);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    const newAcknowledged = new Set(acknowledgedAlerts);
    newAcknowledged.add(alertId);
    setAcknowledgedAlerts(newAcknowledged);

    if (typeof window !== 'undefined') {
      localStorage.setItem(ACKNOWLEDGED_ALERTS_KEY, JSON.stringify([...newAcknowledged]));
    }
  }, [acknowledgedAlerts]);

  // Force refresh health data
  const forceRefresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  // Filter alerts by level and acknowledgment status
  const alerts = healthData?.alerts?.filter(alert => !acknowledgedAlerts.has(alert.id)) || [];
  const criticalAlerts = alerts.filter(alert => alert.level === 'critical');
  const warningAlerts = alerts.filter(alert => alert.level === 'warning');

  // Clean up old acknowledged alerts (older than 7 days)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const validAlerts = [...acknowledgedAlerts].filter(alertId => {
        // If we can't determine age, keep it
        return true;
      });

      if (validAlerts.length !== acknowledgedAlerts.size) {
        const newSet = new Set(validAlerts);
        setAcknowledgedAlerts(newSet);
        localStorage.setItem(ACKNOWLEDGED_ALERTS_KEY, JSON.stringify(validAlerts));
      }
    }
  }, [acknowledgedAlerts]);

  return {
    healthData,
    isLoading,
    error,
    alerts,
    criticalAlerts,
    warningAlerts,
    config,
    updateConfig,
    acknowledgeAlert,
    forceRefresh,
    isConnected,
    lastUpdate
  };
};