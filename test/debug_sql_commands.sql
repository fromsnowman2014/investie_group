-- Debug commands for production database
-- Run these one by one to identify the issue

-- 1. Basic table verification
SELECT COUNT(*) as row_count FROM market_indicators_cache;

-- 2. Check recent activity (should be empty if no data)
SELECT * FROM market_indicators_cache 
WHERE created_at > NOW() - INTERVAL '1 hour' 
ORDER BY created_at DESC;

-- 3. Test manual insert to verify table works
INSERT INTO market_indicators_cache (
  indicator_type, 
  data_value, 
  data_source, 
  expires_at, 
  is_active
) VALUES (
  'test_manual',
  '{"value": 123, "status": "manual_test"}',
  'debug_test',
  NOW() + INTERVAL '1 day',
  true
) RETURNING *;

-- 4. Verify manual insert worked
SELECT * FROM market_indicators_cache WHERE indicator_type = 'test_manual';

-- 5. Check RLS policies that might block inserts
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'market_indicators_cache';

-- 6. Check table permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'market_indicators_cache'
  AND table_schema = 'public';

-- 7. Check if service role can insert (simulate what the function should do)
-- Note: This might fail if run with anon key, which is expected
SELECT current_user, session_user;
