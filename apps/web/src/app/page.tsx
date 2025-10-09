'use client';

import React from 'react';
import TickerTape from './components/TradingView/TickerTape';
import Header from './components/Header';
import DashboardGrid from './components/Dashboard/DashboardGrid';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="app-container">
      {/* Ticker Tape - Global Market Overview */}
      <TickerTape />

      {/* Main Layout with New Customizable Dashboard */}
      <div className="main-layout">
        <header className="layout-header">
          <Header />
        </header>
        <main className="dashboard-main">
          <DashboardGrid />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
