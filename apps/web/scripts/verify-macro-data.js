/**
 * Script to verify Macro Indicators data accuracy
 * Compares our API responses with actual source data
 */

// Current values from screenshot
const CURRENT_VALUES = {
  vix: 17.5,
  fearGreed: 15,
  treasury10Y: 4.07,
  cpi: 2.4
};

async function verifyFearGreedIndex() {
  console.log('\n📊 Verifying Fear & Greed Index...');
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await response.json();

    if (data.data && data.data[0]) {
      const actual = parseInt(data.data[0].value);
      const timestamp = new Date(parseInt(data.data[0].timestamp) * 1000);
      const status = data.data[0].value_classification;

      console.log('  Source: Alternative.me (Crypto Fear & Greed)');
      console.log('  Actual Value:', actual);
      console.log('  Our Value:', CURRENT_VALUES.fearGreed);
      console.log('  Status:', status);
      console.log('  Timestamp:', timestamp.toISOString());
      console.log('  Age:', Math.floor((Date.now() - timestamp) / (1000 * 60 * 60)), 'hours old');
      console.log('  Match:', actual === CURRENT_VALUES.fearGreed ? '✅' : '❌');

      return { actual, our: CURRENT_VALUES.fearGreed, timestamp, status };
    }
  } catch (error) {
    console.error('  ❌ Error:', error.message);
    return null;
  }
}

async function verifyYahooFinanceVIX() {
  console.log('\n📈 Verifying VIX...');

  const proxies = [
    { name: 'corsproxy.io', url: 'https://corsproxy.io/?' },
    { name: 'allorigins', url: 'https://api.allorigins.win/raw?url=' },
  ];

  for (const proxy of proxies) {
    try {
      const targetUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX';
      const url = proxy.url + encodeURIComponent(targetUrl);

      console.log(`  Trying ${proxy.name}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const meta = data.chart?.result?.[0]?.meta;

        if (meta) {
          const currentPrice = meta.regularMarketPrice || meta.previousClose;
          const timestamp = meta.regularMarketTime
            ? new Date(meta.regularMarketTime * 1000)
            : new Date();

          console.log('  Source: Yahoo Finance (^VIX)');
          console.log('  Actual Value:', currentPrice?.toFixed(2));
          console.log('  Our Value:', CURRENT_VALUES.vix);
          console.log('  Timestamp:', timestamp.toISOString());
          console.log('  Age:', Math.floor((Date.now() - timestamp) / (1000 * 60 * 60)), 'hours old');
          console.log('  Match:', Math.abs(currentPrice - CURRENT_VALUES.vix) < 0.5 ? '✅' : '❌');
          console.log('  Proxy Used:', proxy.name, '✅');

          return { actual: currentPrice, our: CURRENT_VALUES.vix, timestamp };
        }
      }
    } catch (error) {
      console.log(`  ${proxy.name} failed:`, error.message);
    }
  }

  console.error('  ❌ All proxies failed');
  return null;
}

async function verifyYahooFinance10Y() {
  console.log('\n💰 Verifying 10Y Treasury...');

  const proxies = [
    { name: 'corsproxy.io', url: 'https://corsproxy.io/?' },
    { name: 'allorigins', url: 'https://api.allorigins.win/raw?url=' },
  ];

  for (const proxy of proxies) {
    try {
      const targetUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX';
      const url = proxy.url + encodeURIComponent(targetUrl);

      console.log(`  Trying ${proxy.name}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const meta = data.chart?.result?.[0]?.meta;

        if (meta) {
          const currentPrice = meta.regularMarketPrice || meta.previousClose;
          const timestamp = meta.regularMarketTime
            ? new Date(meta.regularMarketTime * 1000)
            : new Date();

          console.log('  Source: Yahoo Finance (^TNX)');
          console.log('  Actual Value:', currentPrice?.toFixed(3) + '%');
          console.log('  Our Value:', CURRENT_VALUES.treasury10Y + '%');
          console.log('  Timestamp:', timestamp.toISOString());
          console.log('  Age:', Math.floor((Date.now() - timestamp) / (1000 * 60 * 60)), 'hours old');
          console.log('  Match:', Math.abs(currentPrice - CURRENT_VALUES.treasury10Y) < 0.05 ? '✅' : '❌');
          console.log('  Proxy Used:', proxy.name, '✅');

          return { actual: currentPrice, our: CURRENT_VALUES.treasury10Y, timestamp };
        }
      }
    } catch (error) {
      console.log(`  ${proxy.name} failed:`, error.message);
    }
  }

  console.error('  ❌ All proxies failed');
  return null;
}

function verifyCPI() {
  console.log('\n📊 Verifying CPI...');
  console.log('  Source: Fallback data (FRED API not accessible from client)');
  console.log('  Our Value:', CURRENT_VALUES.cpi);
  console.log('  Note: This is fallback data, not real-time');
  console.log('  Recommendation: Move to server-side API route for real FRED data');

  return { actual: 'unknown', our: CURRENT_VALUES.cpi, note: 'Using fallback' };
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔍 MACRO INDICATORS DATA VERIFICATION');
  console.log('='.repeat(60));
  console.log('Testing Date:', new Date().toISOString());
  console.log('Values from UI:', CURRENT_VALUES);

  const results = {
    fearGreed: await verifyFearGreedIndex(),
    vix: await verifyYahooFinanceVIX(),
    treasury10Y: await verifyYahooFinance10Y(),
    cpi: verifyCPI()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));

  let matchCount = 0;
  let totalCount = 0;

  for (const [key, result] of Object.entries(results)) {
    if (result && result.actual !== 'unknown') {
      totalCount++;
      const match = Math.abs(result.actual - result.our) < 1;
      if (match) matchCount++;

      console.log(`${key.toUpperCase()}:`);
      console.log(`  Actual: ${result.actual}`);
      console.log(`  Ours: ${result.our}`);
      console.log(`  Status: ${match ? '✅ Match' : '❌ Mismatch'}`);
      if (result.timestamp) {
        console.log(`  Data Age: ${Math.floor((Date.now() - result.timestamp) / (1000 * 60 * 60))} hours`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Accuracy: ${matchCount}/${totalCount} metrics match`);
  console.log('='.repeat(60));

  // Analysis and recommendations
  console.log('\n📝 ANALYSIS:');
  console.log('1. Fear & Greed: Using crypto market sentiment (Alternative.me)');
  console.log('   - This is CRYPTO data, not stock market');
  console.log('   - Consider finding stock market Fear & Greed alternative');
  console.log('');
  console.log('2. VIX & 10Y Treasury: From Yahoo Finance via CORS proxies');
  console.log('   - Proxies can be unreliable or rate-limited');
  console.log('   - Consider server-side API routes for reliability');
  console.log('');
  console.log('3. CPI: Using fallback static data');
  console.log('   - FRED API requires server-side call');
  console.log('   - Current value (2.4) may be outdated');
  console.log('   - Must implement server-side API route');
  console.log('');
  console.log('💡 RECOMMENDATIONS:');
  console.log('1. Create Next.js API routes for server-side data fetching');
  console.log('2. Implement caching to reduce API calls');
  console.log('3. Add data freshness indicators to UI');
  console.log('4. Consider paid API services for reliability');
}

// Run the verification
main().catch(console.error);
