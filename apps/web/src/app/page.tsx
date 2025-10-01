'use client';

import React from 'react';
import { useStock } from './components/StockProvider';
import MainLayout from './components/MainLayout';
import Header from './components/Header';
import { StockProfile, AIOpinionCard } from './components/AIAnalysis';
import { MacroIndicatorsDashboard, AINewsAnalysisReport } from './components/MarketIntelligence';
import AdvancedChart from './components/TradingView/AdvancedChart';
import TechnicalAnalysis from './components/TradingView/TechnicalAnalysis';
import CompanyProfile from './components/TradingView/CompanyProfile';
import FundamentalData from './components/TradingView/FundamentalData';
import TopStories from './components/TradingView/TopStories';
import TickerTape from './components/TradingView/TickerTape';
import Footer from './components/Footer';

export default function Home() {
  const { currentSymbol } = useStock();

  return (
    <>
      {/* Ticker Tape - Global Market Overview */}
      <TickerTape />
      
      {/* Main Application Layout - Phase 2 Optimized with Individual Components */}
      <MainLayout
        header={<Header />}
        aiInvestmentOpinion={<AIOpinionCard symbol={currentSymbol} />}
        stockProfile={<StockProfile symbol={currentSymbol} />}
        macroIndicatorsDashboard={<MacroIndicatorsDashboard />}
        aiNewsAnalysisReport={<AINewsAnalysisReport symbol={currentSymbol} />}
        advancedChart={<AdvancedChart />}
        technicalAnalysis={<TechnicalAnalysis />}
        companyProfile={<CompanyProfile />}
        fundamentalData={<FundamentalData />}
        topStories={<TopStories />}
      />
      
      {/* Footer */}
      <Footer />
    </>
  );
}
