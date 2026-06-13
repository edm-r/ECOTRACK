import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/auth';

const mockUser = {
  id: 'usr-1',
  email: 'test@ecotrack.fr',
  full_name: 'Test User',
  role: 'CITIZEN' as const,
  status: 'ACTIVE' as const,
  created_at: '2026-01-01T00:00:00Z',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('démarre sans session (token null, user null)', () => {
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it('setSession stocke le token et l\'utilisateur', () => {
    useAuthStore.getState().setSession('jwt-tok', mockUser);
    const { token, user } = useAuthStore.getState();
    expect(token).toBe('jwt-tok');
    expect(user?.email).toBe('test@ecotrack.fr');
    expect(user?.role).toBe('CITIZEN');
  });

  it('logout vide le token et l\'utilisateur', () => {
    useAuthStore.getState().setSession('jwt-tok', mockUser);
    useAuthStore.getState().logout();
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });
});
