import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Leaf, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/auth';

// ─── Schéma ──────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Nom requis (2 caractères minimum)'),
    email: z.string().email('Adresse email invalide'),
    // Le backend n'exige que 8 caractères minimum (cf. RegisterRequest) —
    // on aligne le client pour éviter des règles plus strictes côté front.
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ─── Composant ────────────────────────────────────────────────────────────────

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { setSession } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    try {
      const response = await authService.register(data.email, data.password, data.full_name);
      setSession(response.access_token, response.refresh_token, response.user);
      // L'inscription crée toujours un CITIZEN → redirige vers la carte
      navigate('/map', { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 409) setServerError('Cet email est déjà utilisé.');
        else setServerError('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
          <Leaf size={17} className="text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">
          ECO<span className="text-emerald-600">TRACK</span>
        </span>
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Créer un compte</h2>
          <p className="mt-1.5 text-sm text-gray-500">Rejoignez ECOTRACK en tant que citoyen</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Erreur serveur */}
          {serverError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {serverError}
            </div>
          )}

          {/* Nom complet */}
          <div>
            <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-gray-700">
              Nom complet
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              placeholder="Jean Dupont"
              {...register('full_name')}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                errors.full_name
                  ? 'border-red-300 bg-red-50 focus:border-red-400'
                  : 'border-gray-300 bg-white focus:border-emerald-500'
              }`}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

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
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
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
                autoComplete="new-password"
                placeholder="Min. 8 caractères"
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
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label
              htmlFor="confirm_password"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirm_password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('confirm_password')}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                errors.confirm_password
                  ? 'border-red-300 bg-red-50 focus:border-red-400'
                  : 'border-gray-300 bg-white focus:border-emerald-500'
              }`}
            />
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Création du compte…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
