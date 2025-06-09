// context/AuthContext.js

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // const login = async (credentials) => {
  //   try {
  //     const response = await api.post('/auth/login', credentials);
  //     const { user, accessToken, refreshToken } = response.data.data;

  //     localStorage.setItem('accessToken', accessToken);
  //     localStorage.setItem('refreshToken', refreshToken);
      
  //     setUser(user);
  //     setIsAuthenticated(true);
      
  //     return { success: true };
  //   } catch (error) {
  //     const message = error.response?.data?.message || 'Login failed';
  //     return { success: false, error: message };
  //   }
  // };

  const login = async (credentials) => {
  try {
    const res = await api.post('/auth/login', credentials);
    const { token, user } = res.data;

    localStorage.setItem('accessToken', token);
    setUser(user);
    setIsAuthenticated(true);

    return { success: true };
  } catch (error) {
    const message = error.response?.data?.message || 'Login failed';
    return { success: false, error: message };
  }
};

  // const register = async (userData) => {
  //   try {
  //     const response = await api.post('/auth/register', userData);
  //     const { user, accessToken, refreshToken } = response.data.data;

  //     localStorage.setItem('accessToken', accessToken);
  //     localStorage.setItem('refreshToken', refreshToken);
      
  //     setUser(user);
  //     setIsAuthenticated(true);
      
  //     return { success: true };
  //   } catch (error) {
  //     const message = error.response?.data?.message || 'Registration failed';
  //     return { success: false, error: message };
  //   }
  // };
const register = async (userData) => {
  try {
    const res = await api.post('/auth/register', userData);
    // Backend returns token & user at the root of res.data
    const { token, user } = res.data;

    localStorage.setItem('accessToken', token);
    // no refresh token for now
    setUser(user);
    setIsAuthenticated(true);

    return { success: true };
  } catch (error) {
    const message = error.response?.data?.message || 'Registration failed';
    return { success: false, error: message };
  }
};
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/auth/login');
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;