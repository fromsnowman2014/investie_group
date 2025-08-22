'use client';

import { useEffect } from 'react';

export default function APIDebugger() {
  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('@/lib/api-debug').then(() => {
      console.log('🔍 API Debugger initialized');
      
      // Use the new utility function for environment logging
      import('@/lib/api-utils').then(({ logEnvironmentStatus }) => {
        logEnvironmentStatus();
      });
    });
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
      border: process.env.NEXT_PUBLIC_API_URL ? '2px solid #10b981' : '2px solid #ef4444'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
        {process.env.NEXT_PUBLIC_API_URL ? '✅' : '⚠️'} API Debug Panel
      </div>
      
      <div style={{ marginBottom: '3px' }}>
        <strong>ENV:</strong> {process.env.NODE_ENV}
      </div>
      
      <div style={{ marginBottom: '3px' }}>
        <strong>API URL:</strong> 
        <div style={{ 
          wordBreak: 'break-all', 
          color: process.env.NEXT_PUBLIC_API_URL ? '#10b981' : '#ef4444',
          fontWeight: 'bold'
        }}>
          {process.env.NEXT_PUBLIC_API_URL || 'UNDEFINED - Will use localhost!'}
        </div>
      </div>

      {!process.env.NEXT_PUBLIC_API_URL && (
        <div style={{ 
          marginTop: '6px', 
          padding: '4px 6px',
          backgroundColor: '#7f1d1d',
          borderRadius: '4px',
          fontSize: '10px'
        }}>
          🚨 Set NEXT_PUBLIC_API_URL in Vercel
        </div>
      )}
      
      <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.8 }}>
        📊 Check console for API request logs
      </div>
    </div>
  );
}