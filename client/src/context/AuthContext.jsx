import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('rf_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        if (data.success) {
          setUser(data.user);
          if (data.currentWorkspace?._id) {
            localStorage.setItem('rf_active_workspace', data.currentWorkspace._id);
          }
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('rf_token');
        localStorage.removeItem('rf_active_workspace');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('rf_token', data.token);
      if (data.workspace?._id) {
        localStorage.setItem('rf_active_workspace', data.workspace._id);
      }
      setUser(data.user);
      return data;
    }
  };

  const register = async (name, email, password, companyName) => {
    const { data } = await api.post('/auth/register', { name, email, password, companyName });
    if (data.success) {
      localStorage.setItem('rf_token', data.token);
      if (data.workspace?._id) {
        localStorage.setItem('rf_active_workspace', data.workspace._id);
      }
      setUser(data.user);
      return data;
    }
  };

  const logout = () => {
    localStorage.removeItem('rf_token');
    localStorage.removeItem('rf_active_workspace');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
