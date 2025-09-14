#!/bin/bash

# Vercel Environment Variables Testing Script
# Tests environment variable loading in production deployment

echo "🚀 VERCEL ENVIRONMENT TESTING"
echo "============================="
echo "Timestamp: $(date)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VERCEL_URL="https://investie-group-web.vercel.app"  # Update with your actual Vercel URL
API_DEBUG_ENDPOINT="$VERCEL_URL/api/debug"
TEST_PAGE="$VERCEL_URL"

echo -e "${BLUE}1. Testing Production Environment Variables${NC}"
echo "============================================="

# Test 1: Check if API Debug Panel is visible
echo -n "Testing API Debug Panel visibility... "
response=$(curl -s "$TEST_PAGE" | grep -o "API Debug Panel" | wc -l)
if [ "$response" -gt 0 ]; then
    echo -e "${GREEN}✓ VISIBLE${NC}"
else
    echo -e "${RED}✗ NOT VISIBLE${NC}"
fi

# Test 2: Extract environment info from page source
echo -n "Extracting environment variables from page... "
page_content=$(curl -s "$TEST_PAGE")

# Look for specific patterns in the JavaScript or HTML
build_time_count=$(echo "$page_content" | grep -o "BUILD_TIME_ENV_COUNT.*[0-9]" | head -1)
build_time_supabase=$(echo "$page_content" | grep -o "BUILD_TIME_SUPABASE_URL.*MISSING\|BUILD_TIME_SUPABASE_URL.*https" | head -1)

if [ -n "$build_time_count" ]; then
    echo -e "${GREEN}✓ EXTRACTED${NC}"
    echo "   $build_time_count"
    echo "   $build_time_supabase"
else
    echo -e "${YELLOW}⚠ PARTIAL${NC}"
fi

echo ""
echo -e "${BLUE}2. Direct API Endpoint Tests${NC}"
echo "============================"

# Test Supabase Edge Functions directly
echo -n "Testing Market Overview Edge Function... "
market_response=$(curl -s -X POST "https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/market-overview" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJiss3VwYWJhc2UiLCJyZWYiOiJmd25tbmp3dGJnZ2FzbXVuc2Z5ayIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI0MTE0NDk3LCJleHAiOjIwMzk2OTA0OTd9.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8" \
  -H "Content-Type: application/json" \
  -w "%{http_code}")

http_code="${market_response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ SUCCESS${NC} (HTTP $http_code)"
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
fi

echo ""
echo -e "${BLUE}3. Browser-based Environment Check${NC}"
echo "=================================="

echo "To manually verify in browser:"
echo "1. Open: $TEST_PAGE"
echo "2. Look for API Debug Panel in top-right corner"
echo "3. Check console for environment variable logs"
echo "4. Verify the following information:"
echo ""
echo -e "${YELLOW}Expected Values:${NC}"
echo "   - Build Time Env Count: > 0"
echo "   - Runtime NEXT_PUBLIC_ Count: > 0"
echo "   - Supabase URL: https://fwnmnjwtbggasmunsfyk.supabase.co"
echo "   - Functions URL: https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1"
echo "   - Anon Key Status: SET"
echo ""

echo -e "${BLUE}4. Debugging Commands${NC}"
echo "==================="
echo ""
echo "If environment variables are missing, check Vercel dashboard:"
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select your project: investie-group-web"
echo "3. Go to Settings → Environment Variables"
echo "4. Verify these variables are set:"
echo ""
echo -e "${YELLOW}Required Vercel Environment Variables:${NC}"
cat << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://fwnmnjwtbggasmunsfyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1
NEXT_PUBLIC_API_URL=https://investiegroup-production.up.railway.app
EOF
echo ""

echo -e "${BLUE}5. Force Redeploy Command${NC}"
echo "========================"
echo "If variables are set but not working, trigger redeploy:"
echo ""
echo -e "${GREEN}git commit --allow-empty -m \"Force redeploy to refresh environment variables\"${NC}"
echo -e "${GREEN}git push origin main${NC}"
echo ""

echo -e "${YELLOW}🔍 Manual Testing Steps:${NC}"
echo "1. Visit: $TEST_PAGE"
echo "2. Open Browser DevTools (F12)"
echo "3. Check Console tab for environment logs"
echo "4. Look for '🔍 ENVIRONMENT VARIABLE DEBUGGING' group"
echo "5. Verify build-time vs runtime variable counts"
echo ""
echo -e "${GREEN}✅ Testing script complete${NC}"
