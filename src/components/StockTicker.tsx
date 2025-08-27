'use client';

import { useState, useEffect } from 'react';
import { StockPrice } from '@/types/portfolio';
import { getWebSocketManager, MockWebSocketManager } from '@/lib/websocket';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatPercentage } from '@/lib/portfolioCalculations';

interface StockTickerProps {
  useMockData?: boolean;
}

export default function StockTicker({ useMockData = false }: StockTickerProps) {
  const [stockPrices, setStockPrices] = useState<Map<string, StockPrice>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const wsManager = useMockData ? new MockWebSocketManager() : getWebSocketManager();

    // Subscribe to price updates
    const unsubscribePrice = wsManager.subscribe((stockPrice: StockPrice) => {
      setStockPrices(prev => new Map(prev.set(stockPrice.symbol, stockPrice)));
    });

    // Subscribe to connection status
    const unsubscribeStatus = wsManager.subscribeToStatus((status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        setError(null);
      }
    });

    // Subscribe to errors
    const unsubscribeError = wsManager.subscribeToErrors((errorMessage) => {
      setError(errorMessage);
    });

    // Connect to WebSocket
    wsManager.connect().catch((err) => {
      console.error('Failed to connect to WebSocket:', err);
      setError('Failed to connect to live data feed');
    });

    // Cleanup on unmount
    return () => {
      unsubscribePrice();
      unsubscribeStatus();
      unsubscribeError();
      if (useMockData) {
        wsManager.disconnect();
      }
    };
  }, [useMockData]);

  const stockArray = Array.from(stockPrices.values());

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertDescription>
          {error} {useMockData ? '(Using mock data)' : '(Check WebSocket connection)'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="bg-black text-white py-3 mb-6 overflow-hidden">
      <div className="flex items-center space-x-2 mb-2 px-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 
            'bg-red-500'
          }`} />
          <span className="text-sm font-medium">
            {connectionStatus === 'connected' ? 'Live Data' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 
             'Disconnected'}
          </span>
          {useMockData && (
            <span className="text-xs text-gray-400">(Demo Mode)</span>
          )}
        </div>
      </div>
      
      {stockArray.length > 0 ? (
        <div className="relative">
          <div className="animate-scroll flex space-x-8 whitespace-nowrap">
            {stockArray.concat(stockArray).map((stock, index) => (
              <div key={`${stock.symbol}-${index}`} className="flex items-center space-x-4 px-4">
                <span className="font-bold text-lg">{stock.symbol}</span>
                <span className="text-lg">{formatCurrency(stock.price)}</span>
                <span className={`text-sm font-medium ${
                  stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}
                </span>
                <span className={`text-sm ${
                  stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(stock.changePercent)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 text-gray-400">
          {connectionStatus === 'connecting' ? 'Loading stock data...' : 'No stock data available'}
        </div>
      )}
      
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
