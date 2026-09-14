import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getUserRole,
  setUserRole,
  removeUserRole,
  loginParticipant as apiLoginParticipant,
  loginAdmin as apiLoginAdmin,
  getMe
} from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(getUserRole());
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setRole(res.user.role);
        setUserRole(res.user.role);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const handleLoginParticipant = async (email, password) => {
    const res = await apiLoginParticipant(email, password);
    if (res.success) {
      setAuthToken(res.token);
      setUserRole(res.user.role);
      setUser(res.user);
      setRole(res.user.role);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const handleLoginAdmin = async (adminId, password) => {
    const res = await apiLoginAdmin(adminId, password);
    if (res.success) {
      setAuthToken(res.token);
      setUserRole(res.admin.role);
      setUser(res.admin);
      setRole(res.admin.role);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    removeAuthToken();
    removeUserRole();
    setUser(null);
    setRole(null);
  };

  const refreshUser = async () => {
    try {
      const res = await getMe();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        loginParticipant: handleLoginParticipant,
        loginAdmin: handleLoginAdmin,
        logout,
        refreshUser,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
