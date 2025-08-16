// Integration Test Script
const https = require('https');

const BACKEND_URL = 'https://investie-backend-02-production.up.railway.app';
const FRONTEND_URL = 'http://localhost:3000';

console.log('🧪 Starting Integration Tests...\n');

// Test 1: Backend API
async function testBackendAPI() {
    console.log('1️⃣ Testing Backend API...');
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/stocks`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log(`✅ Backend API: ${data.length} stocks loaded`);
        console.log(`   Sample: ${data[0]?.symbol} - ${data[0]?.name}`);
        return true;
    } catch (error) {
        console.log(`❌ Backend API Error: ${error.message}`);
        return false;
    }
}

// Test 2: Frontend Loading
async function testFrontendLoading() {
    console.log('\n2️⃣ Testing Frontend Loading...');
    
    try {
        const response = await fetch(FRONTEND_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const html = await response.text();
        const hasTitle = html.includes('Investie - AI-Powered');
        const hasTradingView = html.includes('tradingview');
        
        console.log(`✅ Frontend Loading: ${hasTitle ? 'Title OK' : 'Title Missing'}`);
        console.log(`✅ TradingView Integration: ${hasTradingView ? 'Present' : 'Missing'}`);
        return hasTitle && hasTradingView;
    } catch (error) {
        console.log(`❌ Frontend Error: ${error.message}`);
        return false;
    }
}

// Test 3: CORS Integration
async function testCORSIntegration() {
    console.log('\n3️⃣ Testing CORS Integration...');
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/stocks`, {
            headers: {
                'Origin': 'http://localhost:3000'
            }
        });
        
        const corsHeader = response.headers.get('access-control-allow-origin');
        console.log(`✅ CORS Header: ${corsHeader || 'None'}`);
        return !!corsHeader;
    } catch (error) {
        console.log(`❌ CORS Error: ${error.message}`);
        return false;
    }
}

// Main Test Runner
async function runTests() {
    const results = {
        backend: await testBackendAPI(),
        frontend: await testFrontendLoading(),
        cors: await testCORSIntegration()
    };
    
    console.log('\n📊 Test Results:');
    console.log(`   Backend API: ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Frontend: ${results.frontend ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   CORS: ${results.cors ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(r => r);
    console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);
    
    return allPassed;
}

runTests().catch(console.error);