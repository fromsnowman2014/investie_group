import Header from './components/Header';
import Footer from './components/Footer';
import TickerTape from './components/TradingView/TickerTape';
import SymbolInfo from './components/TradingView/SymbolInfo';
import TechnicalAnalysis from './components/TradingView/TechnicalAnalysis';
import AdvancedChart from './components/TradingView/AdvancedChart';
import CompanyProfile from './components/TradingView/CompanyProfile';
import FundamentalData from './components/TradingView/FundamentalData';
import TopStories from './components/TradingView/TopStories';
import PoweredByTradingView from './components/TradingView/PoweredByTradingView';

export default function Home() {
  return (
    <>
      <Header />
      
      {/* Ticker Tape */}
      <TickerTape />
      
      {/* Main Trading Grid */}
      <main className="trading-grid">
        <SymbolInfo />
        <TechnicalAnalysis />
        <AdvancedChart />
        <CompanyProfile />
        <FundamentalData />
        <TopStories />
        <PoweredByTradingView />
      </main>
      
      <Footer />
    </>
  );
}
