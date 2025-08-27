'use client';

import { useState, useRef } from 'react';
import { TradeRecord } from '@/types/portfolio';
import { parseCSV, CSVParseError, SAMPLE_CSV_FORMAT } from '@/utils/csvParser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface TradeHistoryUploadProps {
  onUpload: (trades: TradeRecord[]) => void;
  currentTrades?: TradeRecord[];
}

export default function TradeHistoryUpload({ onUpload, currentTrades = [] }: TradeHistoryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    
    if (!isCSV && !validTypes.includes(file.type)) {
      setError('Please upload a CSV file. Excel files (.xlsx) support coming soon.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const trades = await parseCSV(file);
      
      if (trades.length === 0) {
        setError('No valid trade records found in the file.');
        return;
      }

      onUpload(trades);
      setSuccess(`Successfully uploaded ${trades.length} trade records.`);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      if (err instanceof CSVParseError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while parsing the file.');
      }
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearData = () => {
    onUpload([]);
    setSuccess('Trade history cleared.');
    setError(null);
  };

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV_FORMAT], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_trades.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Upload Trade History
          {currentTrades.length > 0 && (
            <Badge variant="secondary">
              {currentTrades.length} trades loaded
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Upload your trade history as a CSV file to calculate portfolio metrics and P&L.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? 'Processing...' : 'Choose CSV File'}
            </Button>
            
            {currentTrades.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearData}
                disabled={isUploading}
              >
                Clear Data
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSample(!showSample)}
              className="flex-1"
            >
              {showSample ? 'Hide' : 'Show'} CSV Format
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleCSV}
              className="flex-1"
            >
              Download Sample
            </Button>
          </div>
        </div>

        {showSample && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Expected CSV Format:</h4>
            <div className="bg-gray-50 p-3 rounded-md text-sm font-mono overflow-x-auto">
              <pre>{SAMPLE_CSV_FORMAT}</pre>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p><strong>Required columns:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li><strong>date:</strong> Trade date (YYYY-MM-DD, MM/DD/YYYY, or MM-DD-YYYY)</li>
                <li><strong>symbol:</strong> Stock ticker symbol (e.g., AAPL, GOOGL)</li>
                <li><strong>quantity:</strong> Number of shares (positive number)</li>
                <li><strong>price:</strong> Price per share (positive number)</li>
                <li><strong>type:</strong> Transaction type (buy, sell, b, s, purchase, sale)</li>
              </ul>
              <p className="mt-2 text-xs text-gray-500">
                Column names are flexible - variations like "stock", "ticker", "qty", "shares", "rate" are also accepted.
              </p>
            </div>
          </div>
        )}

        {currentTrades.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Current Portfolio Summary:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>Total Trades: {currentTrades.length}</p>
              <p>Unique Stocks: {new Set(currentTrades.map(t => t.symbol)).size}</p>
              <p>Date Range: {
                currentTrades.length > 0 ? 
                `${Math.min(...currentTrades.map(t => new Date(t.date).getTime()))} to ${Math.max(...currentTrades.map(t => new Date(t.date).getTime()))}`.replace(/\d+/g, (match) => new Date(parseInt(match)).toLocaleDateString()) :
                'No trades'
              }</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
