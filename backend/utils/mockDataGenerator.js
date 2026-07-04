import Stock from '../models/Stock.js';

const DEFAULT_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 182.50 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 151.60 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 421.90 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.40 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 175.20 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 864.00 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 505.30 },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 610.10 }
];

// Helper to generate 20 historical price data points
const generateHistoricalData = (basePrice) => {
  const history = [];
  let currentPrice = basePrice;
  const now = Date.now();
  
  // Generate points backwards in time (every 1 hour)
  for (let i = 20; i >= 0; i--) {
    const time = new Date(now - i * 60 * 60 * 1000);
    // Fluctuate price by -1.5% to +1.5%
    const changeFactor = 1 + (Math.random() * 2 - 1) * 0.015;
    currentPrice = parseFloat((currentPrice * changeFactor).toFixed(2));
    history.push({ price: currentPrice, timestamp: time });
  }
  return history;
};

export const seedStocks = async () => {
  try {
    const count = await Stock.countDocuments();
    if (count === 0) {
      console.log('Stock collection is empty. Seeding default stocks with historical data...');
      
      for (const item of DEFAULT_STOCKS) {
        const history = generateHistoricalData(item.price);
        const lastPrice = history[history.length - 1].price;
        const firstPrice = history[0].price;
        const change = parseFloat((lastPrice - firstPrice).toFixed(2));
        const changePercent = parseFloat(((change / firstPrice) * 100).toFixed(2));

        await Stock.create({
          symbol: item.symbol,
          name: item.name,
          price: lastPrice,
          change,
          changePercent,
          high: Math.max(...history.map(h => h.price)),
          low: Math.min(...history.map(h => h.price)),
          history,
          lastUpdated: new Date()
        });
      }
      console.log('Seeding completed successfully.');
    } else {
      console.log('Stocks already present in database. Skipping seeding.');
    }
  } catch (error) {
    console.error(`Error seeding stocks: ${error.message}`);
  }
};

export const startLiveStockSimulation = () => {
  console.log('Starting live stock price simulation (updates every 5 seconds)...');
  
  setInterval(async () => {
    try {
      const stocks = await Stock.find({});
      
      for (const stock of stocks) {
        // Fluctuate price slightly (-0.4% to +0.4% every 5s)
        const fluctuationPercent = (Math.random() * 2 - 1) * 0.004;
        const priceDelta = parseFloat((stock.price * fluctuationPercent).toFixed(2));
        
        if (priceDelta === 0) continue; // Skip if no price change

        const newPrice = parseFloat((stock.price + priceDelta).toFixed(2));
        
        // Calculate new daily high/low
        if (newPrice > stock.high) stock.high = newPrice;
        if (newPrice < stock.low || stock.low === 0) stock.low = newPrice;
        
        // Accumulate change
        const openingPrice = stock.price - stock.change;
        stock.price = newPrice;
        stock.change = parseFloat((newPrice - openingPrice).toFixed(2));
        stock.changePercent = openingPrice !== 0 ? parseFloat(((stock.change / openingPrice) * 100).toFixed(2)) : 0;
        
        // Add to history
        stock.history.push({ price: newPrice, timestamp: new Date() });
        
        // Keep max 50 points to prevent document bloating
        if (stock.history.length > 50) {
          stock.history.shift();
        }
        
        stock.lastUpdated = new Date();
        await stock.save();
      }
    } catch (error) {
      console.error(`Error in stock simulation: ${error.message}`);
    }
  }, 5000);
};
