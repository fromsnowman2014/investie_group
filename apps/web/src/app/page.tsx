'use client';

import React from 'react';
import { useStock } from './components/StockProvider';
import MainLayout from './components/MainLayout';
import Header from './components/Header';
import { AIInvestmentOpinion, StockProfile } from './components/AIAnalysis';
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
      {/* TEMPORARY: Disable TradingView components to isolate React Error #418 */}
      {/* <TickerTape /> */}
      
      {/* Main Application Layout - Phase 2 Optimized with Individual Components */}
      <MainLayout
        header={<Header />}
        aiInvestmentOpinion={<AIInvestmentOpinion symbol={currentSymbol} />}
        stockProfile={<StockProfile symbol={currentSymbol} />}
        macroIndicatorsDashboard={<MacroIndicatorsDashboard />}
        aiNewsAnalysisReport={<AINewsAnalysisReport symbol={currentSymbol} />}
        advancedChart={<div style={{padding: '20px', background: '#f0f0f0', textAlign: 'center'}}>📊 Chart temporarily disabled for debugging</div>}
        technicalAnalysis={<div style={{padding: '20px', background: '#f0f0f0', textAlign: 'center'}}>📈 Technical Analysis temporarily disabled for debugging</div>}
        companyProfile={<div style={{padding: '20px', background: '#f0f0f0', textAlign: 'center'}}>🏢 Company Profile temporarily disabled for debugging</div>}
        fundamentalData={<div style={{padding: '20px', background: '#f0f0f0', textAlign: 'center'}}>📋 Fundamental Data temporarily disabled for debugging</div>}
        topStories={<div style={{padding: '20px', background: '#f0f0f0', textAlign: 'center'}}>📰 Top Stories temporarily disabled for debugging</div>}
      />
      
      {/* Footer */}
      <Footer />
    </>
  );
}
