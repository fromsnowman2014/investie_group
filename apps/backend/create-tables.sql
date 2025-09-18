-- Create the necessary tables for Investie app
-- Run this in your Supabase SQL Editor

-- Create enum for stock symbols
DO $$ BEGIN
  CREATE TYPE stock_symbol AS ENUM (
    'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 
    'NVDA', 'META', 'NFLX', 'AVGO', 'AMD'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Macro news table
CREATE TABLE IF NOT EXISTS macro_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  top_headline TEXT NOT NULL,
  articles JSONB DEFAULT '[]',
  total_articles INTEGER DEFAULT 0,
  market_impact VARCHAR(10) CHECK (market_impact IN ('bullish', 'neutral', 'bearish')),
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
  sentiment VARCHAR(10) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
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
  recommendation VARCHAR(10) CHECK (recommendation IN ('BUY', 'HOLD', 'SELL')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  key_factors TEXT[] DEFAULT '{}',
  risk_level VARCHAR(10) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
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

-- Stock profiles table (for caching stock data)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_symbol_date ON ai_analysis(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_news_symbol_date ON stock_news(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_macro_news_date ON macro_news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_indicators_date ON market_indicators(date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_profiles_symbol ON stock_profiles(symbol, updated_at DESC);

-- Create unique constraints to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_market_indicators_date 
  ON market_indicators(date);
CREATE UNIQUE INDEX IF NOT EXISTS unique_stock_profile_symbol 
  ON stock_profiles(symbol);

-- Enable RLS (Row Level Security)
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow all operations on ai_analysis" ON ai_analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_news" ON stock_news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on macro_news" ON macro_news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on market_indicators" ON market_indicators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_profiles" ON stock_profiles FOR ALL USING (true) WITH CHECK (true);