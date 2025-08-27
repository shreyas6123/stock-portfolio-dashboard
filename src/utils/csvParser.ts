import { TradeRecord } from '@/types/portfolio';

export class CSVParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CSVParseError';
  }
}

export async function parseCSV(file: File): Promise<TradeRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const records = parseCSVText(csvText);
        resolve(records);
      } catch (error) {
        reject(new CSVParseError(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new CSVParseError('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

function parseCSVText(csvText: string): TradeRecord[] {
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const records: TradeRecord[] = [];
  
  // Expected headers (flexible order)
  const requiredHeaders = ['date', 'symbol', 'quantity', 'price', 'type'];
  const headerMap: { [key: string]: number } = {};
  
  // Map headers to column indices
  requiredHeaders.forEach(header => {
    const variations = getHeaderVariations(header);
    const index = headers.findIndex(h => variations.includes(h));
    if (index === -1) {
      throw new Error(`Required column '${header}' not found. Expected one of: ${variations.join(', ')}`);
    }
    headerMap[header] = index;
  });
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = line.split(',').map(v => v.trim());
    
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
    }
    
    try {
      const record: TradeRecord = {
        date: parseDate(values[headerMap.date]),
        symbol: values[headerMap.symbol].toUpperCase(),
        quantity: parseFloat(values[headerMap.quantity]),
        price: parseFloat(values[headerMap.price]),
        transactionType: parseTransactionType(values[headerMap.type])
      };
      
      // Validate record
      validateTradeRecord(record, i + 1);
      records.push(record);
      
    } catch (error) {
      throw new Error(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
    }
  }
  
  return records;
}

function getHeaderVariations(header: string): string[] {
  const variations: { [key: string]: string[] } = {
    date: ['date', 'trade_date', 'transaction_date', 'dt'],
    symbol: ['symbol', 'stock', 'ticker', 'stock_symbol'],
    quantity: ['quantity', 'qty', 'shares', 'units'],
    price: ['price', 'rate', 'unit_price', 'share_price'],
    type: ['type', 'transaction_type', 'side', 'buy_sell', 'action']
  };
  
  return variations[header] || [header];
}

function parseDate(dateStr: string): string {
  const cleaned = dateStr.replace(/['"]/g, '');
  
  // Try different date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
  ];
  
  if (!formats.some(format => format.test(cleaned))) {
    throw new Error(`Invalid date format: ${dateStr}. Expected formats: YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY`);
  }
  
  const date = new Date(cleaned);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

function parseTransactionType(typeStr: string): 'buy' | 'sell' {
  const cleaned = typeStr.toLowerCase().trim().replace(/['"]/g, '');
  
  if (['buy', 'b', 'purchase', 'long'].includes(cleaned)) {
    return 'buy';
  }
  
  if (['sell', 's', 'sale', 'short'].includes(cleaned)) {
    return 'sell';
  }
  
  throw new Error(`Invalid transaction type: ${typeStr}. Expected: buy, sell, b, s, purchase, sale, long, short`);
}

function validateTradeRecord(record: TradeRecord, rowNumber: number): void {
  if (!record.symbol || record.symbol.length === 0) {
    throw new Error('Symbol cannot be empty');
  }
  
  if (isNaN(record.quantity) || record.quantity <= 0) {
    throw new Error(`Invalid quantity: ${record.quantity}. Must be a positive number`);
  }
  
  if (isNaN(record.price) || record.price <= 0) {
    throw new Error(`Invalid price: ${record.price}. Must be a positive number`);
  }
  
  if (!['buy', 'sell'].includes(record.transactionType)) {
    throw new Error(`Invalid transaction type: ${record.transactionType}`);
  }
}

// Sample CSV format for user reference
export const SAMPLE_CSV_FORMAT = `date,symbol,quantity,price,type
2024-01-15,AAPL,100,150.50,buy
2024-01-20,GOOGL,50,2800.00,buy
2024-02-01,AAPL,50,155.00,sell`;
