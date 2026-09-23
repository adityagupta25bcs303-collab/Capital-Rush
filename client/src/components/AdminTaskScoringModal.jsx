import React, { useState, useEffect } from 'react';
import { X, Award, AlertTriangle, CheckCircle2, QrCode, Camera, Flame, PlusCircle, MinusCircle, TrendingUp } from 'lucide-react';
import { scoreRound2Task, enterRound2Task } from '../services/api';

const TASK_OPTIONS = [
  { key: 'WHO_AM_I', name: 'Who Am I', difficulty: 'Medium', risk: 'Medium', fee: 300, defaultMult: 2.0, defaultLoss: 300 },
  { key: 'BOUNCE_THE_BALL', name: 'Bounce The Ball', difficulty: 'Easy', risk: 'Easy', fee: 200, defaultMult: 1.5, defaultLoss: 200 },
  { key: 'EAT_THE_COOKIES', name: 'Eat The Cookies', difficulty: 'Moderately Hard', risk: 'Medium-High', fee: 400, defaultMult: 2.5, defaultLoss: 400 },
  { key: 'RUN_WITH_THE_PEN', name: 'Run With The Pen', difficulty: 'Hard', risk: 'Hard', fee: 600, defaultMult: 3.5, defaultLoss: 600 }
];

export default function AdminTaskScoringModal({ teams, defaultTeamId, defaultTaskKey, isOpen, onClose, onSuccess, onOpenQRScanner }) {
  const [selectedTaskKey, setSelectedTaskKey] = useState(defaultTaskKey || 'WHO_AM_I');
  const [selectedTeamId, setSelectedTeamId] = useState(defaultTeamId || '');
  const [customMultiplier, setCustomMultiplier] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customLoss, setCustomLoss] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (defaultTeamId) setSelectedTeamId(defaultTeamId);
      if (defaultTaskKey) setSelectedTaskKey(defaultTaskKey);
      setCustomLoss('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, defaultTeamId, defaultTaskKey]);

  if (!isOpen) return null;

  const currentTask = TASK_OPTIONS.find((t) => t.key === selectedTaskKey) || TASK_OPTIONS[0];
  const selectedTeam = teams?.find((t) => t.teamId.toUpperCase() === selectedTeamId.trim().toUpperCase());

  const handleScore = async (resultType) => {
    setError('');
    setSuccess('');

    if (!selectedTeamId.trim()) {
      setError('Please select or scan a team first.');
      return;
    }

    setLoading(true);
    try {
      const penaltyVal = customLoss ? Number(customLoss) : currentTask.defaultLoss;
      const res = await scoreRound2Task({
        teamId: selectedTeamId.trim().toUpperCase(),
        taskKey: currentTask.key,
        result: resultType,
        customMultiplier: customMultiplier ? Number(customMultiplier) : currentTask.defaultMult,
        customAmount: customAmount ? Number(customAmount) : null,
        lossAmount: penaltyVal,
        notes: notes.trim()
      });

      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit task score.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeductFeeOnly = async () => {
    setError('');
    setSuccess('');

    if (!selectedTeamId.trim()) {
      setError('Please select or scan a team.');
      return;
    }

    setLoading(true);
    try {
      const res = await enterRound2Task(currentTask.key, selectedTeamId.trim().toUpperCase());
      if (res.success) {
        setSuccess(res.message);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to deduct entry fee.');
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
          <Award className="w-6 h-6" />
          <h3 className="font-display font-bold text-lg sm:text-xl text-white">Score Round 2 Task</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Select task challenge, target team, and record Win (+Reward), Loss (-Penalty), or custom adjustments.
        </p>

        {/* Task Selection Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            1. Select Active Task Challenge
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TASK_OPTIONS.map((task) => (
              <button
                key={task.key}
                type="button"
                onClick={() => setSelectedTaskKey(task.key)}
                className={`p-3 rounded-xl border text-left transition ${
                  selectedTaskKey === task.key
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{task.name}</span>
                  <span className="font-mono text-amber-400">₹{task.fee}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold">+{task.defaultMult}x Win</span>
                  <span className="text-rose-400 font-semibold">-₹{task.defaultLoss} Loss</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Team Selection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Target Team
            </label>
            {onOpenQRScanner && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQRScanner();
                }}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Camera QR</span>
              </button>
            )}
          </div>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="">-- Choose Team --</option>
            {teams?.map((t) => (
              <option key={t.teamId} value={t.teamId}>
                {t.name} ({t.teamId}) — ₹{t.currentCapital.toLocaleString('en-IN')}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Team Info Card */}
        {selectedTeam && (
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 mb-4 text-xs flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-sm">{selectedTeam.name}</div>
              <div className="text-slate-400 font-mono">ID: {selectedTeam.teamId}</div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-base text-amber-400">
                ₹{selectedTeam.currentCapital.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">Current Balance</div>
            </div>
          </div>
        )}

        {/* Multiplier / Custom Win & Loss Overrides */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 mb-4 space-y-3">
          <div className="text-xs font-semibold text-slate-300">
            Reward & Penalty Configurations (Editable)
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Win Payout Override */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-emerald-400">Win Multiplier</span>
                <span className="text-slate-500 font-mono text-[10px]">Def: {currentTask.defaultMult}x</span>
              </div>
              <input
                type="number"
                step="any"
                placeholder={`${currentTask.defaultMult}`}
                value={customMultiplier}
                onChange={(e) => setCustomMultiplier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Payout: <strong className="text-emerald-300 font-mono">₹{customAmount ? Number(customAmount).toLocaleString('en-IN') : Math.round(currentTask.fee * (customMultiplier ? Number(customMultiplier) : currentTask.defaultMult)).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Loss Penalty Override */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-rose-400">Loss Penalty (₹)</span>
                <span className="text-slate-500 font-mono text-[10px]">Def: ₹{currentTask.defaultLoss}</span>
              </div>
              <input
                type="number"
                step="50"
                placeholder={`${currentTask.defaultLoss}`}
                value={customLoss}
                onChange={(e) => setCustomLoss(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Deduction: <strong className="text-rose-300 font-mono">-₹{(customLoss !== '' ? Number(customLoss) : currentTask.defaultLoss).toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Live Impact Preview Card */}
        {selectedTeam && (
          <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 mb-4 text-xs">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">
              Live Balance Impact Preview ({selectedTeam.name})
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-emerald-950/20 border border-emerald-800/40 p-2 rounded-xl">
                <div className="text-[10px] text-emerald-400 font-bold">IF WIN (+Reward)</div>
                <div className="font-mono font-bold text-sm text-emerald-300 mt-0.5">
                  ₹{(selectedTeam.currentCapital + (customAmount ? Number(customAmount) : Math.round(currentTask.fee * (customMultiplier ? Number(customMultiplier) : currentTask.defaultMult)))).toLocaleString('en-IN')}
                </div>
              </div>

              <div className={`p-2 rounded-xl border ${
                selectedTeam.currentCapital - (customLoss !== '' ? Number(customLoss) : currentTask.defaultLoss) < 1000
                  ? 'bg-rose-950/40 border-rose-600 text-rose-300 animate-pulse'
                  : 'bg-rose-950/20 border-rose-800/40'
              }`}>
                <div className="text-[10px] text-rose-400 font-bold">
                  {selectedTeam.currentCapital - (customLoss !== '' ? Number(customLoss) : currentTask.defaultLoss) < 1000
                    ? 'IF LOSS (ELIMINATES!)'
                    : 'IF LOSS (-Penalty)'}
                </div>
                <div className="font-mono font-bold text-sm text-rose-300 mt-0.5">
                  ₹{Math.max(0, selectedTeam.currentCapital - (customLoss !== '' ? Number(customLoss) : currentTask.defaultLoss)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {selectedTeam.currentCapital - (customLoss !== '' ? Number(customLoss) : currentTask.defaultLoss) < 1000 && (
              <div className="mt-2 text-[10px] text-rose-400 font-bold flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Loss will drop team below ₹1,000 threshold and disqualify them!</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* WIN BUTTON */}
            <button
              type="button"
              disabled={loading || !selectedTeamId}
              onClick={() => handleScore('WIN')}
              className="py-3 px-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-display font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>MARK WIN (+₹{customAmount ? Number(customAmount).toLocaleString('en-IN') : Math.round(currentTask.fee * (customMultiplier ? Number(customMultiplier) : currentTask.defaultMult)).toLocaleString('en-IN')})</span>
            </button>

            {/* LOSS BUTTON */}
            <button
              type="button"
              disabled={loading || !selectedTeamId}
              onClick={() => handleScore('LOSS')}
              className="py-3 px-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-display font-black text-xs rounded-xl shadow-lg shadow-rose-600/20 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>MARK LOSS (-₹{(customLoss !== '' ? Number(customLoss) : currentTask.defaultLoss).toLocaleString('en-IN')})</span>
            </button>
          </div>

          {/* Deduct Entry Fee Only Button */}
          <button
            type="button"
            disabled={loading || !selectedTeamId}
            onClick={handleDeductFeeOnly}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Deduct Entry Fee Only (-₹{currentTask.fee})
          </button>
        </div>
      </div>
    </div>
  );
}
