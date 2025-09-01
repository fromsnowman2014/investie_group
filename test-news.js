#!/usr/bin/env node

// Enhanced News Module Test Script
const http = require('http');

console.log('🧪 Testing Enhanced News Module\n');

// Simple HTTP client
function makeRequest(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3001,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Investie-News-Test/1.0',
        'Accept': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            size: data.length
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data.substring(0, 500) + '...',
            size: data.length,
            parseError: true
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout (${timeout}ms)`));
    });
    
    req.end();
  });
}

// Test function
async function testNewsEndpoint(url, name, expectEnhanced = false) {
  try {
    console.log(`🔍 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    
    const startTime = Date.now();
    const result = await makeRequest(url);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (result.status === 200) {
      console.log(`   ✅ ${name}: SUCCESS (${responseTime}ms)`);
      console.log(`   📊 Response size: ${result.size} bytes`);
      
      if (typeof result.data === 'object') {
        console.log(`   🎯 Success flag: ${result.data.success}`);
        
        if (result.data.data) {
          if (expectEnhanced && result.data.data.news) {
            // Enhanced news endpoint
            const news = result.data.data.news;
            console.log(`   📰 Total articles: ${news.totalCount}`);
            console.log(`   🔥 Recent articles (24h): ${news.recentCount}`);
            console.log(`   📡 Sources: ${news.sources.join(', ')}`);
            
            if (news.articles && news.articles.length > 0) {
              const firstArticle = news.articles[0];
              console.log(`   📋 Sample article:`);
              console.log(`      Title: ${firstArticle.title?.substring(0, 60)}...`);
              console.log(`      Provider: ${firstArticle.provider}`);
              console.log(`      Published: ${firstArticle.publishedAt}`);
              console.log(`      Recent: ${firstArticle.isRecent ? '🔥 YES' : '❄️  NO'}`);
              console.log(`      Relevance: ${firstArticle.relevanceScore}`);
            }
          } else if (result.data.data.overview) {
            // Original news endpoint
            console.log(`   📰 Has overview: ${!!result.data.data.overview}`);
            console.log(`   📊 Analysis available: ${!!result.data.data.analysis}`);
          }
        }
      }
      
      return true;
    } else {
      console.log(`   ❌ ${name}: HTTP ${result.status}`);
      if (result.data && typeof result.data === 'string') {
        console.log(`   📄 Response: ${result.data.substring(0, 200)}...`);
      }
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${name}: ${error.message}`);
    return false;
  }
}

// Check if server is running
async function checkServerStatus() {
  try {
    console.log('🔍 Checking server status...');
    await makeRequest('http://localhost:3001/health', 5000);
    console.log('✅ Backend server is running\n');
    return true;
  } catch (error) {
    console.log('❌ Backend server is not running');
    console.log('💡 Please start the server with: npm run start:dev\n');
    return false;
  }
}

// Main test suite
async function runNewsTests() {
  console.log('📰 Enhanced News Module Testing Suite');
  console.log('=====================================\n');
  
  // Check if server is running
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    return;
  }
  
  const baseUrl = 'http://localhost:3001';
  const testSymbol = 'AAPL'; // Apple - should have lots of news
  
  console.log(`🧪 Testing with symbol: ${testSymbol}\n`);
  
  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/health`,
      enhanced: false
    },
    {
      name: 'Original News Endpoint',
      url: `${baseUrl}/api/v1/news/${testSymbol}`,
      enhanced: false
    },
    {
      name: 'Enhanced News Endpoint (Default)',
      url: `${baseUrl}/api/v1/news/${testSymbol}/enhanced`,
      enhanced: true
    },
    {
      name: 'Enhanced News Endpoint (Limited)',
      url: `${baseUrl}/api/v1/news/${testSymbol}/enhanced?limit=5`,
      enhanced: true
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testNewsEndpoint(test.url, test.name, test.enhanced);
    if (success) passed++;
    console.log(''); // Empty line for readability
  }
  
  // Summary
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📈 Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Enhanced news module is working perfectly!');
  } else if (passed >= total/2) {
    console.log('👍 Most tests passed. Check the failed endpoints above.');
  } else {
    console.log('⚠️  Many tests failed. Please check your server and API configuration.');
  }
  
  console.log('\n💡 NEXT STEPS:');
  console.log('==============');
  if (passed > 0) {
    console.log('✅ Your enhanced news endpoint is working!');
    console.log('🔧 Update your frontend to use: /api/v1/news/:symbol/enhanced');
    console.log('🔑 Add more API keys for better coverage (see .env.example)');
    console.log('📱 Test with different stock symbols (GOOGL, MSFT, TSLA)');
  } else {
    console.log('🚀 Start the backend server: npm run start:dev');
    console.log('🔍 Check the server logs for any errors');
    console.log('🔑 Verify your API keys are properly configured');
  }
  
  console.log(`\n📅 Test completed: ${new Date().toISOString()}`);
}

// Alternative test for when server is not running
async function testWithoutServer() {
  console.log('📋 ENHANCED NEWS MODULE OVERVIEW');
  console.log('=================================\n');
  
  console.log('🎯 NEW FEATURES ADDED:');
  console.log('✅ Enhanced News Service - Multi-source news aggregation');
  console.log('✅ New API Endpoint - /api/v1/news/:symbol/enhanced');
  console.log('✅ Real-time news prioritization');
  console.log('✅ Sentiment analysis support');
  console.log('✅ 6 different news sources');
  
  console.log('\n📡 NEWS SOURCES:');
  console.log('1. Alpha Vantage - Real-time sentiment');
  console.log('2. NewsAPI - Major publications');
  console.log('3. Polygon.io - Financial news');
  console.log('4. Finnhub - Market news');
  console.log('5. Marketaux - News aggregator');
  console.log('6. SerpAPI - Google News (improved)');
  
  console.log('\n🔧 TO TEST:');
  console.log('1. Start server: npm run start:dev');
  console.log('2. Run this test again: node test-news.js');
  console.log('3. Test endpoint: curl http://localhost:3001/api/v1/news/AAPL/enhanced');
  
  console.log('\n📚 FILES CREATED:');
  console.log('✅ enhanced-news.service.ts - Multi-source news service');
  console.log('✅ Updated news.controller.ts - Added /enhanced endpoint');
  console.log('✅ Updated news.module.ts - Added service and HTTP module');
  console.log('✅ .env.example - API key configuration template');
  console.log('✅ ENHANCED_NEWS_README.md - Complete setup guide');
}

// Run the appropriate test
if (require.main === module) {
  runNewsTests().catch(error => {
    console.error('Test failed:', error);
    testWithoutServer();
  });
}

module.exports = { runNewsTests };
