-- Production: Create Market Indicators Cache Tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fwnmnjwtbggasmunsfyk/sql

-- Check if market_indicators_cache table exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'market_indicators_cache') THEN
        CREATE TABLE market_indicators_cache (
          id BIGSERIAL PRIMARY KEY,
          indicator_type VARCHAR(50) NOT NULL, -- 'fear_greed', 'vix', 'treasury_10y', 'cpi', 'unemployment'
          data_value JSONB NOT NULL,          -- Actual data (flexible structure)
          metadata JSONB DEFAULT '{}',        -- Additional metadata
          data_source VARCHAR(50) NOT NULL,   -- 'alpha_vantage', 'fred', 'alternative_me', 'yahoo_finance'
          created_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ,             -- Data expiration time
          is_active BOOLEAN DEFAULT true      -- Soft delete support
        );

        -- Performance optimization indexes
        CREATE INDEX idx_market_indicators_type_active ON market_indicators_cache(indicator_type, is_active, created_at DESC);
        CREATE INDEX idx_market_indicators_expires ON market_indicators_cache(expires_at) WHERE is_active = true;
        CREATE INDEX idx_market_indicators_source ON market_indicators_cache(data_source, created_at DESC);

        RAISE NOTICE 'Created market_indicators_cache table';
    ELSE
        RAISE NOTICE 'market_indicators_cache table already exists';
    END IF;
END
$$;

-- Check if cache_config table exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cache_config') THEN
        CREATE TABLE cache_config (
          id BIGSERIAL PRIMARY KEY,
          config_key VARCHAR(50) UNIQUE NOT NULL,
          config_value TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Insert default configuration values
        INSERT INTO cache_config (config_key, config_value, description) VALUES
        ('cache_max_age_hours', '12', 'Maximum cache data validity time (hours)'),
        ('cache_stale_hours', '6', 'Stale-while-revalidate threshold (hours)'),
        ('api_retry_attempts', '3', 'API call retry count'),
        ('cache_fallback_enabled', 'true', 'Enable API fallback on cache failure'),
        ('realtime_only_mode', 'false', 'Emergency real-time only mode'),
        ('refresh_interval_minutes', '5', 'SWR refresh interval (minutes)'),
        ('collection_frequency_hours', '12', 'Data collection frequency (hours)'),
        ('data_retention_days', '30', 'Historical data retention period (days)');

        RAISE NOTICE 'Created cache_config table with default values';
    ELSE
        RAISE NOTICE 'cache_config table already exists';
    END IF;
END
$$;

-- Check if economic_indicators table exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'economic_indicators') THEN
        CREATE TABLE economic_indicators (
          id BIGSERIAL PRIMARY KEY,
          indicator_name VARCHAR(50) NOT NULL, -- 'treasury_10y', 'unemployment', 'cpi', 'gdp_growth'
          current_value DECIMAL(15,6) NOT NULL,
          previous_value DECIMAL(15,6),
          change_percent DECIMAL(10,4),
          trend VARCHAR(20) CHECK (trend IN ('up', 'down', 'stable')),
          data_source VARCHAR(50) NOT NULL,
          data_date DATE NOT NULL,            -- The date this economic data is for
          created_at TIMESTAMPTZ DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true
        );

        -- Performance indexes for economic indicators
        CREATE INDEX idx_economic_indicators_name_date ON economic_indicators(indicator_name, data_date DESC, is_active);
        CREATE INDEX idx_economic_indicators_created ON economic_indicators(created_at DESC) WHERE is_active = true;

        RAISE NOTICE 'Created economic_indicators table';
    ELSE
        RAISE NOTICE 'economic_indicators table already exists';
    END IF;
END
$$;

-- Enable RLS for new tables
ALTER TABLE market_indicators_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to cache tables
DO $$
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Allow anonymous read access" ON market_indicators_cache;
    DROP POLICY IF EXISTS "Allow anonymous read access" ON cache_config;
    DROP POLICY IF EXISTS "Allow anonymous read access" ON economic_indicators;

    -- Create new policies
    CREATE POLICY "Allow anonymous read access" ON market_indicators_cache FOR SELECT USING (true);
    CREATE POLICY "Allow anonymous read access" ON cache_config FOR SELECT USING (true);
    CREATE POLICY "Allow anonymous read access" ON economic_indicators FOR SELECT USING (true);
END
$$;

-- Allow service role to manage cache data
DO $$
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Allow service role full access" ON market_indicators_cache;
    DROP POLICY IF EXISTS "Allow service role full access" ON cache_config;
    DROP POLICY IF EXISTS "Allow service role full access" ON economic_indicators;

    -- Create new policies
    CREATE POLICY "Allow service role full access" ON market_indicators_cache FOR ALL USING (auth.role() = 'service_role');
    CREATE POLICY "Allow service role full access" ON cache_config FOR ALL USING (auth.role() = 'service_role');
    CREATE POLICY "Allow service role full access" ON economic_indicators FOR ALL USING (auth.role() = 'service_role');
END
$$;

-- Create functions for cache management
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

-- Function to clean up expired cache entries
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

-- Function to get cache configuration
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

-- Add comments for documentation
COMMENT ON TABLE market_indicators_cache IS 'Cached market indicators data with flexible JSON structure';
COMMENT ON TABLE cache_config IS 'Runtime configuration for caching system';
COMMENT ON TABLE economic_indicators IS 'Economic indicators with historical tracking';
COMMENT ON FUNCTION get_latest_market_indicator IS 'Get most recent data for a specific market indicator';
COMMENT ON FUNCTION cleanup_expired_cache IS 'Clean up expired cache entries';
COMMENT ON FUNCTION get_cache_config IS 'Get cache configuration values';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Market Indicators Cache Tables Setup Complete!';
    RAISE NOTICE 'Tables created: market_indicators_cache, cache_config, economic_indicators';
    RAISE NOTICE 'Functions created: get_latest_market_indicator, cleanup_expired_cache, get_cache_config';
    RAISE NOTICE 'RLS policies configured for anonymous read and service role full access';
END
$$;