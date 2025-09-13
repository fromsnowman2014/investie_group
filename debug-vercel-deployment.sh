#!/bin/bash

# Deep Vercel Deployment Environment Debugging
# Checks for environment variable scoping and deployment issues

echo "🔍 DEEP VERCEL ENVIRONMENT DEBUGGING"
echo "====================================="
echo "Investigating why env vars are set but not loaded at runtime"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Current Deployment Analysis${NC}"
echo "=============================="
echo "✅ Environment variables are SET in Vercel Dashboard"
echo "❌ Runtime NEXT_PUBLIC_ Count: 0"
echo "❌ Runtime variables not loading"
echo ""

echo -e "${RED}🚨 Possible Root Causes:${NC}"
echo "========================"
echo "1. Environment variable scoping issues"
echo "2. Branch/deployment target mismatch"
echo "3. Next.js bundling configuration problems"
echo "4. Vercel build cache issues"
echo "5. Environment variable naming or syntax errors"
echo ""

echo -e "${YELLOW}🔧 Systematic Debugging Steps:${NC}"
echo "================================="
echo ""

echo "Step 1: Check Vercel Environment Variable Scoping"
echo "------------------------------------------------"
echo "Go to Vercel Dashboard → Project → Settings → Environment Variables"
echo ""
echo "Verify EACH variable has ALL environments checked:"
echo "- ✅ Production"
echo "- ✅ Preview" 
echo "- ✅ Development"
echo ""
echo "Current deployment branch: develop_BE1"
echo "Check if variables are scoped to 'main' branch only"
echo ""

echo "Step 2: Check Deployment Target Environment"
echo "------------------------------------------"
echo "In Vercel Dashboard:"
echo "1. Go to Deployments tab"
echo "2. Check latest deployment details"
echo "3. Verify deployment environment (Production/Preview)"
echo "4. Check which branch was deployed"
echo ""

echo "Step 3: Check for Variable Naming Issues"
echo "---------------------------------------"
echo "Common problems:"
echo "- Trailing spaces in variable names or values"
echo "- Case sensitivity issues"
echo "- Special characters in values"
echo "- Extra quotes or formatting"
echo ""
echo "Expected exact names:"
echo "NEXT_PUBLIC_SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY" 
echo "NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL"
echo ""

echo -e "${BLUE}🧪 Manual Verification Commands:${NC}"
echo "=================================="
echo ""

echo "1. Force complete rebuild (clears all caches):"
echo -e "${GREEN}git commit --allow-empty -m \"Force complete rebuild to clear env var cache\"${NC}"
echo -e "${GREEN}git push origin develop_BE1${NC}"
echo ""

echo "2. Test different deployment environments:"
echo "   a. Create a preview deployment with a PR"
echo "   b. Test on preview URL vs production URL"
echo ""

echo "3. Check Vercel deployment logs:"
echo "   Go to Vercel Dashboard → Deployments → Select latest → View Function Logs"
echo "   Look for environment variable related errors"
echo ""

echo -e "${YELLOW}🔬 Advanced Debugging:${NC}"
echo "======================"
echo ""

echo "Check if this is a client-side vs server-side issue:"
echo "1. Environment variables should be available in browser (client-side)"
echo "2. NEXT_PUBLIC_ variables should be in the JavaScript bundle"
echo "3. Check browser Network tab for bundle contents"
echo ""

echo -e "${RED}⚠️ Critical Check Points:${NC}"
echo "=========================="
echo ""
echo "1. Is the deployment using the correct branch?"
echo "2. Are environment variables set for ALL environments?"
echo "3. Is there a syntax error in variable values?"
echo "4. Is the Vercel project correctly linked to the repository?"
echo "5. Are there conflicting environment variable definitions?"
echo ""

echo -e "${GREEN}✅ Next Actions:${NC}"
echo "================"
echo "1. Take screenshots of Vercel environment variable settings"
echo "2. Force a complete rebuild with cache clearing"
echo "3. Test both Production and Preview environments"
echo "4. Create a dedicated test page for environment variables"
