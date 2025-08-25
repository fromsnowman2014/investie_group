import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in your .env file');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
console.log(`📍 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEnhancedMarketTables(): Promise<void> {
  console.log('\n🚀 Creating Enhanced Market Tables...\n');

  try {
    // 1. Market Data Cache Table
    console.log('📊 Creating market_data_cache table...');
    const { error: cacheTableError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Market data cache table with scheduled updates
        CREATE TABLE IF NOT EXISTS market_data_cache (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            data_type VARCHAR(50) NOT NULL,           -- 'fear_greed', 'economic_indicators', etc.
            data_payload JSONB NOT NULL,             -- Cached market data
            market_session VARCHAR(20) NOT NULL,     -- 'market_open', 'market_close'
            cache_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expiry_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            api_source VARCHAR(50) NOT NULL,         -- 'fred', 'alpha_vantage', etc.
            data_quality_score INTEGER DEFAULT 100,  -- Data reliability (0-100)
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Indexes for optimal query performance
        CREATE INDEX IF NOT EXISTS idx_market_data_type_session ON market_data_cache(data_type, market_session);
        CREATE INDEX IF NOT EXISTS idx_market_data_expiry ON market_data_cache(expiry_timestamp);
        CREATE INDEX IF NOT EXISTS idx_market_data_created ON market_data_cache(created_at DESC);
        
        -- Unique constraint to prevent duplicate entries per session
        CREATE UNIQUE INDEX IF NOT EXISTS idx_market_data_unique 
        ON market_data_cache(data_type, market_session);
      `
    });

    if (cacheTableError) {
      console.error('❌ Error creating market_data_cache table:', cacheTableError);
    } else {
      console.log('✅ market_data_cache table created successfully');
    }

    // 2. API Usage Log Table  
    console.log('📈 Creating api_usage_log table...');
    const { error: logTableError } = await supabase.rpc('execute_sql', {
      sql: `
        -- API usage tracking table
        CREATE TABLE IF NOT EXISTS api_usage_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            api_service VARCHAR(50) NOT NULL,        -- 'fred', 'alpha_vantage', etc.
            endpoint VARCHAR(200) NOT NULL,          -- API endpoint called
            request_count INTEGER DEFAULT 1,        -- Number of requests
            cache_hit BOOLEAN DEFAULT FALSE,        -- Whether data was cached
            response_time_ms INTEGER,               -- API response time
            cost_estimate DECIMAL(10,4),            -- Estimated API cost
            user_trigger BOOLEAN DEFAULT FALSE,     -- User-triggered vs scheduled
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Indexes for performance monitoring
        CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage_log(api_service);
        CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_log(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_api_usage_cache_hit ON api_usage_log(cache_hit);
      `
    });

    if (logTableError) {
      console.error('❌ Error creating api_usage_log table:', logTableError);
    } else {
      console.log('✅ api_usage_log table created successfully');
    }

    // 3. Market Intelligence Cache Table
    console.log('🧠 Creating market_intelligence_cache table...');
    const { error: intelligenceTableError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Daily market intelligence summary (AI-generated)
        CREATE TABLE IF NOT EXISTS market_intelligence_cache (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            market_date DATE NOT NULL,
            session_type VARCHAR(20) NOT NULL,      -- 'open', 'close'
            market_summary JSONB NOT NULL,          -- Complete market summary data
            ai_insights TEXT,                       -- Claude-generated insights
            confidence_score INTEGER DEFAULT 75,   -- AI confidence (0-100)
            data_sources TEXT[],                    -- Array of data sources used
            generation_duration_ms INTEGER,        -- Time to generate summary
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Unique constraint to prevent duplicate entries
        CREATE UNIQUE INDEX IF NOT EXISTS idx_market_intelligence_date_session 
        ON market_intelligence_cache(market_date, session_type);
        
        -- Index for querying by date
        CREATE INDEX IF NOT EXISTS idx_market_intelligence_date ON market_intelligence_cache(market_date DESC);
      `
    });

    if (intelligenceTableError) {
      console.error('❌ Error creating market_intelligence_cache table:', intelligenceTableError);
    } else {
      console.log('✅ market_intelligence_cache table created successfully');
    }

    // 4. Test table access
    console.log('\n🧪 Testing table access...');
    
    // Test market_data_cache
    const { data: cacheData, error: cacheAccessError } = await supabase
      .from('market_data_cache')
      .select('count(*)')
      .limit(1);
    
    if (cacheAccessError) {
      console.error('❌ Cannot access market_data_cache table:', cacheAccessError);
    } else {
      console.log('✅ market_data_cache table accessible');
    }

    // Test api_usage_log
    const { data: logData, error: logAccessError } = await supabase
      .from('api_usage_log')
      .select('count(*)')
      .limit(1);
    
    if (logAccessError) {
      console.error('❌ Cannot access api_usage_log table:', logAccessError);
    } else {
      console.log('✅ api_usage_log table accessible');
    }

    // Test market_intelligence_cache
    const { data: intelligenceData, error: intelligenceAccessError } = await supabase
      .from('market_intelligence_cache')
      .select('count(*)')
      .limit(1);
    
    if (intelligenceAccessError) {
      console.error('❌ Cannot access market_intelligence_cache table:', intelligenceAccessError);
    } else {
      console.log('✅ market_intelligence_cache table accessible');
    }

    console.log('\n🎉 Enhanced market tables migration completed!');
    console.log('\nTables created:');
    console.log('  ✓ market_data_cache - For caching market data with expiration');
    console.log('  ✓ api_usage_log - For tracking API usage and costs');
    console.log('  ✓ market_intelligence_cache - For storing AI-generated market summaries');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  createEnhancedMarketTables()
    .then(() => {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

export { createEnhancedMarketTables };