import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, AuthState } from '@/types';
import { authApi } from '@/api/auth';

const TOKEN_KEY = 'accessToken';

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
  setNavigate: (navigate: (path: string) => void) => void;
}

type AuthStore = AuthState & AuthActions & {
  _navigate: ((path: string) => void) | null;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      _navigate: null,

      setNavigate: (navigate) => set({ _navigate: navigate }),

      login: async (email: string, password: string) => {
        const response = await authApi.login({ email, password });
        set({
          user: response.user,
          accessToken: response.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      register: async (email: string, password: string, role: UserRole) => {
        await authApi.register({ email, password, role });
      },

      logout: () => {
        const { _navigate } = get();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        _navigate?.('/login');
      },

      initAuth: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ isLoading: false });
          return;
        }

        try {
          const user = await authApi.me();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
);

// Selectors for common use cases
export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
