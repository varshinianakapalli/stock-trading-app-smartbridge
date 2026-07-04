import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions } from '../store/portfolioSlice.js';
import { Search, History, Filter } from 'lucide-react';

const Transactions = () => {
  const dispatch = useDispatch();
  const { transactions, loading } = useSelector((state) => state.portfolio);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, BUY, SELL

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="transactions-page">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>TRANSACTION LEDGER</span>
          <h1 className="page-title">Trade History</h1>
        </div>

        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '500px' }}>
          {/* Search bar */}
          <div className="input-with-icon" style={{ flex: 1 }}>
            <Search size={18} className="input-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type filter */}
          <div className="input-with-icon" style={{ width: '140px' }}>
            <Filter size={18} className="input-icon" />
            <select
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Orders</option>
              <option value="BUY">Buy Orders</option>
              <option value="SELL">Sell Orders</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="card-header" style={{ borderBottom: 'none' }}>
          <h3>Order History</h3>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Total orders: {filteredTransactions.length}</span>
        </div>

        <div className="card-body table-container" style={{ paddingTop: 0 }}>
          {loading && transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p className="text-muted">Loading trade ledger...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <History size={40} className="text-muted" style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p className="text-muted">No transactions found matching your criteria</p>
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Symbol</th>
                  <th>Order Type</th>
                  <th>Share Price</th>
                  <th>Quantity</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  const date = new Date(tx.timestamp).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr key={tx._id}>
                      <td className="text-muted">{date}</td>
                      <td style={{ fontWeight: 700 }}>{tx.symbol}</td>
                      <td>
                        <span className={`badge ${isBuy ? 'badge-gain' : 'badge-loss'}`} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', width: '55px', justifyContent: 'center' }}>
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>${tx.price.toFixed(2)}</td>
                      <td>{tx.quantity}</td>
                      <td style={{ fontWeight: 700 }} className={isBuy ? 'text-loss' : 'text-gain'}>
                        {isBuy ? '-' : '+'}${tx.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
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

export default Transactions;
