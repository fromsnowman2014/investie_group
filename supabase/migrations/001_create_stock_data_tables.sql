-- Stock Data Caching Tables
-- Created: 2025-09-11
-- Purpose: Cache stock data from external APIs for frontend consumption

-- Stock price data table
CREATE TABLE stock_data (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  change_amount DECIMAL(10,2) NOT NULL,
  change_percent DECIMAL(5,2) NOT NULL,
  market_cap BIGINT,
  volume BIGINT,
  pe_ratio DECIMAL(8,2),
  fifty_two_week_high DECIMAL(10,2),
  fifty_two_week_low DECIMAL(10,2),
  data_source VARCHAR(50) NOT NULL DEFAULT 'alpha_vantage',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI analysis data table
CREATE TABLE ai_analysis (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  rating VARCHAR(20) NOT NULL CHECK (rating IN ('bullish', 'neutral', 'bearish')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  recommendation VARCHAR(10) NOT NULL CHECK (recommendation IN ('BUY', 'HOLD', 'SELL')),
  summary TEXT NOT NULL,
  key_factors JSONB,
  analysis_date TIMESTAMPTZ NOT NULL,
  ai_source VARCHAR(50) NOT NULL DEFAULT 'claude',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News analysis data table
CREATE TABLE news_analysis (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10),
  news_type VARCHAR(20) NOT NULL CHECK (news_type IN ('stock', 'macro')),
  sentiment VARCHAR(20) NOT NULL,
  sentiment_score DECIMAL(3,2),
  confidence INTEGER,
  news_count INTEGER,
  timeframe VARCHAR(10),
  key_topics JSONB,
  headlines JSONB,
  ai_summary JSONB,
  analysis_version VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market overview data table
CREATE TABLE market_overview (
  id BIGSERIAL PRIMARY KEY,
  fear_greed_index JSONB,
  economic_indicators JSONB,
  sp500_data JSONB,
  sector_performance JSONB,
  data_source VARCHAR(50) NOT NULL DEFAULT 'alpha_vantage',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stock_data_symbol_created ON stock_data(symbol, created_at DESC);
CREATE INDEX idx_ai_analysis_symbol_created ON ai_analysis(symbol, created_at DESC);
CREATE INDEX idx_news_analysis_symbol_created ON news_analysis(symbol, created_at DESC);
CREATE INDEX idx_news_analysis_type_created ON news_analysis(news_type, created_at DESC);
CREATE INDEX idx_market_overview_created ON market_overview(created_at DESC);

-- Row Level Security (RLS) - Enable public read access
ALTER TABLE stock_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_analysis ENABLE ROW LEVEL SECURITY;  
ALTER TABLE market_overview ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to all tables
CREATE POLICY "Allow anonymous read access" ON stock_data FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON ai_analysis FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON news_analysis FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON market_overview FOR SELECT USING (true);

-- Comments for documentation
COMMENT ON TABLE stock_data IS 'Cached stock price and financial data from Alpha Vantage API';
COMMENT ON TABLE ai_analysis IS 'AI-generated stock analysis from Claude/OpenAI APIs';
COMMENT ON TABLE news_analysis IS 'News sentiment analysis for stocks and macro market';
COMMENT ON TABLE market_overview IS 'Daily market overview including Fear & Greed Index';