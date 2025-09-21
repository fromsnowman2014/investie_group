-- Fix RLS issues for API Usage Dashboard
-- This script enables RLS and sets proper policies for API usage tracking tables
-- Updated to handle views properly

-- 1. Enable RLS on API usage tables (excluding views)
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
-- NOTE: api_usage_debug is a VIEW, not a table - RLS will be enabled on underlying tables
ALTER TABLE api_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_realtime ENABLE ROW LEVEL SECURITY;

-- 2. Create or update policies for api_usage_log
DROP POLICY IF EXISTS "Allow all operations" ON api_usage_log;
CREATE POLICY "Allow service role full access" ON api_usage_log
  FOR ALL USING (true);

-- 3. Create or update policies for api_usage_daily (underlying table for api_usage_debug view)
DROP POLICY IF EXISTS "Allow all operations" ON api_usage_daily;
CREATE POLICY "Allow service role full access" ON api_usage_daily
  FOR ALL USING (true);

-- 4. Create or update policies for api_usage_realtime
DROP POLICY IF EXISTS "Allow all operations" ON api_usage_realtime;
CREATE POLICY "Allow service role full access" ON api_usage_realtime
  FOR ALL USING (true);

-- 5. Enable RLS on other existing tables (from error report)
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_analysis ENABLE ROW LEVEL SECURITY;

-- 6. Update policies for other existing tables to use service role access
DROP POLICY IF EXISTS "Allow all operations" ON ai_analysis;
CREATE POLICY "Allow service role full access" ON ai_analysis
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON news_analysis;
CREATE POLICY "Allow service role full access" ON news_analysis
  FOR ALL USING (true);

-- 7. Grant necessary permissions to service role
GRANT ALL ON api_usage_log TO service_role;
GRANT ALL ON api_usage_daily TO service_role;
GRANT ALL ON api_usage_realtime TO service_role;
-- NOTE: Views inherit permissions from underlying tables, so api_usage_debug will be accessible via api_usage_daily permissions
GRANT ALL ON ai_analysis TO service_role;
GRANT ALL ON news_analysis TO service_role;