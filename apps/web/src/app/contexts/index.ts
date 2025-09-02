// Main provider exports
export { AppProviders, StockProvider } from './AppProviders'

// Context providers
export { AppStateProvider } from './AppStateContext'
export { UIProvider } from './UIContext'
export { SWRConfigProvider } from './SWRConfigProvider'

// App state hooks
export { 
  useAppState, 
  useCurrentStock, 
  useUserPreferences, 
  useSession 
} from './AppStateContext'

// UI hooks
export {
  useUI,
  useModal,
  useLayout,
  useLoading,
  useNotifications,
  useFilters
} from './UIContext'

// Legacy compatibility
export { useStock } from './AppProviders'

// SWR configurations
export {
  stockDataSWRConfig,
  aiAnalysisSWRConfig,
  marketDataSWRConfig,
  newsDataSWRConfig,
  profileDataSWRConfig
} from './SWRConfigProvider'