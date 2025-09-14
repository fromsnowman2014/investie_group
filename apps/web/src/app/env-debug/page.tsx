'use client';

import { useEffect, useState } from 'react';

interface EnvDebugInfo {
  processAvailable: boolean;
  envAvailable: boolean;
  nodeEnv: string;
  allEnvKeys: string[];
  nextPublicKeys: string[];
  specificVars: {
    supabaseUrl: string | undefined;
    supabaseAnonKey: string | undefined;
    supabaseFunctionsUrl: string | undefined;
    apiUrl: string | undefined;
  };
  buildTimeVars: {
    envCount: string | undefined;
    nodeEnv: string | undefined;
    timestamp: string | undefined;
    supabaseUrl: string | undefined;
    functionsUrl: string | undefined;
    anonKeyStatus: string | undefined;
  };
}

export default function EnvDebugPage() {
  const [debugInfo, setDebugInfo] = useState<EnvDebugInfo | null>(null);
  const [clientSideLoaded, setClientSideLoaded] = useState(false);

  useEffect(() => {
    const newClientSideLoaded = true;
    setClientSideLoaded(newClientSideLoaded);
    
    // Comprehensive environment variable analysis
    const info: EnvDebugInfo = {
      processAvailable: typeof process !== 'undefined',
      envAvailable: typeof process !== 'undefined' && !!process.env,
      nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV || 'undefined' : 'process unavailable',
      allEnvKeys: typeof process !== 'undefined' && process.env ? Object.keys(process.env) : [],
      nextPublicKeys: typeof process !== 'undefined' && process.env ? 
        Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')) : [],
      specificVars: {
        supabaseUrl: typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined,
        supabaseAnonKey: typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined,
        supabaseFunctionsUrl: typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL : undefined,
        apiUrl: typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined,
      },
      buildTimeVars: {
        envCount: typeof process !== 'undefined' ? process.env.BUILD_TIME_ENV_COUNT : undefined,
        nodeEnv: typeof process !== 'undefined' ? process.env.BUILD_TIME_NODE_ENV : undefined,
        timestamp: typeof process !== 'undefined' ? process.env.BUILD_TIME_TIMESTAMP : undefined,
        supabaseUrl: typeof process !== 'undefined' ? process.env.BUILD_TIME_SUPABASE_URL : undefined,
        functionsUrl: typeof process !== 'undefined' ? process.env.BUILD_TIME_SUPABASE_FUNCTIONS_URL : undefined,
        anonKeyStatus: typeof process !== 'undefined' ? process.env.BUILD_TIME_SUPABASE_ANON_KEY_STATUS : undefined,
      }
    };

    setDebugInfo(info);

    // Enhanced console logging
    console.group('🔍 DEDICATED ENVIRONMENT VARIABLE DEBUG PAGE');
    console.log('Client-side loaded:', newClientSideLoaded);
    console.log('Full debug info:', info);
    
    if (info.envAvailable) {
      console.log('=== ALL ENVIRONMENT VARIABLES ===');
      info.allEnvKeys.forEach(key => {
        const value = typeof process !== 'undefined' ? process.env[key] : undefined;
        const isSecret = key.toLowerCase().includes('key') || key.toLowerCase().includes('secret');
        console.log(`${key}:`, isSecret && value ? `SET (${value.length} chars)` : (value || 'UNDEFINED'));
      });
    }
    console.groupEnd();
  }, []);

  if (!clientSideLoaded || !debugInfo) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Environment Variables Debug - Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">🔍 Environment Variables Debug Page</h1>
        
        {/* Page Working Confirmation */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-green-800 font-medium">✅ env-debug page is working!</div>
          <div className="text-green-700 text-sm mt-1">
            Page loaded successfully at: {new Date().toISOString()}
          </div>
        </div>

        {/* Basic Environment Check */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">📊 Basic Environment Check</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Process Available:</span>
              <span className={`ml-2 px-2 py-1 rounded ${debugInfo.processAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {debugInfo.processAvailable ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Env Object Available:</span>
              <span className={`ml-2 px-2 py-1 rounded ${debugInfo.envAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {debugInfo.envAvailable ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Node Environment:</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {debugInfo.nodeEnv}
              </span>
            </div>
            <div>
              <span className="font-medium">Client-side Loaded:</span>
              <span className={`ml-2 px-2 py-1 rounded ${clientSideLoaded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {clientSideLoaded ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </div>
        </div>

        {/* Environment Variables Count */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">📈 Environment Variables Count</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-2xl font-bold text-gray-800">{debugInfo.allEnvKeys.length}</div>
              <div className="text-sm text-gray-600">Total Environment Variables</div>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <div className={`text-2xl font-bold ${debugInfo.nextPublicKeys.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {debugInfo.nextPublicKeys.length}
              </div>
              <div className="text-sm text-gray-600">NEXT_PUBLIC_ Variables</div>
            </div>
          </div>
        </div>

        {/* Specific Supabase Variables */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">🔑 Specific Supabase Variables Status</h2>
          <div className="space-y-3">
            {Object.entries(debugInfo.specificVars).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="text-sm text-gray-600 font-mono break-all">
                    {value || 'UNDEFINED'}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {value ? '✅ SET' : '❌ MISSING'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vercel API Keys Status Check */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">🚀 Vercel API Keys Status</h2>
          <div className="text-sm text-blue-700">
            <p className="mb-2">
              <strong>Based on your report:</strong> API keys have been added to Vercel Dashboard
            </p>
            
            {debugInfo.specificVars.supabaseUrl && debugInfo.specificVars.supabaseAnonKey ? (
              <div className="bg-green-100 border border-green-300 p-3 rounded">
                <strong className="text-green-800">✅ Success!</strong>
                <p className="text-green-700 mt-1">
                  All Supabase environment variables are now properly loaded from Vercel.
                </p>
              </div>
            ) : (
              <div className="bg-amber-100 border border-amber-300 p-3 rounded">
                <strong className="text-amber-800">⚠️ Still Missing Some Variables</strong>
                <p className="text-amber-700 mt-1">
                  Even though you added them to Vercel Dashboard, some variables are still not loading.
                  This might be due to:
                </p>
                <ul className="list-disc list-inside mt-2 text-amber-700">
                  <li>Variables not applied to all environments (Production/Preview/Development)</li>
                  <li>Branch scoping restrictions</li>
                  <li>Need to trigger a new deployment</li>
                  <li>Caching issues</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Debug Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">🔧 Next Steps</h2>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>1. Check main page console logs for detailed environment variable analysis</p>
            <p>2. If variables are still missing after adding to Vercel, try forcing a redeploy</p>
            <p>3. Verify all environment scopes are checked (Production/Preview/Development)</p>
            <p>4. Ensure no branch restrictions are applied to the variables</p>
          </div>
        </div>
      </div>
    </div>
  );
}
