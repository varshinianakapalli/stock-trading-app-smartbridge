import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStockDetail, toggleWatchlist, updateStockPrices } from '../store/stockSlice.js';
import { buyStockAction, sellStockAction, fetchHoldings } from '../store/portfolioSlice.js';
import api from '../utils/api.js';
import { Line } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import { ArrowLeft, Star, TrendingUp, TrendingDown, Info } from 'lucide-react';

const StockDetail = () => {
  const { symbol } = useParams();
  const dispatch = useDispatch();
  const uppercaseSymbol = symbol.toUpperCase();

  const { selectedStock, watchlist, detailLoading } = useSelector((state) => state.stocks);
  const { holdings, tradeLoading } = useSelector((state) => state.portfolio);
  const { user } = useSelector((state) => state.auth);

  const [quantity, setQuantity] = useState(1);
  const [tradeType, setTradeType] = useState('BUY'); // BUY or SELL

  // Load stock detail, holdings on mount
  useEffect(() => {
    dispatch(fetchStockDetail(uppercaseSymbol));
    dispatch(fetchHoldings());

    // Poll for live stock price updates
    const interval = setInterval(async () => {
      try {
        const response = await api.get('/stocks');
        dispatch(updateStockPrices(response.data));
      } catch (error) {
        console.error('Error polling stock detail:', error.message);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch, uppercaseSymbol]);

  // Find if stock is watched
  const isWatched = watchlist.some((w) => w.symbol === uppercaseSymbol);

  // Find user holding for this stock
  const userHolding = holdings.find((h) => h.symbol === uppercaseSymbol) || { quantity: 0, averagePrice: 0 };

  const handleToggleWatch = async () => {
    try {
      await dispatch(toggleWatchlist({ symbol: uppercaseSymbol, isWatched })).unwrap();
      toast.success(isWatched ? `Removed ${uppercaseSymbol} from watchlist` : `Added ${uppercaseSymbol} to watchlist`);
    } catch (err) {
      toast.error('Watchlist action failed');
    }
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return toast.warning('Please enter a valid quantity');
    }

    try {
      if (tradeType === 'BUY') {
        await dispatch(buyStockAction({ symbol: uppercaseSymbol, quantity: qty })).unwrap();
        toast.success(`Successfully bought ${qty} shares of ${uppercaseSymbol}!`);
      } else {
        await dispatch(sellStockAction({ symbol: uppercaseSymbol, quantity: qty })).unwrap();
        toast.success(`Successfully sold ${qty} shares of ${uppercaseSymbol}!`);
      }
      setQuantity(1);
      // Reload holdings and profile to sync balance
      dispatch(fetchHoldings());
    } catch (err) {
      toast.error(err || 'Order failed');
    }
  };

  if (detailLoading && !selectedStock) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p className="text-muted">Loading stock details...</p>
      </div>
    );
  }

  if (!selectedStock) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stock Not Found</h2>
        <Link to="/market" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Market
        </Link>
      </div>
    );
  }

  const currentPrice = selectedStock.price;
  const isProfit = selectedStock.change >= 0;
  const estTotal = parseFloat((currentPrice * quantity).toFixed(2));
  const userCash = user?.balance || 0;

  // Validate order requirements
  const canExecute = 
    tradeType === 'BUY' 
      ? userCash >= estTotal 
      : userHolding.quantity >= quantity;

  // Chart configuration
  const chartLabels = selectedStock.history.map(h => 
    new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  
  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: `${selectedStock.symbol} Price ($)`,
      data: selectedStock.history.map(h => h.price),
      borderColor: isProfit ? '#10b981' : '#f43f5e',
      backgroundColor: isProfit ? 'rgba(16, 185, 129, 0.03)' : 'rgba(244, 63, 94, 0.03)',
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      pointHoverRadius: 5,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` $${context.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
      }
    }
  };

  return (
    <div className="stock-detail-page">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/market" className="text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Market
        </Link>
      </div>

      {/* Stock Header Panel */}
      <div className="glass-panel card-body mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }} className="text-gradient">{selectedStock.symbol}</h1>
              <button 
                onClick={handleToggleWatch} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isWatched ? '#fbbf24' : '#4b5563', padding: '0.25rem' }}
              >
                <Star size={24} fill={isWatched ? '#fbbf24' : 'transparent'} />
              </button>
            </div>
            <h2 className="text-muted" style={{ fontSize: '1.15rem', fontWeight: 400, marginTop: '0.15rem' }}>{selectedStock.name}</h2>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>${currentPrice.toFixed(2)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <span className={`badge ${isProfit ? 'badge-gain' : 'badge-loss'}`} style={{ fontSize: '0.85rem' }}>
              {isProfit ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
            </span>
            <span className={isProfit ? 'text-gain' : 'text-loss'} style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              {isProfit ? '+' : ''}{selectedStock.change.toFixed(2)} Today
            </span>
          </div>
        </div>
      </div>

      {/* Chart and Trading Panel */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.2fr', gap: '1.5rem' }}>
        {/* Price History Chart */}
        <div className="glass-panel">
          <div className="card-header">
            <h3>Price Trend (5s Live Refresh)</h3>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Last updated: {new Date(selectedStock.lastUpdated).toLocaleTimeString()}</span>
          </div>
          <div className="card-body">
            <div style={{ height: '320px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>

            {/* Key Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>TODAY'S HIGH</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--color-gain)' }}>${selectedStock.high?.toFixed(2) || currentPrice.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>TODAY'S LOW</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--color-loss)' }}>${selectedStock.low?.toFixed(2) || currentPrice.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>OPEN PRICE</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem' }}>${(currentPrice - selectedStock.change).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>DATA FEED</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--color-brand)' }}>Simulated</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Terminal Card */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <h3>Trade Terminal</h3>
          </div>
          <div className="card-body">
            {/* Holdings Summary */}
            <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>YOUR HOLDING</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{userHolding.quantity} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>shares</span></div>
                {userHolding.quantity > 0 && (
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Avg Cost: ${userHolding.averagePrice.toFixed(2)}</div>
                )}
              </div>
            </div>

            {/* Buy/Sell Selector */}
            <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <button 
                className="btn" 
                style={{ flex: 1, padding: '0.6rem', borderRadius: 0, backgroundColor: tradeType === 'BUY' ? 'var(--color-gain-glow)' : 'transparent', color: tradeType === 'BUY' ? 'var(--color-gain)' : 'var(--color-text-muted)', border: 'none', borderRight: '1px solid var(--border-color)' }}
                onClick={() => { setTradeType('BUY'); setQuantity(1); }}
              >
                Buy Shares
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, padding: '0.6rem', borderRadius: 0, backgroundColor: tradeType === 'SELL' ? 'var(--color-loss-glow)' : 'transparent', color: tradeType === 'SELL' ? 'var(--color-loss)' : 'var(--color-text-muted)', border: 'none' }}
                onClick={() => { setTradeType('SELL'); setQuantity(1); }}
              >
                Sell Shares
              </button>
            </div>

            <form onSubmit={handleTrade}>
              <div className="form-group">
                <label className="form-label" htmlFor="trade-qty">Quantity (Shares)</label>
                <input
                  type="number"
                  id="trade-qty"
                  className="form-control"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  required
                />
              </div>

              {/* Order Estimates */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1.5rem 0', padding: '0.75rem 0', borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span className="text-muted">Share Price:</span>
                  <span style={{ fontWeight: 600 }}>${currentPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span className="text-muted">Quantity:</span>
                  <span style={{ fontWeight: 600 }}>x {quantity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', marginTop: '0.25rem' }}>
                  <span style={{ fontWeight: 700 }}>Estimated Total:</span>
                  <span style={{ fontWeight: 800, color: 'var(--color-brand)' }}>${estTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>

              {/* Balance Check Indicators */}
              {tradeType === 'BUY' && userCash < estTotal && (
                <div style={{ color: 'var(--color-loss)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem', fontWeight: 500 }}>
                  <Info size={14} /> Insufficient funds. You need ${estTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} but only have ${userCash.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </div>
              )}

              {tradeType === 'SELL' && userHolding.quantity < quantity && (
                <div style={{ color: 'var(--color-loss)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem', fontWeight: 500 }}>
                  <Info size={14} /> Insufficient shares. You only own {userHolding.quantity} shares of {selectedStock.symbol}
                </div>
              )}

              <button 
                type="submit" 
                className={`btn btn-block ${tradeType === 'BUY' ? 'btn-success' : 'btn-danger'}`} 
                disabled={!canExecute || tradeLoading}
              >
                {tradeLoading ? 'Executing Order...' : tradeType === 'BUY' ? 'Execute Buy Order' : 'Execute Sell Order'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
