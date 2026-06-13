import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PackageCheck, Wrench, Ban, MessageSquare, ScanLine, ChevronRight, ChevronLeft, Search, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { containerService } from '@/services/containers';
import { reportService } from '@/services/reports';
import { STATUS_CONFIG } from '@/utils/status';
import { cn } from '@/utils/cn';
import type { ContainerMapItem, ReportType } from '@/types';
import type { AxiosError } from 'axios';

// ─── Config types de signalement ─────────────────────────────────────────────

const REPORT_TYPES: Array<{
  value: ReportType;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  bg: string;
}> = [
  {
    value: 'FULL',
    label: 'Plein',
    sublabel: 'Conteneur saturé',
    icon: <PackageCheck size={22} />,
    color: 'text-orange-400',
    border: 'border-orange-500/60',
    bg: 'bg-orange-500/10',
  },
  {
    value: 'DAMAGED',
    label: 'Endommagé',
    sublabel: 'Couvercle, corps…',
    icon: <Wrench size={22} />,
    color: 'text-red-400',
    border: 'border-red-500/60',
    bg: 'bg-red-500/10',
  },
  {
    value: 'BLOCKED',
    label: 'Inaccessible',
    sublabel: 'Obstrué, bloqué',
    icon: <Ban size={22} />,
    color: 'text-amber-400',
    border: 'border-amber-500/60',
    bg: 'bg-amber-500/10',
  },
  {
    value: 'OTHER',
    label: 'Autre',
    sublabel: 'Autre problème',
    icon: <MessageSquare size={22} />,
    color: 'text-gray-400',
    border: 'border-gray-500/60',
    bg: 'bg-gray-500/10',
  },
];

// ─── Stepper header ───────────────────────────────────────────────────────────

function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {[
        { n: 1, label: 'Choisir le conteneur' },
        { n: 2, label: 'Décrire le problème' },
      ].map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-3">
          {i > 0 && (
            <div
              className={cn(
                'h-px w-8 transition-colors',
                step >= n ? 'bg-orange-500' : 'bg-gray-700'
              )}
            />
          )}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                step === n
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : step > n
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-gray-800 text-gray-500'
              )}
            >
              {step > n ? <CheckCircle2 size={14} /> : n}
            </div>
            <span
              className={cn(
                'text-xs font-medium hidden sm:block',
                step === n ? 'text-gray-200' : 'text-gray-600'
              )}
            >
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Step 1 — Container picker ────────────────────────────────────────────────

function Step1({
  onSelect,
}: {
  onSelect: (c: ContainerMapItem) => void;
}) {
  const [search, setSearch] = useState('');

  const { data: rawContainers, isLoading } = useQuery({
    queryKey: ['containers-map'],
    queryFn: containerService.getMapItems,
  });

  const containers = rawContainers ?? [];

  const filtered = useMemo(() => {
    if (!search) return containers.slice(0, 20);
    const q = search.toLowerCase();
    return containers.filter(
      (c) =>
        c.qr_code.toLowerCase().includes(q) ||
        c.zone_name.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [containers, search]);

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-white">Quel conteneur ?</h2>
      <p className="mb-5 text-sm text-gray-500">
        Recherchez par QR code ou nom de zone.
      </p>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            autoFocus
            type="text"
            placeholder="CNT-001, Zone Nord…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-colors"
          />
        </div>
        <button
          onClick={() => toast.info('Fonctionnalité mobile uniquement')}
          className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-xs font-semibold text-gray-400 hover:border-orange-500/30 hover:text-orange-400 transition-colors"
        >
          <ScanLine size={15} />
          <span className="hidden sm:inline">Scanner</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      ) : (
        <ul className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <li className="py-8 text-center text-sm text-gray-600">
              Aucun conteneur trouvé
            </li>
          ) : (
            filtered.map((c) => {
              const cfg = STATUS_CONFIG[c.status];
              const fill = c.fill_level;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => onSelect(c)}
                    className="group w-full rounded-xl bg-white/3 border border-white/5 p-3 text-left hover:border-orange-500/30 hover:bg-orange-500/5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ background: cfg.dot }}
                        />
                        <span className="font-mono text-sm font-bold text-gray-200 group-hover:text-white">
                          {c.qr_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {fill !== null && (
                          <span
                            className="text-xs font-mono"
                            style={{
                              color: fill >= 80 ? '#ef4444' : fill >= 60 ? '#f59e0b' : '#22c55e',
                            }}
                          >
                            {fill}%
                          </span>
                        )}
                        <ChevronRight
                          size={14}
                          className="text-gray-600 group-hover:text-orange-400 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={10} />
                      <span>{c.zone_name}</span>
                      <span className="ml-1 text-gray-700">·</span>
                      <span className={cfg.color}>{cfg.label}</span>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Step 2 — Report form ─────────────────────────────────────────────────────

function Step2({
  container,
  onBack,
}: {
  container: ContainerMapItem;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [comment, setComment] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      reportService.create({
        container_id: container.id,
        type: selectedType!,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Signalement envoyé, merci !');
      navigate('/map');
    },
    onError: (err: AxiosError<{ detail: string; existing_id?: string }>) => {
      const data = err?.response?.data;
      if (data?.detail === 'DUPLICATE_REPORT') {
        toast.error(
          `Un signalement similaire existe déjà (ID: ${(data.existing_id ?? '').slice(0, 8)}…)`
        );
      } else {
        toast.error('Une erreur est survenue, réessayez.');
      }
    },
  });

  const cfg = STATUS_CONFIG[container.status];

  return (
    <div>
      {/* Selected container recap */}
      <button
        onClick={onBack}
        className="group mb-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 hover:border-orange-500/30 transition-colors"
      >
        <ChevronLeft size={14} className="text-gray-500 group-hover:text-orange-400 transition-colors" />
        <span
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ background: cfg.dot }}
        />
        <span className="font-mono text-sm font-bold text-gray-200">{container.qr_code}</span>
        <span className="text-xs text-gray-500">— {container.zone_name}</span>
      </button>

      <h2 className="mb-1 text-lg font-bold text-white">Quel problème ?</h2>
      <p className="mb-5 text-sm text-gray-500">Sélectionnez le type de problème constaté.</p>

      {/* Type buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {REPORT_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setSelectedType(t.value)}
            className={cn(
              'flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all',
              selectedType === t.value
                ? `${t.border} ${t.bg} shadow-lg`
                : 'border-white/5 bg-white/3 hover:border-white/20'
            )}
          >
            <span className={cn('transition-colors', selectedType === t.value ? t.color : 'text-gray-500')}>
              {t.icon}
            </span>
            <div>
              <p
                className={cn(
                  'text-sm font-bold transition-colors',
                  selectedType === t.value ? 'text-white' : 'text-gray-400'
                )}
              >
                {t.label}
              </p>
              <p className="text-xs text-gray-600">{t.sublabel}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-semibold text-gray-400">
          Commentaire <span className="text-gray-600">(optionnel)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="Décrivez le problème en détail…"
          className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-colors"
        />
        <p className="mt-1 text-right text-xs text-gray-700">{comment.length}/500</p>
      </div>

      <button
        disabled={!selectedType || submit.isPending}
        onClick={() => submit.mutate()}
        className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {submit.isPending ? 'Envoi en cours…' : 'Envoyer le signalement'}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewReportPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedContainer, setSelectedContainer] = useState<ContainerMapItem | null>(null);

  const handleSelect = (c: ContainerMapItem) => {
    setSelectedContainer(c);
    setStep(2);
  };

  return (
    <div className="min-h-full bg-gray-950 p-6">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Nouveau signalement
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Aidez-nous à maintenir la ville propre.
          </p>
        </div>

        <Stepper step={step} />

        <div className="rounded-2xl bg-gray-900 border border-white/10 p-6 shadow-xl">
          {step === 1 ? (
            <Step1 onSelect={handleSelect} />
          ) : (
            selectedContainer && (
              <Step2
                container={selectedContainer}
                onBack={() => setStep(1)}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
