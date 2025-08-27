// Trade record interface for uploaded CSV data
export interface TradeRecord {
  date: string;
  symbol: string;
  quantity: number;
  price: number;
  transactionType: 'buy' | 'sell';
}

// Stock price data from websocket
export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

// Portfolio holding calculation result
export interface Holding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

// Portfolio summary metrics
export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdings: Holding[];
}

// Websocket message types
export interface WebSocketMessage {
  type: 'price_update' | 'error' | 'connection_status';
  data: StockPrice | string;
}

// Chart data interfaces
export interface PieChartData {
  name: string;
  value: number;
  percentage: number;
}

export interface LineChartData {
  date: string;
  value: number;
}

export interface BarChartData {
  symbol: string;
  pnl: number;
  invested: number;
  current: number;
}
