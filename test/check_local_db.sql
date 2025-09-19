-- Check market_indicators_cache table in local DB
SELECT 
  indicator_type,
  data_source,
  created_at,
  is_active
FROM market_indicators_cache 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if RPC function exists and works
SELECT * FROM get_latest_market_indicator('fear_greed');

-- Check table schema
\d market_indicators_cache;
