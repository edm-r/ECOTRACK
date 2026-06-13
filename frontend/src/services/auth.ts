import api from '@/lib/axios';
import type { TokenResponse, UserOut } from '@/types';

export const authService = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const { data } = await api.post<TokenResponse>('/auth/login', { email, password });
    return data;
  },

  // Backend retourne directement TokenResponse (pas besoin de login séparé après register)
  register: async (
    email: string,
    password: string,
    full_name: string
  ): Promise<TokenResponse> => {
    const { data } = await api.post<TokenResponse>('/auth/register', {
      email,
      password,
      full_name,
    });
    return data;
  },

  getMe: async (): Promise<UserOut> => {
    const { data } = await api.get<UserOut>('/users/me');
    return data;
  },

  updateMe: async (payload: { full_name?: string; password?: string }): Promise<UserOut> => {
    const { data } = await api.patch<UserOut>('/users/me', payload);
    return data;
  },
};
