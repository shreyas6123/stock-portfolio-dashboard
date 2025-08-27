import { StockPrice, WebSocketMessage } from '@/types/portfolio';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private subscribers: Set<(data: StockPrice) => void> = new Set();
  private errorSubscribers: Set<(error: string) => void> = new Set();
  private statusSubscribers: Set<(status: 'connecting' | 'connected' | 'disconnected' | 'error') => void> = new Set();

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.notifyStatusSubscribers('connecting');

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.notifyStatusSubscribers('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            this.notifyErrorSubscribers('Failed to parse message from server');
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.notifyStatusSubscribers('disconnected');
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.notifyStatusSubscribers('error');
          this.notifyErrorSubscribers('WebSocket connection error');
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        this.isConnecting = false;
        this.notifyStatusSubscribers('error');
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'price_update':
        if (typeof message.data === 'object' && 'symbol' in message.data) {
          this.notifySubscribers(message.data as StockPrice);
        }
        break;
      case 'error':
        this.notifyErrorSubscribers(message.data as string);
        break;
      case 'connection_status':
        console.log('Connection status:', message.data);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.notifyErrorSubscribers('Failed to reconnect after maximum attempts');
          }
        });
      }
    }, delay);
  }

  subscribe(callback: (data: StockPrice) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  subscribeToErrors(callback: (error: string) => void): () => void {
    this.errorSubscribers.add(callback);
    return () => this.errorSubscribers.delete(callback);
  }

  subscribeToStatus(callback: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void): () => void {
    this.statusSubscribers.add(callback);
    return () => this.statusSubscribers.delete(callback);
  }

  protected notifySubscribers(data: StockPrice): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  protected notifyErrorSubscribers(error: string): void {
    this.errorSubscribers.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error subscriber callback:', err);
      }
    });
  }

  protected notifyStatusSubscribers(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
    this.statusSubscribers.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status subscriber callback:', error);
      }
    });
  }

  sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.subscribers.clear();
    this.errorSubscribers.clear();
    this.statusSubscribers.clear();
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

// Singleton instance for the app
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080/ws';
    wsManager = new WebSocketManager(wsUrl);
  }
  return wsManager;
}

// Mock data generator for development/testing
export function generateMockStockData(): StockPrice[] {
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
  const basePrice = { AAPL: 150, GOOGL: 2800, MSFT: 300, AMZN: 3200, TSLA: 800, META: 350, NVDA: 900, NFLX: 400 };
  
  return symbols.map(symbol => {
    const base = basePrice[symbol as keyof typeof basePrice] || 100;
    const change = (Math.random() - 0.5) * 10; // Random change between -5 and +5
    const price = base + change;
    
    return {
      symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round((change / base) * 10000) / 100,
      timestamp: Date.now()
    };
  });
}

// Mock WebSocket for development
export class MockWebSocketManager extends WebSocketManager {
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    super('mock://localhost');
  }

  connect(): Promise<void> {
    return new Promise((resolve) => {
      console.log('Mock WebSocket connected');
      this.notifyStatusSubscribers('connected');
      
      // Generate mock data every 2 seconds
      this.interval = setInterval(() => {
        const mockData = generateMockStockData();
        mockData.forEach(stock => this.notifySubscribers(stock));
      }, 2000);
      
      resolve();
    });
  }

  disconnect(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    super.disconnect();
  }
}
