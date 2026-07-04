import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchHoldings, updateHoldingsPrices } from '../store/portfolioSlice.js';
import { fetchStocks, updateStockPrices } from '../store/stockSlice.js';
import api from '../utils/api.js';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Briefcase,
  Percent,
  Star,
  ChevronRight
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { holdings, loading: portfolioLoading } = useSelector((state) => state.portfolio);
  const { stocks, watchlist } = useSelector((state) => state.stocks);

  // Poll for live stock prices and holdings valuations
  useEffect(() => {
    dispatch(fetchHoldings());
    dispatch(fetchStocks());

    const interval = setInterval(async () => {
      try {
        const response = await api.get('/stocks');
        dispatch(updateStockPrices(response.data));

        // Also update holdings prices using the updated stock price map
        dispatch(updateHoldingsPrices(response.data));
      } catch (error) {
        console.error('Error polling stocks:', error.message);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Derived portfolio statistics
  const cashBalance = user?.balance || 0;
  const holdingsValue = holdings.reduce((sum, h) => sum + (h.currentValuation || 0), 0);
  const portfolioValue = parseFloat((cashBalance + holdingsValue).toFixed(2));
  const initialFunds = 100000.00;
  const totalReturn = parseFloat((portfolioValue - initialFunds).toFixed(2));
  const returnPercent = parseFloat(((totalReturn / initialFunds) * 100).toFixed(2));
  const isProfit = totalReturn >= 0;

  // Chart 1: Doughnut Asset Allocation Chart
  const doughnutData = {
    labels: holdings.length > 0 ? holdings.map(h => h.symbol) : ['Cash'],
    datasets: [{
      data: holdings.length > 0 ? [...holdings.map(h => h.currentValuation), cashBalance] : [cashBalance],
      backgroundColor: [
        '#6366f1', '#10b981', '#f43f5e', '#fbbf24',
        '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
        'rgba(255, 255, 255, 0.08)' // Cash color
      ],
      borderColor: '#0f1115',
      borderWidth: 2,
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#9ca3af',
          font: { family: 'Outfit', size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` $${context.raw.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        }
      }
    }
  };

  // Chart 2: Mock Portfolio Value line chart
  const lineLabels = ['1D Ago', '12H Ago', '6H Ago', '4H Ago', '2H Ago', '1H Ago', 'Current'];
  const baselineValue = 100000.00;

  // Create a realistic line using historical data pointing to our current portfolio value
  const mockHistoricalData = [
    baselineValue,
    baselineValue + (totalReturn * 0.2) + 200,
    baselineValue + (totalReturn * 0.4) - 150,
    baselineValue + (totalReturn * 0.5) + 300,
    baselineValue + (totalReturn * 0.7) - 100,
    baselineValue + (totalReturn * 0.95) + 120,
    portfolioValue
  ];

  const lineData = {
    labels: lineLabels,
    datasets: [{
      label: 'Portfolio Value ($)',
      data: mockHistoricalData,
      borderColor: isProfit ? '#10b981' : '#f43f5e',
      backgroundColor: isProfit ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` $${context.raw.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
      }
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>WELCOME BACK</span>
          <h1 className="page-title">{user?.username || 'Trader'} Dashboard</h1>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-3 mb-4" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-panel card-body d-flex align-items-center gap-3">
          <div className="kpi-icon brand-glow">
            <Briefcase size={24} className="text-gradient" />
          </div>
          <div>
            <div className="text-muted label-sm">PORTFOLIO NET VALUE</div>
            <div className="kpi-value">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="glass-panel card-body d-flex align-items-center gap-3">
          <div className="kpi-icon gain-glow">
            <Wallet size={24} style={{ color: 'var(--color-gain)' }} />
          </div>
          <div>
            <div className="text-muted label-sm">CASH BALANCE</div>
            <div className="kpi-value">${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="glass-panel card-body d-flex align-items-center gap-3">
          <div className={`kpi-icon ${isProfit ? 'gain-glow' : 'loss-glow'}`}>
            {isProfit ? <TrendingUp size={24} style={{ color: 'var(--color-gain)' }} /> : <TrendingDown size={24} style={{ color: 'var(--color-loss)' }} />}
          </div>
          <div>
            <div className="text-muted label-sm">TOTAL RETURNS</div>
            <div className={`kpi-value ${isProfit ? 'text-gain' : 'text-loss'}`}>
              {isProfit ? '+' : ''}${totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <span style={{ fontSize: '0.9rem', marginLeft: '0.5rem', fontWeight: 500 }}>
                ({isProfit ? '+' : ''}{returnPercent}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-2 mb-4" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel">
          <div className="card-header">
            <h3>Performance History</h3>
          </div>
          <div className="card-body" style={{ height: '300px' }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        <div className="glass-panel">
          <div className="card-header">
            <h3>Asset Allocation</h3>
          </div>
          <div className="card-body" style={{ height: '300px', position: 'relative' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Holdings & Watchlist Layout */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Current Holdings */}
        <div className="glass-panel">
          <div className="card-header">
            <h3>Current Holdings</h3>
            <Link to="/market" className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              Buy Stocks
            </Link>
          </div>
          <div className="card-body table-container">
            {holdings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <Briefcase size={40} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h4 style={{ marginBottom: '0.5rem' }}>No stocks in portfolio</h4>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>You haven't bought any stock shares yet. Head to the Stock Market to trade.</p>
                <Link to="/market" className="btn btn-primary">Open Market</Link>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Qty</th>
                    <th>Avg Price</th>
                    <th>Market Price</th>
                    <th>Current Value</th>
                    <th>Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => {
                    const gainPercent = holding.gainLossPercent || 0;
                    const isHoldingProfit = (holding.totalGainLoss || 0) >= 0;

                    return (
                      <tr key={holding._id}>
                        <td>
                          <Link to={`/stocks/${holding.symbol}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 700 }} className="text-gradient">
                            {holding.symbol}
                          </Link>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{holding.name}</div>
                        </td>
                        <td>{holding.quantity}</td>
                        <td>${holding.averagePrice.toFixed(2)}</td>
                        <td>${holding.currentPrice?.toFixed(2) || holding.averagePrice.toFixed(2)}</td>
                        <td>${holding.currentValuation?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</td>
                        <td className={isHoldingProfit ? 'text-gain' : 'text-loss'} style={{ fontWeight: 600 }}>
                          {isHoldingProfit ? '+' : ''}{holding.totalGainLoss?.toFixed(2) || '0.00'}
                          <span style={{ fontSize: '0.8rem', marginLeft: '0.3rem', fontWeight: 500 }}>
                            ({isHoldingProfit ? '+' : ''}{gainPercent}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Watchlist Sidebar */}
        <div className="glass-panel">
          <div className="card-header">
            <h3>My Watchlist</h3>
          </div>
          <div className="card-body" style={{ padding: '1rem' }}>
            {watchlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                <Star size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.875rem' }}>Your watchlist is empty.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Click the star icon in the stock market to watch stocks.</p>
              </div>
            ) : (
              <div className="watchlist-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {watchlist.map((stock) => {
                  const isStockProfit = stock.change >= 0;
                  return (
                    <Link to={`/stocks/${stock.symbol}`} key={stock._id} className="watchlist-item glass-panel card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '0.75rem 1rem', transition: 'transform 0.2s' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }} className="text-gradient">{stock.symbol}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>${stock.price.toFixed(2)}</div>
                        <span className={`badge ${isStockProfit ? 'badge-gain' : 'badge-loss'}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                          {isStockProfit ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-muted" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
