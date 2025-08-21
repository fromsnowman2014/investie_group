#!/bin/bash

# Railway Deployment Verification Script
# Verifies API integration status after migration from mock data to real APIs

# Configuration
RAILWAY_URL="https://investie-backend-02-production.up.railway.app"
BACKEND_API="${RAILWAY_URL}/api/v1"

echo "🚂 RAILWAY DEPLOYMENT VERIFICATION"
echo "=================================="
echo "Railway URL: $RAILWAY_URL"
echo "Testing API integration status..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint and check for mock data indicators
test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_real_data_indicator=$3
    
    echo -e "${BLUE}Testing: $description${NC}"
    echo "URL: $endpoint"
    
    # Make request and capture response
    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$endpoint")
    local body=$(echo "$response" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
    local status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
    
    # Check HTTP status
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✅ HTTP Status: $status${NC}"
    else
        echo -e "${RED}❌ HTTP Status: $status${NC}"
        echo "Response: $body"
        echo ""
        return 1
    fi
    
    # Check for API key warnings (indicates using mock data)
    if echo "$body" | grep -q "API key not configured"; then
        echo -e "${RED}❌ API Key Missing: Found 'API key not configured' warning${NC}"
        echo "Status: Using MOCK DATA"
    elif echo "$body" | grep -q "mock"; then
        echo -e "${YELLOW}⚠️  Mock Data Detected: Response contains 'mock'${NC}"
        echo "Status: Likely using MOCK DATA"
    else
        echo -e "${GREEN}✅ No Mock Data Warnings Found${NC}"
        echo "Status: Likely using REAL DATA"
    fi
    
    # Check for Supabase errors
    if echo "$body" | grep -q "PGRST002\|authentication failed"; then
        echo -e "${RED}❌ Supabase Error: Database connection issue${NC}"
    else
        echo -e "${GREEN}✅ No Supabase Errors${NC}"
    fi
    
    # Check for specific real data indicators
    if [ -n "$expected_real_data_indicator" ]; then
        if echo "$body" | grep -q "$expected_real_data_indicator"; then
            echo -e "${GREEN}✅ Real Data Indicator Found: $expected_real_data_indicator${NC}"
        else
            echo -e "${YELLOW}⚠️  Real Data Indicator Not Found: $expected_real_data_indicator${NC}"
        fi
    fi
    
    # Show sample of response
    echo "Sample Response:"
    echo "$body" | jq '.' 2>/dev/null | head -10 || echo "$body" | head -5
    echo ""
}

# Function to check environment variable status via logs endpoint
check_env_status() {
    echo -e "${BLUE}🔍 ENVIRONMENT VARIABLES CHECK${NC}"
    echo "Checking if API keys are configured..."
    
    # Test health endpoint for environment status
    local health_response=$(curl -s "${BACKEND_API}/health" 2>/dev/null)
    
    if echo "$health_response" | grep -q "environment"; then
        echo "Environment Status in Health Check:"
        echo "$health_response" | jq '.environment // empty' 2>/dev/null || echo "No environment info in health check"
    fi
    echo ""
}

# Function to analyze data sources
analyze_data_sources() {
    echo -e "${BLUE}📊 DATA SOURCE ANALYSIS${NC}"
    echo "Analyzing which data sources are being used..."
    
    # Test stocks endpoint and analyze source
    local stocks_response=$(curl -s "${BACKEND_API}/stocks/AAPL" 2>/dev/null)
    
    if [ -n "$stocks_response" ]; then
        echo "Stock Data Source Analysis:"
        echo "$stocks_response" | jq '.price.source // "unknown"' 2>/dev/null || echo "Could not determine price source"
        echo "$stocks_response" | jq '.aiEvaluation.source // "unknown"' 2>/dev/null || echo "Could not determine AI source"
        echo "$stocks_response" | jq '.newsSummary.source // "unknown"' 2>/dev/null || echo "Could not determine news source"
    fi
    echo ""
}

echo "🔍 1. HEALTH CHECK"
echo "=================="
test_endpoint "${BACKEND_API}/health" "Health Endpoint" ""

echo "🔍 2. ENVIRONMENT STATUS"
echo "======================="
check_env_status

echo "🔍 3. STOCKS API (Alpha Vantage Integration)"
echo "============================================"
test_endpoint "${BACKEND_API}/stocks" "All Stocks List" "alpha_vantage"
test_endpoint "${BACKEND_API}/stocks/AAPL" "Individual Stock (AAPL)" "alpha_vantage"

echo "🔍 4. NEWS API (SerpAPI + Claude Integration)"
echo "============================================="
test_endpoint "${BACKEND_API}/news/AAPL" "Stock News Analysis" "serpapi\|claude"
test_endpoint "${BACKEND_API}/news/macro/today" "Macro News" "serpapi\|claude"

echo "🔍 5. MARKET DATA API"
echo "===================="
test_endpoint "${BACKEND_API}/market/overview" "Market Overview" ""

echo "🔍 6. AI ANALYSIS API (Claude Integration)"
echo "=========================================="
test_endpoint "${BACKEND_API}/ai/analysis/AAPL" "AI Analysis" "claude"

echo "🔍 7. DATA SOURCE ANALYSIS"
echo "========================="
analyze_data_sources

echo "🔍 8. API KEY CONFIGURATION CHECK"
echo "================================="
echo "Required API Keys for Real Data:"
echo "- ALPHA_VANTAGE_API_KEY (for stock prices)"
echo "- SERPAPI_API_KEY (for news data)" 
echo "- CLAUDE_API_KEY (for AI analysis)"
echo "- SUPABASE_URL + SUPABASE_ANON_KEY (for data storage)"
echo ""

echo "🎯 SUMMARY"
echo "=========="
echo "If you see:"
echo "- ✅ Green checkmarks: API integration working"
echo "- ⚠️  Yellow warnings: Possible mock data usage"
echo "- ❌ Red errors: API keys missing or misconfigured"
echo ""
echo "Next steps if using mock data:"
echo "1. Check Railway Dashboard → Environment Variables"
echo "2. Add missing API keys: ALPHA_VANTAGE_API_KEY, SERPAPI_API_KEY, CLAUDE_API_KEY"
echo "3. Restart Railway deployment"
echo "4. Re-run this verification script"