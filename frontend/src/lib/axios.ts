import axios, { AxiosHeaders } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import type { TokenResponse } from '@/types';

declare module 'axios' {
  interface AxiosRequestConfig {
    _suppressErrorToast?: boolean;
  }
  interface InternalAxiosRequestConfig {
    _suppressErrorToast?: boolean;
    _retry?: boolean;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── localStorage helpers (single source = Zustand persisted store) ───────────

interface PersistedAuth {
  token: string | null;
  refreshToken: string | null;
  user: unknown;
}

function readPersistedAuth(): PersistedAuth | null {
  const raw = localStorage.getItem('ecotrack-auth');
  if (!raw) return null;
  try {
    const { state } = JSON.parse(raw) as { state: PersistedAuth };
    return state ?? null;
  } catch {
    return null;
  }
}

function clearSessionAndRedirect(message = 'Session expirée, veuillez vous reconnecter.') {
  useAuthStore.getState().logout();
  localStorage.removeItem('ecotrack-auth');
  toast.error(message);
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// ─── Request: inject JWT ──────────────────────────────────────────────────────

api.interceptors.request.use((config) => {
  const state = readPersistedAuth();
  if (state?.token) {
    config.headers.Authorization = `Bearer ${state.token}`;
  }
  return config;
});

// ─── Single-flight refresh on 401 ─────────────────────────────────────────────

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(refreshToken: string): Promise<string> {
  // Use a bare axios call (NOT `api`) so this request never re-enters the
  // response interceptor and cannot trigger a refresh loop.
  const { data } = await axios.post<TokenResponse>(
    `${BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );
  // Persist the rotated tokens + user into the Zustand store (which writes
  // through to localStorage via the persist middleware).
  useAuthStore.getState().setSession(data.access_token, data.refresh_token, data.user);
  return data.access_token;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config as InternalAxiosRequestConfig | undefined;

    const isRefreshCall = original?.url?.includes('/auth/refresh') ?? false;

    if (status === 401 && original && !original._retry && !isRefreshCall) {
      const state = readPersistedAuth();
      const refreshToken = state?.refreshToken;

      if (!refreshToken) {
        clearSessionAndRedirect();
        return Promise.reject(error);
      }

      original._retry = true;

      try {
        // Coalesce concurrent 401s into a single refresh request.
        refreshPromise = refreshPromise ?? refreshAccessToken(refreshToken);
        const newToken = await refreshPromise;
        refreshPromise = null;

        // Retry the original request once with the fresh access token.
        const headers = AxiosHeaders.from(original.headers);
        headers.set('Authorization', `Bearer ${newToken}`);
        original.headers = headers;
        return api(original);
      } catch (refreshErr) {
        refreshPromise = null;
        clearSessionAndRedirect();
        return Promise.reject(refreshErr);
      }
    }

    if (status === 401) {
      // Refresh path exhausted or unavailable → force re-login.
      clearSessionAndRedirect();
    } else if (status === 403 && !original?._suppressErrorToast) {
      toast.error('Accès refusé.');
    } else if (status != null && status >= 500) {
      toast.error('Erreur serveur, veuillez réessayer.');
    }

    return Promise.reject(error);
  }
);

export default api;
