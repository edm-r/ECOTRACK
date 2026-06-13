import { api } from '@/lib/axios';
import type { ContainerMapItem, ContainerOut, PaginatedResponse, Measurement, ContainerStatus } from '@/types';

export interface ContainerFilters {
  zone?: string;
  status?: ContainerStatus;
  min_fill?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export const containerService = {
  getMapItems: () =>
    api.get<ContainerMapItem[] | { items: ContainerMapItem[] }>('/containers/map').then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.items ?? []);
    }),

  list: (filters: ContainerFilters = {}) =>
    api
      .get<PaginatedResponse<ContainerOut>>('/containers', { params: filters })
      .then((r) => r.data),

  getById: (id: string) => api.get<ContainerOut>(`/containers/${id}`).then((r) => r.data),

  getMeasurements: (id: string) =>
    api.get<Measurement[]>(`/containers/${id}/measurements`).then((r) => r.data),

  create: (data: Partial<ContainerOut>) =>
    api.post<ContainerOut>('/containers', data).then((r) => r.data),

  update: (id: string, data: Partial<ContainerOut>) =>
    api.patch<ContainerOut>(`/containers/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/containers/${id}`),
};
