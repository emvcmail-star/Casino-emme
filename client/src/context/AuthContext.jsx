import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const data = await api.post('/auth/register', { username, email, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    setToken(null);
    setUser(null);
  };

  const updateCredits = (credits) => {
    setUser((u) => (u ? { ...u, credits } : u));
  };

  const updateUser = (patch) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshMe, updateCredits, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
