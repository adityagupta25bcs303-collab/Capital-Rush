import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getUserRole,
  setUserRole,
  removeUserRole,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  getStoredTeam,
  setStoredTeam,
  removeStoredTeam,
  getStoredPortfolio,
  setStoredPortfolio,
  removeStoredPortfolio,
  loginParticipant as apiLoginParticipant,
  loginAdmin as apiLoginAdmin,
  getMe
} from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [role, setRole] = useState(() => getUserRole());
  const [loading, setLoading] = useState(() => !getStoredUser() && !!getAuthToken());

  const logout = useCallback(() => {
    removeAuthToken();
    removeUserRole();
    removeStoredUser();
    removeStoredTeam();
    removeStoredPortfolio();
    setUser(null);
    setRole(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setRole(res.user.role);
        setUserRole(res.user.role);
        setStoredUser(res.user);
        if (res.user.team) setStoredTeam(res.user.team);
        if (res.user.portfolio) setStoredPortfolio(res.user.portfolio);
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        console.warn('[Auth] Token invalid or expired during refresh; logging out.');
        logout();
      } else {
        console.log('[Auth] Refresh user deferred (offline / network reconnecting). Preserving session.');
      }
    }
  }, [logout]);

  const initAuth = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      removeStoredUser();
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const res = await getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setRole(res.user.role);
        setUserRole(res.user.role);
        setStoredUser(res.user);
        if (res.user.team) setStoredTeam(res.user.team);
        if (res.user.portfolio) setStoredPortfolio(res.user.portfolio);
      } else {
        logout();
      }
    } catch (err) {
      // ONLY log out if the backend explicitly returned 401 Unauthorized or 403 Forbidden
      if (err.status === 401 || err.status === 403) {
        console.warn('[Auth] Session rejected by server (401/403):', err.message);
        logout();
      } else {
        // Network drop / device sleep wake-up: DO NOT LOG OUT!
        console.warn('[Auth] Network reconnection in progress during init. Retaining local session.');
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Mobile resilience: When phone screen turns back on or user returns to tab, refresh user silently
  useEffect(() => {
    const handleWakeup = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        const token = getAuthToken();
        if (token) {
          refreshUser();
        }
      }
    };

    document.addEventListener('visibilitychange', handleWakeup);
    window.addEventListener('online', handleWakeup);

    return () => {
      document.removeEventListener('visibilitychange', handleWakeup);
      window.removeEventListener('online', handleWakeup);
    };
  }, [refreshUser]);

  const handleLoginParticipant = async (email, password) => {
    const res = await apiLoginParticipant(email, password);
    if (res.success) {
      setAuthToken(res.token);
      setUserRole(res.user.role);
      setStoredUser(res.user);
      if (res.user.team) setStoredTeam(res.user.team);
      if (res.user.portfolio) setStoredPortfolio(res.user.portfolio);
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
      setStoredUser(res.admin);
      setUser(res.admin);
      setRole(res.admin.role);
      return res;
    }
    throw new Error(res.message || 'Login failed');
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
