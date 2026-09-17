import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Shield, Landmark, Sparkles, AlertTriangle, CheckCircle2, Coins, ArrowRight } from 'lucide-react';
import { allocateRound1 } from '../services/api';

export default function Round1InvestmentModal({ team, portfolio, gameSettings, isOpen, onClose, onAllocated }) {
  const minPerAsset = gameSettings?.minimumAssetInvestment || 1000;
  const maxTotalInvestable = gameSettings?.maximumTotalInvestable || 8000;
  const totalCapital = team?.startingCapital || 10000;

  // Investment values for the 3 options
  const [bank, setBank] = useState(portfolio?.bank && portfolio.bank >= minPerAsset ? portfolio.bank : 2500);
  const [stocks, setStocks] = useState(portfolio?.stocks && portfolio.stocks >= minPerAsset ? portfolio.stocks : 2500);
  const [gold, setGold] = useState(portfolio?.gold && portfolio.gold >= minPerAsset ? portfolio.gold : 2000);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && portfolio) {
      if (portfolio.bank >= minPerAsset) setBank(portfolio.bank);
      if (portfolio.stocks >= minPerAsset) setStocks(portfolio.stocks);
      if (portfolio.gold >= minPerAsset) setGold(portfolio.gold);
    }
  }, [isOpen, portfolio, minPerAsset]);

  if (!isOpen) return null;

  const totalInvested = Number(bank) + Number(stocks) + Number(gold);
  const liquidCash = totalCapital - totalInvested;

  const isBankValid = Number(bank) >= minPerAsset;
  const isStocksValid = Number(stocks) >= minPerAsset;
  const isGoldValid = Number(gold) >= minPerAsset;
  const isTotalValid = totalInvested <= maxTotalInvestable && totalInvested >= (minPerAsset * 3);
  const isValid = isBankValid && isStocksValid && isGoldValid && isTotalValid;

  const applyPreset = (pBank, pStocks, pGold) => {
    setBank(pBank);
    setStocks(pStocks);
    setGold(pGold);
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

    if (!isBankValid || !isStocksValid || !isGoldValid) {
      setError(`Official Rule: You must allocate at least ₹${minPerAsset.toLocaleString('en-IN')} each into Bank, Stocks, and Gold.`);
      return;
    }

    if (totalInvested > maxTotalInvestable) {
      setError(`Official Rule: Maximum total investment across the 3 assets cannot exceed ₹${maxTotalInvestable.toLocaleString('en-IN')}. (Currently ₹${totalInvested.toLocaleString('en-IN')})`);
      return;
    }

    setLoading(true);
    try {
      const res = await allocateRound1(Number(bank), Number(stocks), Number(gold));
      if (res.success) {
        setSuccess('Investment portfolio allocated successfully!');
        setTimeout(() => {
          onAllocated();
          onClose();
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Failed to save investment portfolio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-7 my-4 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-amber-400 mb-1">
          <TrendingUp className="w-6 h-6" />
          <h3 className="font-display font-bold text-lg sm:text-xl text-white">Round 1: Investment Portfolio</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Allocate your capital across <strong className="text-slate-200">Bank, Stocks, and Gold</strong>.
          Rules: <span className="text-amber-300 font-semibold">Min ₹1,000 in each</span>, <span className="text-amber-300 font-semibold">Max ₹8,000 total</span>.
        </p>

        {/* Quick Presets */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Quick Strategy Presets
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => applyPreset(4000, 2000, 2000)}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition active:scale-95"
            >
              <div className="font-bold text-blue-400 flex items-center gap-1 text-[11px]">
                <Shield className="w-3 h-3 shrink-0" /> Safe Bank
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">₹4k Bank / ₹2k S / ₹2k G</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(3000, 2500, 2500)}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition active:scale-95"
            >
              <div className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3 h-3 shrink-0" /> Balanced
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">₹3k Bank / ₹2.5k / ₹2.5k</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(1500, 5000, 1500)}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition active:scale-95"
            >
              <div className="font-bold text-rose-400 flex items-center gap-1 text-[11px]">
                <TrendingUp className="w-3 h-3 shrink-0" /> Aggressive
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">₹5k Stocks (High Risk)</div>
            </button>
          </div>
        </div>

        {/* Investment Form: 3 Assets */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Asset 1: Bank */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-white">Bank FD / Savings</span>
                  <span className="ml-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 bg-blue-500/15 text-blue-300 rounded">
                    Low Risk (+5%)
                  </span>
                </div>
              </div>
              <span className={`text-[11px] font-mono font-bold ${isBankValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isBankValid ? '✓ Min ₹1k Met' : '⚠ Min ₹1,000'}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
              <input
                type="number"
                min={minPerAsset}
                max={maxTotalInvestable}
                step={500}
                value={bank}
                onChange={(e) => setBank(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Asset 2: Stocks */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-white">Stock Market</span>
                  <span className="ml-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 bg-rose-500/15 text-rose-300 rounded">
                    High Volatility
                  </span>
                </div>
              </div>
              <span className={`text-[11px] font-mono font-bold ${isStocksValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isStocksValid ? '✓ Min ₹1k Met' : '⚠ Min ₹1,000'}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
              <input
                type="number"
                min={minPerAsset}
                max={maxTotalInvestable}
                step={500}
                value={stocks}
                onChange={(e) => setStocks(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Asset 3: Gold */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-white">Gold Commodities</span>
                  <span className="ml-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 bg-amber-500/15 text-amber-300 rounded">
                    Moderate (+8%)
                  </span>
                </div>
              </div>
              <span className={`text-[11px] font-mono font-bold ${isGoldValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isGoldValid ? '✓ Min ₹1k Met' : '⚠ Min ₹1,000'}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
              <input
                type="number"
                min={minPerAsset}
                max={maxTotalInvestable}
                step={500}
                value={gold}
                onChange={(e) => setGold(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Investment Calculation Summary */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Invested (Bank + Stocks + Gold):</span>
              <span className={`font-mono font-bold text-sm ${totalInvested <= maxTotalInvestable ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{totalInvested.toLocaleString('en-IN')} / Max ₹{maxTotalInvestable.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${totalInvested <= maxTotalInvestable ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, (totalInvested / maxTotalInvestable) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Remaining Liquid Cash:
              </span>
              <span className="font-mono font-bold text-sm text-white">
                ₹{liquidCash.toLocaleString('en-IN')}
              </span>
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
            disabled={loading || !isValid}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Saving Portfolio...' : 'Confirm & Save Investment Portfolio'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
