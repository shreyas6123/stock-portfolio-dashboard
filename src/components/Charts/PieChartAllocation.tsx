'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Holding } from '@/types/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/portfolioCalculations';

interface PieChartAllocationProps {
  holdings: Holding[];
  title?: string;
  showLegend?: boolean;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
  '#87D068', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'
];

export default function PieChartAllocation({ 
  holdings, 
  title = "Portfolio Allocation", 
  showLegend = true 
}: PieChartAllocationProps) {
  const chartData = useMemo(() => {
    if (holdings.length === 0) return [];

    const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    
    return holdings
      .filter(holding => holding.currentValue > 0)
      .map((holding, index) => ({
        name: holding.symbol,
        value: holding.currentValue,
        percentage: totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0,
        color: COLORS[index % COLORS.length],
        quantity: holding.quantity,
        avgPrice: holding.averagePrice
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-600">
            Value: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            Allocation: {formatPercentage(data.percentage)}
          </p>
          <p className="text-sm text-gray-600">
            Shares: {data.quantity.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Avg Price: {formatCurrency(data.avgPrice)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null; // Don't show labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${percentage.toFixed(1)}%`}
      </text>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Portfolio allocation by stock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            No data available for portfolio allocation
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
          Portfolio allocation by stock ({chartData.length} positions)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.color }}>
                      {value} ({formatPercentage(entry.payload.percentage)})
                    </span>
                  )}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Top Holdings Summary */}
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Top Holdings:</h4>
          {chartData.slice(0, 5).map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <div>{formatCurrency(item.value)}</div>
                <div className="text-xs text-gray-500">
                  {formatPercentage(item.percentage)}
                </div>
              </div>
            </div>
          ))}
          {chartData.length > 5 && (
            <div className="text-xs text-gray-500 pt-1">
              ... and {chartData.length - 5} more positions
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
