import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Flame, AlertTriangle, CheckCheck, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { alertService } from '@/services/alerts';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import type { AlertOut } from '@/types';

// ─── Single alert row ─────────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: AlertOut }) {
  const qc = useQueryClient();

  const ack = useMutation({
    mutationFn: () => alertService.acknowledge(alert.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const isCritical = alert.type === 'CRITICAL_FILL';

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 transition-all',
        alert.acknowledged ? 'opacity-40' : 'bg-white/3 hover:bg-white/5'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
          isCritical ? 'bg-red-500/15' : 'bg-amber-500/15'
        )}
      >
        {isCritical ? (
          <Flame size={14} className="text-red-400" />
        ) : (
          <AlertTriangle size={14} className="text-amber-400" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-gray-200 truncate">{alert.container_qr}</p>
        <p className="text-xs text-gray-500 truncate">{alert.zone_name}</p>
        {isCritical && alert.fill_level !== null && (
          <p className="mt-0.5 text-xs font-semibold text-red-400">{alert.fill_level}% plein</p>
        )}
        <p className="mt-0.5 text-[10px] text-gray-700">
          {formatDistanceToNow(new Date(alert.since), { addSuffix: true, locale: fr })}
        </p>
      </div>

      {/* Ack button */}
      {!alert.acknowledged && (
        <button
          onClick={() => ack.mutate()}
          disabled={ack.isPending}
          title="Acquitter"
          className="ml-1 flex-shrink-0 rounded-md p-1.5 text-gray-600 hover:bg-white/10 hover:text-emerald-400 transition-colors disabled:opacity-50"
        >
          <CheckCheck size={13} />
        </button>
      )}
    </div>
  );
}

// ─── Dropdown panel ───────────────────────────────────────────────────────────

function AlertDropdown({ onClose }: { onClose: () => void }) {
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertService.list,
    refetchInterval: 30000,
  });

  const active = alerts.filter((a) => !a.acknowledged);
  const acknowledged = alerts.filter((a) => a.acknowledged);

  return (
    <div className="absolute right-0 top-full mt-2 w-[360px] rounded-2xl bg-gray-900 border border-white/10 shadow-2xl shadow-black/60 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Alertes actives</h3>
          {active.length > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {active.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto p-2">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <CheckCheck size={22} className="text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-400">Aucune alerte active ✓</p>
            <p className="text-xs text-gray-600">Tout fonctionne normalement.</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="mb-1">
                {active.map((a) => (
                  <AlertRow key={a.id} alert={a} />
                ))}
              </div>
            )}
            {acknowledged.length > 0 && (
              <div>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                  Acquittées
                </p>
                {acknowledged.slice(0, 5).map((a) => (
                  <AlertRow key={a.id} alert={a} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Bell button (exported) ───────────────────────────────────────────────────

export function AlertsBell() {
  const { hasRole } = useAuth();
  const isManager = hasRole(['MANAGER', 'ADMIN']);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertService.list,
    refetchInterval: 30000,
    enabled: isManager,
  });

  const unreadCount = alerts.filter((a: AlertOut) => !a.acknowledged).length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // UX-22 — réservé aux gestionnaires/admins ; aucun rendu (même inerte) sinon.
  if (!isManager) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Alertes"
        className={cn(
          'relative rounded-md p-1.5 transition-colors',
          open ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-100'
        )}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && <AlertDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
