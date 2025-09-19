-- ===========================================
-- Production Database Debug Queries
-- Copy and paste these in Supabase SQL Editor
-- ===========================================

-- 1. Check if market_indicators_cache table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'market_indicators_cache'
) as market_indicators_cache_exists;

-- 2. Check all tables in public schema
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. If market_indicators_cache exists, check its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'market_indicators_cache'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check row count in market_indicators_cache (if exists)
-- If table doesn't exist, this will show an error - that's expected
SELECT COUNT(*) as total_rows FROM market_indicators_cache;

-- 5. Check recent data in market_indicators_cache (if exists)
SELECT 
  indicator_type, 
  data_source, 
  created_at,
  is_active
FROM market_indicators_cache 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check what's in market_indicators table (the one you showed in screenshot)
SELECT 
  id,
  date,
  indices,
  sectors,
  market_sentiment,
  created_at
FROM market_indicators 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Check cache_config table
SELECT * FROM cache_config ORDER BY config_key;

-- 8. Check RLS policies on market_indicators_cache
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'market_indicators_cache';

-- 9. Check if RPC function exists
SELECT proname, proargtypes, prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'get_latest_market_indicator';
