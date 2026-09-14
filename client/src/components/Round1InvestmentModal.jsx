import React, { useState } from 'react';
import { X, TrendingUp, Shield, Landmark, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { allocateRound1 } from '../services/api';

export default function Round1InvestmentModal({ team, portfolio, gameSettings, isOpen, onClose, onAllocated }) {
  const minCash = gameSettings?.minimumCash || 2000;
  const totalCapital = team?.startingCapital || 10000;
  const bankRate = gameSettings?.bankReturnPercent || 5;
  const goldRate = gameSettings?.goldReturnPercent || 8;

  const [cash, setCash] = useState(portfolio?.cash ?? minCash);
  const [bank, setBank] = useState(portfolio?.bank ?? 0);
  const [stocks, setStocks] = useState(portfolio?.stocks ?? 0);
  const [gold, setGold] = useState(portfolio?.gold ?? 0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const currentTotal = Number(cash) + Number(bank) + Number(stocks) + Number(gold);
  const remaining = totalCapital - currentTotal;

  // Preset Allocation Strategies
  const applyPreset = (presetCash, presetBank, presetStocks, presetGold) => {
    setCash(presetCash);
    setBank(presetBank);
    setStocks(presetStocks);
    setGold(presetGold);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const isEliminated = (team?.currentCapital ?? totalCapital) < 1000 || team?.status === 'DISQUALIFIED' || team?.status === 'ELIMINATED';
    if (isEliminated) {
      setError('Your team has been ELIMINATED (Capital below ₹1,000) and cannot allocate investments.');
      return;
    }

    if (Number(cash) < minCash) {
      setError(`Rule Violation: You must maintain at least ₹${minCash.toLocaleString('en-IN')} in CASH.`);
      return;
    }

    if (currentTotal !== totalCapital) {
      setError(`Total allocation must equal exactly ₹${totalCapital.toLocaleString('en-IN')}. Remaining to allocate: ₹${remaining.toLocaleString('en-IN')}`);
      return;
    }

    setLoading(true);
    try {
      const res = await allocateRound1(cash, bank, stocks, gold);
      if (res.success) {
        setSuccess('Investment portfolio allocated successfully!');
        setTimeout(() => {
          onAllocated();
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to save investment portfolio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-amber-400 mb-1">
          <TrendingUp className="w-6 h-6" />
          <h3 className="font-display font-bold text-xl text-white">Round 1: Investment Portfolio</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Allocate your ₹{totalCapital.toLocaleString('en-IN')} across asset classes. Rule: Keep at least ₹{minCash.toLocaleString('en-IN')} Cash.
        </p>

        {/* Quick Presets */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick Strategy Presets
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => applyPreset(2000, 5000, 1000, 2000)}
              className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-left transition"
            >
              <div className="font-bold text-emerald-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Conservative
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">High Bank & Gold</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(2000, 3000, 3000, 2000)}
              className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-left transition"
            >
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Balanced
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Diversified Mix</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(2000, 1000, 5000, 2000)}
              className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-left transition"
            >
              <div className="font-bold text-rose-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Aggressive
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Heavy Stocks (High Risk)</div>
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Option 1: Cash */}
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/80">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-200 text-xs font-bold">
                  ₹
                </div>
                <div>
                  <span className="text-sm font-bold text-white">Cash</span>
                  <span className="ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                    Min ₹{minCash.toLocaleString('en-IN')} Req.
                  </span>
                </div>
              </div>
              <span className="text-xs text-slate-400">0% return (Liquid)</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm font-semibold">₹</span>
              <input
                type="number"
                min={minCash}
                max={totalCapital}
                step={500}
                value={cash}
                onChange={(e) => setCash(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Option 2: Bank */}
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/80">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">Bank FD / Savings</span>
                  <span className="ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                    Low Risk
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400">+{bankRate}% Fixed Return</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm font-semibold">₹</span>
              <input
                type="number"
                min="0"
                max={totalCapital}
                step={500}
                value={bank}
                onChange={(e) => setBank(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Option 3: Stocks */}
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/80">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">Stock Market</span>
                  <span className="ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-rose-500/20 text-rose-300 rounded">
                    High Risk / Simulated
                  </span>
                </div>
              </div>
              <span className="text-xs text-slate-400">Admin-driven market</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm font-semibold">₹</span>
              <input
                type="number"
                min="0"
                max={totalCapital}
                step={500}
                value={stocks}
                onChange={(e) => setStocks(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Option 4: Gold */}
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/80">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">Gold Commodities</span>
                  <span className="ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                    Medium Risk
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400">+{goldRate}% Commodity Return</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm font-semibold">₹</span>
              <input
                type="number"
                min="0"
                max={totalCapital}
                step={500}
                value={gold}
                onChange={(e) => setGold(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Allocation Summary Bar */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="text-xs">
              <div className="text-slate-400">Total Allocated:</div>
              <div className={`font-mono text-base font-bold ${currentTotal === totalCapital ? 'text-emerald-400' : 'text-amber-400'}`}>
                ₹{currentTotal.toLocaleString('en-IN')} / ₹{totalCapital.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-slate-400">Remaining to Allocate:</div>
              <div className={`font-mono text-base font-bold ${remaining === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{remaining.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || currentTotal !== totalCapital || cash < minCash}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95 text-sm"
          >
            {loading ? 'Saving Portfolio...' : 'Confirm & Save Investment Portfolio'}
          </button>
        </form>
      </div>
    </div>
  );
}
