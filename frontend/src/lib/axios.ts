import axios from 'axios';
import { toast } from 'sonner';

declare module 'axios' {
  interface AxiosRequestConfig {
    _suppressErrorToast?: boolean;
  }
  interface InternalAxiosRequestConfig {
    _suppressErrorToast?: boolean;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT on every request
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('ecotrack-auth');
  if (raw) {
    try {
      const { state } = JSON.parse(raw) as { state: { token: string | null } };
      if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // malformed storage — ignore
    }
  }
  return config;
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('ecotrack-auth');
      toast.error('Session expirée, veuillez vous reconnecter.');
      window.location.href = '/login';
    } else if (status === 403 && !error.config?._suppressErrorToast) {
      toast.error('Accès refusé.');
    } else if (status != null && status >= 500) {
      toast.error('Erreur serveur, veuillez réessayer.');
    }

    return Promise.reject(error);
  }
);

export default api;
