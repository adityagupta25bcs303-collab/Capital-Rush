import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getMyTeam } from '../services/api';
import QRDisplayModal from '../components/QRDisplayModal';
import Round1InvestmentModal from '../components/Round1InvestmentModal';
import Round2TasksModal from '../components/Round2TasksModal';
import {
  TrendingUp,
  Landmark,
  Sparkles,
  QrCode,
  Flame,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  RefreshCw,
  Coins,
  AlertOctagon,
  Ban
} from 'lucide-react';

export default function ParticipantDashboard({ gameSettings }) {
  const { user } = useAuth();
  const { joinTeamRoom, leaveTeamRoom, lastBalanceUpdate, lastRoundUpdate } = useSocket();

  const [team, setTeam] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [tasksModalOpen, setTasksModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await getMyTeam();
      if (res.success) {
        setTeam(res.team);
        setPortfolio(res.portfolio);
        setMembers(res.members || []);
        setTransactions(res.transactions || []);
      }
    } catch (err) {
      console.error('Error loading team data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Join WebSocket room for real-time team balance updates
  useEffect(() => {
    if (team?.teamId) {
      joinTeamRoom(team.teamId);
      return () => {
        leaveTeamRoom(team.teamId);
      };
    }
  }, [team?.teamId]);

  // Handle WebSocket updates
  useEffect(() => {
    if (lastBalanceUpdate && team && lastBalanceUpdate.teamId === team.teamId) {
      setTeam((prev) => ({
        ...prev,
        currentCapital: lastBalanceUpdate.currentCapital
      }));
      if (lastBalanceUpdate.portfolio) {
        setPortfolio(lastBalanceUpdate.portfolio);
      }
      if (lastBalanceUpdate.latestTransaction) {
        setTransactions((prev) => [lastBalanceUpdate.latestTransaction, ...prev]);
      }
    }
  }, [lastBalanceUpdate]);

  useEffect(() => {
    if (lastRoundUpdate) {
      // Re-fetch to sync new round requirements
      fetchDashboardData();
    }
  }, [lastRoundUpdate]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Loading Team Portfolio...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
        <p className="text-slate-400 mb-4">No team assigned to your account. Please contact an administrator.</p>
      </div>
    );
  }

  const currentCapital = team.currentCapital;
  const startingCapital = team.startingCapital || 10000;
  const profitLoss = currentCapital - startingCapital;
  const returnPct = startingCapital > 0 ? ((profitLoss / startingCapital) * 100).toFixed(2) : 0;
  const currentRound = gameSettings?.currentRound || 1;
  const gameStatus = gameSettings?.gameStatus || 'NOT_STARTED';
  const isEliminated = currentCapital < 1000 || team.status === 'DISQUALIFIED' || team.status === 'ELIMINATED';

  const roundTitles = {
    1: 'ROUND 1 — INVESTMENT STRATEGY',
    2: 'ROUND 2 — ARENA TASKS'
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* ELIMINATION WARNING BANNER */}
      {isEliminated && (
        <div className="mb-6 p-4 sm:p-6 bg-rose-950/60 border-2 border-rose-500 rounded-3xl text-rose-200 flex flex-col sm:flex-row sm:items-center gap-4 shadow-2xl shadow-rose-950/60 animate-pulse">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-7 h-7 sm:w-8 sm:h-8 text-rose-400" />
          </div>
          <div className="flex-1">
            <div className="font-display font-black text-base sm:text-xl text-rose-300 uppercase tracking-wide flex items-center gap-2">
              <span>TEAM ELIMINATED — GAME OVER</span>
              <span className="px-2 py-0.5 text-[10px] bg-rose-500 text-slate-950 font-black rounded-md">LOST</span>
            </div>
            <p className="text-xs sm:text-sm text-rose-200/90 mt-1">
              Your team capital has dropped below ₹1,000 (Current: ₹{currentCapital.toLocaleString('en-IN')}). Under official CAPITAL RUSH tournament rules, any team with money decreasing less than ₹1,000 has lost and cannot continue.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner: Team Identity & Round Status */}
      <div className={`border rounded-3xl p-5 sm:p-8 mb-6 sm:mb-8 relative overflow-hidden backdrop-blur-sm ${
        isEliminated ? 'bg-rose-950/20 border-rose-900/50' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs rounded-full">
                TEAM ID: {team.teamId}
              </span>
              {isEliminated ? (
                <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold text-xs rounded-full flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" /> ELIMINATED (&lt; ₹1,000)
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  Shared Team Account
                </span>
              )}
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">
              {team.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
              <span>Logged in as: <strong className="text-slate-200">{user?.name}</strong> ({user?.email})</span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 shadow-md transition active:scale-95"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>TEAM QR CODE</span>
            </button>

            {isEliminated ? (
              <div className="px-4 py-2.5 bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2 shadow-inner">
                <Ban className="w-4 h-4 text-rose-400" />
                <span>OPERATIONS LOCKED (LOST)</span>
              </div>
            ) : (
              <>
                {currentRound === 1 && gameStatus !== 'FINISHED' && (
                  <button
                    onClick={() => setInvestModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>MANAGE INVESTMENTS</span>
                  </button>
                )}

                {currentRound === 2 && gameStatus !== 'FINISHED' && (
                  <button
                    onClick={() => setTasksModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95 animate-pulse"
                  >
                    <Flame className="w-4 h-4" />
                    <span>ARENA TASKS</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={handleManualRefresh}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition"
              title="Refresh Balance"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Financial Capital Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Current Capital */}
        <div className={`border rounded-2xl p-5 shadow-lg relative overflow-hidden ${
          isEliminated ? 'bg-rose-950/20 border-rose-800/60' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Current Capital</span>
            {isEliminated && (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 rounded">
                &lt; ₹1,000 ELIMINATED
              </span>
            )}
          </div>
          <div className={`font-display font-black text-3xl sm:text-4xl font-tabular ${
            isEliminated ? 'text-rose-400' : 'text-amber-400'
          }`}>
            ₹{currentCapital.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span>Starting: ₹{startingCapital.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 2: Profit / Loss */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Net Profit / Loss
          </div>
          <div className={`font-display font-black text-3xl sm:text-4xl font-tabular flex items-center gap-1 ${profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {profitLoss >= 0 ? (
              <ArrowUpRight className="w-7 h-7" />
            ) : (
              <ArrowDownRight className="w-7 h-7" />
            )}
            ₹{Math.abs(profitLoss).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs font-bold text-slate-400">
            Return: <span className={profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{returnPct >= 0 ? `+${returnPct}%` : `${returnPct}%`}</span>
          </div>
        </div>

        {/* Card 3: Active Round */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Event Stage
          </div>
          <div className="font-display font-bold text-xl sm:text-2xl text-white uppercase">
            {roundTitles[currentRound] || `ROUND ${currentRound}`}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Status: {gameStatus}
          </div>
        </div>

        {/* Card 4: Team Roster */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Team Members</span>
            <Users className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-sm font-semibold text-slate-200 truncate">
            {members.length > 0 ? members.map(m => m.name.split(' ')[0]).join(', ') : '1 Player'}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {members.length} Registered {members.length === 1 ? 'Player' : 'Players'}
          </div>
        </div>
      </div>

      {/* Round 2: Interactive Arena Tasks Section (when currentRound === 2) */}
      {currentRound === 2 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-7 mb-6 sm:mb-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                <Flame className="w-3.5 h-3.5" /> ARENA CHALLENGES LIVE
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                Round 2: 4 Task Challenges
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pay entry fee, compete in campus challenges, and get rewarded based on difficulty & risk level!
              </p>
            </div>

            <button
              onClick={() => setTasksModalOpen(true)}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-95 flex items-center justify-center gap-2 shrink-0"
            >
              <Flame className="w-4 h-4" />
              <span>BROWSE & ENTER TASKS</span>
            </button>
          </div>

          {/* 4 Mini Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-slate-950/80 p-3 sm:p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-bold text-amber-400 uppercase truncate">Who Am I</div>
              <div className="font-mono text-xs font-bold text-white mt-0.5">Fee: ₹300</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">Win: +₹600 (2.0x)</div>
              <div className="text-[10px] text-rose-400 font-semibold">Loss: -₹300</div>
            </div>
            <div className="bg-slate-950/80 p-3 sm:p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-bold text-emerald-400 uppercase truncate">Bounce The Ball</div>
              <div className="font-mono text-xs font-bold text-white mt-0.5">Fee: ₹200</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">Win: +₹300 (1.5x)</div>
              <div className="text-[10px] text-rose-400 font-semibold">Loss: -₹200</div>
            </div>
            <div className="bg-slate-950/80 p-3 sm:p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-bold text-purple-400 uppercase truncate">Eat The Cookies</div>
              <div className="font-mono text-xs font-bold text-white mt-0.5">Fee: ₹400</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">Win: +₹1,000 (2.5x)</div>
              <div className="text-[10px] text-rose-400 font-semibold">Loss: -₹400</div>
            </div>
            <div className="bg-slate-950/80 p-3 sm:p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-bold text-rose-400 uppercase truncate">Run With The Pen</div>
              <div className="font-mono text-xs font-bold text-white mt-0.5">Fee: ₹600</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">Win: +₹2,100 (3.5x)</div>
              <div className="text-[10px] text-rose-400 font-semibold">Loss: -₹600</div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Asset Allocation Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 mb-6 sm:mb-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              Portfolio Allocation & Valuation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live breakdown across Cash, Bank, Stocks, and Gold investments
            </p>
          </div>

          {currentRound === 1 && !isEliminated && (
            <button
              onClick={() => setInvestModalOpen(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition underline"
            >
              Reallocate Portfolio
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Asset 1: Cash */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-slate-300">CASH (Liquid)</span>
              <span>0% Return</span>
            </div>
            <div className="font-mono font-bold text-xl text-white">
              ₹{(portfolio?.cash ?? currentCapital).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Min ₹{gameSettings?.minimumCash || 2000} Required
            </div>
          </div>

          {/* Asset 2: Bank */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-blue-400 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5" /> BANK
              </span>
              <span className="text-emerald-400 font-bold">+{gameSettings?.bankReturnPercent || 5}%</span>
            </div>
            <div className="font-mono font-bold text-xl text-white">
              ₹{(portfolio?.bank ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Yield: ₹{Math.round((portfolio?.bank ?? 0) * (1 + (gameSettings?.bankReturnPercent || 5) / 100)).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Asset 3: Stocks */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-rose-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> STOCKS
              </span>
              <span className={`font-bold ${(portfolio?.stockReturnPercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(portfolio?.stockReturnPercent ?? 0) >= 0 ? `+${portfolio?.stockReturnPercent ?? 0}%` : `${portfolio?.stockReturnPercent ?? 0}%`}
              </span>
            </div>
            <div className="font-mono font-bold text-xl text-white">
              ₹{(portfolio?.stocks ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Market Val: ₹{Math.round((portfolio?.stocks ?? 0) * (1 + (portfolio?.stockReturnPercent ?? 0) / 100)).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Asset 4: Gold */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> GOLD
              </span>
              <span className="text-emerald-400 font-bold">+{gameSettings?.goldReturnPercent || 8}%</span>
            </div>
            <div className="font-mono font-bold text-xl text-white">
              ₹{(portfolio?.gold ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Commodity Val: ₹{Math.round((portfolio?.gold ?? 0) * (1 + (gameSettings?.goldReturnPercent || 8) / 100)).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Recent Financial Transactions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified ledger records of credits, debits, and peer transfers
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {transactions.length} Records
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Round</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Balance After</th>
                  <th className="py-3 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx._id || tx.transactionId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {tx.transactionId}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          R{tx.round}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-300">
                        {tx.type.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                        {tx.reason}
                      </td>
                      <td className={`py-3 px-3 font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300 font-bold">
                        ₹{tx.newBalance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRDisplayModal
        team={team}
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />

      {/* Round 1 Portfolio Modal */}
      <Round1InvestmentModal
        team={team}
        portfolio={portfolio}
        gameSettings={gameSettings}
        isOpen={investModalOpen}
        onClose={() => setInvestModalOpen(false)}
        onAllocated={fetchDashboardData}
      />

      {/* Round 2 Tasks Modal */}
      <Round2TasksModal
        team={team}
        isOpen={tasksModalOpen}
        onClose={() => setTasksModalOpen(false)}
        onUpdated={fetchDashboardData}
      />
    </div>
  );
}
