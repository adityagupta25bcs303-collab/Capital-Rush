import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  TrendingUp,
  Trophy,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  Radio,
  Clock
} from 'lucide-react';

export default function Navbar({ gameSettings }) {
  const { user, role, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoundBadge = () => {
    if (!gameSettings) return null;
    const r = gameSettings.currentRound || 1;
    const status = gameSettings.gameStatus || 'NOT_STARTED';

    if (status === 'FINISHED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <Clock className="w-3.5 h-3.5" /> Event Concluded
        </span>
      );
    }

    if (status === 'NOT_STARTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-700/50 text-slate-300 border border-slate-600">
          Not Started
        </span>
      );
    }

    const roundNames = {
      1: 'Round 1: Investment',
      2: 'Round 2: Arena Tasks'
    };

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
        {roundNames[r] || `Round ${r}`}
      </span>
    );
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display font-black text-lg sm:text-xl tracking-wider text-white">
                  CAPITAL<span className="text-amber-400">RUSH</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-slate-800 text-slate-400 rounded border border-slate-700">
                  IIIT Kottayam
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block">
                Finance & E-Cell • Strategy Simulation
              </p>
            </div>
          </Link>

          {/* Center Round Indicator */}
          <div className="hidden md:flex items-center gap-3">
            {getRoundBadge()}
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Live Indicator */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
              title={isConnected ? 'Live WebSocket Connected' : 'Connecting to Server...'}
            >
              <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline text-[11px]">{isConnected ? 'Live' : 'Connecting'}</span>
            </div>

            {/* Leaderboard Link */}
            <Link
              to="/leaderboard"
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                location.pathname === '/leaderboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Rankings</span>
              <span className="xs:hidden sm:inline">Leaderboard</span>
            </Link>

            {/* User Logged In State */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {role === 'ADMIN' ? (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{user.adminId || 'Admin'}</span>
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-slate-800 text-amber-400 hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="max-w-[70px] sm:max-w-[120px] truncate">
                      {user.team ? user.team.name : 'Team'}
                    </span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                >
                  Player
                </Link>
                <Link
                  to="/admin/login"
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                >
                  Admin
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
