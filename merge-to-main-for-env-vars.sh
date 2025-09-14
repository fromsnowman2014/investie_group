#!/bin/bash

# Merge develop_BE1 to main for Production Environment Variables
# Use this if environment variables are only configured for main branch

echo "🔄 MERGE TO MAIN FOR ENVIRONMENT VARIABLES"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 This solution merges develop_BE1 to main${NC}"
echo "================================================"
echo "Use this if Vercel environment variables are only configured for 'main' branch"
echo "and you cannot modify the Vercel environment variable scoping"
echo ""

echo -e "${YELLOW}⚠️ Before Running This:${NC}"
echo "========================"
echo "1. Ensure all changes in develop_BE1 are tested and ready for production"
echo "2. Backup current main branch if needed"
echo "3. Confirm with team that merge to main is appropriate"
echo ""

echo -e "${RED}🚨 WARNING:${NC}"
echo "==========="
echo "This will deploy your current develop_BE1 code to PRODUCTION"
echo "Make sure you're ready for a production deployment!"
echo ""

read -p "Continue with merge to main? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 1
fi

echo -e "${GREEN}🚀 Starting merge process...${NC}"
echo ""

# Check current branch
current_branch=$(git branch --show-current)
echo "Current branch: $current_branch"

# Ensure we're on develop_BE1
if [ "$current_branch" != "develop_BE1" ]; then
    echo "Switching to develop_BE1..."
    git checkout develop_BE1
fi

# Ensure develop_BE1 is up to date
echo "Updating develop_BE1..."
git pull origin develop_BE1

# Switch to main
echo "Switching to main branch..."
git checkout main

# Update main
echo "Updating main branch..."
git pull origin main

# Merge develop_BE1 to main
echo "Merging develop_BE1 to main..."
git merge develop_BE1

# Push to main (triggers Production deployment)
echo "Pushing to main (this will trigger Production deployment)..."
git push origin main

echo ""
echo -e "${GREEN}✅ Merge completed!${NC}"
echo "=================="
echo ""
echo "What happens next:"
echo "1. Vercel will automatically deploy main branch to Production"
echo "2. Production deployment will have access to environment variables"
echo "3. Your app should work with real env vars (not fallbacks)"
echo ""
echo "Test after deployment:"
echo "1. Visit: https://investie-group-web.vercel.app"
echo "2. Check API Debug Panel shows real environment variables"
echo "3. Visit: https://investie-group-web.vercel.app/env-debug"
echo "4. Verify Runtime NEXT_PUBLIC_ Count > 0"
echo ""

echo -e "${BLUE}🔄 To continue development:${NC}"
echo "==========================="
echo "After testing production deployment:"
echo "1. Switch back to develop_BE1: git checkout develop_BE1"
echo "2. Continue development on develop_BE1"
echo "3. When ready, merge again to main for next production deployment"
echo ""

echo -e "${YELLOW}📝 Note:${NC}"
echo "========"
echo "This is a temporary solution. The proper fix is to configure"
echo "Vercel environment variables to work with all branches."
