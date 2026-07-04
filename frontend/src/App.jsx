import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { loadUserProfile } from './store/authSlice.js';
import { fetchWatchlist } from './store/stockSlice.js';
import Sidebar from './components/Sidebar.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Market from './pages/Market.jsx';
import StockDetail from './pages/StockDetail.jsx';
import Transactions from './pages/Transactions.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#08090c' }}>
        <div className="text-muted" style={{ fontSize: '1.25rem' }}>Loading SB Stocks...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// Admin Route wrapper
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(loadUserProfile());
      dispatch(fetchWatchlist());
    }
  }, [dispatch, token]);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!isAuthenticated ? <Auth /> : <Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element = {
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/market" element = {
          <ProtectedRoute>
            <Market />
          </ProtectedRoute>
        } />
        
        <Route path="/stocks/:symbol" element = {
          <ProtectedRoute>
            <StockDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/transactions" element = {
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element = {
          <ProtectedRoute>
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer position="bottom-right" theme="dark" />
    </Router>
  );
}

export default App;
