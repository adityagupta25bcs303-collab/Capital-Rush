import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { getLeaderboard } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  TrendingUp,
  RefreshCw,
  Maximize2,
  Minimize2,
  Crown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';

export default function LeaderboardPage() {
  const { lastLeaderboardUpdate, lastBalanceUpdate } = useSocket();
  const [leaderboard, setLeaderboard] = useState([]);
  const [winner, setWinner] = useState(null);
  const [gameStatus, setGameStatus] = useState('LIVE');
  const [currentRound, setCurrentRound] = useState(1);
  const [announcement, setAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res = await getLeaderboard();
      if (res.success) {
        setLeaderboard(res.leaderboard);
        setWinner(res.winner);
        setGameStatus(res.gameStatus);
        setCurrentRound(res.currentRound);
        setAnnouncement(res.announcement);

        if (res.gameStatus === 'FINISHED' && res.winner) {
          triggerConfetti();
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 8000); // Reliable periodic fallback
    return () => clearInterval(interval);
  }, []);

  // Real-time socket updates
  useEffect(() => {
    if (lastLeaderboardUpdate || lastBalanceUpdate) {
      fetchLeaderboard();
    }
  }, [lastLeaderboardUpdate, lastBalanceUpdate]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getRankBadge = (rank, isEliminated) => {
    if (isEliminated) {
      return (
        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center font-mono text-[10px] border border-rose-500/40" title="Eliminated (< ₹1,000)">
          OUT
        </div>
      );
    }
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Crown className="w-5 h-5" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-xl bg-slate-300 text-slate-950 font-black flex items-center justify-center shadow-md">
          <Medal className="w-4 h-4" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-700 text-white font-black flex items-center justify-center shadow-md">
          <Medal className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 font-bold flex items-center justify-center font-mono">
        #{rank}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Loading Live Standings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-300 ${isProjectorMode ? 'bg-black min-h-screen p-6' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              LIVE LEADERBOARD
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ROUND {currentRound} • {gameStatus}
            </span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
            CAPITAL RUSH <span className="text-amber-400">STANDINGS</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time financial rankings automatically sorted by current capital
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProjectorMode(!isProjectorMode)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            {isProjectorMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isProjectorMode ? 'Standard View' : 'Projector Mode'}</span>
          </button>

          <button
            onClick={handleManualRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FINAL WINNER BANNER (Displayed when gameStatus === 'FINISHED') */}
      {gameStatus === 'FINISHED' && winner && (
        <div className="mb-10 bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500 text-slate-950 font-display font-black text-xs uppercase tracking-widest mb-3">
            <Trophy className="w-4 h-4" /> OFFICIAL EVENT WINNER
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-white mb-2">
            {winner.name}
          </h2>
          <div className="font-mono text-sm text-amber-400 font-bold mb-6">
            TEAM ID: {winner.teamId}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Final Capital</div>
              <div className="font-mono font-black text-xl text-amber-400 mt-1">
                ₹{winner.currentCapital.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Starting Capital</div>
              <div className="font-mono font-bold text-xl text-slate-300 mt-1">
                ₹{winner.startingCapital.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Net Profit</div>
              <div className="font-mono font-bold text-xl text-emerald-400 mt-1">
                +₹{winner.profitLoss.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Total Return</div>
              <div className="font-mono font-bold text-xl text-emerald-400 mt-1">
                +{winner.returnPercentage}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="text-center py-16 px-6">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <div className="text-base font-bold text-white mb-1">No Teams Enrolled Yet</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              The live leaderboard will update dynamically as teams are created and start competing.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-4 px-6 text-center w-20">Rank</th>
                <th className="py-4 px-6">Team Details</th>
                <th className="py-4 px-6 text-right">Current Capital</th>
                <th className="py-4 px-6 text-right">Profit / Loss</th>
                <th className="py-4 px-6 text-right">Return %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {leaderboard.map((team) => {
                const isEliminated = team.isEliminated || team.currentCapital < 1000 || team.status === 'ELIMINATED' || team.status === 'DISQUALIFIED';
                const isLeader = team.rank === 1 && !isEliminated;
                const isPositive = team.profitLoss >= 0;

                return (
                  <tr
                    key={team.teamId}
                    className={`transition-colors ${
                      isEliminated
                        ? 'bg-rose-950/15 opacity-80 hover:bg-rose-950/30'
                        : isLeader
                        ? 'bg-amber-500/5 hover:bg-amber-500/10'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center">
                        {getRankBadge(team.rank, isEliminated)}
                      </div>
                    </td>

                    {/* Team */}
                    <td className="py-4 px-6">
                      <div className="font-display font-bold text-base text-white flex items-center gap-2">
                        <span className={isEliminated ? 'line-through text-slate-400' : ''}>{team.name}</span>
                        {isLeader && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            LEADER
                          </span>
                        )}
                        {isEliminated && (
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                            ELIMINATED (&lt; ₹1,000)
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        ID: {team.teamId}
                      </div>
                    </td>

                    {/* Current Capital */}
                    <td className={`py-4 px-6 text-right font-mono font-black text-lg sm:text-xl font-tabular ${
                      isEliminated ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      ₹{team.currentCapital.toLocaleString('en-IN')}
                    </td>

                    {/* Profit / Loss */}
                    <td className="py-4 px-6 text-right font-mono font-bold text-sm font-tabular">
                      <span className={`inline-flex items-center gap-1 ${isPositive && !isEliminated ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive && !isEliminated ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        ₹{Math.abs(team.profitLoss).toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Return % */}
                    <td className="py-4 px-6 text-right font-mono font-bold text-sm">
                      {isEliminated ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                          LOST
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-lg ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {isPositive ? `+${team.returnPercentage}%` : `${team.returnPercentage}%`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-slate-800/80">
          {leaderboard.map((team) => {
            const isEliminated = team.isEliminated || team.currentCapital < 1000 || team.status === 'ELIMINATED' || team.status === 'DISQUALIFIED';
            const isLeader = team.rank === 1 && !isEliminated;
            const isPositive = team.profitLoss >= 0;
            return (
              <div
                key={team.teamId}
                className={`p-4 flex items-center justify-between transition-colors ${
                  isEliminated
                    ? 'bg-rose-950/20 opacity-80'
                    : isLeader
                    ? 'bg-amber-500/10'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getRankBadge(team.rank, isEliminated)}
                  <div className="min-w-0 flex-1 truncate">
                    <div className="font-display font-bold text-white text-sm flex items-center gap-1.5 truncate">
                      <span className={`truncate ${isEliminated ? 'line-through text-slate-400' : ''}`}>{team.name}</span>
                      {isLeader && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                          LEADER
                        </span>
                      )}
                      {isEliminated && (
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
                          ELIMINATED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">ID: {team.teamId}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <div className={`font-mono font-black text-base ${isEliminated ? 'text-rose-400' : 'text-amber-400'}`}>
                    ₹{team.currentCapital.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-bold">
                    {isEliminated ? (
                      <span className="text-rose-400 font-bold">LOST (&lt; ₹1K)</span>
                    ) : (
                      <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                        {isPositive ? `+${team.returnPercentage}%` : `${team.returnPercentage}%`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>
    </div>
  );
}
