#!/bin/bash

# Debug Specific Missing Environment Variables
# Focus on NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

echo "🔍 SPECIFIC MISSING VARIABLES ANALYSIS"
echo "======================================"
echo "Based on API Debug Panel logs:"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Current Status Analysis${NC}"
echo "========================="
echo "✅ NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL: Working (both build and runtime)"
echo "❌ NEXT_PUBLIC_SUPABASE_URL: Missing (both build and runtime)"
echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: Missing (both build and runtime)"
echo "✅ All NEXT_PUBLIC_VERCEL_* variables: Working normally"
echo ""

echo -e "${RED}🚨 Problem Type: SELECTIVE VARIABLE MISSING${NC}"
echo "=============================================="
echo "This is NOT a global environment variable scoping issue."
echo "Some variables work (FUNCTIONS_URL) while others don't (URL, ANON_KEY)."
echo "This indicates specific variables are missing from Vercel configuration."
echo ""

echo -e "${YELLOW}🔧 IMMEDIATE ACTION REQUIRED${NC}"
echo "============================"
echo ""
echo "Go to Vercel Dashboard and ADD these missing variables:"
echo "https://vercel.com/dashboard → Select Project → Settings → Environment Variables"
echo ""

echo -e "${GREEN}1. Add NEXT_PUBLIC_SUPABASE_URL${NC}"
echo "   Name: NEXT_PUBLIC_SUPABASE_URL"
echo "   Value: https://fwnmnjwtbggasmunsfyk.supabase.co"
echo "   Environments: ✅ Production ✅ Preview ✅ Development"
echo ""

echo -e "${GREEN}2. Add NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
echo "   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8"
echo "   Environments: ✅ Production ✅ Preview ✅ Development"
echo ""

echo -e "${BLUE}3. Verify EXISTING variable is correctly scoped:${NC}"
echo "   NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL (this one works)"
echo "   - Check its configuration as a reference"
echo "   - Ensure new variables have identical scoping settings"
echo ""

echo -e "${YELLOW}🔍 Why This Specific Pattern?${NC}"
echo "============================="
echo "Possible reasons for selective missing:"
echo "1. Variables were added individually and some were missed"
echo "2. Copy-paste errors when adding variables"
echo "3. Different timing when variables were added"
echo "4. Branch or environment scoping differences"
echo ""

echo -e "${GREEN}✅ Expected Result After Fix${NC}"
echo "============================"
echo "Runtime NEXT_PUBLIC_ Count: Should increase from 0 to 3+"
echo "Specific vars: All should show ✅"
echo "API Debug Panel: Should stop showing 'HARDCODED (env missing)'"
echo "Build-time Variables: Should show actual URLs instead of 'MISSING'"
echo ""

echo -e "${BLUE}🧪 Quick Verification Commands${NC}"
echo "================================"
echo "After adding variables and redeployment:"
echo ""
echo "1. Check main app:"
echo "   https://investie-group-web.vercel.app"
echo ""
echo "2. Check detailed debug page:"
echo "   https://investie-group-web.vercel.app/env-debug"
echo ""
echo "3. Expected changes:"
echo "   - Runtime NEXT_PUBLIC_ Count: 0 → 3+"
echo "   - SUPABASE_URL: ❌ → ✅"
echo "   - ANON_KEY: ❌ → ✅"
echo "   - Build-time Variables: MISSING → actual values"
echo ""

echo -e "${RED}⚠️ Critical Notes${NC}"
echo "=================="
echo "- FUNCTIONS_URL already works, so the setup process is correct"
echo "- Just need to add the 2 missing variables using the same process"
echo "- Make sure to use identical environment/branch scoping"
echo "- Variable names must be EXACTLY as shown (case-sensitive)"
echo ""

echo -e "${GREEN}🚀 This should be the final fix!${NC}"
echo "=================================="
echo "Since FUNCTIONS_URL works, adding URL and ANON_KEY"
echo "with identical settings should resolve the issue completely."
