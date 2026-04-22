import { create } from 'zustand';
import axiosInstance from '@/lib/axiosInstance';
import type { Platform } from './postStore';

export interface ConnectedAccount {
  id?: number;
  platform: Platform;
  username?: string;
  connected?: boolean;
  avatar?: string;
  platform_username: string;
  expires_at?: string;
}

interface AccountState {
  accounts: ConnectedAccount[];
  isConnecting: Platform | null;
  isLoading: boolean;
  fetchAccounts: () => Promise<void>;
  connectAccount: (data: {
    platform: Platform;
    access_token: string;
    refresh_token?: string;
    platform_username: string;
    expires_at: string;
  }) => Promise<void>;
  startConnection: (platform: Platform) => Promise<void>;
  completeCallback: (platform: string, params: Record<string, string>) => Promise<void>;
  disconnectAccount: (id: number) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isConnecting: null,
  isLoading: false,
  fetchAccounts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get('/social-accounts/');
      set({ accounts: Array.isArray(data) ? data : data.results || [], isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to fetch accounts';
      throw errorMessage;
    }
  },
  connectAccount: async (payload) => {
    set({ isConnecting: payload.platform });
    try {
      const { data } = await axiosInstance.post('/social-accounts/', payload);
      set((state) => ({
        accounts: [...state.accounts, data],
        isConnecting: null,
      }));
    } catch (error: any) {
      set({ isConnecting: null });
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.response?.data ? Object.values(error.response.data).flat().join(' ') : 'Failed to connect account');
      throw errorMessage;
    }
  },
  startConnection: async (platform: Platform) => {
    const key = `start-${platform}`;
    if (inFlightPromises.has(key)) return inFlightPromises.get(key);

    const promise = (async () => {
      set({ isConnecting: platform });
      try {
        const callbackUrl = `${import.meta.env.VITE_CALLBACK_BASE_URL || window.location.origin}/dashboard/accounts/callback/${platform}`;
        const response = await axiosInstance.get(`/social-connect/${platform}/start/`, {
          params: { redirect_uri: callbackUrl, next: callbackUrl }
        });
        const responseData = response.data;

        if (responseData.status === 'error') {
          throw new Error(responseData.message || 'The application failed to start the connection.');
        }

        const authUrl = responseData.auth_url || responseData.url || responseData.data?.auth_url;
        if (authUrl) {
          if (authUrl.includes('/api/social-accounts/')) {
            const urlObj = new URL(authUrl);
            const errorMsg = urlObj.searchParams.get('message') || 'Connection failed before even starting.';
            throw new Error(errorMsg);
          }
          window.location.href = authUrl;
        } else {
          throw new Error(`The API did not return a connection URL.`);
        }
      } catch (error: any) {
        set({ isConnecting: null });
        throw error.response?.data?.message || error.message || 'Connection start failed';
      } finally {
        setTimeout(() => inFlightPromises.delete(key), 1000);
      }
    })();

    inFlightPromises.set(key, promise);
    return promise;
  },

  completeCallback: async (platform: string, params: Record<string, string>) => {
    // The backend already handled the OAuth exchange and saved the account
    // before redirecting the browser here. Just read the status and refresh.
    set({ isLoading: true });
    try {
      if (params.status === 'error') {
        throw params.message || 'Social connection failed';
      }
      // Refresh accounts list to pick up the newly connected account
      const { data } = await axiosInstance.get('/social-accounts/');
      set({ accounts: Array.isArray(data) ? data : data.results || [], isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error.response?.data?.message || error.response?.data?.error || error;
    }
  },
  disconnectAccount: async (id) => {
    await axiosInstance.delete(`/social-accounts/${id}/`);
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    }));
    // Force a fresh fetch to ensure consistency
    const { data } = await axiosInstance.get('/social-accounts/');
    set({ accounts: Array.isArray(data) ? data : data.results || [] });
  },
}));

const inFlightPromises = new Map<string, Promise<any>>();
