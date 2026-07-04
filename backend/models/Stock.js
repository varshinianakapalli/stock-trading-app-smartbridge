import mongoose from 'mongoose';

const stockHistorySchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Please add a stock symbol'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  change: {
    type: Number,
    default: 0.00
  },
  changePercent: {
    type: Number,
    default: 0.00
  },
  high: {
    type: Number,
    default: 0
  },
  low: {
    type: Number,
    default: 0
  },
  history: [stockHistorySchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const Stock = mongoose.model('Stock', stockSchema);
export default Stock;
