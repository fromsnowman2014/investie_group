'use client';

import { useEffect } from 'react';

export default function APIDebugger() {
  useEffect(() => {
    console.log('🔍 API Debugger initialized');
    
    // Use the utility function for environment logging
    import('@/lib/api-utils').then(({ logEnvironmentStatus }) => {
      logEnvironmentStatus();
    }).catch(error => {
      console.error('Failed to load environment status logger:', error);
    });

    // Add global toFixed monitoring to catch undefined values
    if (typeof window !== 'undefined') {
      const originalToFixed = Number.prototype.toFixed;
      Number.prototype.toFixed = function(digits?: number) {
        if (this === undefined || this === null || isNaN(Number(this))) {
          console.error('🚨 CRITICAL: toFixed called on undefined/null/NaN value!', {
            value: this,
            type: typeof this,
            stack: new Error().stack,
            digits
          });
          // Return a safe default instead of crashing
          return '0.00';
        }
        return originalToFixed.call(this, digits);
      };
      
      console.log('🔍 Global toFixed monitoring enabled');
    }
  }, []);

  // Always show debug panel for now (for debugging purposes)
  const shouldShowDebugPanel = true;

  if (!shouldShowDebugPanel) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: '#1f2937',
      color: '#f9fafb',
      padding: '10px 12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      maxWidth: '350px',
      border: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ? '2px solid #10b981' : '2px solid #ef4444'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
        {process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ? '✅' : '⚠️'} API Debug Panel
      </div>
      
      <div style={{ marginBottom: '3px' }}>
        <strong>ENV:</strong> {process.env.NODE_ENV}
      </div>
      
      <div style={{ marginBottom: '3px' }}>
        <strong>Legacy API URL:</strong> 
        <div style={{ 
          wordBreak: 'break-all', 
          color: process.env.NEXT_PUBLIC_API_URL ? '#10b981' : '#666',
          fontWeight: 'bold',
          textDecoration: 'line-through'
        }}>
          {process.env.NEXT_PUBLIC_API_URL || 'DEPRECATED'}
        </div>
      </div>

      <div style={{ marginBottom: '3px' }}>
        <strong>Supabase Functions:</strong> 
        <div style={{ 
          wordBreak: 'break-all', 
          color: '#10b981', // Always green since we're using hardcoded values
          fontWeight: 'bold'
        }}>
          {process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'HARDCODED (env missing)'}
        </div>
      </div>

      <div style={{ marginBottom: '3px' }}>
        <strong>Supabase Anon Key:</strong> 
        <div style={{ 
          color: '#10b981', // Always green since we're using hardcoded values
          fontWeight: 'bold'
        }}>
          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'HARDCODED (env missing)'}
        </div>
      </div>

      {!process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL && (
        <div style={{ 
          marginTop: '6px', 
          padding: '4px 6px',
          backgroundColor: '#059669',
          borderRadius: '4px',
          fontSize: '10px'
        }}>
          🔧 Using HARDCODED values for testing
          <div style={{ marginTop: '2px', fontSize: '9px', opacity: 0.9 }}>
            APIs should work despite missing env vars
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '8px', fontSize: '10px', backgroundColor: '#1f2937', padding: '8px', borderRadius: '4px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#fbbf24' }}>🔍 Environment Debug:</div>
        
        {/* Runtime Environment Variables */}
        <div style={{ marginBottom: '4px' }}>
          <strong>Runtime:</strong>
          <div style={{ marginLeft: '8px', fontSize: '9px' }}>
            <div>Process Available: {typeof process !== 'undefined' ? '✅' : '❌'}</div>
            <div>Env Object: {typeof process !== 'undefined' && process.env ? '✅' : '❌'}</div>
            <div>Runtime NEXT_PUBLIC_ Count: {typeof process !== 'undefined' && process.env ? Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')).length : 0}</div>
            {typeof process !== 'undefined' && process.env && (
              <div style={{ fontSize: '8px', color: '#fbbf24', marginTop: '2px' }}>
                Specific vars: SUPABASE_URL={process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}, 
                ANON_KEY={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}, 
                FUNCTIONS_URL={process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ? '✅' : '❌'}
              </div>
            )}
          </div>
        </div>

        {/* Build-time Environment Variables */}
        <div style={{ marginBottom: '4px' }}>
          <strong>Build Time:</strong>
          <div style={{ marginLeft: '8px', fontSize: '9px' }}>
            <div>Build Env Count: {process.env.BUILD_TIME_ENV_COUNT || 'Unknown'}</div>
            <div>Build Node Env: {process.env.BUILD_TIME_NODE_ENV || 'Unknown'}</div>
            <div>Build Timestamp: {process.env.BUILD_TIME_TIMESTAMP || 'Unknown'}</div>
          </div>
        </div>

        {/* Build-time Variable Status */}
        <div style={{ marginBottom: '4px' }}>
          <strong>Build-time Variables:</strong>
          <div style={{ marginLeft: '8px', fontSize: '9px' }}>
            <div>Supabase URL: <span style={{ color: process.env.BUILD_TIME_SUPABASE_URL !== 'MISSING' ? '#10b981' : '#ef4444' }}>
              {process.env.BUILD_TIME_SUPABASE_URL}
            </span></div>
            <div>Functions URL: <span style={{ color: process.env.BUILD_TIME_SUPABASE_FUNCTIONS_URL !== 'MISSING' ? '#10b981' : '#ef4444' }}>
              {process.env.BUILD_TIME_SUPABASE_FUNCTIONS_URL}
            </span></div>
            <div>Anon Key: <span style={{ color: process.env.BUILD_TIME_SUPABASE_ANON_KEY_STATUS === 'SET' ? '#10b981' : '#ef4444' }}>
              {process.env.BUILD_TIME_SUPABASE_ANON_KEY_STATUS}
            </span></div>
          </div>
        </div>

        {/* Variable List Comparison */}
        {process.env.BUILD_TIME_NEXT_PUBLIC_VARS && (
          <div style={{ marginTop: '4px', fontSize: '8px', backgroundColor: '#374151', padding: '4px', borderRadius: '2px' }}>
            <div style={{ color: '#fbbf24', marginBottom: '2px' }}>Build-time NEXT_PUBLIC_ vars:</div>
            <div style={{ maxHeight: '60px', overflow: 'auto' }}>
              {JSON.parse(process.env.BUILD_TIME_NEXT_PUBLIC_VARS).map((item: { key: string, hasValue: boolean }, idx: number) => (
                <div key={idx} style={{ color: item.hasValue ? '#10b981' : '#ef4444' }}>
                  {item.key}: {item.hasValue ? '✅' : '❌'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.8 }}>
        📊 Check console for API request logs
      </div>
    </div>
  );
}