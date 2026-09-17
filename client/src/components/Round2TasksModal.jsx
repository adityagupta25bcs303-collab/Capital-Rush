import React, { useState, useEffect } from 'react';
import { X, Trophy, AlertTriangle, CheckCircle2, Flame, Shield, Award, Clock, ArrowRight } from 'lucide-react';
import { getRound2Tasks, enterRound2Task } from '../services/api';

export default function Round2TasksModal({ team, isOpen, onClose, onUpdated }) {
  const [tasks, setTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTasksData = async () => {
    try {
      const res = await getRound2Tasks();
      if (res.success) {
        setTasks(res.tasks || []);
        setTeamTasks(res.teamTasks || []);
      }
    } catch (err) {
      console.error('Error loading round 2 tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      loadTasksData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCapital = team?.currentCapital ?? 0;
  const isEliminated = currentCapital < 1000 || team?.status === 'DISQUALIFIED' || team?.status === 'ELIMINATED';

  const handleJoinTask = async (taskKey) => {
    setError('');
    setSuccess('');
    setActionLoading(taskKey);

    try {
      const res = await enterRound2Task(taskKey);
      if (res.success) {
        setSuccess(res.message);
        await loadTasksData();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setError(err.message || 'Failed to enter task.');
    } finally {
      setActionLoading(null);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30">Easy</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-400 rounded-md border border-amber-500/30">Medium</span>;
      case 'moderately hard':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/15 text-purple-300 rounded-md border border-purple-500/30">Moderately Hard</span>;
      case 'hard':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/15 text-rose-400 rounded-md border border-rose-500/30">Hard</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded-md">{difficulty}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-7 my-4 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-amber-400 mb-1">
          <Flame className="w-6 h-6" />
          <h3 className="font-display font-bold text-lg sm:text-xl text-white">Round 2: Arena Task Roster</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Compete in 4 high-stakes challenges. Entry fee depends on game risk & difficulty level. Payouts rewarded upon admin confirmation!
        </p>

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

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          {tasks.map((task) => {
            const myEntry = teamTasks.find((t) => t.taskKey === task.key);
            const canAfford = currentCapital - task.entryFee >= 1000;

            return (
              <div
                key={task.key}
                className={`p-4 rounded-2xl border transition ${
                  myEntry?.status === 'WON'
                    ? 'bg-emerald-950/20 border-emerald-600/40'
                    : myEntry?.status === 'LOST'
                    ? 'bg-rose-950/20 border-rose-800/40'
                    : myEntry?.status === 'ENTERED'
                    ? 'bg-amber-950/20 border-amber-600/40'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-display font-bold text-base text-white">{task.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      {getDifficultyBadge(task.difficulty)}
                      <span className="text-[10px] font-semibold text-slate-400">Risk: {task.risk}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-amber-400 text-sm">
                      ₹{task.entryFee}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">Entry Fee</div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                  {task.description}
                </p>

                {/* Status or Join Button */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-[11px]">
                    <span className="text-slate-400">Reward: </span>
                    <strong className="text-emerald-400 font-mono">
                      {task.defaultMultiplier}x (₹{Math.round(task.entryFee * task.defaultMultiplier)})
                    </strong>
                  </div>

                  {myEntry ? (
                    <div className="text-right">
                      {myEntry.status === 'WON' && (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-lg border border-emerald-500/30">
                          🏆 WON (+₹{myEntry.rewardAmount})
                        </span>
                      )}
                      {myEntry.status === 'LOST' && (
                        <span className="px-2 py-1 bg-rose-500/20 text-rose-300 font-bold text-xs rounded-lg border border-rose-500/30">
                          ✕ LOST
                        </span>
                      )}
                      {myEntry.status === 'ENTERED' && (
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/30 animate-pulse">
                          ⏳ In Arena
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoinTask(task.key)}
                      disabled={isEliminated || !canAfford || actionLoading === task.key}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1"
                    >
                      {actionLoading === task.key ? 'Entering...' : 'Join Task'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note on ₹1,000 threshold */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Your Team Balance: <strong className="text-white font-mono">₹{currentCapital.toLocaleString('en-IN')}</strong></span>
          <span className="text-amber-400 font-semibold">Min Survival: ₹1,000</span>
        </div>
      </div>
    </div>
  );
}
