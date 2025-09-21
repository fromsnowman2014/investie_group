-- API Usage Tracking System
-- Track API key usage, rate limits, and performance metrics

-- API usage log table (detailed per-request tracking)
CREATE TABLE api_usage_log (
  id BIGSERIAL PRIMARY KEY,
  api_provider VARCHAR(50) NOT NULL,           -- 'alpha_vantage', 'yahoo_finance', 'fred', 'alternative_me'
  api_key_hash VARCHAR(64),                    -- SHA-256 hash of API key (for privacy)
  endpoint VARCHAR(100) NOT NULL,              -- API endpoint called
  indicator_type VARCHAR(50),                  -- 'fear_greed', 'sp500', 'vix', etc.

  -- Request details
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_status INTEGER,                     -- HTTP status code
  response_time_ms INTEGER,                    -- Response time in milliseconds
  success BOOLEAN DEFAULT false,               -- Whether request succeeded

  -- Rate limit tracking
  rate_limit_remaining INTEGER,                -- Remaining requests from headers
  rate_limit_reset TIMESTAMPTZ,               -- When rate limit resets

  -- Error tracking
  error_type VARCHAR(50),                      -- 'rate_limit', 'auth_error', 'network_error', etc.
  error_message TEXT,                          -- Error details

  -- Metadata
  function_name VARCHAR(50),                   -- Which edge function made the call
  user_agent VARCHAR(200),                     -- For debugging
  source VARCHAR(50) DEFAULT 'production'      -- 'production', 'staging', 'local'
);

-- Daily usage summary table (aggregated stats)
CREATE TABLE api_usage_daily (
  id BIGSERIAL PRIMARY KEY,
  date_tracked DATE NOT NULL DEFAULT CURRENT_DATE,
  api_provider VARCHAR(50) NOT NULL,
  api_key_hash VARCHAR(64),

  -- Usage counts
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  rate_limited_requests INTEGER DEFAULT 0,

  -- Performance metrics
  avg_response_time_ms DECIMAL(10,2),
  min_response_time_ms INTEGER,
  max_response_time_ms INTEGER,

  -- Rate limit info
  daily_limit INTEGER,                         -- Known daily limit for this provider
  usage_percentage DECIMAL(5,2),               -- Percentage of daily limit used

  -- Timestamps
  first_request_at TIMESTAMPTZ,
  last_request_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(date_tracked, api_provider, api_key_hash)
);

-- Real-time usage tracking (current session)
CREATE TABLE api_usage_realtime (
  id BIGSERIAL PRIMARY KEY,
  api_provider VARCHAR(50) NOT NULL,
  api_key_hash VARCHAR(64),

  -- Current session stats
  session_start TIMESTAMPTZ DEFAULT NOW(),
  requests_this_hour INTEGER DEFAULT 0,
  requests_today INTEGER DEFAULT 0,
  last_request_at TIMESTAMPTZ,

  -- Status indicators
  is_rate_limited BOOLEAN DEFAULT false,
  rate_limit_reset_at TIMESTAMPTZ,
  health_status VARCHAR(20) DEFAULT 'healthy',  -- 'healthy', 'warning', 'error'

  -- Auto-cleanup old entries
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),

  UNIQUE(api_provider, api_key_hash)
);

-- Performance indexes
CREATE INDEX idx_api_usage_log_timestamp ON api_usage_log(request_timestamp DESC);
CREATE INDEX idx_api_usage_log_provider ON api_usage_log(api_provider, request_timestamp DESC);
CREATE INDEX idx_api_usage_log_success ON api_usage_log(success, request_timestamp DESC);
CREATE INDEX idx_api_usage_daily_date ON api_usage_daily(date_tracked DESC);
CREATE INDEX idx_api_usage_realtime_provider ON api_usage_realtime(api_provider);

-- Auto-cleanup function for old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM api_usage_log
  WHERE request_timestamp < NOW() - INTERVAL '30 days';

  DELETE FROM api_usage_daily
  WHERE date_tracked < CURRENT_DATE - INTERVAL '90 days';

  DELETE FROM api_usage_realtime
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update daily summary
CREATE OR REPLACE FUNCTION update_daily_usage_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO api_usage_daily (
    date_tracked, api_provider, api_key_hash,
    total_requests, successful_requests, failed_requests,
    rate_limited_requests, first_request_at, last_request_at,
    avg_response_time_ms, min_response_time_ms, max_response_time_ms
  )
  VALUES (
    DATE(NEW.request_timestamp), NEW.api_provider, NEW.api_key_hash,
    1,
    CASE WHEN NEW.success THEN 1 ELSE 0 END,
    CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    CASE WHEN NEW.error_type = 'rate_limit' THEN 1 ELSE 0 END,
    NEW.request_timestamp, NEW.request_timestamp,
    NEW.response_time_ms, NEW.response_time_ms, NEW.response_time_ms
  )
  ON CONFLICT (date_tracked, api_provider, api_key_hash)
  DO UPDATE SET
    total_requests = api_usage_daily.total_requests + 1,
    successful_requests = api_usage_daily.successful_requests +
      CASE WHEN NEW.success THEN 1 ELSE 0 END,
    failed_requests = api_usage_daily.failed_requests +
      CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    rate_limited_requests = api_usage_daily.rate_limited_requests +
      CASE WHEN NEW.error_type = 'rate_limit' THEN 1 ELSE 0 END,
    last_request_at = NEW.request_timestamp,
    avg_response_time_ms =
      (api_usage_daily.avg_response_time_ms * (api_usage_daily.total_requests - 1) + NEW.response_time_ms)
      / api_usage_daily.total_requests,
    min_response_time_ms = LEAST(api_usage_daily.min_response_time_ms, NEW.response_time_ms),
    max_response_time_ms = GREATEST(api_usage_daily.max_response_time_ms, NEW.response_time_ms),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update realtime usage
CREATE OR REPLACE FUNCTION update_realtime_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO api_usage_realtime (
    api_provider, api_key_hash, requests_this_hour, requests_today, last_request_at,
    is_rate_limited, rate_limit_reset_at,
    health_status
  )
  VALUES (
    NEW.api_provider, NEW.api_key_hash, 1, 1, NEW.request_timestamp,
    NEW.error_type = 'rate_limit',
    NEW.rate_limit_reset,
    CASE
      WHEN NEW.success THEN 'healthy'
      WHEN NEW.error_type = 'rate_limit' THEN 'error'
      ELSE 'warning'
    END
  )
  ON CONFLICT (api_provider, api_key_hash)
  DO UPDATE SET
    requests_this_hour = CASE
      WHEN api_usage_realtime.last_request_at < DATE_TRUNC('hour', NEW.request_timestamp)
      THEN 1
      ELSE api_usage_realtime.requests_this_hour + 1
    END,
    requests_today = CASE
      WHEN api_usage_realtime.last_request_at < DATE_TRUNC('day', NEW.request_timestamp)
      THEN 1
      ELSE api_usage_realtime.requests_today + 1
    END,
    last_request_at = NEW.request_timestamp,
    is_rate_limited = NEW.error_type = 'rate_limit',
    rate_limit_reset_at = COALESCE(NEW.rate_limit_reset, api_usage_realtime.rate_limit_reset_at),
    health_status = CASE
      WHEN NEW.success THEN 'healthy'
      WHEN NEW.error_type = 'rate_limit' THEN 'error'
      ELSE 'warning'
    END,
    expires_at = NOW() + INTERVAL '24 hours';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_daily_usage
  AFTER INSERT ON api_usage_log
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_usage_summary();

CREATE TRIGGER trigger_update_realtime_usage
  AFTER INSERT ON api_usage_log
  FOR EACH ROW
  EXECUTE FUNCTION update_realtime_usage();

-- Create view for easy debugging
CREATE OR REPLACE VIEW api_usage_debug AS
SELECT
  d.api_provider,
  d.date_tracked,
  d.total_requests,
  d.successful_requests,
  d.failed_requests,
  d.rate_limited_requests,
  d.daily_limit,
  ROUND((d.total_requests::DECIMAL / NULLIF(d.daily_limit, 0)) * 100, 2) as usage_percentage,
  d.avg_response_time_ms,
  r.health_status,
  r.is_rate_limited,
  r.rate_limit_reset_at,
  r.last_request_at
FROM api_usage_daily d
LEFT JOIN api_usage_realtime r ON d.api_provider = r.api_provider
WHERE d.date_tracked >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY d.date_tracked DESC, d.api_provider;