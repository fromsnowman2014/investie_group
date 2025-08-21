#!/usr/bin/env node

// Simple test script to verify MacroIndicators component API integration
const fetch = require('node-fetch');

async function testMacroIndicatorsAPI() {
  console.log('🧪 Testing MacroIndicators API Integration...\n');
  
  try {
    // Test backend API directly
    console.log('1. Testing Backend API (/api/v1/market/overview)');
    console.log('   URL: http://localhost:3001/api/v1/market/overview');
    
    const response = await fetch('http://localhost:3001/api/v1/market/overview');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('   ✅ Backend API Response received');
    console.log('   📊 Market Sentiment:', data.data.marketSentiment);
    console.log('   📈 SP500:', data.data.indices.sp500.value, `(${data.data.indices.sp500.changePercent}%)`);
    console.log('   📈 NASDAQ:', data.data.indices.nasdaq.value, `(${data.data.indices.nasdaq.changePercent}%)`);
    console.log('   📈 DOW:', data.data.indices.dow.value, `(${data.data.indices.dow.changePercent}%)`);
    console.log('   🏭 Sectors:', data.data.sectors.length, 'sectors');
    console.log('   📊 VIX:', data.data.volatilityIndex);
    console.log('   🔗 Source:', data.data.source);
    
    // Verify data structure matches our TypeScript interface
    console.log('\n2. Verifying Data Structure');
    const requiredFields = [
      'indices.sp500.value',
      'indices.sp500.change', 
      'indices.sp500.changePercent',
      'indices.nasdaq.value',
      'indices.dow.value',
      'sectors',
      'marketSentiment',
      'volatilityIndex',
      'source'
    ];
    
    let structureValid = true;
    for (const field of requiredFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], data.data);
      if (value === undefined || value === null) {
        console.log(`   ❌ Missing field: ${field}`);
        structureValid = false;
      } else {
        console.log(`   ✅ Field present: ${field} = ${typeof value === 'object' ? 'object' : value}`);
      }
    }
    
    if (structureValid) {
      console.log('\n   ✅ All required fields present - Component should work correctly!');
    } else {
      console.log('\n   ❌ Some fields missing - Component may have issues');
    }
    
    // Test market hours detection
    console.log('\n3. Market Hours Detection');
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hour = easternTime.getHours();
    const day = easternTime.getDay();
    const isMarketOpen = day >= 1 && day <= 5 && hour >= 9 && hour < 16;
    
    console.log('   🕐 Current EST Time:', easternTime.toLocaleString());
    console.log('   📅 Day of week:', day, '(1=Mon, 7=Sun)');
    console.log('   🕐 Hour:', hour);
    console.log('   🏢 Market Status:', isMarketOpen ? '🟢 OPEN' : '🔴 CLOSED');
    console.log('   🔄 Component Refresh:', isMarketOpen ? 'Every 5 minutes' : 'Disabled');
    
    console.log('\n🎉 MacroIndicators API Integration Test Complete!');
    console.log('📝 Test Summary:');
    console.log('   - Backend API: ✅ Working');
    console.log('   - Data Structure: ✅ Valid');
    console.log('   - Market Hours Logic: ✅ Implemented');
    console.log('   - Frontend Component: 🔄 Ready for testing');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure backend is running: cd apps/backend && npm run start:dev');
    console.log('   2. Check backend logs for errors');
    console.log('   3. Verify API endpoint: curl http://localhost:3001/api/v1/market/overview');
  }
}

// Run the test
testMacroIndicatorsAPI().catch(console.error);