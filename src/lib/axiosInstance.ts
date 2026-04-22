import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// const API_BASE = import.meta.env.VITE_API_URL || 'http://192.168.0.114:9000/api';
const API_BASE = 'https://pseudopregnant-fatless-ila.ngrok-free.dev/api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
    headers: { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },

  // withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  console.log('Token:', token ? 'present' : 'missing', 'URL:', config.url);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${API_BASE}/refresh/`,
          { refresh: refreshToken },
          { headers: { 'ngrok-skip-browser-warning': 'true' } }
        );

        const newToken = data.access || data.token;
        if (!newToken) {
          throw new Error('Refresh response missing access token');
        }

        // Update store with new access token
        useAuthStore.setState({ token: newToken });

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
