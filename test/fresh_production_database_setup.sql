-- Fresh Production Database Setup Script
-- Based on working local schema
-- Run this AFTER cleanup_production_database.sql
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/fwnmnjwtbggasmunsfyk/sql

-- 1. Create market_indicators_cache table
CREATE TABLE market_indicators_cache (
  id BIGSERIAL PRIMARY KEY,
  indicator_type VARCHAR(50) NOT NULL,
  data_value JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  data_source VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- 2. Create cache_config table
CREATE TABLE cache_config (
  id BIGSERIAL PRIMARY KEY,
  config_key VARCHAR(50) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create economic_indicators table
CREATE TABLE economic_indicators (
  id BIGSERIAL PRIMARY KEY,
  indicator_name VARCHAR(50) NOT NULL,
  current_value DECIMAL(15,6) NOT NULL,
  previous_value DECIMAL(15,6),
  change_percent DECIMAL(10,4),
  trend VARCHAR(20) CHECK (trend IN ('up', 'down', 'stable')),
  data_source VARCHAR(50) NOT NULL,
  data_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 4. Create all performance indexes
CREATE INDEX idx_market_indicators_type_active ON market_indicators_cache(indicator_type, is_active, created_at DESC);
CREATE INDEX idx_market_indicators_expires ON market_indicators_cache(expires_at) WHERE is_active = true;
CREATE INDEX idx_market_indicators_source ON market_indicators_cache(data_source, created_at DESC);
CREATE INDEX idx_economic_indicators_name_date ON economic_indicators(indicator_name, data_date DESC, is_active);
CREATE INDEX idx_economic_indicators_created ON economic_indicators(created_at DESC) WHERE is_active = true;

-- 5. Enable Row Level Security
ALTER TABLE market_indicators_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for anonymous read access
CREATE POLICY "Allow anonymous read access" ON market_indicators_cache FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON cache_config FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON economic_indicators FOR SELECT USING (true);

-- 7. Create RLS policies for service role full access
CREATE POLICY "Allow service role full access" ON market_indicators_cache FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access" ON cache_config FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access" ON economic_indicators FOR ALL USING (auth.role() = 'service_role');

-- 8. Create utility functions
CREATE OR REPLACE FUNCTION get_latest_market_indicator(p_indicator_type TEXT)
RETURNS TABLE (
  id BIGINT,
  indicator_type VARCHAR(50),
  data_value JSONB,
  metadata JSONB,
  data_source VARCHAR(50),
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  age_seconds INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    mic.id,
    mic.indicator_type,
    mic.data_value,
    mic.metadata,
    mic.data_source,
    mic.created_at,
    mic.expires_at,
    EXTRACT(EPOCH FROM (NOW() - mic.created_at))::INTEGER as age_seconds
  FROM market_indicators_cache mic
  WHERE mic.indicator_type = p_indicator_type
    AND mic.is_active = true
  ORDER BY mic.created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE sql
AS $$
  UPDATE market_indicators_cache
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;

  SELECT COUNT(*)::INTEGER FROM market_indicators_cache
  WHERE is_active = false AND expires_at < NOW();
$$;

CREATE OR REPLACE FUNCTION get_cache_config(p_config_key TEXT DEFAULT NULL)
RETURNS TABLE (
  config_key VARCHAR(50),
  config_value TEXT,
  description TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    cc.config_key,
    cc.config_value,
    cc.description
  FROM cache_config cc
  WHERE p_config_key IS NULL OR cc.config_key = p_config_key
  ORDER BY cc.config_key;
$$;

-- 9. Insert default configuration values
INSERT INTO cache_config (config_key, config_value, description) VALUES
('cache_max_age_hours', '12', 'Maximum cache data validity time (hours)'),
('cache_stale_hours', '6', 'Stale-while-revalidate threshold (hours)'),
('api_retry_attempts', '3', 'API call retry count'),
('cache_fallback_enabled', 'true', 'Enable API fallback on cache failure'),
('realtime_only_mode', 'false', 'Emergency real-time only mode'),
('refresh_interval_minutes', '5', 'SWR refresh interval (minutes)'),
('collection_frequency_hours', '12', 'Data collection frequency (hours)'),
('data_retention_days', '30', 'Historical data retention period (days)');

-- 10. Grant permissions to all roles
GRANT ALL ON TABLE market_indicators_cache TO anon, authenticated, service_role;
GRANT ALL ON TABLE cache_config TO anon, authenticated, service_role;
GRANT ALL ON TABLE economic_indicators TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE market_indicators_cache_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE cache_config_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE economic_indicators_id_seq TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION get_latest_market_indicator TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION cleanup_expired_cache TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION get_cache_config TO anon, authenticated, service_role;

-- 11. Add table comments
COMMENT ON TABLE market_indicators_cache IS 'Cached market indicators data with flexible JSON structure';
COMMENT ON TABLE cache_config IS 'Runtime configuration for caching system';
COMMENT ON TABLE economic_indicators IS 'Economic indicators with historical tracking';
COMMENT ON FUNCTION get_latest_market_indicator IS 'Get most recent data for a specific market indicator';
COMMENT ON FUNCTION cleanup_expired_cache IS 'Clean up expired cache entries';
COMMENT ON FUNCTION get_cache_config IS 'Get cache configuration values';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Fresh Market Indicators Database Setup Complete!';
    RAISE NOTICE 'Tables created: market_indicators_cache, cache_config, economic_indicators';
    RAISE NOTICE 'Functions created: get_latest_market_indicator, cleanup_expired_cache, get_cache_config';
    RAISE NOTICE 'RLS policies configured for anonymous read and service role full access';
    RAISE NOTICE 'Default configuration values inserted';
    RAISE NOTICE 'Ready for data collection and caching operations!';
END
$$;