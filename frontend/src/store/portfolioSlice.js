import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api.js';
import { updateUserBalance } from './authSlice.js';

export const fetchHoldings = createAsyncThunk(
  'portfolio/fetchHoldings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/trades/holdings');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch holdings');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'portfolio/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/trades/transactions');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const buyStockAction = createAsyncThunk(
  'portfolio/buyStock',
  async ({ symbol, quantity }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post('/trades/buy', { symbol, quantity });
      // Update balance in Auth state
      dispatch(updateUserBalance(response.data.balance));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Buy order failed');
    }
  }
);

export const sellStockAction = createAsyncThunk(
  'portfolio/sellStock',
  async ({ symbol, quantity }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post('/trades/sell', { symbol, quantity });
      // Update balance in Auth state
      dispatch(updateUserBalance(response.data.balance));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Sell order failed');
    }
  }
);

const initialState = {
  holdings: [],
  transactions: [],
  loading: false,
  tradeLoading: false,
  error: null
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    updateHoldingsPrices: (state, action) => {
      // Local calculation updates when live prices tick
      const priceMap = {};
      action.payload.forEach(s => {
        priceMap[s.symbol] = s.price;
      });

      state.holdings = state.holdings.map(h => {
        if (priceMap[h.symbol]) {
          const currentPrice = priceMap[h.symbol];
          const currentValuation = parseFloat((h.quantity * currentPrice).toFixed(2));
          const totalCost = parseFloat((h.quantity * h.averagePrice).toFixed(2));
          const totalGainLoss = parseFloat((currentValuation - totalCost).toFixed(2));
          const gainLossPercent = totalCost > 0 ? parseFloat(((totalGainLoss / totalCost) * 100).toFixed(2)) : 0;
          return {
            ...h,
            currentPrice,
            currentValuation,
            totalGainLoss,
            gainLossPercent
          };
        }
        return h;
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Holdings
      .addCase(fetchHoldings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHoldings.fulfilled, (state, action) => {
        state.loading = false;
        state.holdings = action.payload;
      })
      .addCase(fetchHoldings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Buy Stock
      .addCase(buyStockAction.pending, (state) => {
        state.tradeLoading = true;
        state.error = null;
      })
      .addCase(buyStockAction.fulfilled, (state, action) => {
        state.tradeLoading = false;
        state.transactions.unshift(action.payload.transaction);
      })
      .addCase(buyStockAction.rejected, (state, action) => {
        state.tradeLoading = false;
        state.error = action.payload;
      })
      // Sell Stock
      .addCase(sellStockAction.pending, (state) => {
        state.tradeLoading = true;
        state.error = null;
      })
      .addCase(sellStockAction.fulfilled, (state, action) => {
        state.tradeLoading = false;
        state.transactions.unshift(action.payload.transaction);
      })
      .addCase(sellStockAction.rejected, (state, action) => {
        state.tradeLoading = false;
        state.error = action.payload;
      });
  }
});

export const { updateHoldingsPrices } = portfolioSlice.actions;
export default portfolioSlice.reducer;
