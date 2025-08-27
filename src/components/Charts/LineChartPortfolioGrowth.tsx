'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TradeRecord, StockPrice } from '@/types/portfolio';
import { calculatePortfolioGrowthOverTime, formatCurrency } from '@/lib/portfolioCalculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LineChartPortfolioGrowthProps {
  tradeHistory: TradeRecord[];
  livePrices: Map<string, StockPrice>;
  title?: string;
}

export default function LineChartPortfolioGrowth({ 
  tradeHistory, 
  livePrices, 
  title = "Portfolio Growth Over Time" 
}: LineChartPortfolioGrowthProps) {
  const chartData = useMemo(() => {
    if (tradeHistory.length === 0) return [];
    
    const growthData = calculatePortfolioGrowthOverTime(tradeHistory, livePrices);
    
    // Format dates for better display
    return growthData.map(item => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }));
  }, [tradeHistory, livePrices]);

  const portfolioStats = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const firstValue = chartData[0]?.value || 0;
    const lastValue = chartData[chartData.length - 1]?.value || 0;
    const maxValue = Math.max(...chartData.map(d => d.value));
    const minValue = Math.min(...chartData.map(d => d.value));
    
    const totalGrowth = lastValue - firstValue;
    const totalGrowthPercent = firstValue > 0 ? (totalGrowth / firstValue) * 100 : 0;
    
    return {
      firstValue,
      lastValue,
      maxValue,
      minValue,
      totalGrowth,
      totalGrowthPercent,
      dataPoints: chartData.length
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-blue-600">
            Portfolio Value: {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Track your portfolio value over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            No trade history available to show portfolio growth
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Portfolio value progression based on trade history and current prices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Portfolio Statistics */}
        {portfolioStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-500">Starting Value</div>
              <div className="font-bold text-lg">
                {formatCurrency(portfolioStats.firstValue)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Current Value</div>
              <div className="font-bold text-lg">
                {formatCurrency(portfolioStats.lastValue)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Total Growth</div>
              <div className={`font-bold text-lg ${
                portfolioStats.totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolioStats.totalGrowth >= 0 ? '+' : ''}{formatCurrency(portfolioStats.totalGrowth)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Total Return</div>
              <div className={`font-bold text-lg ${
                portfolioStats.totalGrowthPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolioStats.totalGrowthPercent >= 0 ? '+' : ''}{portfolioStats.totalGrowthPercent.toFixed(2)}%
              </div>
            </div>
          </div>
        )}

        {/* Line Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="formattedDate" 
                stroke="#666"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Information */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-blue-600 font-medium">Peak Value</div>
            <div className="text-lg font-bold text-blue-800">
              {formatCurrency(portfolioStats?.maxValue || 0)}
            </div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-red-600 font-medium">Lowest Value</div>
            <div className="text-lg font-bold text-red-800">
              {formatCurrency(portfolioStats?.minValue || 0)}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-gray-600 font-medium">Data Points</div>
            <div className="text-lg font-bold text-gray-800">
              {portfolioStats?.dataPoints || 0} trades
            </div>
          </div>
        </div>

        {livePrices.size === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Portfolio values are calculated using average cost basis since live price data is not available. 
              Connect to live data feed for real-time portfolio valuation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
