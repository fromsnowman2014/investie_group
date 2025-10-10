# Widget Layout System - Quick Start Guide

## 🚀 Getting Started

The customizable widget layout system is **already implemented and running**!

### View the App
1. Start the development server (if not already running):
   ```bash
   cd apps/web
   npm run dev
   ```

2. Open your browser:
   ```
   http://localhost:3000
   ```

3. You'll see the new dashboard with draggable widgets!

---

## 🎮 User Guide

### Basic Operations

#### 1. **Drag Widget**
- Hover over any widget header
- Click and drag the header area
- Drop to new position
- Layout auto-saves

#### 2. **Resize Widget**
- Hover over widget corner (bottom-right)
- Look for resize cursor
- Drag to resize
- Respects minimum/maximum sizes

#### 3. **Lock Widget Position**
- Click lock icon (🔓) in widget header
- Widget becomes locked (🔒)
- Prevents accidental moves
- Click again to unlock

#### 4. **Remove Widget**
- Click ✕ button in widget header
- Widget disappears from dashboard
- Can be added back later

#### 5. **Add Widget**
- Click "➕ Add Widget" button (bottom-right corner)
- Browse widget gallery
- Filter by category (optional)
- Click "+ Add" on desired widget

#### 6. **Export Layout**
- Click "💾 Export" button
- JSON file downloads automatically
- Share with team or save as backup

#### 7. **Import Layout**
- Click "📥 Import" button
- Select JSON file
- Layout updates immediately

#### 8. **Reset to Default**
- Click "🔄 Reset" button
- Confirm action
- All widgets restored to original positions

---

## 🎨 Available Widgets

### AI Analysis
- **AI Investment Opinion** (🤖) - AI-powered investment recommendations
  - Size: Large (full width)
  - Requires stock symbol

### Market Data
- **Stock Profile** (📊) - Company overview and key metrics
  - Size: Medium (half width)
  - Requires stock symbol

- **Macro Indicators** (📈) - Economic indicators and market overview
  - Size: Medium (half width)
  - Always visible (no symbol required)

### Risk Indicators (NEW!)
- **Market Bubble Detector** (🫧) - AI-powered market bubble risk assessment
  - Size: Large (full width)
  - Always visible (no symbol required)
  - Shows: Risk score, Shiller P/E, Market Cap/GDP, VIX, Sentiment
  - *Note: Currently shows placeholder data*

### News
- **AI News Analysis** (📰) - AI-analyzed news and sentiment
  - Size: Large (full width)
  - Requires stock symbol

- **Top Stories** (📃) - Top news stories
  - Size: Small (1/3 width)
  - Requires stock symbol

### Charts
- **Advanced Chart** (📉) - TradingView advanced charting
  - Size: Tall (half width, 2 rows)
  - Requires stock symbol

- **Technical Analysis** (🔧) - Technical indicators and analysis
  - Size: Tall (half width, 2 rows)
  - Requires stock symbol

### Fundamentals
- **Company Profile** (🏢) - Company profile widget
  - Size: Small (1/3 width)
  - Requires stock symbol

- **Fundamental Data** (💰) - Fundamental data and metrics
  - Size: Small (1/3 width)
  - Requires stock symbol

---

## 💡 Pro Tips

### Layout Optimization
1. **Keep frequently used widgets at top** - Easier to see without scrolling
2. **Group related widgets** - Put charts together, fundamentals together
3. **Lock important widgets** - Prevent accidental moves of key data
4. **Use full width for summaries** - AI Opinion and News Analysis work best full width
5. **Side-by-side charts** - Put Advanced Chart and Technical Analysis side-by-side

### Workflow Examples

#### Day Trader Layout
```
Row 1: Stock Profile (left) + Macro Indicators (right)
Row 2: Advanced Chart (left, tall) + Technical Analysis (right, tall)
Row 3: AI News Analysis (full width)
Row 4: Company Profile + Fundamental Data + Top Stories
```

#### Long-Term Investor Layout
```
Row 1: AI Investment Opinion (full width)
Row 2: Market Bubble Detector (full width)
Row 3: Stock Profile (left) + Macro Indicators (right)
Row 4: Fundamental Data (left) + Company Profile (middle) + Top Stories (right)
Row 5: AI News Analysis (full width)
```

#### Risk-Focused Layout
```
Row 1: Market Bubble Detector (full width)
Row 2: Macro Indicators (left) + Stock Profile (right)
Row 3: Technical Analysis (left, tall) + Advanced Chart (right, tall)
Row 4: AI News Analysis (full width)
```

---

## 🔧 Troubleshooting

### Layout Not Saving
- **Check browser storage**: Make sure LocalStorage is enabled
- **Try export/import**: Export current layout and re-import
- **Clear cache**: If corrupted, reset to default

### Widget Not Loading
- **Check network tab**: Ensure API calls succeed
- **Refresh page**: Sometimes lazy loading needs retry
- **Check console**: Look for JavaScript errors

### Drag Not Working
- **Check if locked**: Unlock widget first
- **Try different browser**: Test in Chrome/Edge
- **Clear browser cache**: Old CSS might interfere

### Layout Looks Wrong
- **Try reset**: Click Reset button to restore default
- **Check viewport**: Some layouts work better on larger screens
- **Zoom level**: Make sure browser zoom is at 100%

---

## 🎯 Keyboard Shortcuts (Future)
Currently not implemented, planned for future release:
- `Ctrl/Cmd + S` - Save layout
- `Ctrl/Cmd + Z` - Undo last change
- `Ctrl/Cmd + R` - Reset layout
- `Ctrl/Cmd + E` - Export layout
- `Ctrl/Cmd + I` - Import layout
- `Space` - Toggle lock on selected widget
- `Delete` - Remove selected widget

---

## 📱 Mobile Support

The widget system works on mobile devices but is optimized for desktop. Mobile features:
- ✅ Touch drag & drop works
- ✅ Responsive grid adjusts
- ✅ All widgets accessible
- ⚠️ Better experience on tablets/desktop
- 🔄 Enhanced touch support coming soon

---

## 🆘 Need Help?

1. **Check Implementation Plan**: `docs/customizable-widget-layout-implementation-plan.md`
2. **Read Summary**: `docs/widget-layout-implementation-summary.md`
3. **Inspect Code**: `apps/web/src/app/components/Dashboard/`
4. **Check Types**: `apps/web/src/lib/widgets/types.ts`

---

## 🎉 Enjoy Your Customizable Dashboard!

The system is designed to grow with your needs. Start with the default layout and customize as you learn which widgets are most valuable for your workflow.

**Happy Trading!** 📈
