# Portfolio & PnL Tracker

A simple backend service to track trades, portfolio positions, and calculate realized/unrealized profit & loss (PnL) for a single user. Built with Node.js and Express.

## Features
- Add a trade (buy/sell)
- Get current portfolio holdings and position details
- Get realized and unrealized PnL (FIFO method)
- In-memory storage (no DB required)
- Unit tests for core logic

## API Endpoints

### 1. Add a Trade
- **POST** `/api/trades`
- **Body:**
```json
{
  "symbol": "BTC",
  "side": "buy", // or "sell"
  "price": 40000,
  "quantity": 1,
  "timestamp": "2025-10-02T12:00:00Z" // optional
}
```

### 2. Get All Trades
- **GET** `/api/trades`

### 3. Get Portfolio
- **GET** `/api/portfolio`
- **Response:**
```json
{
  "success": true,
  "summary": {
    "totalValue": 80000,
    "totalCost": 82000,
    "numberOfPositions": 2
  },
  "positions": {
    "BTC": { "quantity": 2, "averageCost": 41000, ... },
    ...
  }
}
```

### 4. Get PnL
- **GET** `/api/pnl`
- **Response:**
```json
{
  "realized": { ... },
  "unrealized": { ... },
  "total": { ... }
}
```

## How to Run

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start the server:**
   ```sh
   npm start
   ```
   The server runs on `http://localhost:3001` by default.

3. **Run tests:**
   ```sh
   npm test
   ```

## Assumptions & Notes
- Single user only, all data is in-memory (resets on restart)
- No authentication
- FIFO method for realized PnL
- Market prices are hardcoded in the code (see `Portfolio` class)

## Example Usage
1. **Add trades:**
   - Buy 1 BTC @ 40000
   - Buy 1 BTC @ 42000
   - Sell 1 BTC @ 43000
2. **Check portfolio:**
   - Should show 1 BTC, avg entry = 41000
3. **Check PnL:**
   - Realized PnL = +2000
   - Unrealized PnL (if BTC = 44000) = +3000

## Author
Manas Sahoo

## License
ISC
