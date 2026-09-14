import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Shield,
  Activity,
  ArrowRightLeft,
  Trophy,
  Users,
  ChevronRight,
  Sparkles,
  Key
} from 'lucide-react';

export default function LandingPage({ gameSettings }) {
  return (
    <div className="relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        {/* Organization Chip */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-amber-400 mb-6 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Finance & E-Cell • IIIT Kottayam Presents</span>
        </div>

        {/* Title & Tagline */}
        <h1 className="font-display font-black text-5xl sm:text-7xl tracking-tight text-white mb-4 uppercase">
          CAPITAL <span className="text-amber-400">RUSH</span>
        </h1>
        <p className="text-xl sm:text-2xl font-bold tracking-widest text-slate-300 uppercase mb-6 font-display">
          Think. Invest. Risk. Negotiate. Win.
        </p>

        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed mb-10">
          A high-stakes, 3-round collegiate financial strategy simulation. Teams start with{' '}
          <span className="text-amber-300 font-bold">₹10,000</span> in capital, construct asset portfolios,
          compete in physical challenges, and negotiate direct peer transfers to build the ultimate treasury.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black tracking-wide text-base shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5" />
            PARTICIPANT LOGIN
          </Link>

          <Link
            to="/admin/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-display font-bold text-base transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5 text-amber-400" />
            ADMIN LOGIN
          </Link>

          <Link
            to="/leaderboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-display font-bold text-base transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            LIVE LEADERBOARD
          </Link>
        </div>

        {/* 3 Rounds Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-6xl mx-auto mb-20">
          {/* Round 1 */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 backdrop-blur-sm transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
              ROUND 1
            </div>
            <h3 className="font-display font-bold text-2xl text-white mb-2">
              INVEST
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Allocate ₹10,000 across Cash, Bank, simulated Stocks, and Gold. Keep minimum ₹2,000 cash and balance high-yield risk vs. guaranteed returns.
            </p>
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <span>Simulated Market Volatility</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Round 2 */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 backdrop-blur-sm transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
              ROUND 2
            </div>
            <h3 className="font-display font-bold text-2xl text-white mb-2">
              CHALLENGE
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Real-world physical challenges conducted on campus. Administrators scan your permanent Team QR code to instantaneously credit winnings or apply penalties.
            </p>
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <span>Sub-second QR Balance Updates</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Round 3 */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 backdrop-blur-sm transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">
              ROUND 3
            </div>
            <h3 className="font-display font-bold text-2xl text-white mb-2">
              NEGOTIATE
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Direct team-to-team peer bargaining. Form alliances, execute buyouts, and initiate direct capital transfers with mandatory confirmation preview.
            </p>
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <span>Autonomous Atomic Transfers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Demo Quick Access Helper */}
        <div className="max-w-4xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-left">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
            <Key className="w-4 h-4" />
            <span>Pre-Configured Demo Accounts (Ready for Testing)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-semibold mb-1">Participant Accounts (Password: <code className="text-amber-400 font-mono">student123</code>):</div>
              <ul className="space-y-1 font-mono text-slate-300">
                <li>• <span className="text-emerald-400">rahul@iiitkottayam.ac.in</span> (Team Alpha)</li>
                <li>• <span className="text-emerald-400">aditya@iiitkottayam.ac.in</span> (Team Alpha)</li>
                <li>• <span className="text-emerald-400">priya@iiitkottayam.ac.in</span> (Team Bravo)</li>
                <li>• <span className="text-emerald-400">arjun@iiitkottayam.ac.in</span> (Team Charlie)</li>
              </ul>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-semibold mb-1">Administrator Accounts (Password: <code className="text-amber-400 font-mono">admin123</code>):</div>
              <ul className="space-y-1 font-mono text-slate-300">
                <li>• <span className="text-amber-400">ADMIN01</span> (Admin Officer 1)</li>
                <li>• <span className="text-amber-400">ADMIN02</span> (Admin Officer 2)</li>
                <li>• ... up to <span className="text-amber-400">ADMIN10</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 text-center">
          <p className="font-display font-black text-2xl sm:text-3xl text-slate-300 uppercase tracking-wide">
            "Who will finish with the highest capital?"
          </p>
        </div>
      </div>
    </div>
  );
}
