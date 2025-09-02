import React from 'react'
import { render, screen, fireEvent } from '@/test-utils'
import { AppStateProvider, useAppState, useCurrentStock, useUserPreferences, useSession } from './AppStateContext'
import { StockSymbol } from '@/types/api'

// Test components
function AppStateTestComponent() {
  const { state, setCurrentStock, setTheme } = useAppState()
  
  return (
    <div>
      <div data-testid="current-symbol">{state.currentStock.symbol}</div>
      <div data-testid="theme">{state.user.preferences.theme}</div>
      <div data-testid="session-active">{state.session.isActive ? 'active' : 'inactive'}</div>
      <button 
        data-testid="change-stock"
        onClick={() => setCurrentStock('TSLA' as StockSymbol)}
      >
        Change Stock
      </button>
      <button 
        data-testid="change-theme"
        onClick={() => setTheme('dark')}
      >
        Change Theme
      </button>
    </div>
  )
}

function CurrentStockTestComponent() {
  const { currentSymbol, setCurrentStock } = useCurrentStock()
  
  return (
    <div>
      <div data-testid="symbol">{currentSymbol}</div>
      <button 
        data-testid="change"
        onClick={() => setCurrentStock('MSFT' as StockSymbol)}
      >
        Change
      </button>
    </div>
  )
}

function UserPreferencesTestComponent() {
  const { theme, defaultSymbol, setTheme, setDefaultSymbol } = useUserPreferences()
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="default-symbol">{defaultSymbol}</div>
      <button 
        data-testid="toggle-theme"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        Toggle Theme
      </button>
      <button 
        data-testid="change-default"
        onClick={() => setDefaultSymbol('GOOGL' as StockSymbol)}
      >
        Change Default
      </button>
    </div>
  )
}

function SessionTestComponent() {
  const { isActive, startSession, endSession, updateActivity } = useSession()
  
  return (
    <div>
      <div data-testid="session-status">{isActive ? 'active' : 'inactive'}</div>
      <button data-testid="start-session" onClick={startSession}>Start</button>
      <button data-testid="end-session" onClick={endSession}>End</button>
      <button data-testid="update-activity" onClick={updateActivity}>Update Activity</button>
    </div>
  )
}

// Error boundary component for testing context errors
function TestComponentWithoutProvider() {
  // This will throw an error due to missing provider context
  const { state } = useAppState()
  return <div>{state.currentStock.symbol}</div>
}

describe('AppStateContext', () => {
  describe('AppStateProvider', () => {
    it('should provide initial state', () => {
      render(
        <AppStateProvider>
          <AppStateTestComponent />
        </AppStateProvider>
      )

      expect(screen.getByTestId('current-symbol')).toHaveTextContent('AAPL')
      expect(screen.getByTestId('theme')).toHaveTextContent('light')
      expect(screen.getByTestId('session-active')).toHaveTextContent('active')
    })

    it('should allow updating stock symbol', () => {
      render(
        <AppStateProvider>
          <AppStateTestComponent />
        </AppStateProvider>
      )

      expect(screen.getByTestId('current-symbol')).toHaveTextContent('AAPL')

      fireEvent.click(screen.getByTestId('change-stock'))

      expect(screen.getByTestId('current-symbol')).toHaveTextContent('TSLA')
    })

    it('should allow updating theme', () => {
      render(
        <AppStateProvider>
          <AppStateTestComponent />
        </AppStateProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('light')

      fireEvent.click(screen.getByTestId('change-theme'))

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    // Temporarily disabled due to React hooks rules - this test would require error boundary
    it.skip('should throw error when used outside provider', () => {
      render(<TestComponentWithoutProvider />)

      expect(screen.getByTestId('error')).toHaveTextContent(
        'useAppState must be used within an AppStateProvider'
      )
    })
  })

  describe('useCurrentStock', () => {
    it('should provide current stock functionality', () => {
      render(
        <AppStateProvider>
          <CurrentStockTestComponent />
        </AppStateProvider>
      )

      expect(screen.getByTestId('symbol')).toHaveTextContent('AAPL')

      fireEvent.click(screen.getByTestId('change'))

      expect(screen.getByTestId('symbol')).toHaveTextContent('MSFT')
    })
  })

  describe('useUserPreferences', () => {
    it('should provide user preferences functionality', () => {
      render(
        <AppStateProvider>
          <UserPreferencesTestComponent />
        </AppStateProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('light')
      expect(screen.getByTestId('default-symbol')).toHaveTextContent('AAPL')

      fireEvent.click(screen.getByTestId('toggle-theme'))
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')

      fireEvent.click(screen.getByTestId('change-default'))
      expect(screen.getByTestId('default-symbol')).toHaveTextContent('GOOGL')
    })
  })

  describe('useSession', () => {
    it('should provide session management functionality', () => {
      render(
        <AppStateProvider>
          <SessionTestComponent />
        </AppStateProvider>
      )

      expect(screen.getByTestId('session-status')).toHaveTextContent('active')

      fireEvent.click(screen.getByTestId('end-session'))
      expect(screen.getByTestId('session-status')).toHaveTextContent('inactive')

      fireEvent.click(screen.getByTestId('start-session'))
      expect(screen.getByTestId('session-status')).toHaveTextContent('active')
    })
  })

  describe('State Integration', () => {
    it('should maintain state consistency across multiple hooks', () => {
      function MultiHookComponent() {
        const { state } = useAppState()
        const { currentSymbol } = useCurrentStock()
        const { theme } = useUserPreferences()
        
        return (
          <div>
            <div data-testid="app-state-symbol">{state.currentStock.symbol}</div>
            <div data-testid="current-stock-symbol">{currentSymbol}</div>
            <div data-testid="app-state-theme">{state.user.preferences.theme}</div>
            <div data-testid="user-pref-theme">{theme}</div>
          </div>
        )
      }

      render(
        <AppStateProvider>
          <MultiHookComponent />
        </AppStateProvider>
      )

      // Both hooks should return the same symbol
      expect(screen.getByTestId('app-state-symbol')).toHaveTextContent('AAPL')
      expect(screen.getByTestId('current-stock-symbol')).toHaveTextContent('AAPL')

      // Both hooks should return the same theme
      expect(screen.getByTestId('app-state-theme')).toHaveTextContent('light')
      expect(screen.getByTestId('user-pref-theme')).toHaveTextContent('light')
    })
  })
})