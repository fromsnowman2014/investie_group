#!/bin/bash

# Supabase Edge Functions Endpoint Tests
# Quick commands to test specific Supabase Edge Functions

SUPABASE_URL="https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8"

echo "🚀 SUPABASE EDGE FUNCTIONS TESTS"
echo "================================="
echo "Supabase URL: $SUPABASE_URL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. Market Overview Edge Function${NC}"
echo "Command: curl -X POST ${SUPABASE_URL}/market-overview"
curl -X POST "${SUPABASE_URL}/market-overview" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '{source, indices: .indices.sp500, vix}'
echo ""

echo -e "${BLUE}2. Stock Data Edge Function - AAPL${NC}"
echo "Command: curl -X POST ${SUPABASE_URL}/stock-data"
curl -X POST "${SUPABASE_URL}/stock-data" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}' \
  -s | jq '{symbol, price: .price, source}'
echo ""

echo -e "${BLUE}3. AI Analysis Edge Function - AAPL${NC}"
echo "Command: curl -X POST ${SUPABASE_URL}/ai-analysis"
curl -X POST "${SUPABASE_URL}/ai-analysis" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}' \
  -s | jq '{rating, confidence, source, summary: .summary[0:100]}'
echo ""

echo -e "${BLUE}4. News Analysis Edge Function - AAPL${NC}"
echo "Command: curl -X POST ${SUPABASE_URL}/news-analysis"
curl -X POST "${SUPABASE_URL}/news-analysis" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}' \
  -s | jq '{symbol, overview: .overview.source, summary: .summary[0:100]}'
echo ""

echo -e "${BLUE}5. Data Collector Edge Function${NC}"
echo "Command: curl -X POST ${SUPABASE_URL}/data-collector"
curl -X POST "${SUPABASE_URL}/data-collector" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL", "TSLA"]}' \
  -s | jq '{success, collected: length, timestamp}'
echo ""

echo -e "${BLUE}6. Database Reader Edge Function${NC}"
echo "Command: curl -X POST ${SUPABASE_URL}/database-reader"
curl -X POST "${SUPABASE_URL}/database-reader" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}' \
  -s | jq '{symbol, cached, timestamp}'
echo ""

echo -e "${YELLOW}Edge Functions Status Summary:${NC}"
echo "- All Edge Functions should return valid JSON responses"
echo "- Source field indicates data provider (alpha_vantage, mock_data, etc.)"
echo "- API keys are configured in Supabase Dashboard > Settings > Edge Functions > Secrets"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Verify API keys are set in Supabase Dashboard"
echo "2. Check Edge Function logs: supabase functions logs <function-name>"
echo "3. Deploy latest changes: supabase functions deploy"
