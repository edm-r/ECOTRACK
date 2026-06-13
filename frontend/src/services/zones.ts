import { api } from '@/lib/axios';
import type { ZoneOut, ZoneStats } from '@/types';

export const zoneService = {
  list: () => api.get<ZoneOut[]>('/zones').then((r) => r.data),
  getStats: (id: string) => api.get<ZoneStats>(`/zones/${id}/stats`).then((r) => r.data),
};
