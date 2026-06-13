import { api } from '@/lib/axios';
import type { KpiDashboard, TopZone, ContainerPrediction, TimeseriesPoint } from '@/types';

export const analyticsService = {
  getKpis: () => api.get<KpiDashboard>('/analytics/kpis').then((r) => r.data),

  getTimeseries: (params: {
    metric: 'avg_fill' | 'report_count';
    zone?: string;
    from?: string;
    to?: string;
    granularity?: 'hour' | 'day';
  }) =>
    api
      .get<{ points: TimeseriesPoint[] }>('/analytics/timeseries', { params })
      .then((r) => r.data?.points ?? []),

  getTopZones: (limit = 5) =>
    api
      .get<TopZone[] | { items: TopZone[] }>('/analytics/zones/top', { params: { limit } })
      .then((r) => {
        const d = r.data;
        return Array.isArray(d) ? d : (d.items ?? []);
      }),

  getHeatmap: (params?: { zone?: string; days?: number }) =>
    api.get('/analytics/heatmap', { params }).then((r) => r.data),

  getPrediction: (containerId: string) =>
    api.get<ContainerPrediction>(`/analytics/predictions/containers/${containerId}`).then((r) => r.data),
};
