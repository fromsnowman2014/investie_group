-- Fix Production RLS Issues
-- Enable RLS on tables that have policies but RLS disabled
-- Based on production schema analysis from 20250921185606_remote_schema.sql

-- Enable RLS on tables with existing policies but disabled RLS
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service_role for all tables
-- (policies already exist, just need proper permissions)
GRANT ALL ON ai_analysis TO service_role;
GRANT ALL ON macro_news TO service_role;
GRANT ALL ON market_indicators TO service_role;
GRANT ALL ON news_analysis TO service_role;
GRANT ALL ON stock_news TO service_role;
GRANT ALL ON stock_profiles TO service_role;

-- Also ensure API usage tables have proper permissions (may be missing in production)
GRANT ALL ON api_usage_log TO service_role;
GRANT ALL ON api_usage_daily TO service_role;
GRANT ALL ON api_usage_realtime TO service_role;