'use client';

import { useMemo } from 'react';
import { TradeRecord, StockPrice, PortfolioSummary as PortfolioSummaryType } from '@/types/portfolio';
import { calculatePortfolioSummary, formatCurrency, formatPercentage } from '@/lib/portfolioCalculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PortfolioSummaryProps {
  tradeHistory: TradeRecord[];
  livePrices: Map<string, StockPrice>;
}

export default function PortfolioSummary({ tradeHistory, livePrices }: PortfolioSummaryProps) {
  const portfolioData: PortfolioSummaryType | null = useMemo(() => {
    if (tradeHistory.length === 0) return null;
    return calculatePortfolioSummary(tradeHistory, livePrices);
  }, [tradeHistory, livePrices]);

  if (!portfolioData) {
    return (
      <Alert>
        <AlertDescription>
          Upload your trade history to see portfolio summary and metrics.
        </AlertDescription>
      </Alert>
    );
  }

  const { totalInvested, totalCurrentValue, totalPnL, totalPnLPercent, holdings } = portfolioData;

  return (
    <div className="space-y-6">
      {/* Overall Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invested</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {formatCurrency(totalInvested)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Value</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {formatCurrency(totalCurrentValue)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total P&L</CardDescription>
            <CardTitle className={`text-2xl font-bold ${
              totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Return</CardDescription>
            <CardTitle className={`text-2xl font-bold ${
              totalPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(totalPnLPercent)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Holdings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings Breakdown</CardTitle>
          <CardDescription>
            Individual stock positions and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <Alert>
              <AlertDescription>
                No current holdings found. This might indicate all positions have been sold or there are data issues.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {holdings.map((holding) => {
                const currentPrice = livePrices.get(holding.symbol);
                const hasLivePrice = !!currentPrice;
                
                return (
                  <div key={holding.symbol} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-bold text-lg">{holding.symbol}</h3>
                        {!hasLivePrice && (
                          <Badge variant="outline" className="text-xs">
                            No Live Price
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                        </div>
                        <div className={`text-sm ${
                          holding.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(holding.pnlPercent)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Quantity</div>
                        <div className="font-medium">{holding.quantity.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Avg Price</div>
                        <div className="font-medium">{formatCurrency(holding.averagePrice)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Invested</div>
                        <div className="font-medium">{formatCurrency(holding.investedValue)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Current Value</div>
                        <div className="font-medium">
                          {hasLivePrice ? formatCurrency(holding.currentValue) : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {hasLivePrice && (
                      <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                        <div>
                          Current Price: {formatCurrency(currentPrice!.price)}
                        </div>
                        <div className={`${
                          currentPrice!.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Today: {currentPrice!.changePercent >= 0 ? '+' : ''}{formatCurrency(currentPrice!.change)} 
                          ({formatPercentage(currentPrice!.changePercent)})
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Total Positions</div>
              <div className="font-bold text-lg">{holdings.length}</div>
            </div>
            <div>
              <div className="text-gray-500">Winning Positions</div>
              <div className="font-bold text-lg text-green-600">
                {holdings.filter(h => h.pnl > 0).length}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Losing Positions</div>
              <div className="font-bold text-lg text-red-600">
                {holdings.filter(h => h.pnl < 0).length}
              </div>
            </div>
          </div>
          
          {livePrices.size === 0 && (
            <Alert className="mt-4">
              <AlertDescription>
                Live price data is not available. Portfolio values are calculated using average cost basis. 
                Connect to live data feed for real-time portfolio valuation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
