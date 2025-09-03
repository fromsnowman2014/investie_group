'use client'

import React, { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { debugFetch } from '@/lib/api-utils'
import { useNotifications } from './UIContext'

interface SWRConfigProviderProps {
  children: ReactNode
}

export function SWRConfigProvider({ children }: SWRConfigProviderProps) {
  const { addNotification } = useNotifications()

  const swrConfig = {
    // Global fetcher with error handling
    fetcher: async (url: string) => {
      try {
        const response = await debugFetch(url)
        const data = await response.json()
        return data
      } catch (error) {
        throw error
      }
    },

    // Global configuration
    refreshInterval: 300000, // 5 minutes default
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000, // 5 seconds
    dedupingInterval: 60000, // 1 minute

    // Cache configuration
    revalidateIfStale: true,
    revalidateOnMount: true,
    
    // Performance optimizations
    parallel: true,
    suspense: false,
    keepPreviousData: true,

    // Global error handler
    onError: (error: Error, key: string) => {
      // Add user-friendly notification
      let message = 'Failed to load data. Please try again.'
      
      if (error.message.includes('fetch')) {
        message = 'Network connection issue. Please check your internet connection.'
      } else if (error.message.includes('404')) {
        message = 'Data not found. The requested information may not be available.'
      } else if (error.message.includes('500')) {
        message = 'Server error. Please try again in a moment.'
      }

      addNotification({
        type: 'error',
        message,
        autoHide: true,
        duration: 5000
      })
    },


    // Loading state change handler
    onLoadingSlow: (key: string) => {
      addNotification({
        type: 'info',
        message: 'Loading data is taking longer than expected...',
        autoHide: true,
        duration: 3000
      })
    },

    // Connection recovery handler
    onErrorRetry: (error: Error, key: string, config: unknown, revalidate: unknown, { retryCount }: { retryCount: number }) => {
      
      // Don't retry on 404
      if (error.message.includes('404')) return
      
      // Don't retry after 3 attempts
      if (retryCount >= 3) return
      
      // Exponential backoff
      setTimeout(() => {
        if (typeof revalidate === 'function') {
          revalidate({ retryCount })
        }
      }, Math.min(1000 * (2 ** retryCount), 30000)) // Max 30 seconds
    }
  }

  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  )
}

// Specialized SWR configurations for different data types
export const stockDataSWRConfig = {
  refreshInterval: 60000, // 1 minute for stock data
  errorRetryCount: 5,
  revalidateOnFocus: true,
  dedupingInterval: 30000 // 30 seconds
}

export const aiAnalysisSWRConfig = {
  refreshInterval: 600000, // 10 minutes for AI analysis
  errorRetryCount: 3,
  revalidateOnFocus: false,
  dedupingInterval: 300000 // 5 minutes
}

export const marketDataSWRConfig = {
  refreshInterval: 300000, // 5 minutes for market data
  errorRetryCount: 5,
  revalidateOnFocus: true,
  dedupingInterval: 120000 // 2 minutes
}

export const newsDataSWRConfig = {
  refreshInterval: 900000, // 15 minutes for news
  errorRetryCount: 3,
  revalidateOnFocus: false,
  dedupingInterval: 600000 // 10 minutes
}

export const profileDataSWRConfig = {
  refreshInterval: 0, // No auto-refresh for profile data
  revalidateOnFocus: false,
  dedupingInterval: 3600000 // 1 hour
}