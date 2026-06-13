import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';

const mockManager = {
  id: 'usr-2',
  email: 'manager@ecotrack.fr',
  full_name: 'Manager Test',
  role: 'MANAGER' as const,
  status: 'ACTIVE' as const,
  created_at: '2026-01-01T00:00:00Z',
};

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('isAuthenticated est false sans token', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('isAuthenticated est true avec token et user', () => {
    useAuthStore.setState({ token: 'tok', user: mockManager });
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('hasRole retourne true pour le rôle exact de l\'utilisateur', () => {
    useAuthStore.setState({ token: 'tok', user: mockManager });
    const { result } = renderHook(() => useAuth());
    expect(result.current.hasRole(['MANAGER'])).toBe(true);
    expect(result.current.hasRole(['MANAGER', 'ADMIN'])).toBe(true);
  });

  it('hasRole retourne false pour un rôle non détenu', () => {
    useAuthStore.setState({ token: 'tok', user: mockManager });
    const { result } = renderHook(() => useAuth());
    expect(result.current.hasRole(['CITIZEN'])).toBe(false);
    expect(result.current.hasRole(['ADMIN'])).toBe(false);
  });

  it('hasRole retourne false quand aucun utilisateur n\'est connecté', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.hasRole(['MANAGER'])).toBe(false);
  });
});
