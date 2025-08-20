'use client';

import React from 'react';
import { SWRConfig } from 'swr';

interface SWRProviderProps {
  children: React.ReactNode;
}

// Default fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorInfo = {
      status: response.status,
      statusText: response.statusText,
      url
    };
    
    const error = new Error(`API Error: ${response.status} ${response.statusText}`) as Error & { info?: { status?: number; statusText?: string; url?: string } };
    error.info = errorInfo;
    throw error;
  }
  
  return response.json();
};

// SWR global configuration
const swrConfig = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0, // Disable automatic refresh by default
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  onError: (error: Error & { info?: { status?: number; url?: string } }, key: string) => {
    console.error('SWR Error:', {
      key,
      error: error.message,
      status: error.info?.status,
      url: error.info?.url
    });
  },
  onSuccess: (data: unknown, key: string) => {
    // Optional: Log successful data fetches in development
    if (process.env.NODE_ENV === 'development') {
      console.log('SWR Success:', key, data);
    }
  },
  // Cache provider for better performance
  use: []
};

export default function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}