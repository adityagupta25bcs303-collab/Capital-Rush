import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, UserCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminLogin() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!adminId || !password) {
      setError('Please provide both Admin ID and password.');
      return;
    }

    setLoading(true);
    try {
      await loginAdmin(adminId, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (id) => {
    setAdminId(id);
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-3 shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-display font-black text-2xl text-white tracking-wide uppercase">
            Administrator Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authorized administrative access for event controllers & officials
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Identifier
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="e.g. ADMIN01"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm font-mono uppercase tracking-widest placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-display font-black tracking-wider text-sm rounded-xl shadow-lg shadow-blue-600/25 transition active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying Credentials...' : 'SIGN IN AS ADMINISTRATOR'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick demo fill chips */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Quick Demo Login
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN01')}
              className="px-2.5 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            >
              ADMIN01
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN02')}
              className="px-2.5 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            >
              ADMIN02
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN03')}
              className="px-2.5 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            >
              ADMIN03
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Looking for participant login?{' '}
          <Link to="/login" className="text-amber-400 font-semibold hover:underline">
            Participant Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
