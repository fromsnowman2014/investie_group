'use client';

import { useEffect } from 'react';

export default function APIDebugger() {
  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('@/lib/api-debug').then(() => {
      console.log('🔍 API Debugger initialized');
      
      // Display current environment info
      console.group('🌍 Environment Debug Info');
      console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('Current Origin:', typeof window !== 'undefined' ? window.location.origin : 'SSR');
      console.log('User Agent:', typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR');
      console.groupEnd();
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
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '300px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🔍 API Debug</div>
      <div>ENV: {process.env.NODE_ENV}</div>
      <div style={{ wordBreak: 'break-all' }}>
        API: {process.env.NEXT_PUBLIC_API_URL || 'undefined'}
      </div>
      <div style={{ marginTop: '4px', fontSize: '10px', opacity: 0.8 }}>
        Check console for detailed logs
      </div>
    </div>
  );
}