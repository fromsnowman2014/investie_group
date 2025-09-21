#!/bin/bash

# API 사용량 확인 스크립트 - Professional Monitoring Tool
# Usage: ./check_api_usage.sh [local|production]
# Author: Claude Code Assistant
# Version: 2.0

ENVIRONMENT=${1:-local}
DEBUG_MODE=${2:-false}

# Also accept 'debug' as second parameter
if [ "$2" = "debug" ]; then
    DEBUG_MODE="true"
fi

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
if [ "$ENVIRONMENT" = "local" ]; then
    BASE_URL="http://127.0.0.1:54321/functions/v1"
    AUTH_HEADER="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
else
    BASE_URL="https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1"
    # Production anon key for JWT-verified function
    AUTH_HEADER="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8"
fi

# Function to print debug information
debug_print() {
    if [ "$DEBUG_MODE" = "true" ]; then
        echo -e "${YELLOW}[DEBUG]${NC} $1"
    fi
}

# Function to make API calls with error handling
api_call() {
    local endpoint="$1"
    local description="$2"

    debug_print "Making API call to: $BASE_URL/$endpoint"
    debug_print "Using auth header: $AUTH_HEADER"

    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/$endpoint" -H "$AUTH_HEADER" 2>/dev/null)
    local http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    local body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')

    debug_print "HTTP Status: $http_code"
    debug_print "Response body: $body"

    if [ "$http_code" -eq 200 ]; then
        echo "$body"
        return 0
    else
        echo -e "${RED}❌ Failed to fetch $description${NC}" >&2
        echo -e "${RED}   HTTP Status: $http_code${NC}" >&2
        if [ -n "$body" ]; then
            echo -e "${RED}   Error: $body${NC}" >&2
        fi
        return 1
    fi
}

echo -e "\n${BLUE}🚀 API Usage Statistics${NC} (${GREEN}$ENVIRONMENT${NC})"
echo -e "${BLUE}============================================${NC}"
echo ""

# Test connection first
echo -e "${YELLOW}🔍 Testing connection...${NC}"
test_response=$(api_call "api-usage-dashboard" "connection test")
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cannot connect to API. Please check:${NC}"
    echo -e "   ${RED}• Network connectivity${NC}"
    echo -e "   ${RED}• API endpoint availability${NC}"
    echo -e "   ${RED}• Authentication credentials${NC}"
    echo ""
    echo -e "${YELLOW}💡 Debug mode: Run with 'debug' as second parameter${NC}"
    echo -e "   Example: ./check_api_usage.sh $ENVIRONMENT debug"
    exit 1
fi
echo -e "${GREEN}✅ Connection successful${NC}"
echo ""

# 전체 사용량 요약
echo -e "${BLUE}📊 Today's Summary:${NC}"
summary_data=$(api_call "api-usage-dashboard?action=dashboard&format=json" "today's summary")
if [ $? -eq 0 ]; then
    echo "$summary_data" | jq -r '.today[] | "• \(.api_provider): \(.total_requests) requests (\(.successful_requests) success, \(.failed_requests) failed) - Avg: \(.avg_response_time_ms // "N/A")ms"' 2>/dev/null || {
        echo -e "${YELLOW}⚠️ Could not parse summary data${NC}"
        debug_print "Raw summary data: $summary_data"
    }
else
    echo -e "${RED}❌ Failed to fetch today's summary${NC}"
fi

echo ""
echo -e "${BLUE}🌐 Provider Status:${NC}"
realtime_data=$(api_call "api-usage-dashboard?action=realtime" "realtime status")
if [ $? -eq 0 ]; then
    echo "$realtime_data" | jq -r '.[] | "• \(.api_provider): \(.requests_today // 0) today, \(.requests_this_hour // 0) this hour - Status: \(.health_status // "unknown")"' 2>/dev/null || {
        echo -e "${YELLOW}⚠️ Could not parse realtime data${NC}"
        debug_print "Raw realtime data: $realtime_data"
    }
else
    echo -e "${RED}❌ Failed to fetch realtime status${NC}"
fi

echo ""
echo -e "${BLUE}⚠️ Rate Limited Providers:${NC}"
rate_limit_data=$(api_call "api-usage-dashboard?action=rate_limits" "rate limits")
if [ $? -eq 0 ]; then
    RATE_LIMITED=$(echo "$rate_limit_data" | jq -r 'to_entries[] | select(.value == true) | .key' 2>/dev/null | tr '\n' ' ')
    if [ -z "$RATE_LIMITED" ]; then
        echo -e "${GREEN}✅ No providers are currently rate limited${NC}"
    else
        echo -e "${RED}🚫 Rate limited: $RATE_LIMITED${NC}"
    fi
else
    echo -e "${RED}❌ Failed to fetch rate limit status${NC}"
fi

echo ""
echo -e "${BLUE}📈 Detailed Stats (Alpha Vantage):${NC}"
daily_data=$(api_call "api-usage-dashboard?action=daily&provider=alpha_vantage" "Alpha Vantage daily stats")
if [ $? -eq 0 ]; then
    echo "$daily_data" | jq -r '.[] | "Date: \(.date_tracked) | Requests: \(.total_requests) | Success Rate: \(if .total_requests > 0 then (.successful_requests / .total_requests * 100 | floor) else 0 end)% | Usage: \(.usage_percentage // 0)%"' 2>/dev/null || {
        echo -e "${YELLOW}⚠️ No Alpha Vantage data available or format error${NC}"
        debug_print "Raw daily data: $daily_data"
    }
else
    echo -e "${RED}❌ Failed to fetch Alpha Vantage daily stats${NC}"
fi

echo ""
echo -e "${BLUE}💡 Access full dashboard:${NC}"
if [ "$ENVIRONMENT" = "local" ]; then
    echo -e "   ${GREEN}Browser:${NC} http://127.0.0.1:54321/functions/v1/api-usage-dashboard"
else
    echo -e "   ${GREEN}Browser:${NC} https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/api-usage-dashboard"
fi

echo ""
echo -e "${BLUE}🔄 Auto-refresh this data every 30 seconds:${NC}"
echo -e "   ${GREEN}Command:${NC} watch -n 30 './check_api_usage.sh $ENVIRONMENT'"

echo ""
echo -e "${BLUE}🛠️ Additional Commands:${NC}"
echo -e "   ${GREEN}Debug mode:${NC} ./check_api_usage.sh $ENVIRONMENT debug"
echo -e "   ${GREEN}Check specific provider:${NC} curl -s '$BASE_URL/api-usage-dashboard?action=daily&provider=yahoo_finance' -H '$AUTH_HEADER' | jq"
echo -e "   ${GREEN}Real-time monitoring:${NC} curl -s '$BASE_URL/api-usage-dashboard?action=realtime' -H '$AUTH_HEADER' | jq"

echo ""
echo -e "${GREEN}✅ Monitoring completed successfully!${NC}"