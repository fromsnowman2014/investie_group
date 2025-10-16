'use client';

import React from 'react';
import TickerTape from './components/TradingView/TickerTape';
import Header from './components/Header';
import MasonryDashboard from './components/Dashboard/MasonryDashboard';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="app-container">
      {/* Ticker Tape - Global Market Overview */}
      <TickerTape />

      {/* Main Layout with Card-Based Masonry Dashboard */}
      <div className="main-layout">
        <header className="layout-header">
          <Header />
        </header>
        <main className="dashboard-main">
          <MasonryDashboard />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
