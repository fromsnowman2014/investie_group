-- Create the necessary tables for Investie app (Final version)
-- Run this in your Supabase SQL Editor

-- Macro news table
CREATE TABLE IF NOT EXISTS macro_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  top_headline TEXT NOT NULL,
  articles JSONB DEFAULT '[]',
  total_articles INTEGER DEFAULT 0,
  market_impact VARCHAR(10),
  source VARCHAR(50) DEFAULT 'serpapi',
  query_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock news table  
CREATE TABLE IF NOT EXISTS stock_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  headline TEXT NOT NULL,
  articles JSONB DEFAULT '[]',
  sentiment VARCHAR(10),
  source VARCHAR(50) DEFAULT 'serpapi',
  query_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI analysis table
CREATE TABLE IF NOT EXISTS ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  overview TEXT NOT NULL,
  recommendation VARCHAR(10),
  confidence INTEGER,
  key_factors TEXT[] DEFAULT '{}',
  risk_level VARCHAR(10),
  time_horizon VARCHAR(50),
  source VARCHAR(50) DEFAULT 'claude_ai',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market indicators table
CREATE TABLE IF NOT EXISTS market_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  indices JSONB NOT NULL DEFAULT '{}',
  sectors JSONB DEFAULT '[]',
  market_sentiment VARCHAR(20),
  volatility_index DECIMAL(5,2),
  source VARCHAR(50) DEFAULT 'mock_data',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock profiles table
CREATE TABLE IF NOT EXISTS stock_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  current_price DECIMAL(10,2),
  change_percent DECIMAL(5,2),
  market_cap VARCHAR(20),
  pe_ratio DECIMAL(8,2),
  volume VARCHAR(20),
  source VARCHAR(50) DEFAULT 'mock_data',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remove duplicate data before creating unique constraints
DELETE FROM market_indicators 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM market_indicators 
    GROUP BY date
);

DELETE FROM stock_profiles 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM stock_profiles 
    GROUP BY symbol
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_analysis_symbol_date ON ai_analysis(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_news_symbol_date ON stock_news(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_macro_news_date ON macro_news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_indicators_date ON market_indicators(date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_profiles_symbol ON stock_profiles(symbol, created_at DESC);

-- Create unique constraints (only if no duplicates exist)
DO $$ 
BEGIN
    -- Try to create unique index for market_indicators
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'unique_market_indicators_date') THEN
        CREATE UNIQUE INDEX unique_market_indicators_date ON market_indicators(date);
    END IF;
    
    -- Try to create unique index for stock_profiles
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'unique_stock_profile_symbol') THEN
        CREATE UNIQUE INDEX unique_stock_profile_symbol ON stock_profiles(symbol);
    END IF;
EXCEPTION 
    WHEN others THEN
        RAISE NOTICE 'Some unique indexes may already exist or have conflicts';
END $$;

-- Enable RLS 
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_profiles ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all operations
DROP POLICY IF EXISTS "Allow all operations" ON ai_analysis;
CREATE POLICY "Allow all operations" ON ai_analysis FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON stock_news;
CREATE POLICY "Allow all operations" ON stock_news FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON macro_news;
CREATE POLICY "Allow all operations" ON macro_news FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON market_indicators;
CREATE POLICY "Allow all operations" ON market_indicators FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON stock_profiles;
CREATE POLICY "Allow all operations" ON stock_profiles FOR ALL USING (true) WITH CHECK (true);