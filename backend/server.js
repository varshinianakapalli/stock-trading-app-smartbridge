import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { startMongo } from './utils/mongoDaemon.js';
import { connectDB } from './config/db.js';

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic root route
app.get('/', (req, res) => {
  res.send('SB Stocks API is running...');
});

// Route imports
import authRoutes from './routes/authRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import { seedStocks, startLiveStockSimulation } from './utils/mockDataGenerator.js';

// Route mountings
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/watchlist', watchlistRoutes);

// Error Handling Middlewares
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

// Start database and server
const startServer = async () => {
  try {
    // 1. Start local MongoDB process
    await startMongo();
    
    // 2. Connect database via Mongoose
    await connectDB();

    // 2.5 Seed default stocks and start live simulation
    await seedStocks();
    startLiveStockSimulation();
    
    // 3. Start Express server
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error during server boot: ${error.message}`);
    process.exit(1);
  }
};

startServer();
