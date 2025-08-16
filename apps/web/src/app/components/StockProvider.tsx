'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StockSymbol } from '@/types/api';

interface StockContextType {
  currentSymbol: StockSymbol;
  setCurrentSymbol: (symbol: StockSymbol) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: ReactNode }) {
  const [currentSymbol, setCurrentSymbol] = useState<StockSymbol>('AAPL');

  return (
    <StockContext.Provider value={{ currentSymbol, setCurrentSymbol }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
}