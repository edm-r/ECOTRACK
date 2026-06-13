import { api } from '@/lib/axios';
import type { UserOut, AuditLogOut, PaginatedResponse, UserRole, UserStatus } from '@/types';

export const adminService = {
  // ─── Users ─────────────────────────────────────────────────────────────────

  listUsers: (params?: {
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => api.get<PaginatedResponse<UserOut>>('/users', { params }).then((r) => r.data),

  createUser: (data: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
  }) => api.post<UserOut>('/users', data).then((r) => r.data),

  updateUser: (
    id: string,
    data: { full_name?: string; role?: UserRole; status?: UserStatus }
  ) => api.patch<UserOut>(`/users/${id}`, data).then((r) => r.data),

  deleteUser: (id: string) => api.delete(`/users/${id}`),

  // ─── Audit logs ────────────────────────────────────────────────────────────

  listAuditLogs: (params?: {
    actor?: string;
    action?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) =>
    api.get<PaginatedResponse<AuditLogOut>>('/audit-logs', { params }).then((r) => r.data),
};
