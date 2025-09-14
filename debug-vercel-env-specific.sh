#!/bin/bash

echo "🔍 Vercel Environment Variables Specific Analysis"
echo "=================================================="
echo ""

echo "📊 Based on logs, we have a VERY SPECIFIC pattern:"
echo "✅ NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL = LOADED"
echo "❌ NEXT_PUBLIC_SUPABASE_URL = MISSING"
echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY = MISSING"
echo ""

echo "🎯 This suggests these exact scenarios:"
echo ""

echo "1️⃣  SCENARIO 1: Typo in Variable Names"
echo "   Check if you have these EXACT names in Vercel Dashboard:"
echo "   ❌ NEXT_PUBLIC_SUPABASE_BASE_URL (wrong)"
echo "   ✅ NEXT_PUBLIC_SUPABASE_URL (correct)"
echo "   ❌ NEXT_PUBLIC_SUPABASE_KEY (wrong)"
echo "   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY (correct)"
echo ""

echo "2️⃣  SCENARIO 2: Branch-Specific Configuration"
echo "   Check if environment variables are set for:"
echo "   🌟 ALL BRANCHES (recommended)"
echo "   🔍 SPECIFIC BRANCH: develop_BE1"
echo ""

echo "3️⃣  SCENARIO 3: Different Environment Scopes"
echo "   Environment variables might be set for:"
echo "   📱 Development only"
echo "   🌐 Production only"
echo "   🎯 Preview only"
echo ""

echo "📋 EXACT STEPS TO VERIFY:"
echo "=========================="
echo ""

echo "Step 1: Go to Vercel Dashboard"
echo "→ https://vercel.com/fromsnowman2014/investie-group-web"
echo "→ Settings → Environment Variables"
echo ""

echo "Step 2: Verify these EXACT variable names exist:"
echo "📝 NEXT_PUBLIC_SUPABASE_URL"
echo "📝 NEXT_PUBLIC_SUPABASE_ANON_KEY"  
echo "📝 NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL"
echo ""

echo "Step 3: Check Environment Scope for EACH variable:"
echo "🎯 Should be: Production, Preview, Development"
echo "🌟 OR: All Environments"
echo ""

echo "Step 4: Check Branch Targeting:"
echo "🔍 Target Branches: develop_BE1 (or All Branches)"
echo ""

echo "🚨 CRITICAL: If FUNCTIONS_URL works but URL/ANON_KEY don't,"
echo "   there's likely a NAME MISMATCH or SCOPE DIFFERENCE"
echo ""

echo "💡 Quick Test Commands:"
echo "curl -H 'User-Agent: Vercel' https://investie-group-web.vercel.app/api/env-check"
echo ""

echo "🔧 If issues persist, try:"
echo "1. Delete ALL three variables"
echo "2. Re-add them with EXACT names above"
echo "3. Set scope to 'All Environments'"
echo "4. Set branches to 'All Branches'"
echo ""
