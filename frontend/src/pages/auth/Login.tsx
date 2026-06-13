import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Leaf, Eye, EyeOff, AlertCircle, Loader2, ChevronDown, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// ─── Schéma ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Constantes ───────────────────────────────────────────────────────────────

const ROLE_REDIRECT: Record<string, string> = {
  CITIZEN: '/map',
  AGENT: '/my-tours',
  MANAGER: '/dashboard',
  ADMIN: '/dashboard',
};

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@ecotrack.fr', password: 'Password1!' },
  { role: 'Manager', email: 'gestionnaire@ecotrack.fr', password: 'Password1!' },
  { role: 'Agent', email: 'agent1@ecotrack.fr', password: 'Password1!' },
  { role: 'Citoyen', email: 'citoyen1@ecotrack.fr', password: 'Password1!' },
];

// ─── Composant ────────────────────────────────────────────────────────────────

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const response = await login(data.email, data.password);
      const redirect = ROLE_REDIRECT[response.user.role] ?? '/dashboard';
      navigate(redirect, { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) setServerError('Email ou mot de passe incorrect.');
        else if (status === 429) setServerError('Trop de tentatives. Réessayez dans 5 minutes.');
        else setServerError('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setShowDemo(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Panneau gauche atmosphérique ──────────────────── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        {/* Fond dégradé */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950" />

        {/* Grille technique */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(52,211,153,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(52,211,153,1) 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Halos lumineux */}
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-emerald-600/15 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-52 w-52 rounded-full bg-teal-500/10 blur-2xl" />

        {/* Contenu */}
        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <Leaf size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              ECO<span className="text-emerald-400">TRACK</span>
            </span>
          </div>

          {/* Tagline + badge */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-800/50 bg-emerald-950/60 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">2 000 conteneurs connectés en temps réel</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Gestion intelligente
              <br />
              <span className="text-emerald-400">des déchets urbains</span>
            </h1>
            <p className="mt-4 max-w-sm leading-relaxed text-slate-400">
              Plateforme IoT de collecte optimisée pour une métropole de 500 000 habitants. Plus
              propre. Plus durable.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '−20%', label: 'Distance collecte' },
              { value: '15 000', label: 'Citoyens actifs' },
              { value: '99.5%', label: 'Disponibilité' },
            ].map((s) => (
              <div
                key={s.value}
                className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 backdrop-blur-sm"
              >
                <div className="text-xl font-bold text-emerald-400">{s.value}</div>
                <div className="mt-0.5 text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center bg-gray-50 px-6 py-12 lg:w-1/2">
        {/* Logo mobile */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
            <Leaf size={17} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            ECO<span className="text-emerald-600">TRACK</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
            <p className="mt-1.5 text-sm text-gray-500">Accédez à votre espace ECOTRACK</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Erreur serveur */}
            {serverError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.fr"
                {...register('email')}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                  errors.email
                    ? 'border-red-300 bg-red-50 focus:border-red-400'
                    : 'border-gray-300 bg-white focus:border-emerald-500'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.password
                      ? 'border-red-300 bg-red-50 focus:border-red-400'
                      : 'border-gray-300 bg-white focus:border-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {/* Lien inscription */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-700">
              S'inscrire
            </Link>
          </p>

          {/* Comptes de démo */}
          <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-emerald-500" />
                Comptes de démonstration
              </div>
              <ChevronDown
                size={15}
                className={`text-gray-400 transition-transform ${showDemo ? 'rotate-180' : ''}`}
              />
            </button>
            {showDemo && (
              <div className="divide-y divide-gray-100 border-t border-gray-100">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc.email, acc.password)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-emerald-50"
                  >
                    <span className="text-xs font-semibold text-gray-700">{acc.role}</span>
                    <span className="truncate text-xs text-gray-400">{acc.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
