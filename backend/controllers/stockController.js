import Stock from '../models/Stock.js';

// @desc    Get all stocks
// @route   GET /api/stocks
// @access  Public
export const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find({});
    return res.json(stocks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get stock by symbol
// @route   GET /api/stocks/:symbol
// @access  Public
export const getStockBySymbol = async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const stock = await Stock.findOne({ symbol });
    if (stock) {
      return res.json(stock);
    } else {
      return res.status(404).json({ message: 'Stock not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Create new stock (Admin Only)
// @route   POST /api/admin/stocks
// @access  Private/Admin
export const createStock = async (req, res) => {
  const { symbol, name, price } = req.body;

  try {
    if (!symbol || !name || price === undefined) {
      return res.status(400).json({ message: 'Please provide symbol, name, and price' });
    }

    const stockExists = await Stock.findOne({ symbol: symbol.toUpperCase() });

    if (stockExists) {
      return res.status(400).json({ message: 'Stock with this symbol already exists' });
    }

    const stockPrice = parseFloat(price);
    const stock = await Stock.create({
      symbol: symbol.toUpperCase(),
      name,
      price: stockPrice,
      change: 0.00,
      changePercent: 0.00,
      high: stockPrice,
      low: stockPrice,
      history: [{ price: stockPrice, timestamp: new Date() }]
    });

    return res.status(201).json(stock);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update stock price or name (Admin Only)
// @route   PUT /api/admin/stocks/:symbol
// @access  Private/Admin
export const updateStock = async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const { name, price } = req.body;

  try {
    const stock = await Stock.findOne({ symbol });

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    if (name) stock.name = name;
    
    if (price !== undefined) {
      const newPrice = parseFloat(price);
      const oldPrice = stock.price;
      
      stock.change = parseFloat((newPrice - oldPrice).toFixed(2));
      stock.changePercent = parseFloat(((stock.change / oldPrice) * 100).toFixed(2));
      stock.price = newPrice;
      
      if (newPrice > stock.high) stock.high = newPrice;
      if (newPrice < stock.low || stock.low === 0) stock.low = newPrice;
      
      stock.history.push({ price: newPrice, timestamp: new Date() });
      
      // Limit history length to 100 entries to prevent document bloat
      if (stock.history.length > 100) {
        stock.history.shift();
      }
    }
    
    stock.lastUpdated = new Date();
    await stock.save();

    return res.json(stock);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete stock (Admin Only)
// @route   DELETE /api/admin/stocks/:symbol
// @access  Private/Admin
export const deleteStock = async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    const result = await Stock.findOneAndDelete({ symbol });

    if (result) {
      return res.json({ message: `Stock ${symbol} deleted successfully` });
    } else {
      return res.status(404).json({ message: 'Stock not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
