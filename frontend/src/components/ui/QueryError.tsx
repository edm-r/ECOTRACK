import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';

interface QueryErrorProps {
  /** Relance la requête (typiquement `refetch` de TanStack Query). */
  onRetry: () => void;
  /** Message affiché ; valeur par défaut générique. */
  message?: string;
  /** Variante claire (fonds blancs) ou sombre (fonds gray-950). */
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * UX-24 — état d'erreur léger et réutilisable avec bouton « Réessayer ».
 */
export function QueryError({
  onRetry,
  message = 'Impossible de charger les données.',
  tone = 'dark',
  className,
}: QueryErrorProps) {
  const dark = tone === 'dark';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border p-8 text-center',
        dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white',
        className
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full',
          dark ? 'bg-red-500/10' : 'bg-red-100'
        )}
      >
        <AlertTriangle size={20} className="text-red-500" />
      </div>
      <p className={cn('text-sm', dark ? 'text-gray-400' : 'text-gray-600')}>{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        <RefreshCw size={14} />
        Réessayer
      </button>
    </div>
  );
}
