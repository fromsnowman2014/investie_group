'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// UI State Types
interface UIState {
  modals: {
    isStockSelectorOpen: boolean
    isSearchOpen: boolean
    isSettingsOpen: boolean
    isHelpOpen: boolean
  }
  layout: {
    sidebarCollapsed: boolean
    headerMinimized: boolean
    gridColumns: 1 | 2 | 3
  }
  loading: {
    globalLoading: boolean
    stockDataLoading: boolean
    aiAnalysisLoading: boolean
    chartLoading: boolean
  }
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
    timestamp: Date
    autoHide?: boolean
    duration?: number
  }>
  filters: {
    timeframe: '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y'
    chartType: 'candlestick' | 'line' | 'area'
    indicators: string[]
  }
}

type UIAction = 
  | { type: 'TOGGLE_STOCK_SELECTOR' }
  | { type: 'OPEN_STOCK_SELECTOR' }
  | { type: 'CLOSE_STOCK_SELECTOR' }
  | { type: 'TOGGLE_SEARCH' }
  | { type: 'OPEN_SEARCH' }
  | { type: 'CLOSE_SEARCH' }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'TOGGLE_HELP' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'MINIMIZE_HEADER'; payload: boolean }
  | { type: 'SET_GRID_COLUMNS'; payload: 1 | 2 | 3 }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_STOCK_DATA_LOADING'; payload: boolean }
  | { type: 'SET_AI_ANALYSIS_LOADING'; payload: boolean }
  | { type: 'SET_CHART_LOADING'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<UIState['notifications'][0], 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_TIMEFRAME'; payload: UIState['filters']['timeframe'] }
  | { type: 'SET_CHART_TYPE'; payload: UIState['filters']['chartType'] }
  | { type: 'TOGGLE_INDICATOR'; payload: string }
  | { type: 'CLOSE_ALL_MODALS' }

interface UIContextType {
  state: UIState
  dispatch: React.Dispatch<UIAction>
  // Modal actions
  toggleStockSelector: () => void
  openStockSelector: () => void
  closeStockSelector: () => void
  toggleSearch: () => void
  openSearch: () => void
  closeSearch: () => void
  toggleSettings: () => void
  toggleHelp: () => void
  closeAllModals: () => void
  // Layout actions
  toggleSidebar: () => void
  setGridColumns: (columns: 1 | 2 | 3) => void
  minimizeHeader: (minimized: boolean) => void
  // Loading actions
  setGlobalLoading: (loading: boolean) => void
  setStockDataLoading: (loading: boolean) => void
  setAIAnalysisLoading: (loading: boolean) => void
  setChartLoading: (loading: boolean) => void
  // Notification actions
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  // Filter actions
  setTimeframe: (timeframe: UIState['filters']['timeframe']) => void
  setChartType: (chartType: UIState['filters']['chartType']) => void
  toggleIndicator: (indicator: string) => void
}

const initialState: UIState = {
  modals: {
    isStockSelectorOpen: false,
    isSearchOpen: false,
    isSettingsOpen: false,
    isHelpOpen: false
  },
  layout: {
    sidebarCollapsed: false,
    headerMinimized: false,
    gridColumns: 2
  },
  loading: {
    globalLoading: false,
    stockDataLoading: false,
    aiAnalysisLoading: false,
    chartLoading: false
  },
  notifications: [],
  filters: {
    timeframe: '1D',
    chartType: 'candlestick',
    indicators: []
  }
}

function uiStateReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'TOGGLE_STOCK_SELECTOR':
      return {
        ...state,
        modals: {
          ...state.modals,
          isStockSelectorOpen: !state.modals.isStockSelectorOpen,
          isSearchOpen: false // Close other modals
        }
      }
    
    case 'OPEN_STOCK_SELECTOR':
      return {
        ...state,
        modals: {
          ...state.modals,
          isStockSelectorOpen: true,
          isSearchOpen: false
        }
      }
    
    case 'CLOSE_STOCK_SELECTOR':
      return {
        ...state,
        modals: {
          ...state.modals,
          isStockSelectorOpen: false
        }
      }
    
    case 'TOGGLE_SEARCH':
      return {
        ...state,
        modals: {
          ...state.modals,
          isSearchOpen: !state.modals.isSearchOpen,
          isStockSelectorOpen: false // Close other modals
        }
      }
    
    case 'OPEN_SEARCH':
      return {
        ...state,
        modals: {
          ...state.modals,
          isSearchOpen: true,
          isStockSelectorOpen: false
        }
      }
    
    case 'CLOSE_SEARCH':
      return {
        ...state,
        modals: {
          ...state.modals,
          isSearchOpen: false
        }
      }
    
    case 'TOGGLE_SETTINGS':
      return {
        ...state,
        modals: {
          ...state.modals,
          isSettingsOpen: !state.modals.isSettingsOpen
        }
      }
    
    case 'TOGGLE_HELP':
      return {
        ...state,
        modals: {
          ...state.modals,
          isHelpOpen: !state.modals.isHelpOpen
        }
      }
    
    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        modals: {
          isStockSelectorOpen: false,
          isSearchOpen: false,
          isSettingsOpen: false,
          isHelpOpen: false
        }
      }
    
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        layout: {
          ...state.layout,
          sidebarCollapsed: !state.layout.sidebarCollapsed
        }
      }
    
    case 'MINIMIZE_HEADER':
      return {
        ...state,
        layout: {
          ...state.layout,
          headerMinimized: action.payload
        }
      }
    
    case 'SET_GRID_COLUMNS':
      return {
        ...state,
        layout: {
          ...state.layout,
          gridColumns: action.payload
        }
      }
    
    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          globalLoading: action.payload
        }
      }
    
    case 'SET_STOCK_DATA_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          stockDataLoading: action.payload
        }
      }
    
    case 'SET_AI_ANALYSIS_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          aiAnalysisLoading: action.payload
        }
      }
    
    case 'SET_CHART_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          chartLoading: action.payload
        }
      }
    
    case 'ADD_NOTIFICATION':
      const newNotification = {
        ...action.payload,
        id: crypto.randomUUID(),
        timestamp: new Date()
      }
      return {
        ...state,
        notifications: [...state.notifications, newNotification]
      }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: []
      }
    
    case 'SET_TIMEFRAME':
      return {
        ...state,
        filters: {
          ...state.filters,
          timeframe: action.payload
        }
      }
    
    case 'SET_CHART_TYPE':
      return {
        ...state,
        filters: {
          ...state.filters,
          chartType: action.payload
        }
      }
    
    case 'TOGGLE_INDICATOR':
      const indicators = state.filters.indicators.includes(action.payload)
        ? state.filters.indicators.filter(i => i !== action.payload)
        : [...state.filters.indicators, action.payload]
      
      return {
        ...state,
        filters: {
          ...state.filters,
          indicators
        }
      }
    
    default:
      return state
  }
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiStateReducer, initialState)

  // Action creators
  const toggleStockSelector = () => dispatch({ type: 'TOGGLE_STOCK_SELECTOR' })
  const openStockSelector = () => dispatch({ type: 'OPEN_STOCK_SELECTOR' })
  const closeStockSelector = () => dispatch({ type: 'CLOSE_STOCK_SELECTOR' })
  const toggleSearch = () => dispatch({ type: 'TOGGLE_SEARCH' })
  const openSearch = () => dispatch({ type: 'OPEN_SEARCH' })
  const closeSearch = () => dispatch({ type: 'CLOSE_SEARCH' })
  const toggleSettings = () => dispatch({ type: 'TOGGLE_SETTINGS' })
  const toggleHelp = () => dispatch({ type: 'TOGGLE_HELP' })
  const closeAllModals = () => dispatch({ type: 'CLOSE_ALL_MODALS' })
  
  const toggleSidebar = () => dispatch({ type: 'TOGGLE_SIDEBAR' })
  const setGridColumns = (columns: 1 | 2 | 3) => 
    dispatch({ type: 'SET_GRID_COLUMNS', payload: columns })
  const minimizeHeader = (minimized: boolean) => 
    dispatch({ type: 'MINIMIZE_HEADER', payload: minimized })
  
  const setGlobalLoading = (loading: boolean) => 
    dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading })
  const setStockDataLoading = (loading: boolean) => 
    dispatch({ type: 'SET_STOCK_DATA_LOADING', payload: loading })
  const setAIAnalysisLoading = (loading: boolean) => 
    dispatch({ type: 'SET_AI_ANALYSIS_LOADING', payload: loading })
  const setChartLoading = (loading: boolean) => 
    dispatch({ type: 'SET_CHART_LOADING', payload: loading })
  
  const addNotification = (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) =>
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
  const removeNotification = (id: string) => 
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  const clearNotifications = () => dispatch({ type: 'CLEAR_NOTIFICATIONS' })
  
  const setTimeframe = (timeframe: UIState['filters']['timeframe']) =>
    dispatch({ type: 'SET_TIMEFRAME', payload: timeframe })
  const setChartType = (chartType: UIState['filters']['chartType']) =>
    dispatch({ type: 'SET_CHART_TYPE', payload: chartType })
  const toggleIndicator = (indicator: string) =>
    dispatch({ type: 'TOGGLE_INDICATOR', payload: indicator })

  const contextValue: UIContextType = {
    state,
    dispatch,
    toggleStockSelector,
    openStockSelector,
    closeStockSelector,
    toggleSearch,
    openSearch,
    closeSearch,
    toggleSettings,
    toggleHelp,
    closeAllModals,
    toggleSidebar,
    setGridColumns,
    minimizeHeader,
    setGlobalLoading,
    setStockDataLoading,
    setAIAnalysisLoading,
    setChartLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    setTimeframe,
    setChartType,
    toggleIndicator
  }

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}

// Specialized hooks for different UI concerns
export function useModal() {
  const { state, toggleStockSelector, openStockSelector, closeStockSelector, 
          toggleSearch, openSearch, closeSearch, toggleSettings, toggleHelp, closeAllModals } = useUI()
  return {
    modals: state.modals,
    toggleStockSelector,
    openStockSelector,
    closeStockSelector,
    toggleSearch,
    openSearch,
    closeSearch,
    toggleSettings,
    toggleHelp,
    closeAllModals
  }
}

export function useLayout() {
  const { state, toggleSidebar, setGridColumns, minimizeHeader } = useUI()
  return {
    layout: state.layout,
    toggleSidebar,
    setGridColumns,
    minimizeHeader
  }
}

export function useLoading() {
  const { state, setGlobalLoading, setStockDataLoading, setAIAnalysisLoading, setChartLoading } = useUI()
  return {
    loading: state.loading,
    setGlobalLoading,
    setStockDataLoading,
    setAIAnalysisLoading,
    setChartLoading
  }
}

export function useNotifications() {
  const { state, addNotification, removeNotification, clearNotifications } = useUI()
  return {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearNotifications
  }
}

export function useFilters() {
  const { state, setTimeframe, setChartType, toggleIndicator } = useUI()
  return {
    filters: state.filters,
    setTimeframe,
    setChartType,
    toggleIndicator
  }
}