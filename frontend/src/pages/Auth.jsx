import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser, registerUser, clearError } from '../store/authSlice.js';
import { TrendingUp, User, Mail, Lock, Shield } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [isLogin, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      if (!formData.email || !formData.password) {
        return toast.warning('Please enter email and password');
      }
      dispatch(loginUser({ email: formData.email, password: formData.password }));
    } else {
      if (!formData.username || !formData.email || !formData.password) {
        return toast.warning('Please fill in all fields');
      }
      dispatch(registerUser(formData));
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-glow-ball auth-glow-1"></div>
      <div className="auth-glow-ball auth-glow-2"></div>
      
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-logo">
            <TrendingUp size={36} className="brand-logo" />
          </div>
          <h2>{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
          <p className="text-muted">{isLogin ? 'Enter your details to manage your virtual portfolio' : 'Create an account to begin paper trading without risk'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  name="username"
                  id="username"
                  className="form-control"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                name="email"
                id="email"
                className="form-control"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                name="password"
                id="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="role">Account Role (Testing Toggle)</label>
              <div className="input-with-icon">
                <Shield size={18} className="input-icon" />
                <select
                  name="role"
                  id="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">Standard User (Practice Paper Trading)</option>
                  <option value="admin">Administrator (Manage Stock Lists)</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
          <button onClick={() => setIsLogin(!isLogin)} className="btn-link">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
