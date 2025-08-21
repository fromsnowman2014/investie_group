#!/bin/bash

# Local vs Production Comparison Script
# Compares local development environment with Railway production deployment

LOCAL_URL="http://localhost:3001"
RAILWAY_URL="https://investie-backend-02-production.up.railway.app"
API_PATH="/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🔄 LOCAL vs PRODUCTION COMPARISON${NC}"
echo "=================================="
echo "Local:      $LOCAL_URL"
echo "Production: $RAILWAY_URL"
echo ""

# Function to compare endpoints
compare_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -e "${BLUE}Testing: $description${NC}"
    echo "Endpoint: $endpoint"
    echo ""
    
    # Test local
    echo -e "${GREEN}LOCAL RESPONSE:${NC}"
    local_response=$(curl -s "${LOCAL_URL}${API_PATH}${endpoint}" 2>/dev/null)
    local_status=$?
    
    if [ $local_status -eq 0 ] && [ -n "$local_response" ]; then
        echo "$local_response" | jq . 2>/dev/null | head -10 || echo "$local_response" | head -5
        
        # Check for mock data indicators in local
        if echo "$local_response" | grep -q "mock\|API key not configured"; then
            echo -e "${YELLOW}⚠️  Local: Using MOCK DATA${NC}"
        else
            echo -e "${GREEN}✅ Local: Using REAL DATA${NC}"
        fi
    else
        echo -e "${RED}❌ Local server not running or endpoint failed${NC}"
    fi
    echo ""
    
    # Test production
    echo -e "${GREEN}PRODUCTION RESPONSE:${NC}"
    prod_response=$(curl -s "${RAILWAY_URL}${API_PATH}${endpoint}" 2>/dev/null)
    prod_status=$?
    
    if [ $prod_status -eq 0 ] && [ -n "$prod_response" ]; then
        echo "$prod_response" | jq . 2>/dev/null | head -10 || echo "$prod_response" | head -5
        
        # Check for mock data indicators in production
        if echo "$prod_response" | grep -q "mock\|API key not configured"; then
            echo -e "${YELLOW}⚠️  Production: Using MOCK DATA${NC}"
        else
            echo -e "${GREEN}✅ Production: Using REAL DATA${NC}"
        fi
    else
        echo -e "${RED}❌ Production endpoint failed${NC}"
    fi
    echo ""
    
    # Compare data sources if both responses exist
    if [ $local_status -eq 0 ] && [ $prod_status -eq 0 ] && [ -n "$local_response" ] && [ -n "$prod_response" ]; then
        echo -e "${PURPLE}COMPARISON:${NC}"
        
        # Extract source information
        local_sources=$(echo "$local_response" | jq -r '.. | objects | select(has("source")) | .source' 2>/dev/null | sort -u)
        prod_sources=$(echo "$prod_response" | jq -r '.. | objects | select(has("source")) | .source' 2>/dev/null | sort -u)
        
        if [ -n "$local_sources" ] || [ -n "$prod_sources" ]; then
            echo "Local Sources: $local_sources"
            echo "Production Sources: $prod_sources"
            
            if [ "$local_sources" = "$prod_sources" ]; then
                echo -e "${GREEN}✅ Sources match${NC}"
            else
                echo -e "${YELLOW}⚠️  Sources differ${NC}"
            fi
        fi
    fi
    
    echo "----------------------------------------"
    echo ""
}

# Function to check environment configuration
check_environment_config() {
    echo -e "${BLUE}🔧 ENVIRONMENT CONFIGURATION CHECK${NC}"
    echo "=================================="
    
    echo -e "${GREEN}Local Environment (.env files):${NC}"
    if [ -f "apps/backend/.env.local" ]; then
        echo "Found: apps/backend/.env.local"
        grep -E "(ALPHA_VANTAGE_API_KEY|SERPAPI_API_KEY|CLAUDE_API_KEY|SUPABASE)" apps/backend/.env.local | sed 's/=.*/=***' || echo "No API keys found in .env.local"
    else
        echo "❌ No .env.local file found"
    fi
    
    if [ -f "apps/backend/.env" ]; then
        echo "Found: apps/backend/.env"
        grep -E "(ALPHA_VANTAGE_API_KEY|SERPAPI_API_KEY|CLAUDE_API_KEY|SUPABASE)" apps/backend/.env | sed 's/=.*/=***' || echo "No API keys found in .env"
    else
        echo "❌ No .env file found"
    fi
    echo ""
    
    echo -e "${GREEN}Production Environment (Railway):${NC}"
    echo "⚠️  Cannot directly access Railway environment variables from this script"
    echo "✅ Check Railway Dashboard → Your Project → Variables tab"
    echo "Required variables:"
    echo "   - ALPHA_VANTAGE_API_KEY"
    echo "   - SERPAPI_API_KEY"
    echo "   - CLAUDE_API_KEY"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo ""
}

# Main comparison tests
echo -e "${BLUE}🏥 1. HEALTH CHECK COMPARISON${NC}"
compare_endpoint "/health" "Health Status"

echo -e "${BLUE}📈 2. STOCKS API COMPARISON${NC}"
compare_endpoint "/stocks/AAPL" "Stock Data (AAPL)"

echo -e "${BLUE}📰 3. NEWS API COMPARISON${NC}"
compare_endpoint "/news/AAPL" "News Analysis (AAPL)"

echo -e "${BLUE}🤖 4. AI API COMPARISON${NC}"
compare_endpoint "/ai/analysis/AAPL" "AI Analysis (AAPL)"

echo -e "${BLUE}📊 5. MARKET API COMPARISON${NC}"
compare_endpoint "/market/overview" "Market Overview"

# Environment configuration check
check_environment_config

echo -e "${PURPLE}🎯 ANALYSIS SUMMARY${NC}"
echo "==================="
echo "1. If LOCAL shows real data but PRODUCTION shows mock data:"
echo "   → Railway API keys are missing or incorrect"
echo ""
echo "2. If both show mock data:"
echo "   → API keys missing in both environments"
echo ""
echo "3. If both show real data:"
echo "   → ✅ Migration successful! Both environments using real APIs"
echo ""
echo "4. If PRODUCTION fails entirely:"
echo "   → Railway deployment or routing issue"
echo ""

echo -e "${YELLOW}🔧 NEXT STEPS:${NC}"
echo "1. Run: ./verify-railway-deployment.sh (for detailed Railway analysis)"
echo "2. Run: ./test-railway-endpoints.sh (for individual endpoint testing)"
echo "3. Check Railway Dashboard environment variables if needed"
echo "4. Test local environment: npm run backend:dev"