import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { 
  LayoutDashboard, 
  TrendingUp, 
  History, 
  ShieldAlert, 
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth');
  };

  const formattedBalance = user?.balance !== undefined
    ? user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';

  return (
    <aside className="sidebar-container">
      <div className="sidebar-brand">
        <TrendingUp size={28} className="brand-logo" />
        <span className="brand-name">SB <span className="text-gradient">Stocks</span></span>
      </div>

      <div className="user-profile-panel">
        <div className="user-avatar">
          {user?.username ? user.username[0].toUpperCase() : 'U'}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.username || 'Trader'}</div>
          <span className={`role-badge ${user?.role === 'admin' ? 'role-admin' : 'role-user'}`}>
            {user?.role === 'admin' ? 'Admin' : 'User'}
          </span>
        </div>
        <div className="user-balance-card">
          <div className="balance-label">VIRTUAL CASH</div>
          <div className="balance-value">${formattedBalance}</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/market" 
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
        >
          <TrendingUp size={20} />
          <span>Stock Market</span>
        </NavLink>

        <NavLink 
          to="/transactions" 
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
        >
          <History size={20} />
          <span>Transactions</span>
        </NavLink>

        {user?.role === 'admin' && (
          <NavLink 
            to="/admin" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <ShieldAlert size={20} />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <button onClick={handleLogout} className="btn-logout">
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
