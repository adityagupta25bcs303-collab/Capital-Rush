import React, { useState, useEffect } from 'react';
import { X, Award, AlertTriangle, CheckCircle2, QrCode, Camera, Flame, PlusCircle, MinusCircle, TrendingUp } from 'lucide-react';
import { scoreRound2Task, enterRound2Task } from '../services/api';

const TASK_OPTIONS = [
  { key: 'WHO_AM_I', name: 'Who Am I', difficulty: 'Medium', risk: 'Medium', fee: 300, defaultMult: 2.0 },
  { key: 'BOUNCE_THE_BALL', name: 'Bounce The Ball', difficulty: 'Easy', risk: 'Easy', fee: 200, defaultMult: 1.5 },
  { key: 'EAT_THE_COOKIES', name: 'Eat The Cookies', difficulty: 'Moderately Hard', risk: 'Medium-High', fee: 400, defaultMult: 2.5 },
  { key: 'RUN_WITH_THE_PEN', name: 'Run With The Pen', difficulty: 'Hard', risk: 'Hard', fee: 600, defaultMult: 3.5 }
];

export default function AdminTaskScoringModal({ teams, defaultTeamId, defaultTaskKey, isOpen, onClose, onSuccess, onOpenQRScanner }) {
  const [selectedTaskKey, setSelectedTaskKey] = useState(defaultTaskKey || 'WHO_AM_I');
  const [selectedTeamId, setSelectedTeamId] = useState(defaultTeamId || '');
  const [customMultiplier, setCustomMultiplier] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (defaultTeamId) setSelectedTeamId(defaultTeamId);
      if (defaultTaskKey) setSelectedTaskKey(defaultTaskKey);
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
      const res = await scoreRound2Task({
        teamId: selectedTeamId.trim().toUpperCase(),
        taskKey: currentTask.key,
        result: resultType,
        customMultiplier: customMultiplier ? Number(customMultiplier) : currentTask.defaultMult,
        customAmount: customAmount ? Number(customAmount) : null,
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
          Select task challenge, target team, and record Win, Loss, or custom multiplier reward.
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
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <span>{task.difficulty}</span>
                  <span>•</span>
                  <span className="text-emerald-400">{task.defaultMult}x win</span>
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

        {/* Multiplier / Custom override option */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 mb-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Custom Multiplier / Payout Override (Optional)</span>
            <span className="text-slate-500 text-[10px]">Default: {currentTask.defaultMult}x</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Multiplier (e.g. 1.02, 2.0)</label>
              <input
                type="number"
                step="any"
                placeholder={`Default: ${currentTask.defaultMult}`}
                value={customMultiplier}
                onChange={(e) => setCustomMultiplier(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Or Flat Payout ₹ (Optional)</label>
              <input
                type="number"
                step="100"
                placeholder="e.g. 800"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

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
              className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-display font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>MARK WIN (+Reward)</span>
            </button>

            {/* LOSS BUTTON */}
            <button
              type="button"
              disabled={loading || !selectedTeamId}
              onClick={() => handleScore('LOSS')}
              className="py-3 px-4 bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 text-rose-300 border border-rose-500/40 font-display font-black text-xs rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>MARK LOSS (0 Payout)</span>
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
