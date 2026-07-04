import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api.js';

export const fetchStocks = createAsyncThunk(
  'stocks/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/stocks');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stocks');
    }
  }
);

export const fetchStockDetail = createAsyncThunk(
  'stocks/fetchDetail',
  async (symbol, { rejectWithValue }) => {
    try {
      const response = await api.get(`/stocks/${symbol}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stock details');
    }
  }
);

export const fetchWatchlist = createAsyncThunk(
  'stocks/fetchWatchlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/watchlist');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch watchlist');
    }
  }
);

export const toggleWatchlist = createAsyncThunk(
  'stocks/toggleWatchlist',
  async ({ symbol, isWatched }, { rejectWithValue }) => {
    try {
      const endpoint = isWatched ? '/watchlist/remove' : '/watchlist/add';
      const response = await api.post(endpoint, { symbol });
      return response.data; // Returns updated watchlist stocks array
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Watchlist action failed');
    }
  }
);

// Admin actions
export const createStockAdmin = createAsyncThunk(
  'stocks/adminCreate',
  async (stockData, { rejectWithValue }) => {
    try {
      const response = await api.post('/stocks/admin', stockData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create stock');
    }
  }
);

export const updateStockAdmin = createAsyncThunk(
  'stocks/adminUpdate',
  async ({ symbol, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/stocks/admin/${symbol}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update stock');
    }
  }
);

export const deleteStockAdmin = createAsyncThunk(
  'stocks/adminDelete',
  async (symbol, { rejectWithValue }) => {
    try {
      await api.delete(`/stocks/admin/${symbol}`);
      return symbol;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete stock');
    }
  }
);

const initialState = {
  stocks: [],
  selectedStock: null,
  watchlist: [],
  loading: false,
  detailLoading: false,
  watchlistLoading: false,
  error: null
};

const stockSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {
    updateStockPrices: (state, action) => {
      // Local state update when polling live price changes from server
      const priceMap = {};
      action.payload.forEach(s => {
        priceMap[s.symbol] = s;
      });
      state.stocks = state.stocks.map(s => {
        if (priceMap[s.symbol]) {
          return {
            ...s,
            price: priceMap[s.symbol].price,
            change: priceMap[s.symbol].change,
            changePercent: priceMap[s.symbol].changePercent,
            high: priceMap[s.symbol].high,
            low: priceMap[s.symbol].low
          };
        }
        return s;
      });
      if (state.selectedStock && priceMap[state.selectedStock.symbol]) {
        state.selectedStock = {
          ...state.selectedStock,
          price: priceMap[state.selectedStock.symbol].price,
          change: priceMap[state.selectedStock.symbol].change,
          changePercent: priceMap[state.selectedStock.symbol].changePercent,
          high: priceMap[state.selectedStock.symbol].high,
          low: priceMap[state.selectedStock.symbol].low,
          history: priceMap[state.selectedStock.symbol].history
        };
      }
      state.watchlist = state.watchlist.map(s => {
        if (priceMap[s.symbol]) {
          return {
            ...s,
            price: priceMap[s.symbol].price,
            change: priceMap[s.symbol].change,
            changePercent: priceMap[s.symbol].changePercent,
            high: priceMap[s.symbol].high,
            low: priceMap[s.symbol].low
          };
        }
        return s;
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all stocks
      .addCase(fetchStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload;
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch stock detail
      .addCase(fetchStockDetail.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchStockDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedStock = action.payload;
      })
      .addCase(fetchStockDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      // Fetch watchlist
      .addCase(fetchWatchlist.pending, (state) => {
        state.watchlistLoading = true;
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.watchlistLoading = false;
        state.watchlist = action.payload;
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.watchlistLoading = false;
        state.error = action.payload;
      })
      // Toggle watchlist
      .addCase(toggleWatchlist.fulfilled, (state, action) => {
        state.watchlist = action.payload;
      })
      // Admin create
      .addCase(createStockAdmin.fulfilled, (state, action) => {
        state.stocks.push(action.payload);
      })
      // Admin update
      .addCase(updateStockAdmin.fulfilled, (state, action) => {
        state.stocks = state.stocks.map(s => s.symbol === action.payload.symbol ? action.payload : s);
        if (state.selectedStock && state.selectedStock.symbol === action.payload.symbol) {
          state.selectedStock = action.payload;
        }
      })
      // Admin delete
      .addCase(deleteStockAdmin.fulfilled, (state, action) => {
        state.stocks = state.stocks.filter(s => s.symbol !== action.payload);
        if (state.selectedStock && state.selectedStock.symbol === action.payload) {
          state.selectedStock = null;
        }
      });
  }
});

export const { updateStockPrices } = stockSlice.actions;
export default stockSlice.reducer;
