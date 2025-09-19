import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Production Supabase configuration
const supabaseUrl = 'https://fwnmnjwtbggasmunsfyk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔑 Using key:', supabaseServiceKey ? 'Found' : 'Not found');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductionDB() {
  console.log('🔍 Checking production database state...');

  // 1. Check market_indicators_cache table
  console.log('\n1. Checking market_indicators_cache table:');
  try {
    const { data: cacheData, error: cacheError } = await supabase
      .from('market_indicators_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (cacheError) {
      console.error('❌ market_indicators_cache error:', cacheError.message);
    } else {
      console.log(`✅ Found ${cacheData?.length || 0} recent records`);
      if (cacheData && cacheData.length > 0) {
        console.log('Latest record:', {
          indicator_type: cacheData[0].indicator_type,
          data_source: cacheData[0].data_source,
          created_at: cacheData[0].created_at
        });
      }
    }
  } catch (error) {
    console.error('💥 Exception checking market_indicators_cache:', error);
  }

  // 2. Check if RPC function exists
  console.log('\n2. Testing get_latest_market_indicator function:');
  try {
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_latest_market_indicator', { p_indicator_type: 'fear_greed' });

    if (rpcError) {
      console.error('❌ RPC function error:', rpcError.message);
    } else {
      console.log('✅ RPC function works, returned:', rpcData?.length || 0, 'records');
    }
  } catch (error) {
    console.error('💥 Exception testing RPC function:', error);
  }

  // 3. Check cache_config table
  console.log('\n3. Checking cache_config table:');
  try {
    const { data: configData, error: configError } = await supabase
      .from('cache_config')
      .select('*');

    if (configError) {
      console.error('❌ cache_config error:', configError.message);
    } else {
      console.log(`✅ Found ${configData?.length || 0} config records`);
    }
  } catch (error) {
    console.error('💥 Exception checking cache_config:', error);
  }

  // 4. Count records by indicator type
  console.log('\n4. Counting records by indicator type:');
  try {
    const { data: countData, error: countError } = await supabase
      .from('market_indicators_cache')
      .select('indicator_type, count(*)')
      .eq('is_active', true)
      .group('indicator_type');

    if (countError) {
      console.error('❌ Count query error:', countError.message);
    } else {
      console.log('✅ Indicator counts:', countData);
    }
  } catch (error) {
    console.error('💥 Exception counting indicators:', error);
  }
}

checkProductionDB().then(() => {
  console.log('\n🎉 Database check complete');
}).catch((error) => {
  console.error('💥 Database check failed:', error);
});
