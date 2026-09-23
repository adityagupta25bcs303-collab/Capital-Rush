import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  getAdminStats,
  getAllTeams,
  getAllParticipants,
  getGameSettings,
  updateGameSettings,
  createTeam,
  deleteTeam,
  createParticipant,
  deleteParticipant,
  toggleParticipantStatus,
  resetToCleanSlate,
  getAuditLogs,
  getAllTransactions
} from '../services/api';
import QRScannerModal from '../components/QRScannerModal';
import Round2QuickMoneyModal from '../components/Round2QuickMoneyModal';
import AdminStockModal from '../components/AdminStockModal';
import AdminTaskScoringModal from '../components/AdminTaskScoringModal';
import QRDisplayModal from '../components/QRDisplayModal';
import {
  ShieldCheck,
  Camera,
  Users,
  Building2,
  TrendingUp,
  Settings,
  FileText,
  Clock,
  PlusCircle,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  DollarSign,
  Radio,
  Trash2,
  Power,
  RotateCcw,
  Flame,
  Award
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { lastLeaderboardUpdate, lastBalanceUpdate } = useSocket();

  // Active Tab: 'overview' | 'teams' | 'participants' | 'settings' | 'audit' | 'transactions'
  const [activeTab, setActiveTab] = useState('overview');

  // Stats & Data
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [settings, setSettings] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter
  const [teamSearch, setTeamSearch] = useState('');

  // Modals
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [quickMoneyTeamId, setQuickMoneyTeamId] = useState(null);
  const [stockModalTeam, setStockModalTeam] = useState(null);
  const [qrDisplayTeam, setQrDisplayTeam] = useState(null);
  const [taskScoringOpen, setTaskScoringOpen] = useState(false);
  const [selectedTaskKey, setSelectedTaskKey] = useState('WHO_AM_I');
  const [taskScoringTeamId, setTaskScoringTeamId] = useState('');

  // Forms
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCapital, setNewTeamCapital] = useState(10000);
  const [teamCreateLoading, setTeamCreateLoading] = useState(false);
  const [teamCreateError, setTeamCreateError] = useState('');
  const [teamCreateSuccess, setTeamCreateSuccess] = useState('');

  const [newPartName, setNewPartName] = useState('');
  const [newPartEmail, setNewPartEmail] = useState('');
  const [newPartPass, setNewPartPass] = useState('student123');
  const [newPartTeamId, setNewPartTeamId] = useState('');
  const [partCreateLoading, setPartCreateLoading] = useState(false);
  const [partCreateError, setPartCreateError] = useState('');
  const [partCreateSuccess, setPartCreateSuccess] = useState('');

  // Settings form
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  const loadAllData = async () => {
    try {
      const [stRes, tmRes, prRes, stgRes, audRes, txnRes] = await Promise.all([
        getAdminStats(),
        getAllTeams(),
        getAllParticipants(),
        getGameSettings(),
        getAuditLogs(),
        getAllTransactions()
      ]);

      if (stRes.success) setStats(stRes.stats);
      if (tmRes.success) setTeams(tmRes.teams);
      if (prRes.success) setParticipants(prRes.participants);
      if (stgRes.success) setSettings(stgRes.settings);
      if (audRes.success) setAuditLogs(audRes.logs);
      if (txnRes.success) setTransactions(txnRes.transactions);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Listen for socket events
  useEffect(() => {
    if (lastLeaderboardUpdate || lastBalanceUpdate) {
      loadAllData();
    }
  }, [lastLeaderboardUpdate, lastBalanceUpdate]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // QR Scan callback
  const handleQRScanned = (scannedTeamId) => {
    setQrScannerOpen(false);
    setQuickMoneyTeamId(scannedTeamId);
  };

  // Create Team Submit
  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    setTeamCreateError('');
    setTeamCreateSuccess('');

    if (!newTeamName.trim()) {
      setTeamCreateError('Please enter a team name.');
      return;
    }

    setTeamCreateLoading(true);
    try {
      const res = await createTeam(newTeamName.trim(), newTeamCapital);
      if (res.success) {
        setTeamCreateSuccess(res.message);
        setNewTeamName('');
        loadAllData();
      }
    } catch (err) {
      setTeamCreateError(err.message || 'Failed to create team.');
    } finally {
      setTeamCreateLoading(false);
    }
  };

  // Create Participant Submit
  const handleCreateParticipantSubmit = async (e) => {
    e.preventDefault();
    setPartCreateError('');
    setPartCreateSuccess('');

    if (!newPartName || !newPartEmail || !newPartPass || !newPartTeamId) {
      setPartCreateError('Please fill all fields.');
      return;
    }

    setPartCreateLoading(true);
    try {
      const res = await createParticipant(newPartName, newPartEmail, newPartPass, newPartTeamId);
      if (res.success) {
        setPartCreateSuccess(res.message);
        setNewPartName('');
        setNewPartEmail('');
        loadAllData();
      }
    } catch (err) {
      setPartCreateError(err.message || 'Failed to create participant.');
    } finally {
      setPartCreateLoading(false);
    }
  };

  // Delete Participant
  const handleDeleteParticipant = async (participant) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${participant.name} (${participant.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await deleteParticipant(participant._id);
      if (res.success) {
        setPartCreateSuccess(res.message);
        setTimeout(() => setPartCreateSuccess(''), 3000);
        loadAllData();
      }
    } catch (err) {
      setPartCreateError(err.message || 'Failed to delete participant.');
      setTimeout(() => setPartCreateError(''), 3000);
    }
  };

  // Delete Team
  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${team.name} (${team.teamId})? This will also remove any assigned participants.`)) {
      return;
    }
    try {
      const res = await deleteTeam(team.teamId || team.id);
      if (res.success) {
        setTeamCreateSuccess(res.message);
        setTimeout(() => setTeamCreateSuccess(''), 3000);
        loadAllData();
      }
    } catch (err) {
      setTeamCreateError(err.message || 'Failed to delete team.');
      setTimeout(() => setTeamCreateError(''), 3000);
    }
  };

  // Toggle Participant Status
  const handleToggleParticipantStatus = async (userId) => {
    try {
      const res = await toggleParticipantStatus(userId);
      if (res.success) {
        loadAllData();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Reset all participants and balances to clean slate (0 participants)
  const handleResetToCleanSlate = async () => {
    if (!window.confirm("WARNING: This will reset all participants to 0, restore all team balances to starting capital, and clear round transactions. Proceed with clean slate?")) {
      return;
    }
    try {
      const res = await resetToCleanSlate();
      if (res.success) {
        alert(res.message);
        loadAllData();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Save Settings Submit
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg('');
    try {
      const res = await updateGameSettings(settings);
      if (res.success) {
        setSettingsMsg('Game settings and round state updated successfully!');
        setSettings(res.settings);
        setTimeout(() => setSettingsMsg(''), 3000);
      }
    } catch (err) {
      setSettingsMsg(`Error: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.teamId.toLowerCase().includes(teamSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Loading Admin Control Suite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-8">
      {/* Admin Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold text-xs rounded-full">
                {user?.adminId || 'ADMIN'}
              </span>
              <span className="text-xs text-slate-400">Event Controller Suite</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              CAPITAL RUSH <span className="text-amber-400">ADMIN</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Multi-admin concurrent orchestration for Finance & E-Cell IIIT Kottayam
            </p>
          </div>

          {/* Core Admin Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setQrScannerOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-display font-black rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-95"
            >
              <Camera className="w-5 h-5" />
              <span>SCAN TEAM QR</span>
            </button>

            <button
              onClick={handleResetToCleanSlate}
              className="flex items-center gap-1.5 px-3.5 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/20 transition active:scale-95"
              title="Reset all participants to 0 and restore clean state"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset to 0</span>
            </button>

            <button
              onClick={handleRefresh}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-2 mt-8 pt-6 border-t border-slate-800 text-xs">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: Building2 },
            { id: 'tasks', label: 'Round 2 Arena Tasks', icon: Flame },
            { id: 'teams', label: `Teams (${teams.length})`, icon: Users },
            { id: 'participants', label: `Participants (${participants.length})`, icon: ShieldCheck },
            { id: 'settings', label: 'Game Settings & Rounds', icon: Settings },
            { id: 'audit', label: 'Admin Audit Log', icon: FileText },
            { id: 'transactions', label: 'Ledger Transactions', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Teams</div>
              <div className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
                {stats?.totalTeams || teams.length}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Players</div>
              <div className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
                {stats?.totalPlayers || participants.length}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Capital</div>
              <div className="font-display font-black text-xl sm:text-2xl text-amber-400 mt-1 font-mono">
                ₹{(stats?.totalCapital || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Current Round</div>
              <div className="font-display font-black text-2xl sm:text-3xl text-blue-400 mt-1">
                ROUND {settings?.currentRound || 1}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Highest Capital</div>
              <div className="font-display font-black text-xl sm:text-2xl text-emerald-400 mt-1 font-mono">
                ₹{(stats?.highestCapital || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Lowest Capital</div>
              <div className="font-display font-black text-xl sm:text-2xl text-slate-300 mt-1 font-mono">
                ₹{(stats?.lowestCapital || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Quick Team Search & Action Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-display font-bold text-xl text-white">Quick Team Operations</h3>
                <p className="text-xs text-slate-400">
                  Select a team to adjust balance, apply stock outcomes, or inspect QR
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search Team Name or ID..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map((t) => (
                <div
                  key={t.id || t.teamId}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                        {t.teamId}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">{t.name}</h4>
                      <p className="text-[11px] text-slate-400">{t.memberCount || 0} Registered Members</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-lg text-amber-400">
                        ₹{t.currentCapital.toLocaleString('en-IN')}
                      </div>
                      <div className={`text-[11px] font-bold ${t.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.profitLoss >= 0 ? `+₹${t.profitLoss.toLocaleString('en-IN')}` : `-₹${Math.abs(t.profitLoss).toLocaleString('en-IN')}`}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-800/80 text-xs">
                    <button
                      onClick={() => setQuickMoneyTeamId(t.teamId)}
                      className="py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/20 transition flex items-center justify-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+/- Money</span>
                    </button>

                    <button
                      onClick={() => setStockModalTeam(t)}
                      className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-lg border border-rose-500/20 transition flex items-center justify-center gap-1"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Stocks</span>
                    </button>

                    <button
                      onClick={() => setQrDisplayTeam(t)}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition flex items-center justify-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: ROUND 2 ARENA TASKS */}
      {/* ========================================================================= */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                  <Flame className="w-3.5 h-3.5" /> ARENA TASK CONTROLLER
                </div>
                <h3 className="font-display font-black text-2xl text-white">
                  Round 2 Task Challenges & Scoring
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage the 4 official tournament tasks, deduct entry fees, and record risk-adjusted payouts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setTaskScoringTeamId('');
                    setSelectedTaskKey('WHO_AM_I');
                    setTaskScoringOpen(true);
                  }}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-95 flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>SCORE ANY TASK</span>
                </button>
              </div>
            </div>

            {/* The 4 Official Task Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { key: 'WHO_AM_I', name: 'Who Am I', diff: 'Medium', risk: 'Medium', fee: 300, mult: 2.0, loss: 300, color: 'text-amber-400', border: 'border-amber-500/30' },
                { key: 'BOUNCE_THE_BALL', name: 'Bounce The Ball', diff: 'Easy', risk: 'Easy', fee: 200, mult: 1.5, loss: 200, color: 'text-emerald-400', border: 'border-emerald-500/30' },
                { key: 'EAT_THE_COOKIES', name: 'Eat The Cookies', diff: 'Moderately Hard', risk: 'Medium-High', fee: 400, mult: 2.5, loss: 400, color: 'text-purple-400', border: 'border-purple-500/30' },
                { key: 'RUN_WITH_THE_PEN', name: 'Run With The Pen', diff: 'Hard', risk: 'Hard', fee: 600, mult: 3.5, loss: 600, color: 'text-rose-400', border: 'border-rose-500/30' }
              ].map((task) => (
                <div key={task.key} className={`bg-slate-950 p-4 rounded-2xl border ${task.border} flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-display font-black text-sm uppercase ${task.color}`}>
                        {task.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        ₹{task.fee} Fee
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1 mb-4">
                      <div>Difficulty: <strong className="text-white">{task.diff}</strong></div>
                      <div>Risk Level: <strong className="text-white">{task.risk}</strong></div>
                      <div>Win Payout: <strong className="text-emerald-400">+{task.mult}x (+₹{Math.round(task.fee * task.mult)})</strong></div>
                      <div>Loss Penalty: <strong className="text-rose-400">-₹{task.loss}</strong></div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTaskKey(task.key);
                      setTaskScoringTeamId('');
                      setTaskScoringOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Score {task.name}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Team Task Scoring List */}
            <div>
              <h4 className="font-display font-bold text-base text-white mb-3 flex items-center justify-between">
                <span>Select Team to Score</span>
                <span className="text-xs font-mono text-slate-400">{teams.length} Teams</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams.map((t) => {
                  const isEliminated = t.currentCapital < 1000 || t.status === 'DISQUALIFIED' || t.status === 'ELIMINATED';
                  return (
                    <div key={t.teamId} className={`bg-slate-950 p-3.5 rounded-2xl border ${isEliminated ? 'border-rose-900/60 bg-rose-950/15' : 'border-slate-800'} flex items-center justify-between gap-3`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">{t.teamId}</span>
                          <span className="font-bold text-white text-sm truncate">{t.name}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          ₹{t.currentCapital.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setTaskScoringTeamId(t.teamId);
                          setTaskScoringOpen(true);
                        }}
                        disabled={isEliminated}
                        className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-bold text-xs rounded-lg transition shrink-0"
                      >
                        Score Task
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Team Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit">
            <h3 className="font-display font-bold text-lg text-white mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              Register New Team
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Team names must be strictly unique across the competition
            </p>

            {teamCreateError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{teamCreateError}</span>
              </div>
            )}

            {teamCreateSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{teamCreateSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Unique Team Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Team Phoenix"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Starting Capital (₹)
                </label>
                <input
                  type="number"
                  step="500"
                  value={newTeamCapital}
                  onChange={(e) => setNewTeamCapital(parseInt(e.target.value) || 10000)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={teamCreateLoading || !newTeamName.trim()}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition active:scale-95 text-xs"
              >
                {teamCreateLoading ? 'Generating QR & Registering...' : 'CREATE TEAM'}
              </button>
            </form>
          </div>

          {/* Teams Table */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-white">Active Teams Roster</h3>
              <span className="text-xs text-slate-400 font-mono">{teams.length} Teams</span>
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-6">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-300">No Teams Created Yet</div>
                <p className="text-xs text-slate-500 mt-1">
                  Team count is currently 0. Create teams using the form on the left, or let participants create teams during registration.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                        <th className="py-3 px-3">Team ID</th>
                        <th className="py-3 px-3">Name & Status</th>
                        <th className="py-3 px-3">Members</th>
                        <th className="py-3 px-3">Current Capital</th>
                        <th className="py-3 px-3">Return %</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {teams.map((t) => {
                        const isEliminated = t.isEliminated || t.currentCapital < 1000 || t.status === 'DISQUALIFIED' || t.status === 'ELIMINATED';
                        return (
                          <tr key={t.id || t.teamId} className={`hover:bg-slate-800/40 transition ${isEliminated ? 'bg-rose-950/15' : ''}`}>
                            <td className="py-3 px-3 font-mono text-amber-400 font-bold">{t.teamId}</td>
                            <td className="py-3 px-3 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <span className={isEliminated ? 'line-through text-slate-400' : ''}>{t.name}</span>
                                {isEliminated ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    ELIMINATED (&lt; ₹1K)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-400">{t.memberCount} players</td>
                            <td className={`py-3 px-3 font-mono font-bold ${isEliminated ? 'text-rose-400' : 'text-white'}`}>
                              ₹{t.currentCapital.toLocaleString('en-IN')}
                            </td>
                            <td className={`py-3 px-3 font-bold ${t.returnPercentage >= 0 && !isEliminated ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isEliminated ? 'LOST' : t.returnPercentage >= 0 ? `+${t.returnPercentage}%` : `${t.returnPercentage}%`}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => setQuickMoneyTeamId(t.teamId)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg"
                                  title="Quick Money"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setStockModalTeam(t)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg"
                                  title="Stock Outcome"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setQrDisplayTeam(t)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg"
                                  title="QR Code"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTeam(t)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition"
                                  title="Delete Team"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards for Teams */}
                <div className="md:hidden space-y-3">
                  {teams.map((t) => {
                    const isEliminated = t.isEliminated || t.currentCapital < 1000 || t.status === 'DISQUALIFIED' || t.status === 'ELIMINATED';
                    return (
                      <div
                        key={t.id || t.teamId}
                        className={`p-4 rounded-2xl border transition ${
                          isEliminated
                            ? 'bg-rose-950/20 border-rose-900/60'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-amber-400">{t.teamId}</span>
                          {isEliminated ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              ELIMINATED (&lt; ₹1,000)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-white text-base mb-1">
                          <span className={isEliminated ? 'line-through text-slate-400' : ''}>{t.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="text-slate-400">{t.memberCount} players</span>
                          <span className={`font-mono font-bold text-sm ${isEliminated ? 'text-rose-400' : 'text-white'}`}>
                            ₹{t.currentCapital.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            onClick={() => setQuickMoneyTeamId(t.teamId)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-lg"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Money</span>
                          </button>
                          <button
                            onClick={() => setStockModalTeam(t)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold rounded-lg"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Stock</span>
                          </button>
                          <button
                            onClick={() => setQrDisplayTeam(t)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(t)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition"
                            title="Delete Team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PARTICIPANTS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'participants' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Participant Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit">
            <h3 className="font-display font-bold text-lg text-white mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Add Participant
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add student account with unique college email & assign to team
            </p>

            {partCreateError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{partCreateError}</span>
              </div>
            )}

            {partCreateSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{partCreateSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateParticipantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  College Email (Unique)
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@iiitkottayam.ac.in"
                  value={newPartEmail}
                  onChange={(e) => setNewPartEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Assign to Team
                </label>
                <select
                  required
                  value={newPartTeamId}
                  onChange={(e) => setNewPartTeamId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Select Team --</option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.name} ({t.teamId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Initial Password
                </label>
                <input
                  type="text"
                  required
                  value={newPartPass}
                  onChange={(e) => setNewPartPass(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={partCreateLoading || !newPartEmail.trim() || !newPartTeamId}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition active:scale-95 text-xs"
              >
                {partCreateLoading ? 'Creating User...' : 'ADD PARTICIPANT'}
              </button>
            </form>
          </div>

          {/* Participants Table */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-white">Registered Participants</h3>
              <span className="text-xs text-slate-400 font-mono">{participants.length} Players</span>
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-6">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-300">No Participants Registered Yet</div>
                <p className="text-xs text-slate-500 mt-1">
                  Participant count is currently 0. As students register or you add them, the roster will update dynamically.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                        <th className="py-3 px-3">Name</th>
                        <th className="py-3 px-3">College Email</th>
                        <th className="py-3 px-3">Assigned Team</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {participants.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-bold text-white">{p.name}</td>
                          <td className="py-3 px-3 font-mono text-slate-400">{p.email}</td>
                          <td className="py-3 px-3">
                            {p.team ? (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold">
                                {p.team.name} ({p.team.teamId})
                              </span>
                            ) : (
                              <span className="text-slate-500">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleParticipantStatus(p._id)}
                                className={`p-1.5 rounded-lg border transition ${
                                  p.status === 'ACTIVE'
                                    ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                                    : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border-slate-700'
                                }`}
                                title={p.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteParticipant(p)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition"
                                title="Delete Participant Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Cards (Phone View) */}
                <div className="md:hidden space-y-3">
                  {participants.map((p) => (
                    <div key={p._id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-sm truncate">{p.name}</div>
                        <div className="font-mono text-xs text-slate-400 truncate">{p.email}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {p.team && (
                            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                              {p.team.name}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleParticipantStatus(p._id)}
                          className={`p-2.5 rounded-xl border transition ${
                            p.status === 'ACTIVE'
                              ? 'bg-slate-800 text-emerald-400 border-slate-700'
                              : 'bg-slate-800 text-rose-400 border-slate-700'
                          }`}
                          title={p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteParticipant(p)}
                          className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GAME SETTINGS & ROUNDS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Settings className="w-6 h-6" />
            <h3 className="font-display font-bold text-xl text-white">Event Simulation Settings</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Configure round progression, event state, and global return benchmarks
          </p>

          {settingsMsg && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{settingsMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Event Status Toggle */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Overall Event State
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['NOT_STARTED', 'LIVE', 'FINISHED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSettings({ ...settings, gameStatus: st })}
                    className={`py-2.5 px-3 rounded-xl font-display font-bold text-xs transition ${
                      settings?.gameStatus === st
                        ? st === 'FINISHED'
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'bg-emerald-500 text-slate-950 shadow-lg'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Round Selector */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Active Round (2 Rounds Competition)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { r: 1, label: 'ROUND 1: INVESTMENT' },
                  { r: 2, label: 'ROUND 2: ARENA TASKS' }
                ].map(({ r, label }) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSettings({ ...settings, currentRound: r })}
                    className={`py-3 px-2 rounded-xl font-display font-bold text-xs text-center transition ${
                      settings?.currentRound === r
                        ? 'bg-amber-500 text-slate-950 shadow-lg'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Default Starting Capital (₹)
                </label>
                <input
                  type="number"
                  value={settings?.startingCapital ?? 10000}
                  onChange={(e) => setSettings({ ...settings, startingCapital: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Min Per Asset Rule (₹)
                </label>
                <input
                  type="number"
                  value={settings?.minimumAssetInvestment ?? 1000}
                  onChange={(e) => setSettings({ ...settings, minimumAssetInvestment: parseInt(e.target.value) || 1000 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Max Total Investable (₹)
                </label>
                <input
                  type="number"
                  value={settings?.maximumTotalInvestable ?? 8000}
                  onChange={(e) => setSettings({ ...settings, maximumTotalInvestable: parseInt(e.target.value) || 8000 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Stocks Return (%)
                </label>
                <input
                  type="number"
                  value={settings?.stockReturnPercent ?? 0}
                  onChange={(e) => setSettings({ ...settings, stockReturnPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Bank Return (%)
                </label>
                <input
                  type="number"
                  value={settings?.bankReturnPercent ?? 5}
                  onChange={(e) => setSettings({ ...settings, bankReturnPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Gold Return (%)
                </label>
                <input
                  type="number"
                  value={settings?.goldReturnPercent ?? 8}
                  onChange={(e) => setSettings({ ...settings, goldReturnPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Live Announcement Banner */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Broadcast Announcement (Displayed on all screens)
              </label>
              <input
                type="text"
                placeholder="e.g. Attention teams: Round 2 begins in 5 minutes at the main atrium!"
                value={settings?.announcement ?? ''}
                onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition active:scale-95 text-sm"
            >
              {savingSettings ? 'Broadcasting Updates...' : 'SAVE & BROADCAST SETTINGS'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT LOG */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-xl text-white">Administrator Audit Trail</h3>
              <p className="text-xs text-slate-400">
                Immutable security logs of administrative balance adjustments, round transitions, and logins
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">{auditLogs.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-3">Admin</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Target Team</th>
                  <th className="py-3 px-3">Details</th>
                  <th className="py-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">{log.adminId}</td>
                    <td className="py-3 px-3 font-semibold text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-400">{log.targetTeam || '—'}</td>
                    <td className="py-3 px-3 text-slate-400 max-w-sm truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: TRANSACTIONS LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-xl text-white">Platform Ledger</h3>
              <p className="text-xs text-slate-400">
                All debits, credits, investments, and peer transfers across the event
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">{transactions.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Team</th>
                  <th className="py-3 px-3">Round</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3">Operator</th>
                  <th className="py-3 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx._id || tx.transactionId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono text-slate-400">{tx.transactionId}</td>
                      <td className="py-3 px-3 font-bold text-white">
                        {tx.team?.name || 'Team'} ({tx.team?.teamId || '—'})
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-300">R{tx.round}</td>
                      <td className="py-3 px-3 text-slate-300">{tx.type}</td>
                      <td className={`py-3 px-3 font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                      </td>
                      <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{tx.reason}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{tx.performedBy}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Scanner Modal (Camera / Manual ID) */}
      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScanSuccess={handleQRScanned}
        title="Admin: Scan Team QR"
      />

      {/* Quick Money Modal */}
      <Round2QuickMoneyModal
        teamId={quickMoneyTeamId}
        isOpen={!!quickMoneyTeamId}
        onClose={() => setQuickMoneyTeamId(null)}
        onSuccess={loadAllData}
      />

      {/* Stock Modifier Modal */}
      <AdminStockModal
        team={stockModalTeam}
        isOpen={!!stockModalTeam}
        onClose={() => setStockModalTeam(null)}
        onSuccess={loadAllData}
      />

      {/* QR Code Display Modal */}
      <QRDisplayModal
        team={qrDisplayTeam}
        isOpen={!!qrDisplayTeam}
        onClose={() => setQrDisplayTeam(null)}
      />

      {/* Round 2 Task Scoring Modal */}
      <AdminTaskScoringModal
        teams={teams}
        defaultTeamId={taskScoringTeamId}
        defaultTaskKey={selectedTaskKey}
        isOpen={taskScoringOpen}
        onClose={() => setTaskScoringOpen(false)}
        onSuccess={loadAllData}
        onOpenQRScanner={() => setQrScannerOpen(true)}
      />

      {/* Mobile Sticky Bottom Floating Action Bar (Admin Mobile-Specific Navigation) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 pb-safe flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${activeTab === 'overview' ? 'text-amber-400' : 'text-slate-400'}`}
        >
          <Building2 className="w-5 h-5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${activeTab === 'tasks' ? 'text-amber-400' : 'text-slate-400'}`}
        >
          <Flame className="w-5 h-5" />
          <span>Tasks</span>
        </button>

        {/* Big Center Thumb SCAN QR Button */}
        <button
          onClick={() => setQrScannerOpen(true)}
          className="w-12 h-12 -mt-5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 border-2 border-slate-950 active:scale-95 transition"
          title="Scan Team QR"
        >
          <Camera className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${activeTab === 'teams' ? 'text-amber-400' : 'text-slate-400'}`}
        >
          <Users className="w-5 h-5" />
          <span>Teams</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${activeTab === 'settings' ? 'text-amber-400' : 'text-slate-400'}`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
