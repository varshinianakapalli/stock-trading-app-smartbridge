import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import stockReducer from './stockSlice.js';
import portfolioReducer from './portfolioSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    stocks: stockReducer,
    portfolio: portfolioReducer
  }
});
