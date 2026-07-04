import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { fetchStocks, updateStockPrices, toggleWatchlist } from '../store/stockSlice.js';
import api from '../utils/api.js';
import { Search, Star, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-toastify';

// Sub-component for individual stock rows that handles flash animations on live updates
const StockRow = ({ stock, isWatched, onToggleWatch }) => {
  const [flashClass, setFlashClass] = useState('');
  const prevPriceRef = useRef(stock.price);

  useEffect(() => {
    if (stock.price > prevPriceRef.current) {
      setFlashClass('flash-up');
      const timer = setTimeout(() => setFlashClass(''), 800);
      prevPriceRef.current = stock.price;
      return () => clearTimeout(timer);
    } else if (stock.price < prevPriceRef.current) {
      setFlashClass('flash-down');
      const timer = setTimeout(() => setFlashClass(''), 800);
      prevPriceRef.current = stock.price;
      return () => clearTimeout(timer);
    }
  }, [stock.price]);

  const isProfit = stock.change >= 0;

  return (
    <tr className={flashClass}>
      <td>
        <button 
          onClick={() => onToggleWatch(stock.symbol)} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isWatched ? '#fbbf24' : '#4b5563' }}
        >
          <Star size={18} fill={isWatched ? '#fbbf24' : 'transparent'} />
        </button>
      </td>
      <td>
        <RouterLink to={`/stocks/${stock.symbol}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 700 }} className="text-gradient">
          {stock.symbol}
        </RouterLink>
      </td>
      <td className="text-muted">{stock.name}</td>
      <td style={{ fontWeight: 700 }}>${stock.price.toFixed(2)}</td>
      <td className={isProfit ? 'text-gain' : 'text-loss'} style={{ fontWeight: 600 }}>
        {isProfit ? '+' : ''}{stock.change.toFixed(2)}
      </td>
      <td>
        <span className={`badge ${isProfit ? 'badge-gain' : 'badge-loss'}`}>
          {isProfit ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </span>
      </td>
      <td>
        <RouterLink to={`/stocks/${stock.symbol}`} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          Trade
        </RouterLink>
      </td>
    </tr>
  );
};

const Market = () => {
  const dispatch = useDispatch();
  const { stocks, watchlist, loading } = useSelector((state) => state.stocks);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('symbol'); // symbol, price, changePercent
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  useEffect(() => {
    dispatch(fetchStocks());

    const interval = setInterval(async () => {
      try {
        const response = await api.get('/stocks');
        dispatch(updateStockPrices(response.data));
      } catch (error) {
        console.error('Error polling stocks:', error.message);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleToggleWatchlist = async (symbol) => {
    const isWatched = watchlist.some(w => w.symbol === symbol);
    try {
      await dispatch(toggleWatchlist({ symbol, isWatched })).unwrap();
      toast.success(isWatched ? `Removed ${symbol} from watchlist` : `Added ${symbol} to watchlist`);
    } catch (err) {
      toast.error('Watchlist action failed');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter stocks
  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
      stock.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort stocks
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'symbol') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  return (
    <div className="market-page">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>REAL-TIME US MARKET</span>
          <h1 className="page-title">Stock Directory</h1>
        </div>
        
        {/* Search Input */}
        <div className="input-with-icon" style={{ width: '100%', maxWidth: '300px' }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search symbol or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel">
        <div className="card-header" style={{ borderBottom: 'none' }}>
          <h3>Listed Stocks</h3>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Showing {sortedStocks.length} assets</span>
        </div>

        <div className="card-body table-container" style={{ paddingTop: 0 }}>
          {loading && stocks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p className="text-muted">Loading stock list...</p>
            </div>
          ) : sortedStocks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p className="text-muted">No stocks found matching "{search}"</p>
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('symbol')}>
                    Symbol <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                  </th>
                  <th>Company Name</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>
                    Price <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                  </th>
                  <th>Change</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('changePercent')}>
                    % Change <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                  </th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock) => {
                  const isWatched = watchlist.some((w) => w.symbol === stock.symbol);
                  return (
                    <StockRow
                      key={stock._id}
                      stock={stock}
                      isWatched={isWatched}
                      onToggleWatch={handleToggleWatchlist}
                    />
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Market;
