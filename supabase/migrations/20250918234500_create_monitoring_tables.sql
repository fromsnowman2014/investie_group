-- Migration: Create monitoring and performance tracking tables
-- Created: 2025-09-18
-- Purpose: Add monitoring infrastructure for market indicators caching system

-- Performance metrics tracking table
CREATE TABLE performance_metrics (
  id BIGSERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance metrics
CREATE INDEX idx_performance_metrics_name_created
ON performance_metrics(metric_name, created_at DESC);

CREATE INDEX idx_performance_metrics_created
ON performance_metrics(created_at DESC);

-- System alerts table
CREATE TABLE system_alerts (
  id VARCHAR(255) PRIMARY KEY,
  alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('info', 'warning', 'error', 'critical')),
  component VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by VARCHAR(100),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for alerts
CREATE INDEX idx_system_alerts_level_created
ON system_alerts(alert_level, created_at DESC);

CREATE INDEX idx_system_alerts_component_created
ON system_alerts(component, created_at DESC);

CREATE INDEX idx_system_alerts_unacknowledged
ON system_alerts(acknowledged, created_at DESC)
WHERE acknowledged = FALSE;

-- System status history table
CREATE TABLE system_status_history (
  id BIGSERIAL PRIMARY KEY,
  overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('healthy', 'warning', 'critical')),
  database_status VARCHAR(20) NOT NULL,
  collection_status VARCHAR(20) NOT NULL,
  cache_status VARCHAR(20) NOT NULL,
  api_status VARCHAR(20) NOT NULL,
  total_alerts INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  cache_hit_rate NUMERIC,
  avg_data_age_hours NUMERIC,
  total_indicators INTEGER,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for status history
CREATE INDEX idx_system_status_history_created
ON system_status_history(created_at DESC);

-- Function to cleanup old performance metrics (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_performance_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM performance_metrics
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old system status history (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_status_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM system_status_history
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest system health summary
CREATE OR REPLACE FUNCTION get_latest_system_health()
RETURNS TABLE (
  status VARCHAR(20),
  last_check TIMESTAMP WITH TIME ZONE,
  active_alerts INTEGER,
  critical_alerts INTEGER,
  cache_hit_rate NUMERIC,
  total_indicators INTEGER,
  hours_since_collection NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ssh.overall_status,
    ssh.created_at as last_check,
    ssh.total_alerts,
    ssh.critical_alerts,
    ssh.cache_hit_rate,
    ssh.total_indicators,
    EXTRACT(EPOCH FROM (NOW() -
      (SELECT MAX(created_at) FROM market_indicators_cache WHERE is_active = true)
    )) / 3600 as hours_since_collection
  FROM system_status_history ssh
  ORDER BY ssh.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get performance trend analysis
CREATE OR REPLACE FUNCTION get_performance_trends(
  metric_name_param VARCHAR(100),
  hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  hour_bucket TIMESTAMP WITH TIME ZONE,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  sample_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('hour', pm.created_at) as hour_bucket,
    ROUND(AVG(pm.metric_value), 2) as avg_value,
    ROUND(MIN(pm.metric_value), 2) as min_value,
    ROUND(MAX(pm.metric_value), 2) as max_value,
    COUNT(*)::INTEGER as sample_count
  FROM performance_metrics pm
  WHERE pm.metric_name = metric_name_param
    AND pm.created_at >= NOW() - (hours_back || ' hours')::INTERVAL
  GROUP BY DATE_TRUNC('hour', pm.created_at)
  ORDER BY hour_bucket DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to record system status snapshot
CREATE OR REPLACE FUNCTION record_system_status(
  p_overall_status VARCHAR(20),
  p_database_status VARCHAR(20),
  p_collection_status VARCHAR(20),
  p_cache_status VARCHAR(20),
  p_api_status VARCHAR(20),
  p_total_alerts INTEGER DEFAULT 0,
  p_critical_alerts INTEGER DEFAULT 0,
  p_cache_hit_rate NUMERIC DEFAULT NULL,
  p_avg_data_age_hours NUMERIC DEFAULT NULL,
  p_total_indicators INTEGER DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS BIGINT AS $$
DECLARE
  new_id BIGINT;
BEGIN
  INSERT INTO system_status_history (
    overall_status,
    database_status,
    collection_status,
    cache_status,
    api_status,
    total_alerts,
    critical_alerts,
    cache_hit_rate,
    avg_data_age_hours,
    total_indicators,
    details
  ) VALUES (
    p_overall_status,
    p_database_status,
    p_collection_status,
    p_cache_status,
    p_api_status,
    p_total_alerts,
    p_critical_alerts,
    p_cache_hit_rate,
    p_avg_data_age_hours,
    p_total_indicators,
    p_details
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better query performance on large datasets
CREATE INDEX idx_performance_metrics_value
ON performance_metrics(metric_value)
WHERE metric_name IN ('cache_hit_rate', 'avg_data_age_hours', 'system_alerts_count');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON performance_metrics TO anon;
GRANT SELECT, INSERT, UPDATE ON system_alerts TO anon;
GRANT SELECT, INSERT ON system_status_history TO anon;
GRANT USAGE ON SEQUENCE performance_metrics_id_seq TO anon;
GRANT USAGE ON SEQUENCE system_status_history_id_seq TO anon;

-- Add comments for documentation
COMMENT ON TABLE performance_metrics IS 'Stores time-series performance metrics for monitoring system health';
COMMENT ON TABLE system_alerts IS 'Stores system alerts with acknowledgment tracking';
COMMENT ON TABLE system_status_history IS 'Historical record of overall system health status';

COMMENT ON FUNCTION cleanup_old_performance_metrics() IS 'Maintenance function to remove performance metrics older than 30 days';
COMMENT ON FUNCTION cleanup_old_status_history() IS 'Maintenance function to remove status history older than 90 days';
COMMENT ON FUNCTION get_latest_system_health() IS 'Returns the most recent system health summary';
COMMENT ON FUNCTION get_performance_trends(VARCHAR, INTEGER) IS 'Analyzes performance trends for a specific metric over time';
COMMENT ON FUNCTION record_system_status(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER, NUMERIC, NUMERIC, INTEGER, JSONB) IS 'Records a system status snapshot for historical tracking';