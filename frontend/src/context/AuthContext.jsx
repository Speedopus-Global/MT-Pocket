import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, try to silently exchange the refresh cookie (if any)
  // for a new access token, so a page refresh doesn't force a re-login.
  useEffect(() => {
    api
      .refresh()
      .then(({ accessToken, user }) => {
        setAccessToken(accessToken);
        setUser(user);
      })
      .catch(() => {
        // No valid session — that's fine, just means "logged out".
      })
      .finally(() => setIsLoading(false));
  }, []);

  const completeLogin = ({ accessToken, user }) => {
    setAccessToken(accessToken);
    setUser(user);
  };

  const updateUser = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const setRole = async (role) => {
    const result = await api.setRole(role, accessToken);
    setUser((u) => (u ? { ...u, role: result.role } : null));
  };

  const logout = async () => {
    try {
      await api.logout(accessToken);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ accessToken, user, isLoading, completeLogin, updateUser, setRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}