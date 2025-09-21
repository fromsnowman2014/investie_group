// Test API Tracking System
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { apiTracker } from '../_shared/api-usage-tracker.ts';

Deno.serve(async (req) => {
  try {
    console.log('🧪 Testing API tracking system...');

    // Test 1: Check if tracker is enabled
    const trackerEnabled = !Deno.env.get('DISABLE_API_TRACKING');
    console.log(`📊 Tracker enabled: ${trackerEnabled}`);

    // Test 2: Force create some test API usage data
    const testResult = await apiTracker.trackApiCall(
      {
        provider: 'test_provider',
        endpoint: '/test-endpoint',
        indicatorType: 'test_data',
        functionName: 'test-api-tracking',
        apiKey: 'test-key-123'
      },
      async () => {
        // Simulate a successful API call
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, testData: 'Hello World' };
      }
    );

    console.log('✅ Test API call completed');

    // Test 3: Try to get usage summary
    const summary = await apiTracker.getUsageSummary();
    console.log('📈 Usage summary retrieved:', JSON.stringify(summary, null, 2));

    // Test 4: Get debug logs
    const debugLogs = apiTracker.getRecentDebugLogs(10);
    console.log('🔍 Debug logs count:', debugLogs.length);

    return new Response(JSON.stringify({
      trackerEnabled,
      testResult,
      summary,
      debugLogsCount: debugLogs.length,
      debugLogs: debugLogs.slice(0, 3) // Show first 3 for brevity
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);

    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});