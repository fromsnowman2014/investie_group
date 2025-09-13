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

  // Only show debug panel in development or when debugging is needed
  const shouldShowDebugPanel = process.env.NODE_ENV === 'development' || 
    (typeof window !== 'undefined' && window.location.search.includes('debug=true'));

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
        <strong>API URL:</strong> 
        <div style={{ 
          wordBreak: 'break-all', 
          color: process.env.NEXT_PUBLIC_API_URL ? '#10b981' : '#f59e0b',
          fontWeight: 'bold'
        }}>
          {process.env.NEXT_PUBLIC_API_URL || 'UNDEFINED'}
        </div>
      </div>

      <div style={{ marginBottom: '3px' }}>
        <strong>Supabase Functions:</strong> 
        <div style={{ 
          wordBreak: 'break-all', 
          color: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ? '#10b981' : '#f59e0b',
          fontWeight: 'bold'
        }}>
          {process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'UNDEFINED'}
        </div>
      </div>

      <div style={{ marginBottom: '3px' }}>
        <strong>Supabase Anon Key:</strong> 
        <div style={{ 
          color: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '#10b981' : '#ef4444',
          fontWeight: 'bold'
        }}>
          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}
        </div>
      </div>

      {!process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL && (
        <div style={{ 
          marginTop: '6px', 
          padding: '4px 6px',
          backgroundColor: '#92400e',
          borderRadius: '4px',
          fontSize: '10px'
        }}>
          ⚠️ Using fallback URL
          <div style={{ marginTop: '2px', fontSize: '9px', opacity: 0.9 }}>
            Set NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.8 }}>
        📊 Check console for API request logs
      </div>
    </div>
  );
}