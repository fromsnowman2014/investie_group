-- Debug queries to check production database state

-- 1. Check if market_indicators_cache table exists and has data
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT indicator_type) as unique_indicators,
  MAX(created_at) as latest_update
FROM market_indicators_cache 
WHERE is_active = true;

-- 2. Show recent indicators
SELECT 
  indicator_type,
  data_source,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER as age_seconds
FROM market_indicators_cache 
WHERE is_active = true 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if the RPC function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_latest_market_indicator'
) as function_exists;

-- 4. Test the RPC function
SELECT * FROM get_latest_market_indicator('fear_greed');

-- 5. Check cache_config table
SELECT * FROM cache_config ORDER BY config_key;

-- 6. Check table permissions
SELECT 
  schemaname,
  tablename,
  hasinsert,
  hasselect,
  hasupdate,
  hasdelete
FROM pg_tables t
LEFT JOIN pg_user u ON t.tableowner = u.usename
WHERE schemaname = 'public' 
  AND tablename IN ('market_indicators_cache', 'cache_config', 'stock_data');
