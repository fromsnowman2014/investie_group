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

        {/* NEXT_PUBLIC_ Variables List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">📋 NEXT_PUBLIC_ Variables</h2>
          {debugInfo.nextPublicKeys.length > 0 ? (
            <div className="space-y-2">
              {debugInfo.nextPublicKeys.map((key, index) => {
                const value = typeof process !== 'undefined' ? process.env[key] : undefined;
                const hasValue = !!value;
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{key}</span>
                    <span className={`px-2 py-1 rounded text-xs ${hasValue ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {hasValue ? '✅ SET' : '❌ MISSING'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-red-600 bg-red-50 p-4 rounded">
              ❌ No NEXT_PUBLIC_ variables found at runtime!
            </div>
          )}
        </div>

        {/* Specific Supabase Variables */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">🔑 Specific Supabase Variables</h2>
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

        {/* Build-time vs Runtime Comparison */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">⚖️ Build-time vs Runtime Comparison</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Build-time</h3>
              <div className="space-y-2 text-sm">
                <div>Env Count: <span className="font-mono">{debugInfo.buildTimeVars.envCount || 'Unknown'}</span></div>
                <div>Node Env: <span className="font-mono">{debugInfo.buildTimeVars.nodeEnv || 'Unknown'}</span></div>
                <div>Timestamp: <span className="font-mono">{debugInfo.buildTimeVars.timestamp || 'Unknown'}</span></div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Runtime</h3>
              <div className="space-y-2 text-sm">
                <div>Env Count: <span className="font-mono">{debugInfo.nextPublicKeys.length}</span></div>
                <div>Node Env: <span className="font-mono">{debugInfo.nodeEnv}</span></div>
                <div>Timestamp: <span className="font-mono">{new Date().toISOString()}</span></div>
              </div>
            </div>
          </div>
          
          {debugInfo.buildTimeVars.envCount && debugInfo.nextPublicKeys.length === 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <div className="text-red-800 font-medium">🚨 Critical Issue Detected</div>
              <div className="text-red-700 text-sm mt-1">
                Build-time detected {debugInfo.buildTimeVars.envCount} variables, but runtime shows 0. 
                This indicates a Next.js bundling or Vercel configuration issue.
              </div>
            </div>
          )}
        </div>

        {/* Specific Missing Variables Analysis */}
        {debugInfo.nextPublicKeys.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">🔍 Selective Variable Analysis</h2>
            <div className="text-sm text-blue-700">
              <div className="mb-4">
                <strong>Pattern Detected:</strong> Some NEXT_PUBLIC_ variables are present while others are missing.
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-green-700 mb-2">✅ Working Variables</h4>
                  <ul className="text-xs space-y-1">
                    {debugInfo.nextPublicKeys.filter(key => {
                      const value = typeof process !== 'undefined' ? process.env[key] : undefined;
                      return !!value;
                    }).map((key, idx) => (
                      <li key={idx} className="text-green-600">• {key}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-red-700 mb-2">❌ Expected but Missing</h4>
                  <ul className="text-xs space-y-1 text-red-600">
                    {!debugInfo.specificVars.supabaseUrl && <li>• NEXT_PUBLIC_SUPABASE_URL</li>}
                    {!debugInfo.specificVars.supabaseAnonKey && <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>}
                    {debugInfo.specificVars.supabaseFunctionsUrl && debugInfo.nextPublicKeys.length === 0 && <li>• Runtime loading issue detected</li>}
                  </ul>
                </div>
              </div>

              {debugInfo.specificVars.supabaseFunctionsUrl && !debugInfo.specificVars.supabaseUrl && (
                <div className="bg-amber-100 border border-amber-300 p-3 rounded mb-4">
                  <strong className="text-amber-800">🎯 Specific Issue Identified:</strong>
                  <p className="text-amber-700 mt-1">
                    NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL is working, but NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.
                    This indicates these specific variables were not added to Vercel environment configuration.
                  </p>
                </div>
              )}

              <div className="bg-green-100 border border-green-300 p-3 rounded">
                <strong className="text-green-800">💡 Recommended Action:</strong>
                <p className="text-green-700 mt-1">
                  Add the missing variables to Vercel Dashboard → Environment Variables using the same settings as the working FUNCTIONS_URL variable.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Debug Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">🔧 Debug Instructions</h2>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>1. Check browser console for detailed environment variable logs</p>
            <p>2. If specific variables are missing, add them individually to Vercel Dashboard</p>
            <p>3. Use working variables as a reference for correct scoping settings</p>
            <p>4. Ensure variable names are exactly correct (case-sensitive)</p>
            <p>5. Try forcing a complete rebuild after adding variables</p>
          </div>
        </div>
      </div>
    </div>
  );
}
