```markdown
# Detailed Implementation Plan for Stock Portfolio Dashboard

This plan describes the full end-to-end implementation of a stock portfolio dashboard in our Next.js/TypeScript project. The dashboard will use a live websocket connection for real-time price updates, allow trade history uploads (CSV/Excel), and display calculated portfolio metrics with multiple charts.

---

## New/Updated Files and Directories

1. **New Next.js Dashboard Page**  
   **File:** `src/app/dashboard/page.tsx`  
   - Import and assemble all new components (header, live ticker, upload, summary, and charts).  
   - Layout the page using a responsive grid with modern typography and spacing.  
   - Maintain state for uploaded trade history data and live websocket data.  
   - Show error alerts if required data is missing or API/websocket connection fails.

2. **Stock Ticker Component**  
   **File:** `src/components/StockTicker.tsx`  
   - Import the common websocket connection from `src/lib/websocket.ts`.  
   - On mount, connect to the websocket (using the URL from an environment variable).  
   - Listen for stock price updates, update local state, and display a horizontal scrolling ticker.  
   - Add proper error handling (display fallback message if connection fails).

3. **Trade History Upload Component**  
   **File:** `src/components/TradeHistoryUpload.tsx`  
   - Render a file input allowing CSV/Excel uploads.  
   - Use the FileReader API to read user-selected files and parse CSV data via `src/utils/csvParser.ts`.  
   - Call an onUpload callback with parsed trade records.  
   - Provide clear error messages if parsing fails or file type is invalid.

4. **Portfolio Summary Component**  
   **File:** `src/components/PortfolioSummary.tsx`  
   - Accept props: parsed trade history and live stock data.  
   - Use helper functions from `src/lib/portfolioCalculations.ts` to compute holdings, average price, invested value, current value, and profit/loss (P&L).  
   - Display metrics using a clean card or grid layout.  
   - Handle cases when data is missing by showing placeholder messages.

5. **Charts Components**  
   Create three individual chart components to display portfolio insights:
   
   a. **Pie Chart for Allocation by Stock**  
      **File:** `src/components/Charts/PieChartAllocation.tsx`  
      - Use Recharts to render a pie chart showing allocation percentages per stock.  
      - Display clear labels and tooltips.
   
   b. **Line Chart for Portfolio Growth Over Time**  
      **File:** `src/components/Charts/LineChartPortfolioGrowth.tsx`  
      - Render a line chart plotting the historical portfolio value with appropriate axis labels, tooltips, and responsiveness.
   
   c. **Bar Chart for Sector/Stock-wise P&L**  
      **File:** `src/components/Charts/BarChartPnL.tsx`  
      - Use Recharts to construct a bar chart to illustrate profit/loss for each stock or sector with clear visual hierarchy.

6. **Websocket Utility Module**  
   **File:** `src/lib/websocket.ts`  
   - Export a function `connectWebSocket()` that reads the websocket URL from `process.env.NEXT_PUBLIC_WEBSOCKET_URL`.  
   - Create and return a WebSocket instance with handlers for `onopen`, `onmessage`, `onerror`, and `onclose`.  
   - Implement graceful reconnection logic and error fallback handling.

7. **Portfolio Calculations Utility Module**  
   **File:** `src/lib/portfolioCalculations.ts`  
   - Define functions to process trade data:  
     - `calculateHoldings(tradeHistory)`: Returns totals per stock.  
     - `calculateAveragePrice(tradeHistory)`: Computes average buy price per stock.  
     - `calculateInvestedValue(tradeHistory)`: Sums total investment.  
     - `calculateCurrentValue(livePrices, holdings)`: Looks up real-time prices to compute current value.  
     - `calculatePnL(investedValue, currentValue)`: Computes absolute and percentage gain/loss.  
   - Ensure each function has proper error-checking and type validations.

8. **CSV Parsing Utility**  
   **File:** `src/utils/csvParser.ts`  
   - Create a function `parseCSV(file: File): Promise<TradeRecord[]>` that uses FileReader and a CSV parsing routine (for example, via Papaparse or a custom parser).  
   - Define and validate the `TradeRecord` interface with fields: `date`, `symbol`, `quantity`, `price`, and `transactionType` ('buy' or 'sell').  
   - Implement error responses for invalid file content.

9. **README.md Update**  
   - Add clear instructions to install dependencies (`npm install`), configure a `.env` file with `NEXT_PUBLIC_WEBSOCKET_URL`, and run the development server (`npm run dev`).  
   - Provide usage notes for uploading trade history files and expected dashboard behavior, along with troubleshooting steps if live data or file parsing fails.

---

## Error Handling & Best Practices

- Wrap asynchronous calls and file operations within try/catch blocks.  
- Use UI alerts (e.g., the Alert component in `src/components/ui/alert.tsx`) to notify the user of connection or parsing errors.  
- Validate all inputs from file uploads and websocket messages.  
- Use TypeScript interfaces for strict type checking of trade records and websocket response data.  
- Ensure clean state resets on upload errors or WebSocket disconnections.

---

## UI/UX Considerations

- The dashboard will feature modern typography, consistent spacing, and a responsive grid layout suitable for desktops and tablets.  
- All charts and summary sections will have clear labels and a minimalist design, avoiding external icons and images.  
- The file upload interface will use a clear button with actionable text and error feedback.  
- The Stock Ticker display will scroll horizontally with legible text and modern color schemes.  
- Overall, the design emphasizes clarity, real-time interactivity, and modularity for future extension.

---

## Integration and Testing

- Verify websocket connectivity by simulating live stock updates; use browser developer tools to monitor connection events.  
- Test CSV file upload with valid and malformed files to ensure error messages are displayed appropriately.  
- Confirm that portfolio calculations update automatically as new trade data and live prices arrive.  
- Validate each chart component by comparing displayed data with the computed metrics.  
- Run linting (`eslint`) and type checking (`tsc`) to ensure code quality.

---

## Summary

- Created a new `src/app/dashboard/page.tsx` to serve as the main dashboard page integrating live stock ticker, trade history upload, summary metrics, and charts.
- Developed dedicated components for StockTicker, TradeHistoryUpload, PortfolioSummary, and three chart views.
- Added utility modules for websocket connections, portfolio calculations, and CSV parsing.
- Employed robust error handling, TypeScript type checking, and modern Tailwind layout for a clean UI.
- Updated README.md with run instructions and environment variable guidance.
- The design focuses on modularity, real-time interactivity via websocket, and an extendable architecture.
