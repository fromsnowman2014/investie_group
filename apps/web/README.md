# Investie Frontend

Modern investment analysis platform built with Next.js 14+ and TradingView widgets.

## 🚀 Features

- **TradingView Integration**: Real-time stock charts, technical analysis, and market data
- **Responsive Design**: Mobile-first design that works on all devices
- **Stock Search & Selection**: Interactive search and dropdown for stock selection
- **Real-time Updates**: Live stock data from backend API
- **Modern UI**: Clean, professional interface with gradient branding

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Custom CSS
- **Language**: TypeScript
- **State Management**: React Context API
- **Charts**: TradingView Widgets
- **API**: REST API integration with NestJS backend

## 📦 Installation

```bash
# Install dependencies (from root)
npm install

# Start development server
npm run frontend:dev

# Or run directly in this directory
cd apps/web
npm run dev
```

## 🌐 Environment Variables

Create `.env.local` in the `apps/web` directory:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For production, update to your deployed backend URL:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set the root directory to `apps/web`
3. Add environment variable `NEXT_PUBLIC_API_URL`
4. Deploy!

### Manual Build

```bash
# Build the application
npm run frontend:build

# Start production server
npm run frontend:start
```

## 📱 Responsive Breakpoints

- **Desktop**: 1080px max-width, 2-column grid
- **Mobile**: < 800px, single column layout
- **Components**: Adaptive sizing based on viewport

## 🔧 Configuration

### TradingView Widgets

The app includes these TradingView widgets:
- Ticker Tape (market indices and crypto)
- Symbol Info (current stock details)
- Technical Analysis (RSI, moving averages)
- Advanced Chart (interactive price chart)
- Company Profile (fundamental data)
- Financial Data (earnings, metrics)
- Top Stories (news timeline)

### Stock Symbols

Currently supports these stocks:
- AAPL, TSLA, MSFT, GOOGL, AMZN
- NVDA, META, NFLX, AVGO, AMD

## 🔗 API Integration

The frontend connects to the Investie backend API:

- `GET /api/v1/stocks` - All stock data
- `GET /api/v1/stocks/:symbol` - Individual stock
- `GET /api/v1/stocks/:symbol/chart` - Chart data
- `GET /api/v1/market/overview` - Market summary

## 🎨 Styling

- Custom CSS variables for consistent spacing
- Blue gradient branding (`#00bce5` to `#2962ff`)
- System font stack for optimal performance
- Dark/light theme support (TradingView widgets)

## 🧪 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── components/       # React components
│   │   │   ├── TradingView/  # TradingView widgets
│   │   │   ├── Header.tsx    # Navigation header
│   │   │   └── Footer.tsx    # Site footer
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── lib/
│   │   └── api.ts           # API client
│   └── types/
│       └── api.ts           # TypeScript types
├── public/                   # Static assets
├── vercel.json              # Vercel config
└── package.json
```
