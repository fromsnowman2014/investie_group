-- Production Database Cleanup Script
-- WARNING: This will completely remove all market indicators data
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fwnmnjwtbggasmunsfyk/sql

-- Drop all functions first
DROP FUNCTION IF EXISTS get_latest_market_indicator(TEXT);
DROP FUNCTION IF EXISTS cleanup_expired_cache();
DROP FUNCTION IF EXISTS get_cache_config(TEXT);

-- Drop all policies
DO $$
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Allow anonymous read access" ON market_indicators_cache;
    DROP POLICY IF EXISTS "Allow anonymous read access" ON cache_config;
    DROP POLICY IF EXISTS "Allow anonymous read access" ON economic_indicators;
    DROP POLICY IF EXISTS "Allow service role full access" ON market_indicators_cache;
    DROP POLICY IF EXISTS "Allow service role full access" ON cache_config;
    DROP POLICY IF EXISTS "Allow service role full access" ON economic_indicators;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Some tables do not exist, continuing...';
END
$$;

-- Drop all tables completely
DROP TABLE IF EXISTS market_indicators_cache CASCADE;
DROP TABLE IF EXISTS cache_config CASCADE;
DROP TABLE IF EXISTS economic_indicators CASCADE;

-- Verify cleanup
DO $$
BEGIN
    RAISE NOTICE '🧹 Production database cleanup completed!';
    RAISE NOTICE 'All market indicators tables, functions, and policies have been removed.';
    RAISE NOTICE 'Ready for fresh schema installation.';
END
$$;