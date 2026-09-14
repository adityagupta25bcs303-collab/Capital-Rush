import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerParticipant, getLeaderboard } from '../services/api';
import { setAuthToken, setUserRole } from '../services/api';
import { Users, Lock, Mail, ArrowRight, AlertCircle, UserPlus, Building2 } from 'lucide-react';

export default function ParticipantLogin() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [teamSelectionType, setTeamSelectionType] = useState('existing'); // 'existing' | 'new'
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [availableTeams, setAvailableTeams] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginParticipant, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch available teams for registration dropdown
    (async () => {
      try {
        const res = await getLeaderboard();
        if (res.success && res.leaderboard) {
          setAvailableTeams(res.leaderboard);
          if (res.leaderboard.length > 0) {
            setSelectedTeamId(res.leaderboard[0].teamId);
          }
        }
      } catch (e) {}
    })();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both college email and password.');
      return;
    }

    setLoading(true);
    try {
      await loginParticipant(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Name, college email, and password are required.');
      return;
    }

    if (teamSelectionType === 'existing' && !selectedTeamId) {
      setError('Please select a team to join.');
      return;
    }

    if (teamSelectionType === 'new' && !newTeamName.trim()) {
      setError('Please enter a team name for your new team.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerParticipant(
        name.trim(),
        email.trim(),
        password,
        teamSelectionType === 'existing' ? selectedTeamId : null,
        teamSelectionType === 'new' ? newTeamName.trim() : null
      );

      if (res.success) {
        setAuthToken(res.token);
        setUserRole(res.user.role);
        await refreshUser();
        setSuccess('Registration successful! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Portal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="font-display font-black text-2xl text-white tracking-wide uppercase">
            Participant Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to your team dashboard or register for CAPITAL RUSH
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            REGISTER NEW PLAYER
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {mode === 'login' ? (
          /* SIGN IN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                College Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="student@iiitkottayam.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-base sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-base sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-display font-black tracking-wider text-sm rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'SIGN IN TO DASHBOARD'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-base sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                College Email
              </label>
              <input
                type="email"
                required
                placeholder="student@iiitkottayam.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-base sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-base sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Team Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Team Allocation
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setTeamSelectionType('existing')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                    teamSelectionType === 'existing'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Join Existing Team
                </button>
                <button
                  type="button"
                  onClick={() => setTeamSelectionType('new')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                    teamSelectionType === 'new'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Create New Team
                </button>
              </div>

              {teamSelectionType === 'existing' ? (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  {availableTeams.length === 0 ? (
                    <option value="">No existing teams yet (Create a new team above)</option>
                  ) : (
                    availableTeams.map((t) => (
                      <option key={t.teamId} value={t.teamId}>
                        {t.name} ({t.teamId})
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter unique Team Name (e.g. Team Titans)"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-base sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-display font-black tracking-wider text-sm rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Registering...' : 'REGISTER & START SIMULATION'}
              <UserPlus className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          Are you an event administrator?{' '}
          <Link to="/admin/login" className="text-amber-400 font-semibold hover:underline">
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
