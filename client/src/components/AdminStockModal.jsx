import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { adminModifyStockResult } from '../services/api';

export default function AdminStockModal({ team, isOpen, onClose, onSuccess }) {
  const [percent, setPercent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && team) {
      setPercent(String(team.portfolio?.stockReturnPercent ?? 0));
      setError('');
      setSuccess('');
    }
  }, [isOpen, team]);

  if (!isOpen || !team) return null;

  const stocksInvested = team.portfolio?.stocks ?? 0;
  const numPercent = Number(percent) || 0;
  const projectedStockValuation = Math.round(stocksInvested * (1 + numPercent / 100));

  const presets = [+40, +20, +10, 0, -10, -20, -35];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isNaN(numPercent)) {
      setError('Please enter a valid percentage.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminModifyStockResult(team.teamId, numPercent);
      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to update stock result.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-amber-400 mb-1">
          <TrendingUp className="w-6 h-6" />
          <h3 className="font-display font-bold text-xl text-white">Modify Stock Outcome</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Control simulated stock performance for {team.name}
        </p>

        {/* Team Stock Summary */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Team:</span>
            <span className="font-bold text-white">{team.name} ({team.teamId})</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Stocks Invested:</span>
            <span className="font-mono font-bold text-amber-400">₹{stocksInvested.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Current Stock Return:</span>
            <span className={`font-mono font-bold ${(team.portfolio?.stockReturnPercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(team.portfolio?.stockReturnPercent ?? 0) >= 0 ? `+${team.portfolio?.stockReturnPercent ?? 0}%` : `${team.portfolio?.stockReturnPercent ?? 0}%`}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Preset Outcomes
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPercent(String(p))}
                  className={`py-1.5 px-2 text-xs font-mono font-bold rounded-lg border transition ${
                    numPercent === p
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : p >= 0
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                  }`}
                >
                  {p >= 0 ? `+${p}%` : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Percentage Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Custom Return Percentage (%)
            </label>
            <input
              type="number"
              step="1"
              placeholder="e.g. 25 or -15"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-base focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Projected Stock Valuation */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400">Projected Stock Value:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              ₹{projectedStockValuation.toLocaleString('en-IN')}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition active:scale-95 text-sm"
          >
            {loading ? 'Applying Outcome...' : 'APPLY STOCK OUTCOME'}
          </button>
        </form>
      </div>
    </div>
  );
}
