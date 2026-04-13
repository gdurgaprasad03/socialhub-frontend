import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from '@/lib/axiosInstance';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axiosInstance.post('/login/', { username, password });
          const user = data.user || { id: data.id, email: data.email, name: data.name || username };
          const token = data.token || data.access;
          const refreshToken = data.refresh;
          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false, error: null });
        } catch (error: any) {
          console.error("Login error:", error.response?.data);
          let errorMessage = 'Invalid credentials';
          
          if (error.response?.data) {
            const data = error.response.data;
            if (typeof data === 'string') {
              errorMessage = data;
            } else if (data.error && typeof data.error === 'string') {
              errorMessage = data.error;
            } else if (data.detail && typeof data.detail === 'string') {
              errorMessage = data.detail;
            } else if (data.message && typeof data.message === 'string') {
              errorMessage = data.message;
            } else if (typeof data === 'object') {
              // Extract all values and join them as strings
              errorMessage = Object.values(data)
                .flat()
                .filter(v => typeof v === 'string')
                .join(' ') || 'Invalid credentials';
            }
          }
          
          set({ isLoading: false, error: errorMessage });
          throw errorMessage;
        }
      },
      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axiosInstance.post('/register/', { username: name, email, password });
          const user = data.user || { id: data.id, email: data.email, name: data.name || name };
          const token = data.token || data.access;
          const refreshToken = data.refresh;
          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false, error: null });
        } catch (error: any) {
          console.error("Register error:", error.response?.data);
          let errorMessage = 'Registration failed';
          
          if (error.response?.data) {
            const data = error.response.data;
            if (typeof data === 'string') {
              errorMessage = data;
            } else if (data.error && typeof data.error === 'string') {
              errorMessage = data.error;
            } else if (data.detail && typeof data.detail === 'string') {
              errorMessage = data.detail;
            } else if (data.message && typeof data.message === 'string') {
              errorMessage = data.message;
            } else if (typeof data === 'object') {
              errorMessage = Object.values(data)
                .flat()
                .filter(v => typeof v === 'string')
                .join(' ') || 'Registration failed';
            }
          }
          
          set({ isLoading: false, error: errorMessage });
          throw errorMessage;
        }
      },
      logout: async () => {
        const { refreshToken } = get();
        try {
          await axiosInstance.post('/logout/', { refresh: refreshToken });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, error: null });
        }
      },
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      clearError: () => set({ error: null }),
    }),
    { 
      name: 'socialhub-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
