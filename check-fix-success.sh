#!/bin/bash

echo "🎯 Environment Variables Fix Verification"
echo "========================================"
echo ""

echo "📱 Testing current deployment..."
echo ""

# Test main page
echo "🌐 Checking main page environment status..."
MAIN_PAGE_RESPONSE=$(curl -s "https://investie-group-web-git-developbe1-sein-ohs-projects.vercel.app/" | grep -o "Runtime NEXT_PUBLIC_ Count: [0-9]*" || echo "Could not fetch")

echo "Main page result: $MAIN_PAGE_RESPONSE"
echo ""

# Test env-debug page  
echo "🔍 Checking env-debug page..."
ENV_DEBUG_RESPONSE=$(curl -s "https://investie-group-web-git-developbe1-sein-ohs-projects.vercel.app/env-debug" | grep -o "Runtime NEXT_PUBLIC_ Count: [0-9]*" || echo "Could not fetch")

echo "Env-debug result: $ENV_DEBUG_RESPONSE"
echo ""

echo "📊 Expected vs Current Status:"
echo "┌─────────────────────────────────┬──────────────┬──────────────┐"
echo "│ Variable                        │ Before Fix   │ After Fix    │"
echo "├─────────────────────────────────┼──────────────┼──────────────┤"
echo "│ NEXT_PUBLIC_SUPABASE_URL       │ ❌ MISSING   │ Should be ✅  │"
echo "│ NEXT_PUBLIC_SUPABASE_ANON_KEY  │ ❌ MISSING   │ Should be ✅  │"
echo "│ NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL │ ✅ EXISTS │ ✅ EXISTS   │"
echo "├─────────────────────────────────┼──────────────┼──────────────┤"
echo "│ Runtime NEXT_PUBLIC_ Count      │ 0            │ Should be 3   │"
echo "└─────────────────────────────────┴──────────────┴──────────────┘"
echo ""

if [[ "$MAIN_PAGE_RESPONSE" == *"Count: 0"* ]]; then
    echo "🚨 STILL NEEDS FIX:"
    echo "   → Variables not yet added to Vercel Dashboard"
    echo "   → OR redeploy hasn't completed yet"
    echo "   → Please add the 2 missing variables and redeploy"
elif [[ "$MAIN_PAGE_RESPONSE" == *"Count: 3"* ]]; then
    echo "🎉 SUCCESS!"
    echo "   → All 3 Supabase variables now loaded"
    echo "   → Environment variable issue resolved"
    echo "   → Application should work perfectly now"
else
    echo "📊 PARTIAL SUCCESS:"
    echo "   → Some variables loaded, check specific status"
    echo "   → May need to verify variable names and redeploy"
fi

echo ""
echo "🔗 Quick verification links:"
echo "   Main: https://investie-group-web-git-developbe1-sein-ohs-projects.vercel.app/"
echo "   Debug: https://investie-group-web-git-developbe1-sein-ohs-projects.vercel.app/env-debug"
echo ""

echo "📋 If fix is not complete:"
echo "1. Verify variable names in Vercel Dashboard (exact spelling)"
echo "2. Ensure Environment scope: Production, Preview, Development"  
echo "3. Ensure Branch scope: All Branches"
echo "4. Redeploy WITHOUT using existing build cache"
echo "5. Wait 2-3 minutes for deployment to complete"
echo ""
