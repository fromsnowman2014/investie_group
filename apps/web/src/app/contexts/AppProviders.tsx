'use client'

import React, { ReactNode } from 'react'
import { AppStateProvider, useCurrentStock } from './AppStateContext'
import { UIProvider } from './UIContext'
import { SWRConfigProvider } from './SWRConfigProvider'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Master provider component that wraps the application with all necessary contexts.
 * 
 * Provider hierarchy (inside-out):
 * 1. AppStateProvider - Global application state
 * 2. UIProvider - UI state and interactions
 * 3. SWRConfigProvider - Optimized data fetching configuration
 * 
 * This hierarchy ensures that:
 * - App state is available to all child components
 * - UI state can access app state when needed
 * - SWR can access notification system from UI context
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppStateProvider>
      <UIProvider>
        <SWRConfigProvider>
          {children}
        </SWRConfigProvider>
      </UIProvider>
    </AppStateProvider>
  )
}

// Legacy compatibility - maintain StockProvider API for backward compatibility
export function StockProvider({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>
}

// Re-export all context hooks for convenience
export { 
  useAppState, 
  useCurrentStock, 
  useUserPreferences, 
  useSession 
} from './AppStateContext'

export {
  useUI,
  useModal,
  useLayout,
  useLoading,
  useNotifications,
  useFilters
} from './UIContext'

// Legacy compatibility hook
export function useStock() {
  const { currentSymbol, setCurrentStock } = useCurrentStock()
  return {
    currentSymbol,
    setCurrentSymbol: setCurrentStock
  }
}