import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          id="global-error-boundary-screen"
          className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Ops! Algo inesperado aconteceu
              </h1>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Não se preocupe: seus dados locais e salvos na nuvem estão seguros. Tente recarregar a página para continuar de onde parou.
              </p>
            </div>

            <div className="pt-2">
              <button
                id="error-reload-btn"
                onClick={this.handleReload}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Aplicativo</span>
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mt-4 p-3 bg-neutral-950 rounded-lg text-xs font-mono text-neutral-400 overflow-x-auto border border-neutral-800">
                <summary className="cursor-pointer text-amber-400 font-medium mb-1">
                  Detalhes Técnicos do Erro
                </summary>
                <div className="mt-2 text-red-400">{this.state.error.toString()}</div>
                <div className="mt-1 text-neutral-500 whitespace-pre-wrap">{this.state.error.stack}</div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
