#!/bin/bash

# Supabase Deployment Verification Script
# Comprehensive health check for Supabase Edge Functions and backend integration

echo "🚀 SUPABASE DEPLOYMENT VERIFICATION"
echo "==================================="
echo "Timestamp: $(date)"
echo ""

# Configuration
SUPABASE_URL="https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8"
BACKEND_URL="http://localhost:3001"  # Adjust for production

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="$3"
    local headers="$4"
    local data="$5"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -X POST "$url" -H "$headers" -H "Content-Type: application/json" -d "$data")
    else
        response=$(curl -s -w "%{http_code}" "$url")
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "   Response: $body"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo -e "${BLUE}1. Backend Health Checks${NC}"
echo "========================"

# Test backend health endpoint
test_endpoint "Backend Health" "$BACKEND_URL/health" "GET"

# Test backend API info
test_endpoint "Backend API Info" "$BACKEND_URL/" "GET"

echo ""
echo -e "${BLUE}2. Supabase Edge Functions${NC}"
echo "=========================="

# Test Market Overview Edge Function
test_endpoint "Market Overview" "$SUPABASE_URL/market-overview" "POST" "Authorization: Bearer $AUTH_TOKEN" "{}"

# Test Stock Data Edge Function
test_endpoint "Stock Data (AAPL)" "$SUPABASE_URL/stock-data" "POST" "Authorization: Bearer $AUTH_TOKEN" '{"symbol": "AAPL"}'

# Test AI Analysis Edge Function
test_endpoint "AI Analysis (AAPL)" "$SUPABASE_URL/ai-analysis" "POST" "Authorization: Bearer $AUTH_TOKEN" '{"symbol": "AAPL"}'

# Test News Analysis Edge Function
test_endpoint "News Analysis (AAPL)" "$SUPABASE_URL/news-analysis" "POST" "Authorization: Bearer $AUTH_TOKEN" '{"symbol": "AAPL"}'

# Test Data Collector Edge Function
test_endpoint "Data Collector" "$SUPABASE_URL/data-collector" "POST" "Authorization: Bearer $AUTH_TOKEN" '{"symbols": ["AAPL"]}'

echo ""
echo -e "${BLUE}3. Backend API Endpoints${NC}"
echo "========================"

# Test backend API endpoints
test_endpoint "Stock Data API (AAPL)" "$BACKEND_URL/api/v1/stocks/AAPL" "GET"
test_endpoint "Market Overview API" "$BACKEND_URL/api/v1/market/overview" "GET"
test_endpoint "AI Health Check" "$BACKEND_URL/api/v1/ai/health" "GET"
test_endpoint "News Health Check" "$BACKEND_URL/api/v1/news/health" "GET"

echo ""
echo -e "${BLUE}4. Data Quality Verification${NC}"
echo "============================"

# Test data structure and quality
echo -n "Verifying market data structure... "
market_response=$(curl -s -X POST "$SUPABASE_URL/market-overview" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

if echo "$market_response" | jq -e '.indices.sp500.value' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Market data structure invalid"
    ((TESTS_FAILED++))
fi

echo ""
echo -e "${YELLOW}=== DEPLOYMENT VERIFICATION SUMMARY ===${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED - Deployment is healthy!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Frontend should now point to Supabase Edge Functions"
    echo "2. Verify API keys are configured in Supabase Dashboard"
    echo "3. Monitor Edge Function logs for any issues"
    exit 0
else
    echo -e "${RED}❌ Some tests failed - please investigate${NC}"
    echo ""
    echo -e "${BLUE}Troubleshooting:${NC}"
    echo "1. Check Supabase Edge Function logs: supabase functions logs <function-name>"
    echo "2. Verify API keys in Supabase Dashboard > Settings > Edge Functions > Secrets"
    echo "3. Ensure backend is running: npm run start:dev in apps/backend"
    echo "4. Check network connectivity and CORS settings"
    exit 1
fi
