const Portfolio = require('../src/models/portfolio');

describe('Portfolio', () => {
  let portfolio;

  beforeEach(() => {
    portfolio = new Portfolio();
  });

  test('should add a buy trade and update position', async () => {
    // Mock uuidv4
    portfolio.addTrade = jest.fn(portfolio.addTrade.bind(portfolio));
    const trade = await portfolio.addTrade({
      symbol: 'BTC',
      side: 'buy',
      price: 40000,
      quantity: 1
    });
    expect(trade.symbol).toBe('BTC');
    expect(trade.side).toBe('buy');
    expect(portfolio.trades.length).toBe(1);
    expect(portfolio.positions.get('BTC').quantity).toBe(1);
  });

  test('should add a sell trade and update realized PnL', async () => {
    await portfolio.addTrade({ symbol: 'BTC', side: 'buy', price: 40000, quantity: 1 });
    await portfolio.addTrade({ symbol: 'BTC', side: 'sell', price: 42000, quantity: 1 });
    const pnl = portfolio.getPnL();
    expect(pnl.realized.bySymbol['BTC']).toBeCloseTo(2000);
    expect(portfolio.positions.get('BTC').quantity).toBe(0);
  });

  test('should calculate unrealized PnL', async () => {
    await portfolio.addTrade({ symbol: 'BTC', side: 'buy', price: 40000, quantity: 1 });
    const pnl = portfolio.getPnL();
    expect(pnl.unrealized.bySymbol['BTC']).toBeCloseTo(10000); // marketPrice 50000 - 40000
  });

  test('should throw error for insufficient balance on sell', async () => {
    await portfolio.addTrade({ symbol: 'BTC', side: 'buy', price: 40000, quantity: 1 });
    expect(() => portfolio.addTrade({ symbol: 'BTC', side: 'sell', price: 42000, quantity: 2 })).toThrow();
  });

  test('should return all trades', async () => {
    await portfolio.addTrade({ symbol: 'BTC', side: 'buy', price: 40000, quantity: 1 });
    await portfolio.addTrade({ symbol: 'ETH', side: 'buy', price: 2000, quantity: 2 });
    const trades = portfolio.getAllTrades();
    expect(trades.length).toBe(2);
    expect(trades[0].symbol).toBe('BTC');
    expect(trades[1].symbol).toBe('ETH');
  });
});
