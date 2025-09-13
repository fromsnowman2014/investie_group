'use client';

import React, { useEffect } from 'react';
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

  // Add comprehensive environment variable debugging
  useEffect(() => {
    console.group('🔍 MAIN PAGE ENVIRONMENT DEBUGGING');
    console.log('='.repeat(50));
    
    // Basic environment info
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🌍 Is Client:', typeof window !== 'undefined');
    console.log('🌍 Process Available:', typeof process !== 'undefined');
    
    // Check all NEXT_PUBLIC_ variables
    const allNextPublicVars = typeof process !== 'undefined' && process.env ? 
      Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')) : [];
    
    console.log('📊 Total NEXT_PUBLIC_ variables:', allNextPublicVars.length);
    console.log('📊 NEXT_PUBLIC_ variables list:', allNextPublicVars);
    
    // Check specific Supabase variables
    console.log('🔑 NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING');
    console.log('🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
    console.log('🔑 NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL:', process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'MISSING');
    console.log('🔑 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'MISSING');
    
    // Build-time variables
    console.log('🏗️ BUILD_TIME_ENV_COUNT:', process.env.BUILD_TIME_ENV_COUNT || 'MISSING');
    console.log('🏗️ BUILD_TIME_NODE_ENV:', process.env.BUILD_TIME_NODE_ENV || 'MISSING');
    console.log('🏗️ BUILD_TIME_TIMESTAMP:', process.env.BUILD_TIME_TIMESTAMP || 'MISSING');
    
    // Vercel specific variables
    const vercelVars = allNextPublicVars.filter(k => k.includes('VERCEL'));
    console.log('🚀 Vercel variables count:', vercelVars.length);
    console.log('🚀 Sample Vercel vars:', vercelVars.slice(0, 3));
    
    // Check for any patterns
    if (allNextPublicVars.length === 0) {
      console.error('❌ CRITICAL: No NEXT_PUBLIC_ variables found at runtime!');
      console.error('This indicates a serious environment variable loading issue.');
    } else if (allNextPublicVars.length > 0) {
      const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const hasFunctionsUrl = !!process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
      
      if (!hasSupabaseUrl || !hasSupabaseKey) {
        console.warn('⚠️ Some Supabase variables are missing:');
        console.warn('   SUPABASE_URL:', hasSupabaseUrl ? '✅' : '❌');
        console.warn('   SUPABASE_ANON_KEY:', hasSupabaseKey ? '✅' : '❌');
        console.warn('   SUPABASE_FUNCTIONS_URL:', hasFunctionsUrl ? '✅' : '❌');
      } else {
        console.log('✅ All Supabase variables are present!');
      }
    }
    
    console.log('='.repeat(50));
    console.groupEnd();
  }, []);

  return (
    <>
      {/* TEMPORARY: Disable TradingView components to isolate React Error #418 */}
      {/* <TickerTape /> */}
      
      {/* Debugging Link */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        zIndex: 9999,
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <a href="/env-debug" style={{ color: 'white', textDecoration: 'none' }}>
          🔍 Environment Debug
        </a>
      </div>
      
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
