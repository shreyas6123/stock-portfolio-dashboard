# Stock Portfolio Dashboard

A full-featured stock portfolio dashboard built with Next.js 15+, TypeScript, and modern UI components. Track your investments, analyze performance, and monitor real-time stock prices with interactive charts and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **Real-time Stock Data**: WebSocket integration for live price updates
- **Trade History Upload**: CSV file parsing with flexible column mapping
- **Portfolio Analytics**: Automatic P&L calculations and performance metrics
- **Interactive Charts**: Pie charts, line graphs, and bar charts for data visualization
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui components

### Analytics & Insights
- **Portfolio Summary**: Total invested, current value, P&L, and percentage returns
- **Holdings Breakdown**: Individual stock positions with detailed metrics
- **Allocation Analysis**: Visual representation of portfolio distribution
- **Growth Tracking**: Historical portfolio value progression
- **Performance Analysis**: Stock-wise profit/loss breakdown with win/loss ratios

### Technical Features
- **TypeScript**: Full type safety and IntelliSense support
- **WebSocket Support**: Real-time data with automatic reconnection
- **Error Handling**: Graceful error management and user feedback
- **Data Persistence**: Local storage for trade history
- **Mock Data Mode**: Demo functionality without external dependencies

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Modern web browser with WebSocket support

## 🛠️ Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd stock-portfolio-dashboard
   npm install
   ```

2. **Environment Configuration** (Optional)
   Create a `.env.local` file in the root directory:
   ```env
   # WebSocket URL for live stock data (optional)
   NEXT_PUBLIC_WEBSOCKET_URL=ws://your-websocket-server.com/ws
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## 🎯 Usage Guide

### Getting Started

1. **Access the Dashboard**
   - Navigate to `http://localhost:3000`
   - You'll be automatically redirected to the dashboard

2. **Demo Mode**
   - Toggle "Demo Mode" ON to use mock stock data
   - Perfect for testing without external WebSocket connections

3. **Upload Trade History**
   - Prepare your trade data in CSV format
   - Use the upload component to import your trades
   - The system automatically calculates holdings and P&L

### CSV Format Requirements

Your CSV file should include these columns (flexible naming):

```csv
date,symbol,quantity,price,type
2024-01-15,AAPL,100,150.50,buy
2024-01-20,GOOGL,50,2800.00,buy
2024-02-01,AAPL,50,155.00,sell
```

**Supported Column Variations:**
- **Date**: `date`, `trade_date`, `transaction_date`, `dt`
- **Symbol**: `symbol`, `stock`, `ticker`, `stock_symbol`
- **Quantity**: `quantity`, `qty`, `shares`, `units`
- **Price**: `price`, `rate`, `unit_price`, `share_price`
- **Type**: `type`, `transaction_type`, `side`, `buy_sell`, `action`

**Supported Values:**
- **Date Formats**: YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY
- **Transaction Types**: buy, sell, b, s, purchase, sale, long, short

### Live Data Integration

To connect real WebSocket data:

1. **Disable Demo Mode**: Toggle off "Demo Mode" in the dashboard
2. **Configure WebSocket URL**: Set `NEXT_PUBLIC_WEBSOCKET_URL` in `.env.local`
3. **WebSocket Message Format**: Your WebSocket should send messages in this format:
   ```json
   {
     "type": "price_update",
     "data": {
       "symbol": "AAPL",
       "price": 150.25,
       "change": 2.50,
       "changePercent": 1.69,
       "timestamp": 1640995200000
     }
   }
   ```

## 📊 Dashboard Components

### Stock Ticker
- Horizontal scrolling ticker with live prices
- Real-time connection status indicator
- Hover to pause scrolling

### Portfolio Summary
- Total invested amount and current value
- Overall P&L with percentage returns
- Individual holdings breakdown
- Performance statistics

### Interactive Charts
1. **Pie Chart**: Portfolio allocation by stock
2. **Line Chart**: Portfolio growth over time
3. **Bar Chart**: Stock-wise P&L analysis

### Trade History Upload
- Drag-and-drop CSV upload
- Real-time parsing with error feedback
- Sample CSV download
- Data validation and error reporting

## 🏗️ Project Structure

```
src/
├── app/
│   ├── dashboard/page.tsx     # Main dashboard page
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
├── components/
│   ├── Charts/               # Chart components
│   │   ├── PieChartAllocation.tsx
│   │   ├── LineChartPortfolioGrowth.tsx
│   │   └── BarChartPnL.tsx
│   ├── ui/                   # shadcn/ui components
│   ├── StockTicker.tsx       # Live stock ticker
│   ├── TradeHistoryUpload.tsx # CSV upload component
│   └── PortfolioSummary.tsx  # Portfolio metrics
├── lib/
│   ├── websocket.ts          # WebSocket management
│   ├── portfolioCalculations.ts # Portfolio math
│   └── utils.ts              # Utility functions
├── types/
│   └── portfolio.ts          # TypeScript interfaces
└── utils/
    └── csvParser.ts          # CSV parsing logic
```

## 🔧 Configuration

### WebSocket Integration
The dashboard supports real-time data through WebSocket connections. Configure your WebSocket server to send price updates in the expected format.

### Error Handling
- Graceful WebSocket disconnection handling
- CSV parsing error reporting
- Network failure recovery
- User-friendly error messages

### Data Persistence
- Trade history is automatically saved to localStorage
- Data persists between browser sessions
- Manual data clearing option available

## 🚀 Production Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

3. **Environment Variables**
   Set production WebSocket URLs and any required API keys

## 🛠️ Development

### Core Dependencies
- **Framework**: Next.js 15+ with TypeScript
- **UI Components**: shadcn/ui, Radix UI primitives
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: React hooks
- **File Processing**: Native FileReader API

### Development Tools
- **Linting**: ESLint with TypeScript support
- **Type Checking**: TypeScript compiler
- **Hot Reload**: Next.js development server
- **Build Tool**: Turbopack for faster builds

## 📈 Performance Features

- **Optimized Rendering**: React.memo and useMemo for expensive calculations
- **Efficient Updates**: Selective re-rendering based on data changes
- **Memory Management**: Proper cleanup of WebSocket connections
- **Responsive Design**: Mobile-first approach with breakpoint optimization

## 🔒 Security Considerations

- **Client-side Only**: No sensitive data stored on servers
- **Local Storage**: Trade data remains in browser
- **WebSocket Security**: Supports secure WebSocket connections (wss://)
- **Input Validation**: Comprehensive CSV data validation

## 🆘 Troubleshooting

### Common Issues

**WebSocket Connection Failed**
- Check your WebSocket URL in `.env.local`
- Verify the WebSocket server is running
- Try using Demo Mode for testing

**CSV Upload Errors**
- Ensure your CSV has the required columns
- Check date formats are supported
- Verify numeric values for price and quantity

**Charts Not Displaying**
- Ensure you have uploaded trade history
- Check that live price data is available
- Verify holdings have positive values

**Performance Issues**
- Large trade histories (>1000 records) may impact performance
- Consider filtering data by date range
- Use Demo Mode for testing with smaller datasets

## 🎮 Quick Start Demo

1. **Run the application**: `npm run dev`
2. **Enable Demo Mode**: Toggle "Demo Mode" ON in the dashboard
3. **Download Sample CSV**: Click "Download Sample" in the upload section
4. **Upload the sample**: Use the sample CSV to see the dashboard in action
5. **Explore Features**: Navigate through charts, summary, and analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

---

For additional support, please check the documentation or create an issue in the repository.
