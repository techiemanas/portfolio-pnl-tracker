
// Import uuid for unique trade IDs
const { v4: uuidv4 } = require('uuid');

/**
 * Portfolio class to manage trades, positions, and PnL calculations for a single user.
 * Uses FIFO for realized PnL calculation.
 */
class Portfolio {
    /**
     * Initialize portfolio with empty trades, positions, and realized PnL.
     * Sets hardcoded market prices for supported symbols.
     */
    constructor(){
        this.trades = [];
        this.positions = new Map();
        this.realizedPnL = new Map();

        this.marketPrices = {
            BTC: 50000,
            ETH: 2500,
            PYUSD: 1
        }
    }

    /**
     * Returns all trades recorded in the portfolio.
     */
    getAllTrades() {
        return this.trades;
    }

    /**
     * Adds a trade to the portfolio and updates positions and realized PnL.
     * @param {Object} tradeData - Trade details (symbol, side, price, quantity, timestamp)
     * @returns {Object} The trade object added
     */
    addTrade(tradeData){
        const trade = {
            id: uuidv4(), // Generate unique trade ID
            symbol: tradeData.symbol.toUpperCase(),
            side: tradeData.side.toLowerCase(),
            price: parseFloat(tradeData.price),
            quantity: parseFloat(tradeData.quantity),
            timestamp: tradeData.timestamp || new Date().toISOString(),
            value: parseFloat(tradeData.price) * parseFloat(tradeData.quantity)
        }

        if(!this._validateTrade(trade)){
            throw new Error('Invalid trade data')
        }

        this.trades.push(trade);
        this._updatePosition(trade);

        return trade;
    }

    /**
     * Validates a trade for correct fields and sufficient balance (for sells).
     * @param {Object} trade - Trade object
     * @returns {boolean} True if valid, throws error if invalid
     */
    _validateTrade(trade){
        if(!trade.symbol || typeof trade.symbol !== 'string') return false;
        if(!['buy', 'sell'].includes(trade.side)) return false;
        if(trade.price <= 0 || isNaN(trade.price)) return false;
        if(trade.quantity <=0 || isNaN(trade.quantity)) return false;

        // For sell trades, check if enough quantity is available
        if(trade.side === 'sell') {
            const position = this.positions.get(trade.symbol);
            if(!position || position.quantity < trade.quantity){
                throw new Error(`Insufficient balance. Availale ${position?.quantity || 0} Requested: ${trade.quantity}`,)
            }
        }
        return true;
    }

    /**
     * Updates the position and realized PnL for a symbol after a trade.
     * Uses FIFO for realized PnL calculation.
     * @param {Object} trade - Trade object
     */
    _updatePosition(trade) {
        const {symbol, side, price, quantity} = trade;
    // Initialize position if it doesn't exist
    if(!this.positions.has(symbol)){
            this.positions.set(symbol, {
                quantity: 0,
                totalCost: 0,
                averageCost: 0,
                lots: []
            });
        }

        const position = this.positions.get(symbol);
        if( side === 'buy'){
            // For buys, add to lots and update average cost
            position.lots.push({price, quantity, timestamp: trade.timestamp});
            position.quantity += quantity;
            position.totalCost += price*quantity;
            position.averageCost = position.totalCost / position.quantity;
        } else {
            // For sells, use FIFO to calculate realized PnL and update lots
            let remainingToSell = quantity;
            let realizedPnL = 0;
            while(remainingToSell >0 && position.lots.length >0 ){
                const lot = position.lots[0];
                if(lot.quantity < remainingToSell){
                    realizedPnL += (price - lot.price) * lot.quantity;
                    remainingToSell -= lot.quantity;
                    position.lots.shift();
                } else {
                    realizedPnL += (price - lot.price) * remainingToSell;
                    lot.quantity  -= remainingToSell;
                    remainingToSell = 0; 
                }
            }
            position.quantity -= quantity;
            if(position.quantity > 0 ){
                // Recalculate total cost and average cost after sell
                position.totalCost = position.lots.reduce((sum, lot) => sum + lot.price * lot.quantity, 0);
                position.averageCost = position.totalCost / position.quantity;
            } else {
                // If position closed, reset cost and average
                position.totalCost = 0;
                position.averageCost = 0;
            }
            if(!this.realizedPnL.has(symbol)){
                this.realizedPnL.set(symbol, 0);
            }

            this.realizedPnL.set(symbol, this.realizedPnL.get(symbol) + realizedPnL);
        }
    }

    /**
     * Calculates total and per-symbol realized PnL.
     * @returns {Object} Realized PnL summary
     */
    _calculateRealizedPnL(){
        const bySymbol = {};
        let totalPnL = 0;
        for(const [symbol, pnl] of this.realizedPnL.entries()){
            bySymbol[symbol] = pnl;
            totalPnL +=pnl;
        }
        return {
            totalPnL,
            bySymbol
        }
    }

    /**
     * Calculates total and per-symbol unrealized PnL based on current market prices.
     * @returns {Object} Unrealized PnL summary
     */
    _calculateUnRealizedPnL(){
        const bySymbol = {};
        let totalPnL = 0;
        for(const [symbol, position] of this.positions.entries()){
            if(position.quantity > 0 ){
                const marketPrice = this.marketPrices[symbol] || position.averageCost;
                const unrealizedPnL = (marketPrice - position.averageCost) * position.quantity;
                bySymbol[symbol] = unrealizedPnL;
                totalPnL += unrealizedPnL;
            }
        }
        return {
            totalPnL,
            bySymbol
        }
    }

    /**
     * Merges realized and unrealized PnL breakdowns by symbol.
     * @param {Object} realized - Realized PnL by symbol
     * @param {Object} unrealized - Unrealized PnL by symbol
     * @returns {Object} Combined breakdown
     */
    _mergePnLBreakdown(realized, unrealized){
        const merged = {};
        const allSymbols = new Set([...Object.keys(realized), ...Object.keys(unrealized)]);
        for(const symbol of allSymbols){
            merged[symbol] = {
                realized: realized[symbol] || 0,
                unrealized: unrealized[symbol] || 0,
                total: (realized[symbol] || 0) + (unrealized[symbol] ||0)
            }
        }
        return merged;
    }

    /**
     * Returns realized, unrealized, and total PnL (with breakdown) for the portfolio.
     * @returns {Object} PnL summary
     */
    getPnL() {
        const realizedPnL = this._calculateRealizedPnL();
        const unrealizedPnL = this._calculateUnRealizedPnL();
        return {
            realized: realizedPnL,
            unrealized: unrealizedPnL,
            total: {
                totalPnL: realizedPnL.totalPnL + unrealizedPnL.totalPnL,
                breakdown: this._mergePnLBreakdown(realizedPnL.bySymbol, unrealizedPnL.bySymbol)
            }
        }
    }

}

module.exports = Portfolio;