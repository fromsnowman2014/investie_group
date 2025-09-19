-- Check if market_indicators_cache table exists in production
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'market_indicators_cache'
) as table_exists;

-- Check table columns if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'market_indicators_cache'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there's any data in the table
SELECT COUNT(*) as row_count FROM market_indicators_cache;

-- Show recent records if any
SELECT indicator_type, data_source, created_at 
FROM market_indicators_cache 
ORDER BY created_at DESC 
LIMIT 5;
