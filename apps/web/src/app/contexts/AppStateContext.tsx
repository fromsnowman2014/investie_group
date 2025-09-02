'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { StockSymbol } from '@/types/api'

// App State Types
interface AppState {
  currentStock: {
    symbol: StockSymbol
    lastUpdated: Date | null
  }
  user: {
    preferences: {
      theme: 'light' | 'dark'
      defaultSymbol: StockSymbol
      refreshInterval: number
    }
  }
  session: {
    isActive: boolean
    startTime: Date
    lastActivity: Date
  }
}

type AppAction = 
  | { type: 'SET_CURRENT_STOCK'; payload: StockSymbol }
  | { type: 'UPDATE_STOCK_TIMESTAMP'; payload: Date }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_DEFAULT_SYMBOL'; payload: StockSymbol }
  | { type: 'SET_REFRESH_INTERVAL'; payload: number }
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'START_SESSION' }
  | { type: 'END_SESSION' }

interface AppStateContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  // Convenience actions
  setCurrentStock: (symbol: StockSymbol) => void
  setTheme: (theme: 'light' | 'dark') => void
  setDefaultSymbol: (symbol: StockSymbol) => void
  updateActivity: () => void
}

const initialState: AppState = {
  currentStock: {
    symbol: 'AAPL',
    lastUpdated: null
  },
  user: {
    preferences: {
      theme: 'light',
      defaultSymbol: 'AAPL',
      refreshInterval: 60000 // 1 minute
    }
  },
  session: {
    isActive: true,
    startTime: new Date(),
    lastActivity: new Date()
  }
}

function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_STOCK':
      return {
        ...state,
        currentStock: {
          symbol: action.payload,
          lastUpdated: new Date()
        }
      }
    
    case 'UPDATE_STOCK_TIMESTAMP':
      return {
        ...state,
        currentStock: {
          ...state.currentStock,
          lastUpdated: action.payload
        }
      }
    
    case 'SET_THEME':
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            theme: action.payload
          }
        }
      }
    
    case 'SET_DEFAULT_SYMBOL':
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            defaultSymbol: action.payload
          }
        }
      }
    
    case 'SET_REFRESH_INTERVAL':
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            refreshInterval: action.payload
          }
        }
      }
    
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        session: {
          ...state.session,
          lastActivity: new Date()
        }
      }
    
    case 'START_SESSION':
      return {
        ...state,
        session: {
          isActive: true,
          startTime: new Date(),
          lastActivity: new Date()
        }
      }
    
    case 'END_SESSION':
      return {
        ...state,
        session: {
          ...state.session,
          isActive: false
        }
      }
    
    default:
      return state
  }
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appStateReducer, initialState)

  // Convenience action creators
  const setCurrentStock = (symbol: StockSymbol) => {
    dispatch({ type: 'SET_CURRENT_STOCK', payload: symbol })
    dispatch({ type: 'UPDATE_ACTIVITY' })
  }

  const setTheme = (theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme })
    dispatch({ type: 'UPDATE_ACTIVITY' })
  }

  const setDefaultSymbol = (symbol: StockSymbol) => {
    dispatch({ type: 'SET_DEFAULT_SYMBOL', payload: symbol })
    dispatch({ type: 'UPDATE_ACTIVITY' })
  }

  const updateActivity = () => {
    dispatch({ type: 'UPDATE_ACTIVITY' })
  }

  const contextValue: AppStateContextType = {
    state,
    dispatch,
    setCurrentStock,
    setTheme,
    setDefaultSymbol,
    updateActivity
  }

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}

// Specialized hooks for specific state slices
export function useCurrentStock() {
  const { state, setCurrentStock } = useAppState()
  return {
    currentSymbol: state.currentStock.symbol,
    lastUpdated: state.currentStock.lastUpdated,
    setCurrentStock
  }
}

export function useUserPreferences() {
  const { state, setTheme, setDefaultSymbol, dispatch } = useAppState()
  return {
    theme: state.user.preferences.theme,
    defaultSymbol: state.user.preferences.defaultSymbol,
    refreshInterval: state.user.preferences.refreshInterval,
    setTheme,
    setDefaultSymbol,
    setRefreshInterval: (interval: number) => 
      dispatch({ type: 'SET_REFRESH_INTERVAL', payload: interval })
  }
}

export function useSession() {
  const { state, updateActivity, dispatch } = useAppState()
  return {
    isActive: state.session.isActive,
    startTime: state.session.startTime,
    lastActivity: state.session.lastActivity,
    updateActivity,
    startSession: () => dispatch({ type: 'START_SESSION' }),
    endSession: () => dispatch({ type: 'END_SESSION' })
  }
}