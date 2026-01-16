import React, { createContext, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, UserRole, AuthState } from '@/types';
import { authApi } from '@/api/auth';
import { setGlobalLogoutHandler, setGlobalUnauthorizedHandler } from '@/api/client';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'accessToken';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    navigate('/login');
  }, [navigate]);

  const handleUnauthorized = useCallback(() => {
    navigate('/app/unauthorized');
  }, [navigate]);

  // Set up global handlers
  useEffect(() => {
    setGlobalLogoutHandler(logout);
    setGlobalUnauthorizedHandler(handleUnauthorized);
  }, [logout, handleUnauthorized]);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const user = await authApi.me();
        setState({
          user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    setState({
      user: response.user,
      accessToken: response.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const register = useCallback(async (email: string, password: string, role: UserRole) => {
    await authApi.register({ email, password, role });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
