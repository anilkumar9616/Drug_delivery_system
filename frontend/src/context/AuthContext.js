import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from localStorage
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Verify token is still valid
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await api.post('/auth/refresh-token', {
        refresh_token: localStorage.getItem('refresh_token')
      });
      
      if (response.data.success) {
        const { access_token, refresh_token, user } = response.data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        setUser(user);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Token verification failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Login failed');
      }

      const { access_token, refresh_token, user } = response.data.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setUser(user);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (email, password, name) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', { email, password, name });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Registration failed');
      }

      // Auto-login after registration
      const loginResult = await login(email, password);
      return loginResult;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await api.post('/auth/logout', {});
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setError(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    setError,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
