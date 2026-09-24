import React from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught runtime UI error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-lg">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <h1 className="font-display font-black text-2xl text-white uppercase tracking-wide">
              Simulation Reconnecting
            </h1>

            <p className="text-xs text-slate-400 mt-2 mb-6">
              A temporary display glitch occurred or your session connection was interrupted. Your portfolio and team data remain safe and secured in our database.
            </p>

            {this.state.error?.message && (
              <div className="mb-6 p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-[11px] font-mono text-slate-400 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black tracking-wider text-xs rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>RELOAD SIMULATION</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-xs rounded-xl border border-slate-700 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>HOME</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
