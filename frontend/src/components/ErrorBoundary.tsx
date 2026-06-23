import { Component, type ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode }
interface State { hasError: boolean; message?: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gray-950 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertOctagon size={28} className="text-red-400" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-400">Erreur inattendue</p>
          <h1 className="mt-2 text-xl font-black text-white">Quelque chose a mal tourné</h1>
          {this.state.message && (
            <p className="mt-2 max-w-sm font-mono text-xs text-gray-600">{this.state.message}</p>
          )}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-xl bg-gray-800 border border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-200 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={14} />
          Recharger la page
        </button>
      </div>
    );
  }
}
