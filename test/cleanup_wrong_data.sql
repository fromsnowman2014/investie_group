-- Clean up wrong data and prepare for fresh data collection
-- Run in Supabase SQL Editor

-- 1. Clear any wrong data from market_indicators_cache table
DELETE FROM market_indicators_cache WHERE id > 0;

-- 2. Verify table is empty
SELECT COUNT(*) as records_in_cache FROM market_indicators_cache;

-- 3. Check table structure is correct
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'market_indicators_cache'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🧹 Cleaned market_indicators_cache table for fresh data collection';
END
$$;