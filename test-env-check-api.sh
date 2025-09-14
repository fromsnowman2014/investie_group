#!/bin/bash

echo "🔍 Testing Vercel Environment Variables via API"
echo "=============================================="
echo ""

echo "🌐 Testing server-side environment check..."
echo ""

# Test the API endpoint
echo "📡 Calling /api/env-check endpoint..."
curl -s "https://investie-group-web.vercel.app/api/env-check" | jq '.' 2>/dev/null || {
    echo "❌ jq not found, showing raw response:"
    curl -s "https://investie-group-web.vercel.app/api/env-check"
}

echo ""
echo ""
echo "🔍 Key Analysis Points:"
echo "======================"
echo ""
echo "1️⃣  Check 'nextPublicCount' - should be > 0"
echo "2️⃣  Check 'nextPublicKeys' - should contain our Supabase variables"
echo "3️⃣  Check 'supabaseVars' - should show true for all three"
echo "4️⃣  Check 'supabaseVarLengths' - should show non-zero values"
echo ""

echo "🎯 Expected values:"
echo "   NEXT_PUBLIC_SUPABASE_URL: ~45 characters"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY: ~200+ characters"
echo "   NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL: ~60 characters"
echo ""

echo "🚨 If server-side shows variables but client-side doesn't:"
echo "   → Build-time vs Runtime issue"
echo "   → Possible caching problem"
echo "   → Vercel deployment configuration issue"
echo ""
