import { api } from '@/lib/axios';
import type { ReportOut, PaginatedResponse } from '@/types';

export const reportService = {
  create: (data: { container_id: string; type: string; comment?: string }) =>
    api.post<ReportOut>('/reports', data).then((r) => r.data),

  listMine: () =>
    api.get<ReportOut[] | { items: ReportOut[] }>('/reports/mine').then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.items ?? []);
    }),

  listAll: (params?: { limit?: number; offset?: number; status?: string }) =>
    api.get<PaginatedResponse<ReportOut>>('/reports', { params }).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    api.patch<ReportOut>(`/reports/${id}/status`, { status }).then((r) => r.data),
};
