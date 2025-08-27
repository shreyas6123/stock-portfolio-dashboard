import { TradeRecord, Holding, PortfolioSummary, StockPrice } from '@/types/portfolio';

export function calculateHoldings(tradeHistory: TradeRecord[]): Map<string, { quantity: number; totalCost: number; trades: TradeRecord[] }> {
  const holdings = new Map<string, { quantity: number; totalCost: number; trades: TradeRecord[] }>();

  tradeHistory.forEach(trade => {
    const existing = holdings.get(trade.symbol) || { quantity: 0, totalCost: 0, trades: [] };
    
    if (trade.transactionType === 'buy') {
      existing.quantity += trade.quantity;
      existing.totalCost += trade.quantity * trade.price;
    } else if (trade.transactionType === 'sell') {
      // For sells, we reduce quantity but also reduce cost proportionally
      const sellValue = trade.quantity * trade.price;
      const avgCostPerShare = existing.quantity > 0 ? existing.totalCost / existing.quantity : 0;
      const costToReduce = trade.quantity * avgCostPerShare;
      
      existing.quantity -= trade.quantity;
      existing.totalCost -= costToReduce;
      
      // If quantity goes negative, it means we sold more than we had
      if (existing.quantity < 0) {
        console.warn(`Warning: Negative quantity for ${trade.symbol}. This might indicate short selling or data issues.`);
      }
    }
    
    existing.trades.push(trade);
    holdings.set(trade.symbol, existing);
  });

  // Filter out holdings with zero or negative quantities
  const filteredHoldings = new Map();
  holdings.forEach((value, key) => {
    if (value.quantity > 0) {
      filteredHoldings.set(key, value);
    }
  });

  return filteredHoldings;
}

export function calculateAveragePrice(symbol: string, trades: TradeRecord[]): number {
  const symbolTrades = trades.filter(trade => trade.symbol === symbol && trade.transactionType === 'buy');
  
  if (symbolTrades.length === 0) return 0;
  
  const totalQuantity = symbolTrades.reduce((sum, trade) => sum + trade.quantity, 0);
  const totalValue = symbolTrades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
  
  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}

export function calculateInvestedValue(tradeHistory: TradeRecord[]): number {
  return tradeHistory
    .filter(trade => trade.transactionType === 'buy')
    .reduce((total, trade) => total + (trade.quantity * trade.price), 0);
}

export function calculateCurrentValue(livePrices: Map<string, StockPrice>, holdings: Map<string, { quantity: number; totalCost: number; trades: TradeRecord[] }>): number {
  let totalValue = 0;
  
  holdings.forEach((holding, symbol) => {
    const currentPrice = livePrices.get(symbol);
    if (currentPrice && holding.quantity > 0) {
      totalValue += holding.quantity * currentPrice.price;
    }
  });
  
  return totalValue;
}

export function calculatePnL(investedValue: number, currentValue: number): { absolute: number; percentage: number } {
  const absolute = currentValue - investedValue;
  const percentage = investedValue > 0 ? (absolute / investedValue) * 100 : 0;
  
  return {
    absolute: Math.round(absolute * 100) / 100,
    percentage: Math.round(percentage * 100) / 100
  };
}

export function calculatePortfolioSummary(
  tradeHistory: TradeRecord[], 
  livePrices: Map<string, StockPrice>
): PortfolioSummary {
  const holdings = calculateHoldings(tradeHistory);
  const totalInvested = calculateInvestedValue(tradeHistory);
  const totalCurrentValue = calculateCurrentValue(livePrices, holdings);
  const pnl = calculatePnL(totalInvested, totalCurrentValue);
  
  const holdingsArray: Holding[] = [];
  
  holdings.forEach((holding, symbol) => {
    const currentPrice = livePrices.get(symbol);
    const averagePrice = holding.quantity > 0 ? holding.totalCost / holding.quantity : 0;
    const currentValue = currentPrice ? holding.quantity * currentPrice.price : 0;
    const investedValue = holding.totalCost;
    const stockPnL = calculatePnL(investedValue, currentValue);
    
    holdingsArray.push({
      symbol,
      quantity: holding.quantity,
      averagePrice: Math.round(averagePrice * 100) / 100,
      investedValue: Math.round(investedValue * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      pnl: stockPnL.absolute,
      pnlPercent: stockPnL.percentage
    });
  });
  
  // Sort holdings by current value (descending)
  holdingsArray.sort((a, b) => b.currentValue - a.currentValue);
  
  return {
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
    totalPnL: pnl.absolute,
    totalPnLPercent: pnl.percentage,
    holdings: holdingsArray
  };
}

export function calculatePortfolioGrowthOverTime(tradeHistory: TradeRecord[], livePrices: Map<string, StockPrice>): { date: string; value: number }[] {
  if (tradeHistory.length === 0) return [];
  
  // Sort trades by date
  const sortedTrades = [...tradeHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const growthData: { date: string; value: number }[] = [];
  const holdings = new Map<string, { quantity: number; totalCost: number }>();
  
  // Group trades by date
  const tradesByDate = new Map<string, TradeRecord[]>();
  sortedTrades.forEach(trade => {
    const trades = tradesByDate.get(trade.date) || [];
    trades.push(trade);
    tradesByDate.set(trade.date, trades);
  });
  
  // Calculate portfolio value for each date
  const dates = Array.from(tradesByDate.keys()).sort();
  
  dates.forEach(date => {
    const dayTrades = tradesByDate.get(date) || [];
    
    // Update holdings with day's trades
    dayTrades.forEach(trade => {
      const existing = holdings.get(trade.symbol) || { quantity: 0, totalCost: 0 };
      
      if (trade.transactionType === 'buy') {
        existing.quantity += trade.quantity;
        existing.totalCost += trade.quantity * trade.price;
      } else {
        const avgCostPerShare = existing.quantity > 0 ? existing.totalCost / existing.quantity : 0;
        const costToReduce = trade.quantity * avgCostPerShare;
        
        existing.quantity -= trade.quantity;
        existing.totalCost -= costToReduce;
      }
      
      if (existing.quantity > 0) {
        holdings.set(trade.symbol, existing);
      } else {
        holdings.delete(trade.symbol);
      }
    });
    
    // Calculate portfolio value at current prices
    let portfolioValue = 0;
    holdings.forEach((holding, symbol) => {
      const currentPrice = livePrices.get(symbol);
      if (currentPrice && holding.quantity > 0) {
        portfolioValue += holding.quantity * currentPrice.price;
      }
    });
    
    growthData.push({
      date,
      value: Math.round(portfolioValue * 100) / 100
    });
  });
  
  return growthData;
}

export function calculateSectorAllocation(holdings: Holding[]): { name: string; value: number; percentage: number }[] {
  // This is a simplified sector mapping - in a real app, you'd use an API to get sector data
  const sectorMap: { [key: string]: string } = {
    'AAPL': 'Technology',
    'GOOGL': 'Technology',
    'MSFT': 'Technology',
    'AMZN': 'Consumer Discretionary',
    'TSLA': 'Consumer Discretionary',
    'META': 'Technology',
    'NVDA': 'Technology',
    'NFLX': 'Communication Services',
    'JPM': 'Financial Services',
    'JNJ': 'Healthcare',
    'PG': 'Consumer Staples',
    'V': 'Financial Services',
    'WMT': 'Consumer Staples',
    'DIS': 'Communication Services',
    'MA': 'Financial Services'
  };
  
  const sectorTotals = new Map<string, number>();
  let totalValue = 0;
  
  holdings.forEach(holding => {
    const sector = sectorMap[holding.symbol] || 'Other';
    const currentTotal = sectorTotals.get(sector) || 0;
    sectorTotals.set(sector, currentTotal + holding.currentValue);
    totalValue += holding.currentValue;
  });
  
  const sectorData: { name: string; value: number; percentage: number }[] = [];
  
  sectorTotals.forEach((value, sector) => {
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
    sectorData.push({
      name: sector,
      value: Math.round(value * 100) / 100,
      percentage: Math.round(percentage * 100) / 100
    });
  });
  
  // Sort by value (descending)
  sectorData.sort((a, b) => b.value - a.value);
  
  return sectorData;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatPercentage(percentage: number): string {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}
