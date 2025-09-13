#!/bin/bash

# Vercel Environment Variables Verification
# Based on the debugging output, verify what's missing

echo "🔍 VERCEL ENVIRONMENT VARIABLES ANALYSIS"
echo "========================================"
echo "Based on your debug output analysis"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Current Status Analysis${NC}"
echo "=========================="
echo "✅ Build Time Env Count: 20 variables detected"
echo "❌ Runtime NEXT_PUBLIC_ Count: 0 variables"
echo "✅ NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL: Present at build time"
echo "❌ NEXT_PUBLIC_SUPABASE_URL: MISSING"
echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: MISSING"
echo ""

echo -e "${RED}🚨 Critical Issue Identified${NC}"
echo "============================="
echo "Environment variables are available at BUILD TIME but not at RUNTIME"
echo "This indicates a Next.js bundling or Vercel configuration issue"
echo ""

echo -e "${YELLOW}🔧 Required Actions${NC}"
echo "=================="
echo ""
echo "1. Add missing environment variables to Vercel:"
echo "   Go to: https://vercel.com/dashboard → Select Project → Settings → Environment Variables"
echo ""
echo "2. Add these MISSING variables:"
echo ""
echo -e "${GREEN}NEXT_PUBLIC_SUPABASE_URL${NC}"
echo "Value: https://fwnmnjwtbggasmunsfyk.supabase.co"
echo "Environments: ✅ Production ✅ Preview ✅ Development"
echo ""
echo -e "${GREEN}NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
echo "Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8"
echo "Environments: ✅ Production ✅ Preview ✅ Development"
echo ""

echo -e "${BLUE}3. Verify existing variables are scoped correctly:${NC}"
echo ""
echo "Check that NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL is set for:"
echo "- ✅ Production"
echo "- ✅ Preview" 
echo "- ✅ Development"
echo ""

echo -e "${YELLOW}🔄 After adding variables:${NC}"
echo "========================="
echo ""
echo "Option A - Force redeploy:"
echo -e "${GREEN}git commit --allow-empty -m \"Force redeploy after adding Supabase env vars\"${NC}"
echo -e "${GREEN}git push origin develop_BE1${NC}"
echo ""
echo "Option B - Manual redeploy from Vercel Dashboard"
echo ""

echo -e "${BLUE}🧪 Expected Result After Fix:${NC}"
echo "=============================="
echo "Runtime NEXT_PUBLIC_ Count: Should change from 0 to 3+"
echo "Supabase URL: Should show the actual URL (not MISSING)"
echo "Anon Key: Should show SET (not MISSING)"
echo "Hardcoded fallbacks: Should no longer be needed"
echo ""

echo -e "${RED}⚠️ Important Notes:${NC}"
echo "=================="
echo "1. Environment variables must be added to ALL environments (Production/Preview/Development)"
echo "2. Variable names are case-sensitive and must start with NEXT_PUBLIC_"
echo "3. After adding variables, a new deployment is required"
echo "4. Check that no typos exist in variable names"
echo ""

echo -e "${GREEN}✅ Next Steps:${NC}"
echo "=============="
echo "1. Add the missing environment variables to Vercel Dashboard"
echo "2. Trigger a new deployment"
echo "3. Run: ./test-vercel-environment.sh"
echo "4. Check that Runtime NEXT_PUBLIC_ Count > 0"
echo "5. Verify APIs work without hardcoded fallbacks"
