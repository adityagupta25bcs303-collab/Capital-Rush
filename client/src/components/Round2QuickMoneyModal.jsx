import React, { useState, useEffect } from 'react';
import { X, PlusCircle, MinusCircle, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { adminQuickMoneyUpdate, getTeamByTeamId } from '../services/api';

export default function Round2QuickMoneyModal({ teamId, isOpen, onClose, onSuccess }) {
  const [teamData, setTeamData] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState('ADD'); // 'ADD' | 'SUBTRACT'
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && teamId) {
      loadTeam(teamId);
    } else {
      setTeamData(null);
      setAmount('');
      setReason('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, teamId]);

  const loadTeam = async (id) => {
    setLoadingTeam(true);
    try {
      const res = await getTeamByTeamId(id);
      if (res.success) {
        setTeamData(res.team);
      }
    } catch (err) {
      setError(err.message || 'Failed to load team data.');
    } finally {
      setLoadingTeam(false);
    }
  };

  if (!isOpen) return null;

  const numAmount = parseInt(amount) || 0;
  const currentCap = teamData?.currentCapital || 0;
  const projectedBalance = action === 'ADD' ? currentCap + numAmount : currentCap - numAmount;

  const quickAmounts = [500, 1000, 2000, 3000, 5000];
  const quickReasons = [
    'Round 2 Game Winner',
    'Round 2 Runner-up',
    'Physical Challenge Bonus',
    'Rule Violation Penalty',
    'Admin Adjustment'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (numAmount <= 0) {
      setError('Amount must be greater than ₹0.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this financial modification.');
      return;
    }

    if (action === 'SUBTRACT' && numAmount > currentCap) {
      setError(`Cannot deduct ₹${numAmount.toLocaleString('en-IN')}; exceeds current balance of ₹${currentCap.toLocaleString('en-IN')}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await adminQuickMoneyUpdate(teamId, numAmount, action, reason.trim());
      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 text-amber-400 mb-1">
          <PlusCircle className="w-6 h-6" />
          <h3 className="font-display font-bold text-xl text-white">Quick Money Update</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Fast administrator balance adjustment for Round 2 & scoring
        </p>

        {/* Team Card */}
        <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400">Target Team</div>
              <div className="text-base font-bold text-white">
                {teamData ? teamData.name : `Loading ${teamId}...`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-400">Current Balance</div>
              <div className="text-lg font-mono font-black text-amber-400">
                ₹{currentCap.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAction('ADD')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                action === 'ADD'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> ADD MONEY
            </button>
            <button
              type="button"
              onClick={() => setAction('SUBTRACT')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                action === 'SUBTRACT'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MinusCircle className="w-4 h-4" /> SUBTRACT MONEY
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-base font-bold">₹</span>
              <input
                type="number"
                step="100"
                placeholder="Enter amount (e.g. 2000)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-base focus:outline-none focus:border-amber-500"
              />
            </div>
            {/* Quick amounts */}
            <div className="flex gap-1.5 mt-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className="flex-1 py-1 text-[11px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/80 transition"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reason / Game Identifier
            </label>
            <input
              type="text"
              placeholder="e.g. Round 2 Game Winner"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            />
            {/* Quick Reason chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Projected Balance Preview & Elimination Warning */}
          {numAmount > 0 && (
            <div className={`p-3 rounded-xl border flex flex-col gap-1.5 text-xs ${
              projectedBalance < 1000 ? 'bg-rose-950/40 border-rose-500/50' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Resulting Balance:</span>
                <span className={`font-mono text-sm font-bold ${projectedBalance < 1000 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ₹{projectedBalance.toLocaleString('en-IN')}
                </span>
              </div>
              {projectedBalance < 1000 && (
                <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5 mt-1 pt-1 border-t border-rose-900/50">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>ELIMINATION WARNING: Dropping below ₹1,000 will disqualify/eliminate this team!</span>
                </div>
              )}
            </div>
          )}

          {/* Error / Success messages */}
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

          {/* Action button */}
          <button
            type="submit"
            disabled={loading || numAmount <= 0 || !reason.trim() || projectedBalance < 0}
            className={`w-full py-3 px-4 font-bold rounded-xl shadow-lg transition active:scale-95 text-sm flex items-center justify-center gap-2 ${
              action === 'ADD'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-rose-500 hover:bg-rose-400 text-white'
            } disabled:opacity-50`}
          >
            {loading ? 'Processing...' : `Confirm ${action === 'ADD' ? 'Credit' : 'Debit'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
