'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Holding } from '@/types/portfolio';
import { formatCurrency, formatPercentage } from '@/lib/portfolioCalculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BarChartPnLProps {
  holdings: Holding[];
  title?: string;
  sortBy?: 'pnl' | 'pnlPercent' | 'symbol';
}

export default function BarChartPnL({ 
  holdings, 
  title = "Profit & Loss by Stock", 
  sortBy = 'pnl' 
}: BarChartPnLProps) {
  const chartData = useMemo(() => {
    if (holdings.length === 0) return [];

    let sortedHoldings = [...holdings];
    
    // Sort based on the sortBy parameter
    switch (sortBy) {
      case 'pnl':
        sortedHoldings.sort((a, b) => b.pnl - a.pnl);
        break;
      case 'pnlPercent':
        sortedHoldings.sort((a, b) => b.pnlPercent - a.pnlPercent);
        break;
      case 'symbol':
        sortedHoldings.sort((a, b) => a.symbol.localeCompare(b.symbol));
        break;
    }

    return sortedHoldings.map(holding => ({
      symbol: holding.symbol,
      pnl: holding.pnl,
      pnlPercent: holding.pnlPercent,
      invested: holding.investedValue,
      current: holding.currentValue,
      quantity: holding.quantity,
      avgPrice: holding.averagePrice,
      // For coloring bars
      isProfit: holding.pnl >= 0
    }));
  }, [holdings, sortBy]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const totalPnL = chartData.reduce((sum, item) => sum + item.pnl, 0);
    const winners = chartData.filter(item => item.pnl > 0);
    const losers = chartData.filter(item => item.pnl < 0);
    const breakeven = chartData.filter(item => item.pnl === 0);
    
    const biggestWinner = winners.length > 0 ? winners.reduce((max, item) => item.pnl > max.pnl ? item : max) : null;
    const biggestLoser = losers.length > 0 ? losers.reduce((min, item) => item.pnl < min.pnl ? item : min) : null;

    return {
      totalPnL,
      winners: winners.length,
      losers: losers.length,
      breakeven: breakeven.length,
      winRate: chartData.length > 0 ? (winners.length / chartData.length) * 100 : 0,
      biggestWinner,
      biggestLoser
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg min-w-48">
          <p className="font-bold text-lg mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>P&L:</span>
              <span className={`font-bold ${data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Return:</span>
              <span className={`font-bold ${data.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(data.pnlPercent)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Invested:</span>
              <span>{formatCurrency(data.invested)}</span>
            </div>
            <div className="flex justify-between">
              <span>Current:</span>
              <span>{formatCurrency(data.current)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shares:</span>
              <span>{data.quantity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Price:</span>
              <span>{formatCurrency(data.avgPrice)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, ...rest } = props;
    const isProfit = props.payload.pnl >= 0;
    return <Bar {...rest} fill={isProfit ? '#16a34a' : '#dc2626'} />;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Profit and loss breakdown by individual stocks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            No holdings data available for P&L analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {stats && (
            <div className="flex space-x-2">
              <Badge variant={stats.totalPnL >= 0 ? "default" : "destructive"}>
                Total: {stats.totalPnL >= 0 ? '+' : ''}{formatCurrency(stats.totalPnL)}
              </Badge>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Individual stock performance and profit/loss analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistics Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-500">Winners</div>
              <div className="font-bold text-lg text-green-600">{stats.winners}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Losers</div>
              <div className="font-bold text-lg text-red-600">{stats.losers}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Win Rate</div>
              <div className="font-bold text-lg">{stats.winRate.toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Breakeven</div>
              <div className="font-bold text-lg text-gray-600">{stats.breakeven}</div>
            </div>
          </div>
        )}

        {/* Bar Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="symbol" 
                stroke="#666"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1000) {
                    return `$${(value / 1000).toFixed(0)}K`;
                  }
                  return `$${value.toFixed(0)}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
              <Bar 
                dataKey="pnl" 
                shape={<CustomBar />}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best and Worst Performers */}
        {stats && (stats.biggestWinner || stats.biggestLoser) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.biggestWinner && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Best Performer</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold">{stats.biggestWinner.symbol}</span>
                    <span className="font-bold text-green-600">
                      +{formatCurrency(stats.biggestWinner.pnl)}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Return:</span>
                    <span>{formatPercentage(stats.biggestWinner.pnlPercent)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Investment:</span>
                    <span>{formatCurrency(stats.biggestWinner.invested)}</span>
                  </div>
                </div>
              </div>
            )}

            {stats.biggestLoser && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Worst Performer</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold">{stats.biggestLoser.symbol}</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(stats.biggestLoser.pnl)}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-700">
                    <span>Return:</span>
                    <span>{formatPercentage(stats.biggestLoser.pnlPercent)}</span>
                  </div>
                  <div className="flex justify-between text-red-700">
                    <span>Investment:</span>
                    <span>{formatCurrency(stats.biggestLoser.invested)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>Profitable Positions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span>Loss-making Positions</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
