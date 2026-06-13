import { api } from '@/lib/axios';
import type { AlertOut } from '@/types';

export const alertService = {
  list: () =>
    api.get<AlertOut[] | { items: AlertOut[] }>('/alerts').then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.items ?? []);
    }),

  acknowledge: (id: string) => api.post(`/alerts/${id}/acknowledge`),
};
