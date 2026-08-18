import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { connectChatSocket, disconnectChatSocket } from '../lib/Socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load Refresh
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

  // 2. Socket Connection Management
  useEffect(() => {
    if (!accessToken) {
      disconnectChatSocket();
      return;
    }
    connectChatSocket(accessToken);
    // Do NOT disconnect on cleanup — the socket should persist across
    // re-renders and navigation. It's only disconnected on logout (above).
  }, [accessToken]);

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
  if (!ctx) {
    return {
      accessToken: null,
      user: null,
      isLoading: false,
      completeLogin: () => {},
      updateUser: () => {},
      setRole: async () => {},
      logout: async () => {},
    };
  }
  return ctx;
}