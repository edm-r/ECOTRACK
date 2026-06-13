import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

const mockUser = {
  id: 'usr-1',
  email: 'agent@ecotrack.fr',
  full_name: 'Agent Test',
  role: 'AGENT' as const,
  status: 'ACTIVE' as const,
  created_at: '2026-01-01T00:00:00Z',
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('redirige vers /login quand aucun token n\'est présent', () => {
    render(
      <MemoryRouter initialEntries={['/ma-page']}>
        <ProtectedRoute allow={['AGENT']}>
          <div>Contenu protégé</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Contenu protégé')).toBeNull();
  });

  it('affiche le contenu avec token et rôle autorisé', () => {
    useAuthStore.setState({ token: 'valid-token', user: mockUser });
    render(
      <MemoryRouter>
        <ProtectedRoute allow={['AGENT']}>
          <div>Contenu protégé</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('affiche "Accès refusé" avec token valide mais rôle non autorisé', () => {
    useAuthStore.setState({ token: 'valid-token', user: mockUser });
    render(
      <MemoryRouter>
        <ProtectedRoute allow={['ADMIN']}>
          <div>Contenu protégé</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Accès refusé')).toBeInTheDocument();
    expect(screen.queryByText('Contenu protégé')).toBeNull();
  });
});
