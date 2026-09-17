import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Sparkles, Landmark, AlertCircle, CheckCircle2, Globe, Users } from 'lucide-react';
import { adminModifyAssetOutcome } from '../services/api';

export default function AdminStockModal({ team, isOpen, onClose, onSuccess }) {
  // Mode: 'MULTIPLIER' (e.g. 1.02) vs 'PERCENT' (e.g. +2%)
  const [inputMode, setInputMode] = useState('MULTIPLIER');
  const [applyToAll, setApplyToAll] = useState(false);

  // Asset inputs
  const [stockRate, setStockRate] = useState('');
  const [bankRate, setBankRate] = useState('');
  const [goldRate, setGoldRate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && team) {
      setError('');
      setSuccess('');
      setApplyToAll(false);

      const pStock = team.portfolio?.stockReturnPercent ?? 0;
      const pBank = team.portfolio?.bankReturnPercent ?? 5;
      const pGold = team.portfolio?.goldReturnPercent ?? 8;

      if (inputMode === 'MULTIPLIER') {
        setStockRate((1 + pStock / 100).toFixed(2));
        setBankRate((1 + pBank / 100).toFixed(2));
        setGoldRate((1 + pGold / 100).toFixed(2));
      } else {
        setStockRate(String(pStock));
        setBankRate(String(pBank));
        setGoldRate(String(pGold));
      }
    }
  }, [isOpen, team, inputMode]);

  if (!isOpen || !team) return null;

  const stocksInvested = team.portfolio?.stocks ?? 0;
  const bankInvested = team.portfolio?.bank ?? 0;
  const goldInvested = team.portfolio?.gold ?? 0;

  // Helper to compute multiplier for preview
  const getMultiplier = (val) => {
    const num = Number(val);
    if (isNaN(num)) return 1.0;
    if (inputMode === 'MULTIPLIER') return num;
    return 1 + num / 100;
  };

  const stockMult = getMultiplier(stockRate);
  const bankMult = getMultiplier(bankRate);
  const goldMult = getMultiplier(goldRate);

  const projectedStocks = Math.round(stocksInvested * stockMult);
  const projectedBank = Math.round(bankInvested * bankMult);
  const projectedGold = Math.round(goldInvested * goldMult);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setLoading(true);
    try {
      const res = await adminModifyAssetOutcome({
        teamId: team.teamId,
        applyToAll,
        stockRate,
        bankRate,
        goldRate,
        rateMode: inputMode
      });

      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to update asset outcomes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-7 my-4 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-amber-400 mb-1">
          <TrendingUp className="w-6 h-6" />
          <h3 className="font-display font-bold text-lg sm:text-xl text-white">
            Market Outcome & Multipliers
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Control returns for <strong className="text-slate-200">Stocks, Bank, and Gold</strong> in multiplier (e.g. 1.02) or percentage format.
        </p>

        {/* Input Mode & Scope Selector */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Format Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex">
            <button
              type="button"
              onClick={() => setInputMode('MULTIPLIER')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                inputMode === 'MULTIPLIER' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Multiplier (1.02)
            </button>
            <button
              type="button"
              onClick={() => setInputMode('PERCENT')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                inputMode === 'PERCENT' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Percent (+2%)
            </button>
          </div>

          {/* Scope Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex">
            <button
              type="button"
              onClick={() => setApplyToAll(false)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                !applyToAll ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>This Team</span>
            </button>
            <button
              type="button"
              onClick={() => setApplyToAll(true)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                applyToAll ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All Teams</span>
            </button>
          </div>
        </div>

        {/* Target Indicator */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Target: </span>
            <strong className="text-white">
              {applyToAll ? 'All Active Teams (Global Market Move)' : `${team.name} (${team.teamId})`}
            </strong>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
            {applyToAll ? 'GLOBAL' : team.teamId}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Asset 1: Stocks */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> STOCKS
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Invested: ₹{stocksInvested.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="any"
                placeholder={inputMode === 'MULTIPLIER' ? 'e.g. 1.02 or 1.40' : 'e.g. 2 or 40'}
                value={stockRate}
                onChange={(e) => setStockRate(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
              <div className="text-right text-xs font-mono font-bold text-rose-300">
                → ₹{projectedStocks.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Asset 2: Bank */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" /> BANK
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Invested: ₹{bankInvested.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="any"
                placeholder={inputMode === 'MULTIPLIER' ? 'e.g. 1.05' : 'e.g. 5'}
                value={bankRate}
                onChange={(e) => setBankRate(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
              <div className="text-right text-xs font-mono font-bold text-blue-300">
                → ₹{projectedBank.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Asset 3: Gold */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> GOLD
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Invested: ₹{goldInvested.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="any"
                placeholder={inputMode === 'MULTIPLIER' ? 'e.g. 1.08' : 'e.g. 8'}
                value={goldRate}
                onChange={(e) => setGoldRate(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
              <div className="text-right text-xs font-mono font-bold text-amber-300">
                → ₹{projectedGold.toLocaleString('en-IN')}
              </div>
            </div>
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
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition active:scale-95 text-xs sm:text-sm"
          >
            {loading ? 'Updating Outcomes...' : applyToAll ? 'APPLY TO ALL TEAMS (GLOBAL)' : `APPLY TO ${team.name.toUpperCase()}`}
          </button>
        </form>
      </div>
    </div>
  );
}
