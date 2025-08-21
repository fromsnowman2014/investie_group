#!/bin/bash

# Individual Railway Endpoint Tests
# Quick commands to test specific Railway endpoints

RAILWAY_URL="https://investie-backend-02-production.up.railway.app"
API_BASE="${RAILWAY_URL}/api/v1"

echo "🚂 RAILWAY ENDPOINT TESTS"
echo "========================"
echo "Railway URL: $RAILWAY_URL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. Health Check${NC}"
echo "Command: curl -s ${API_BASE}/health | jq ."
curl -s "${API_BASE}/health" | jq .
echo ""

echo -e "${BLUE}2. All Stocks (Check for Alpha Vantage integration)${NC}"
echo "Command: curl -s ${API_BASE}/stocks | jq '.[] | {symbol, price: .price, source: .price.source}' | head -5"
curl -s "${API_BASE}/stocks" | jq '.[] | {symbol, price: .price, source: .price.source}' | head -5
echo ""

echo -e "${BLUE}3. Individual Stock - AAPL (Check data sources)${NC}"
echo "Command: curl -s ${API_BASE}/stocks/AAPL | jq '{symbol, price: .price.source, ai: .aiEvaluation.source, news: .newsSummary.source}'"
curl -s "${API_BASE}/stocks/AAPL" | jq '{symbol, price: .price.source, ai: .aiEvaluation.source, news: .newsSummary.source}'
echo ""

echo -e "${BLUE}4. Stock News - AAPL (Check SerpAPI + Claude)${NC}" 
echo "Command: curl -s ${API_BASE}/news/AAPL | jq '{isValid, symbol, overview: .overview.source}'"
curl -s "${API_BASE}/news/AAPL" | jq '{isValid, symbol, overview: .overview.source}'
echo ""

echo -e "${BLUE}5. Macro News (Check SerpAPI integration)${NC}"
echo "Command: curl -s ${API_BASE}/news/macro/today | jq '{summary: .summary[0:100], source}'"
curl -s "${API_BASE}/news/macro/today" | jq '{summary: .summary[0:100], source}'
echo ""

echo -e "${BLUE}6. AI Analysis - AAPL (Check Claude integration)${NC}"
echo "Command: curl -s ${API_BASE}/ai/analysis/AAPL | jq '{rating, confidence, source, summary: .summary[0:100]}'"
curl -s "${API_BASE}/ai/analysis/AAPL" | jq '{rating, confidence, source, summary: .summary[0:100]}'
echo ""

echo -e "${BLUE}7. Market Overview${NC}"
echo "Command: curl -s ${API_BASE}/market/overview | jq '{marketTrend, fearGreedIndex}'"
curl -s "${API_BASE}/market/overview" | jq '{marketTrend, fearGreedIndex}'
echo ""

echo -e "${BLUE}8. Process News Endpoint (POST)${NC}"
echo "Command: curl -s -X POST -H 'Content-Type: application/json' -d '{\"symbol\":\"AAPL\"}' ${API_BASE}/news/process | jq '{isValid, symbol}'"
curl -s -X POST -H "Content-Type: application/json" -d '{"symbol":"AAPL"}' "${API_BASE}/news/process" | jq '{isValid, symbol}'
echo ""

echo -e "${YELLOW}📋 API KEY STATUS INDICATORS:${NC}"
echo "✅ Real Data: Look for sources like 'alpha_vantage', 'serpapi', 'claude_ai'"
echo "❌ Mock Data: Look for sources like 'mock_data', 'fallback_data', or 'API key not configured' messages"
echo "⚠️  Supabase: Check for 'supabase_cache' sources or PGRST002 errors"
echo ""

echo -e "${YELLOW}🔧 QUICK DEBUGGING COMMANDS:${NC}"
echo ""
echo "# Check if specific API keys are working:"
echo "curl -s ${API_BASE}/stocks/AAPL | grep -E 'alpha_vantage|mock|API key'"
echo "curl -s ${API_BASE}/news/AAPL | grep -E 'serpapi|claude|mock|API key'"
echo "curl -s ${API_BASE}/ai/analysis/AAPL | grep -E 'claude|mock|API key'"
echo ""
echo "# Check for Supabase connection:"
echo "curl -s ${API_BASE}/stocks/AAPL | grep -E 'supabase|PGRST002'"
echo ""
echo "# Test error handling:"
echo "curl -s ${API_BASE}/stocks/INVALID | jq ."