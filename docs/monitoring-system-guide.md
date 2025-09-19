# Market Indicators Monitoring System Guide

## Overview

The Market Indicators Monitoring System provides comprehensive real-time monitoring, alerting, and performance tracking for the Investie platform's market data infrastructure.

## Architecture Components

### 1. Monitoring Edge Function (`supabase/functions/monitoring/`)

**Purpose**: Provides system health checks and performance metrics collection

**Endpoints**:
- `POST /monitoring` with `{"action": "health_check"}` - Comprehensive system health assessment
- `POST /monitoring` with `{"action": "performance_metrics", "timeRange": 24}` - Historical metrics

**Health Checks**:
- **Database**: Connection status, response times, cache function availability
- **Data Collection**: Recent collection activity, success rates, data freshness
- **Cache Performance**: Hit rates, data age, indicator availability
- **External APIs**: Alpha Vantage, FRED, Alternative.me connectivity

### 2. Database Schema

**Performance Metrics Table**:
```sql
performance_metrics (
  id BIGSERIAL,
  metric_name VARCHAR(100),     -- e.g., 'cache_hit_rate', 'collection_duration'
  metric_value NUMERIC,         -- Numeric value of the metric
  metadata JSONB,               -- Additional context
  created_at TIMESTAMP
)
```

**System Alerts Table**:
```sql
system_alerts (
  id VARCHAR(255),              -- Unique alert identifier
  alert_level VARCHAR(20),      -- 'info', 'warning', 'error', 'critical'
  component VARCHAR(50),        -- Component that generated the alert
  message TEXT,                 -- Human-readable alert message
  details JSONB,                -- Additional alert context
  acknowledged BOOLEAN,         -- Whether alert has been acknowledged
  acknowledged_by VARCHAR(100), -- Who acknowledged the alert
  acknowledged_at TIMESTAMP,    -- When it was acknowledged
  created_at TIMESTAMP,
  resolved_at TIMESTAMP
)
```

**System Status History Table**:
```sql
system_status_history (
  id BIGSERIAL,
  overall_status VARCHAR(20),   -- 'healthy', 'warning', 'critical'
  database_status VARCHAR(20),  -- Component-specific status
  collection_status VARCHAR(20),
  cache_status VARCHAR(20),
  api_status VARCHAR(20),
  total_alerts INTEGER,
  critical_alerts INTEGER,
  cache_hit_rate NUMERIC,
  avg_data_age_hours NUMERIC,
  total_indicators INTEGER,
  details JSONB,                -- Additional status context
  created_at TIMESTAMP
)
```

### 3. Frontend Components

**SystemHealthDashboard** (`src/components/Monitoring/SystemHealthDashboard.tsx`):
- Real-time system status overview
- Component health details with expandable views
- Key performance metrics visualization
- Active alerts management
- Auto-refresh capabilities

**MonitoringNotificationBar** (`src/components/Monitoring/MonitoringNotificationBar.tsx`):
- Persistent notification bar for critical alerts
- Collapsible/expandable design
- Alert acknowledgment functionality
- System metrics summary

**useSystemMonitoring Hook** (`src/hooks/useSystemMonitoring.ts`):
- React hook for monitoring data management
- Desktop notification support
- Alert acknowledgment tracking
- Configurable refresh intervals
- Local storage for settings persistence

### 4. Monitoring Dashboard

**Access**: Navigate to `/monitoring` in the web application

**Features**:
- Overall system status indicator
- Component health breakdown (Database, Data Collection, Cache, APIs)
- Key performance metrics cards
- Active alerts list with severity levels
- Real-time refresh controls
- Historical performance data

## Alert Levels and Thresholds

### Alert Levels
- **Info**: Informational messages, system state changes
- **Warning**: Degraded performance, recoverable issues
- **Error**: Service failures, data collection problems
- **Critical**: System-wide failures, data unavailability

### Default Thresholds
- **Cache Hit Rate**: Warning below 70%, Critical below 50%
- **Data Age**: Warning above 12 hours, Critical above 24 hours
- **Response Time**: Warning above 2 seconds, Critical above 5 seconds
- **Collection Success**: Warning below 80%, Critical below 50%

## Notification System

### Desktop Notifications
- Requires user permission grant
- Configurable for critical alerts only or all levels
- Auto-dismisses after 10 seconds
- Includes alert level, component, and message

### Sound Alerts
- Optional audio notifications
- Different tones for different alert levels
- Configurable on/off setting

### Acknowledgment System
- Users can acknowledge alerts to prevent re-notification
- Acknowledged alerts are stored locally
- Auto-cleanup of old acknowledged alerts (7 days)

## Performance Metrics Tracking

### Automatically Collected Metrics
- `system_health_check_duration` - Time taken for health checks
- `cache_hit_rate` - Percentage of cache hits vs. misses
- `avg_data_age_hours` - Average age of cached data
- `total_indicators` - Total number of cached indicators
- `system_alerts_count` - Number of active system alerts
- `collection_[type]_success_rate` - Success rate for each collection type
- `collection_[type]_duration` - Duration of collection operations

### Database Functions
- `get_latest_system_health()` - Latest system health summary
- `get_performance_trends(metric_name, hours_back)` - Trend analysis
- `record_system_status(...)` - Record status snapshots
- `cleanup_old_performance_metrics()` - Maintenance cleanup
- `cleanup_old_status_history()` - Historical data cleanup

## Integration with Data Collection

### Enhanced Data Collector
The data collector function has been enhanced with monitoring integration:

```typescript
// Log collection metrics after each run
await logCollectionMetrics(
  'economic_indicators',
  successCount,
  totalCount,
  duration,
  errors
);

// Create alerts for collection issues
if (successRate < 80) {
  await createSystemAlert(
    successRate < 50 ? 'critical' : 'warning',
    'data_collection',
    `Low collection success rate: ${successRate}%`,
    { success_rate: successRate, errors: errors.length }
  );
}

// Record system status
await recordCollectionStatus(collectionResults, errors);
```

## Usage Examples

### Basic Health Check
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/monitoring' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "health_check"}'
```

### Performance Metrics Query
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/monitoring' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "performance_metrics", "timeRange": 24}'
```

### Frontend Integration
```typescript
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';

function MyComponent() {
  const {
    healthData,
    criticalAlerts,
    config,
    updateConfig,
    acknowledgeAlert
  } = useSystemMonitoring();

  // Use monitoring data in your component
  return (
    <div>
      <p>System Status: {healthData?.status}</p>
      <p>Critical Alerts: {criticalAlerts.length}</p>
    </div>
  );
}
```

## Maintenance and Operations

### Regular Maintenance
- Performance metrics are automatically cleaned up after 30 days
- System status history is retained for 90 days
- Alert acknowledgments are cleaned up after 7 days

### Troubleshooting
1. **High Response Times**: Check database connections, query performance
2. **Low Cache Hit Rate**: Verify data collection schedules, API availability
3. **Collection Failures**: Check API keys, rate limits, network connectivity
4. **Database Issues**: Verify Supabase connection, check function logs

### Monitoring Best Practices
1. **Set up regular health checks** via cron jobs or monitoring services
2. **Configure appropriate alert thresholds** for your use case
3. **Monitor trends** rather than just point-in-time metrics
4. **Acknowledge alerts promptly** to maintain notification effectiveness
5. **Review historical data** regularly for capacity planning

## Configuration

### Environment Variables
- Standard Supabase environment variables for database access
- API keys for external service monitoring
- No additional configuration required for basic monitoring

### Frontend Configuration
The monitoring system uses local storage for user preferences:
- Refresh interval settings
- Notification preferences
- Alert acknowledgment tracking
- Alert threshold customization

### Database Configuration
All monitoring tables and functions are created automatically via migrations. No manual database setup required beyond running the migrations.

## Security Considerations

- Monitoring endpoints require proper Supabase authentication
- Sensitive information (API keys, etc.) is not exposed in monitoring data
- Alert details are sanitized to prevent information leakage
- User preferences are stored locally, not on the server

## Future Enhancements

- Integration with external monitoring services (DataDog, New Relic)
- Enhanced alerting via email, Slack, Discord webhooks
- Performance trend analysis and prediction
- Automated remediation for common issues
- Mobile app push notifications
- Custom dashboard creation tools