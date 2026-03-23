import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/login/', { email, password });
          const user = data.user || { id: data.id, email: data.email, name: data.name || email.split('@')[0] };
          const token = data.token || data.access;
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/register/', { name, email, password });
          const user = data.user || { id: data.id, email: data.email, name: data.name || name };
          const token = data.token || data.access;
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    { name: 'socialhub-auth' }
  )
);
