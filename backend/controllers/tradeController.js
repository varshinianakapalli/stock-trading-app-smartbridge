import User from '../models/User.js';
import Stock from '../models/Stock.js';
import Transaction from '../models/Transaction.js';

// @desc    Buy shares of a stock
// @route   POST /api/trades/buy
// @access  Private
export const buyStock = async (req, res) => {
  const { symbol, quantity } = req.body;
  const uppercaseSymbol = symbol.toUpperCase();
  const qty = parseInt(quantity, 10);

  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive integer' });
  }

  try {
    const stock = await Stock.findOne({ symbol: uppercaseSymbol });
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    const user = await User.findById(req.user._id);
    const totalCost = parseFloat((stock.price * qty).toFixed(2));

    if (user.balance < totalCost) {
      return res.status(400).json({ message: `Insufficient balance. Need $${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}, but you have $${user.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}` });
    }

    // Process trade: Deduct balance
    user.balance = parseFloat((user.balance - totalCost).toFixed(2));

    // Update holdings
    const holdingIndex = user.holdings.findIndex(h => h.symbol === uppercaseSymbol);

    if (holdingIndex >= 0) {
      const existingHolding = user.holdings[holdingIndex];
      const newQty = existingHolding.quantity + qty;
      const newAvgPrice = parseFloat(((existingHolding.averagePrice * existingHolding.quantity + totalCost) / newQty).toFixed(2));
      
      user.holdings[holdingIndex].quantity = newQty;
      user.holdings[holdingIndex].averagePrice = newAvgPrice;
    } else {
      user.holdings.push({
        symbol: uppercaseSymbol,
        quantity: qty,
        averagePrice: stock.price
      });
    }

    // Create transaction log
    const transaction = await Transaction.create({
      userId: user._id,
      symbol: uppercaseSymbol,
      type: 'BUY',
      quantity: qty,
      price: stock.price,
      totalAmount: totalCost
    });

    await user.save();

    return res.status(201).json({
      message: 'Purchase successful',
      balance: user.balance,
      holdings: user.holdings,
      transaction
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Sell shares of a stock
// @route   POST /api/trades/sell
// @access  Private
export const sellStock = async (req, res) => {
  const { symbol, quantity } = req.body;
  const uppercaseSymbol = symbol.toUpperCase();
  const qty = parseInt(quantity, 10);

  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive integer' });
  }

  try {
    const stock = await Stock.findOne({ symbol: uppercaseSymbol });
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    const user = await User.findById(req.user._id);
    const holdingIndex = user.holdings.findIndex(h => h.symbol === uppercaseSymbol);

    if (holdingIndex === -1 || user.holdings[holdingIndex].quantity < qty) {
      return res.status(400).json({ message: 'Insufficient shares in portfolio to execute sell order' });
    }

    const totalRevenue = parseFloat((stock.price * qty).toFixed(2));
    
    // Process trade: Add balance
    user.balance = parseFloat((user.balance + totalRevenue).toFixed(2));

    // Update holdings
    const existingHolding = user.holdings[holdingIndex];
    const newQty = existingHolding.quantity - qty;

    if (newQty === 0) {
      // Remove holding
      user.holdings.splice(holdingIndex, 1);
    } else {
      user.holdings[holdingIndex].quantity = newQty;
    }

    // Create transaction log
    const transaction = await Transaction.create({
      userId: user._id,
      symbol: uppercaseSymbol,
      type: 'SELL',
      quantity: qty,
      price: stock.price,
      totalAmount: totalRevenue
    });

    await user.save();

    return res.status(201).json({
      message: 'Sale successful',
      balance: user.balance,
      holdings: user.holdings,
      transaction
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's transactions
// @route   GET /api/trades/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ timestamp: -1 });
    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get user holdings with live market valuations
// @route   GET /api/trades/holdings
// @access  Private
export const getHoldings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const holdings = user.holdings;

    // Fetch current prices of all held stocks
    const symbols = holdings.map(h => h.symbol);
    const stocks = await Stock.find({ symbol: { $in: symbols } });
    
    const priceMap = {};
    stocks.forEach(s => {
      priceMap[s.symbol] = {
        currentPrice: s.price,
        change: s.change,
        changePercent: s.changePercent,
        name: s.name
      };
    });

    // Decorate holdings with current market info
    const decoratedHoldings = holdings.map(h => {
      const marketInfo = priceMap[h.symbol] || { currentPrice: h.averagePrice, change: 0, changePercent: 0, name: '' };
      const currentValuation = parseFloat((h.quantity * marketInfo.currentPrice).toFixed(2));
      const totalCost = parseFloat((h.quantity * h.averagePrice).toFixed(2));
      const totalGainLoss = parseFloat((currentValuation - totalCost).toFixed(2));
      const gainLossPercent = totalCost > 0 ? parseFloat(((totalGainLoss / totalCost) * 100).toFixed(2)) : 0;

      return {
        _id: h._id,
        symbol: h.symbol,
        name: marketInfo.name,
        quantity: h.quantity,
        averagePrice: h.averagePrice,
        currentPrice: marketInfo.currentPrice,
        totalCost,
        currentValuation,
        totalGainLoss,
        gainLossPercent,
        change: marketInfo.change,
        changePercent: marketInfo.changePercent
      };
    });

    return res.json(decoratedHoldings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
