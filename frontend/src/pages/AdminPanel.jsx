import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createStockAdmin, updateStockAdmin, deleteStockAdmin, fetchStocks } from '../store/stockSlice.js';
import { Plus, Trash2, Edit2, ShieldAlert, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminPanel = () => {
  const dispatch = useDispatch();
  const { stocks } = useSelector((state) => state.stocks);

  // New stock form state
  const [newStock, setNewStock] = useState({
    symbol: '',
    name: '',
    price: ''
  });

  // Edit stock price inline state
  const [editSymbol, setEditSymbol] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    dispatch(fetchStocks());
  }, [dispatch]);

  const handleCreateStock = async (e) => {
    e.preventDefault();
    if (!newStock.symbol || !newStock.name || !newStock.price) {
      return toast.warning('Please fill in all fields');
    }
    
    const priceVal = parseFloat(newStock.price);
    if (isNaN(priceVal) || priceVal <= 0) {
      return toast.warning('Price must be a positive number');
    }

    try {
      await dispatch(createStockAdmin({
        symbol: newStock.symbol.toUpperCase(),
        name: newStock.name,
        price: priceVal
      })).unwrap();
      
      toast.success(`Successfully listed ${newStock.symbol.toUpperCase()}!`);
      setNewStock({ symbol: '', name: '', price: '' });
    } catch (err) {
      toast.error(err || 'Failed to list stock');
    }
  };

  const handleUpdatePrice = async (symbol) => {
    const priceVal = parseFloat(editPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      return toast.warning('Price must be a positive number');
    }

    try {
      await dispatch(updateStockAdmin({
        symbol,
        data: { price: priceVal }
      })).unwrap();
      toast.success(`Updated price of ${symbol} to $${priceVal.toFixed(2)}`);
      setEditSymbol(null);
      setEditPrice('');
    } catch (err) {
      toast.error(err || 'Failed to update price');
    }
  };

  const handleDeleteStock = async (symbol) => {
    if (window.confirm(`Are you sure you want to delete ${symbol} from the stock exchange?`)) {
      try {
        await dispatch(deleteStockAdmin(symbol)).unwrap();
        toast.success(`Stock ${symbol} deleted successfully.`);
      } catch (err) {
        toast.error(err || 'Failed to delete stock');
      }
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <span className="text-muted" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldAlert size={14} style={{ color: 'var(--color-brand)' }} /> ADMINISTRATOR ROOT ACCESS
          </span>
          <h1 className="page-title">Admin Management Panel</h1>
        </div>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
        {/* Listing Form */}
        <div className="glass-panel">
          <div className="card-header">
            <h3>List New Stock Asset</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateStock}>
              <div className="form-group">
                <label className="form-label" htmlFor="stock-symbol">Ticker Symbol (e.g. META)</label>
                <input
                  type="text"
                  id="stock-symbol"
                  name="symbol"
                  className="form-control"
                  placeholder="META"
                  maxLength="5"
                  value={newStock.symbol}
                  onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="stock-name">Company Name</label>
                <input
                  type="text"
                  id="stock-name"
                  name="name"
                  className="form-control"
                  placeholder="Meta Platforms Inc."
                  value={newStock.name}
                  onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="stock-price">Initial Share Price ($)</label>
                <input
                  type="number"
                  id="stock-price"
                  name="price"
                  className="form-control"
                  placeholder="505.30"
                  step="0.01"
                  min="0.01"
                  value={newStock.price}
                  onChange={(e) => setNewStock({ ...newStock, price: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                <Plus size={18} /> List Asset
              </button>
            </form>
          </div>
        </div>

        {/* Inventory Management Table */}
        <div className="glass-panel">
          <div className="card-header">
            <h3>Manage Exchange Inventory</h3>
          </div>
          <div className="card-body table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company Name</th>
                  <th>Current Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const isEditing = editSymbol === stock.symbol;
                  return (
                    <tr key={stock._id}>
                      <td style={{ fontWeight: 700 }} className="text-gradient">{stock.symbol}</td>
                      <td className="text-muted">{stock.name}</td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <input
                              type="number"
                              className="form-control"
                              style={{ width: '90px', padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                              step="0.01"
                              min="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              required
                            />
                            <button onClick={() => handleUpdatePrice(stock.symbol)} className="btn btn-success" style={{ padding: '0.4rem', borderRadius: '6px' }}>
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditSymbol(null)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px' }}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 700 }}>${stock.price.toFixed(2)}</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {!isEditing && (
                            <button 
                              onClick={() => { setEditSymbol(stock.symbol); setEditPrice(stock.price.toString()); }} 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteStock(stock.symbol)} 
                            className="btn btn-danger" 
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
