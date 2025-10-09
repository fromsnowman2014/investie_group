# Stock Search User Guide

## Overview

Investie now supports universal stock search, allowing you to analyze any US-listed stock, not just the predefined popular stocks. This guide will help you make the most of this feature.

---

## How to Search for Stocks

### Search Methods

1. **By Ticker Symbol**
   - Type the exact stock ticker (e.g., AAPL, TSLA, MSFT)
   - Case insensitive: "aapl" = "AAPL" = "Aapl"
   - Press Enter or click the search result

2. **By Company Name**
   - Type partial or full company name (e.g., "Apple", "Tesla")
   - Supports partial matching
   - Works for popular stocks displayed in the dropdown

3. **Direct Entry**
   - Enter any valid US stock ticker (1-5 letters)
   - System will validate if the ticker exists
   - If valid, stock analysis will load automatically

---

## Search Features

### 1. Real-time Validation

When you search for a stock ticker:
- ✅ **Instant**: Popular stocks load immediately from cache
- ✅ **API Validation**: Unknown tickers are validated against real market data
- ✅ **Error Feedback**: Clear error messages if ticker is not found

### 2. Search History

Your last 10 searched stocks are automatically saved:
- **Storage**: Browser cookies (90-day expiration)
- **Privacy**: Client-side only, no server tracking
- **Access**: Click "Change Stock" button → See "Recently Viewed" section

### 3. Quick Actions

**Recently Viewed Section:**
- Click any stock to instantly switch to it
- Remove individual stocks by clicking the × button
- Clear all history with the "Clear" button

**Popular Stocks Section:**
- Quick access to 10 most popular stocks
- Always visible in the dropdown menu

---

## User Interface Guide

### Header Components

1. **Search Bar** (Top right)
   - Type to search
   - Shows auto-complete dropdown for popular stocks
   - Displays loading spinner during validation
   - Shows error messages if ticker not found

2. **Change Stock Button**
   - Opens dropdown menu
   - Shows Recently Viewed (if available)
   - Shows Popular Stocks
   - Current stock is highlighted with ✓

3. **Current Stock Display**
   - Shows "Analyzing: [TICKER]"
   - Updates when you switch stocks

---

## Error Handling

### Common Error Messages

1. **"Invalid ticker format (must be 1-5 letters)"**
   - Fix: Enter only letters (A-Z), 1-5 characters
   - Examples: AAPL ✅, APPL123 ❌, TOOLONGNAME ❌

2. **"Stock ticker not found"**
   - Possible causes:
     - Ticker doesn't exist
     - Not a US-listed stock
     - Typo in ticker symbol
   - Fix: Double-check spelling or try company name

3. **"Search failed. Please try again."**
   - Possible causes:
     - Network connection issue
     - API temporarily unavailable
   - Fix: Check internet connection and retry

### Error Dismissal

- Click the × button to dismiss error
- Start typing to automatically clear error
- Current stock view is preserved during errors

---

## Tips & Best Practices

### Efficient Searching

1. **Use Ticker Symbols** for fastest results
   - Example: "AAPL" is faster than "Apple Inc."

2. **Check Recently Viewed** before searching
   - Saves time if you've searched it before

3. **Bookmark Popular Stocks**
   - Add frequently analyzed stocks to your history

### Privacy & Data

- **Search history** is stored locally in browser cookies
- **No account** required
- **Auto-cleanup** after 90 days
- **Clear anytime** with the "Clear" button

### Mobile Usage

- All features work on mobile devices
- Touch-friendly interface
- Responsive dropdown menus

---

## Keyboard Shortcuts

- **Enter**: Submit search
- **Escape**: Close dropdown or dismiss error
- **Tab**: Navigate between elements

---

## Troubleshooting

### Search Not Working

**Issue**: Search doesn't return results

**Solutions**:
1. Check internet connection
2. Verify ticker spelling
3. Try using company name instead
4. Check if it's a US-listed stock
5. Clear browser cache and retry

### History Not Saving

**Issue**: Recently viewed stocks don't appear

**Solutions**:
1. Check if cookies are enabled in browser
2. Check if in incognito/private mode (cookies not saved)
3. Verify browser storage isn't full

### Slow Search

**Issue**: Search takes long time to validate

**Solutions**:
1. Check internet speed
2. Popular stocks load instantly (no validation needed)
3. Unknown tickers require API validation (1-2 seconds normal)

---

## Supported Stock Types

### ✅ Supported

- US-listed stocks (NYSE, NASDAQ)
- ETFs (e.g., SPY, QQQ, VTI)
- Major tech companies
- Financial institutions
- Healthcare companies
- Indices via ETFs

### ❌ Not Supported

- International stocks (non-US exchanges)
- OTC (Over-the-counter) stocks
- Cryptocurrencies
- Commodities
- Forex pairs

---

## FAQ

**Q: How many stocks can I search?**
A: Unlimited searches. History saves only last 10.

**Q: Is my search history private?**
A: Yes, stored only in your browser, never sent to servers.

**Q: Can I search international stocks?**
A: Currently only US-listed stocks are supported.

**Q: What happens to my history if I clear cookies?**
A: History will be deleted along with cookies.

**Q: Can I export my search history?**
A: Not currently available. Consider bookmarking stocks in your browser.

**Q: Does search work offline?**
A: Popular stocks load from cache. New tickers require internet connection.

**Q: How accurate is stock data?**
A: Data is fetched from Alpha Vantage and Yahoo Finance APIs, updated in real-time (5-minute delay for some data sources).

---

## Feature Roadmap

### Coming Soon

- Autocomplete suggestions from all US stocks
- Search analytics and popular searches
- Custom watchlists
- Multi-stock comparison
- International market support
- Voice search

---

## Support

For issues or feedback:
- Check this guide first
- Verify internet connection
- Try clearing browser cache
- Report persistent issues to development team

---

**Last Updated**: 2025-10-07
**Version**: 1.0
**Feature**: Universal Stock Search
