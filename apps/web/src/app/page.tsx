'use client';

import React from 'react';
import { useStock } from './components/StockProvider';
import MainLayout from './components/MainLayout';
import Header from './components/Header';
import AIAnalysis from './components/AIAnalysis';
import MarketIntelligence from './components/MarketIntelligence';
import ChartAnalysis from './components/ChartAnalysis';
import TickerTape from './components/TradingView/TickerTape';
import Footer from './components/Footer';

export default function Home() {
  const { currentSymbol } = useStock();

  return (
    <>
      {/* Ticker Tape - Global Market Overview */}
      <TickerTape />
      
      {/* Main Application Layout */}
      <MainLayout
        header={<Header />}
        aiAnalysis={<AIAnalysis symbol={currentSymbol} />}
        marketIntelligence={<MarketIntelligence symbol={currentSymbol} />}
        chartAnalysis={<ChartAnalysis symbol={currentSymbol} />}
      />
      
      {/* Footer */}
      <Footer />
    </>
  );
}
