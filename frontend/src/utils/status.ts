import type { ContainerStatus } from '@/types';

export const STATUS_CONFIG: Record<
  ContainerStatus,
  { label: string; color: string; bg: string; bgLight: string; dot: string; border: string }
> = {
  NORMAL: {
    label: 'Normal',
    color: 'text-green-500',
    bg: 'bg-green-500',
    bgLight: 'bg-green-500/10',
    dot: '#22c55e',
    border: 'border-green-500',
  },
  WATCH: {
    label: 'Surveillance',
    color: 'text-amber-500',
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-500/10',
    dot: '#f59e0b',
    border: 'border-amber-500',
  },
  CRITICAL: {
    label: 'Critique',
    color: 'text-red-500',
    bg: 'bg-red-500',
    bgLight: 'bg-red-500/10',
    dot: '#ef4444',
    border: 'border-red-500',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    color: 'text-gray-400',
    bg: 'bg-gray-500',
    bgLight: 'bg-gray-500/10',
    dot: '#6b7280',
    border: 'border-gray-500',
  },
  UNKNOWN: {
    label: 'Inconnu',
    color: 'text-blue-400',
    bg: 'bg-blue-400',
    bgLight: 'bg-blue-400/10',
    dot: '#60a5fa',
    border: 'border-blue-400',
  },
};
