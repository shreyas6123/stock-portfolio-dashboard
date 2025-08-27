'use client';

import { useState, useEffect } from 'react';
import { TradeRecord, StockPrice } from '@/types/portfolio';
import { getWebSocketManager, MockWebSocketManager } from '@/lib/websocket';
import { calculatePortfolioSummary } from '@/lib/portfolioCalculations';

// Components
import StockTicker from '@/components/StockTicker';
import TradeHistoryUpload from '@/components/TradeHistoryUpload';
import PortfolioSummary from '@/components/PortfolioSummary';
import PieChartAllocation from '@/components/Charts/PieChartAllocation';
import LineChartPortfolioGrowth from '@/components/Charts/LineChartPortfolioGrowth';
import BarChartPnL from '@/components/Charts/BarChartPnL';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function DashboardPage() {
  // State management
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [livePrices, setLivePrices] = useState<Map<string, StockPrice>>(new Map());
  const [useMockData, setUseMockData] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // Auto-refresh interval (every 2 minutes for real data, every 2 seconds for mock)
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        setLastUpdated(new Date());
      }
    }, useMockData ? 2000 : 120000);

    return () => clearInterval(interval);
  }, [connectionStatus, useMockData]);

  // WebSocket connection management
  useEffect(() => {
    const wsManager = useMockData ? new MockWebSocketManager() : getWebSocketManager();

    // Subscribe to price updates
    const unsubscribePrice = wsManager.subscribe((stockPrice: StockPrice) => {
      setLivePrices(prev => new Map(prev.set(stockPrice.symbol, stockPrice)));
      setLastUpdated(new Date());
    });

    // Subscribe to connection status
    const unsubscribeStatus = wsManager.subscribeToStatus((status) => {
      setConnectionStatus(status);
    });

    // Connect to WebSocket
    wsManager.connect().catch((err) => {
      console.error('Failed to connect to WebSocket:', err);
    });

    // Cleanup on unmount
    return () => {
      unsubscribePrice();
      unsubscribeStatus();
      if (useMockData) {
        wsManager.disconnect();
      }
    };
  }, [useMockData]);

  // Calculate portfolio summary
  const portfolioSummary = tradeHistory.length > 0 ? calculatePortfolioSummary(tradeHistory, livePrices) : null;

  // Handle trade history upload
  const handleTradeUpload = (trades: TradeRecord[]) => {
    setTradeHistory(trades);
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('portfolio_trades', JSON.stringify(trades));
    } catch (error) {
      console.warn('Failed to save trades to localStorage:', error);
    }
  };

  // Load trades from localStorage on mount
  useEffect(() => {
    try {
      const savedTrades = localStorage.getItem('portfolio_trades');
      if (savedTrades) {
        const trades = JSON.parse(savedTrades);
        setTradeHistory(trades);
      }
    } catch (error) {
      console.warn('Failed to load trades from localStorage:', error);
    }
  }, []);

  // Toggle between mock and real data
  const handleDataSourceToggle = (checked: boolean) => {
    setUseMockData(checked);
    setLivePrices(new Map()); // Clear existing prices
    setConnectionStatus('disconnected');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Portfolio Dashboard</h1>
              <p className="text-sm text-gray-500">
                Real-time portfolio tracking and analysis
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <div className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="data-source" className="text-sm">
                  Demo Mode
                </Label>
                <Switch
                  id="data-source"
                  checked={useMockData}
                  onCheckedChange={handleDataSourceToggle}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Ticker */}
      <StockTicker useMockData={useMockData} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Upload Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TradeHistoryUpload 
                onUpload={handleTradeUpload}
                currentTrades={tradeHistory}
              />
            </div>
            
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Connection Status</span>
                  <Badge variant={
                    connectionStatus === 'connected' ? 'default' : 
                    connectionStatus === 'connecting' ? 'secondary' : 
                    'destructive'
                  }>
                    {connectionStatus}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Live Prices</span>
                  <span className="font-medium">{livePrices.size} stocks</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Trade Records</span>
                  <span className="font-medium">{tradeHistory.length}</span>
                </div>
                
                {portfolioSummary && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Holdings</span>
                    <span className="font-medium">{portfolioSummary.holdings.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Summary */}
          {tradeHistory.length > 0 ? (
            <PortfolioSummary 
              tradeHistory={tradeHistory}
              livePrices={livePrices}
            />
          ) : (
            <Alert>
              <AlertDescription>
                Welcome to your Portfolio Dashboard! Upload your trade history CSV file to get started with portfolio analysis, 
                P&L calculations, and interactive charts.
              </AlertDescription>
            </Alert>
          )}

          {/* Charts Section */}
          {portfolioSummary && portfolioSummary.holdings.length > 0 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart - Portfolio Allocation */}
                <PieChartAllocation holdings={portfolioSummary.holdings} />
                
                {/* Bar Chart - P&L Analysis */}
                <BarChartPnL holdings={portfolioSummary.holdings} />
              </div>

              {/* Line Chart - Portfolio Growth (Full Width) */}
              <LineChartPortfolioGrowth 
                tradeHistory={tradeHistory}
                livePrices={livePrices}
              />
            </div>
          )}

          {/* Instructions Card */}
          {tradeHistory.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Follow these steps to set up your portfolio dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Prepare Your Trade Data</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Export your trade history from your broker as a CSV file with columns: date, symbol, quantity, price, type (buy/sell).
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Upload Trade History</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Use the upload component above to import your CSV file. The system will automatically calculate your holdings and P&L.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Connect Live Data</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Toggle off "Demo Mode" and configure your WebSocket URL in the environment variables for real-time price updates.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Analyze Your Portfolio</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        View detailed analytics including allocation charts, P&L analysis, and portfolio growth over time.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
