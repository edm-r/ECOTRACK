import { api } from '@/lib/axios';
import type { RouteOut, RouteStepOut, RouteOptimizeResponse, PaginatedResponse } from '@/types';

export const routeService = {
  optimize: (data: { zone_id: string; fill_threshold?: number; date?: string }) =>
    api.post<RouteOptimizeResponse>('/routes/optimize', data).then((r) => r.data),

  create: (data: { zone_id: string; fill_threshold?: number; scheduled_date: string }) =>
    api.post<RouteOut>('/routes', data).then((r) => r.data),

  list: (params?: { zone?: string; status?: string; limit?: number; offset?: number }) =>
    api
      .get<PaginatedResponse<RouteOut> | RouteOut[]>('/routes', { params })
      .then((r) => {
        const d = r.data;
        if (Array.isArray(d)) return { items: d, total: d.length, limit: 20, offset: 0 };
        return d as PaginatedResponse<RouteOut>;
      }),

  listMine: () =>
    api
      .get<RouteOut[] | { items: RouteOut[] }>('/routes/mine')
      .then((r) => {
        const d = r.data;
        return Array.isArray(d) ? d : (d.items ?? []);
      }),

  getById: (id: string) => api.get<RouteOut>(`/routes/${id}`).then((r) => r.data),

  assign: (id: string, agent_id: string) =>
    api.patch<RouteOut>(`/routes/${id}/assign`, undefined, { params: { agent_id } }).then((r) => r.data),

  start: (id: string) => api.patch<RouteOut>(`/routes/${id}/start`).then((r) => r.data),

  complete: (id: string) => api.patch<RouteOut>(`/routes/${id}/complete`).then((r) => r.data),

  validateStep: (stepId: string) =>
    api.patch<RouteStepOut>(`/route-steps/${stepId}/validate`).then((r) => r.data),

  issueStep: (stepId: string) =>
    api.patch<RouteStepOut>(`/route-steps/${stepId}/issue`).then((r) => r.data),
};
