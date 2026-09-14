import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../services/api';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Medal, ArrowUpRight, Award, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FinalResultsPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getLeaderboard();
        if (res.success) {
          setLeaderboard(res.leaderboard);
          if (res.leaderboard.length > 0) {
            setWinner(res.leaderboard[0]);
            try {
              confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.5 }
              });
            } catch (e) {}
          }
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs uppercase tracking-widest mb-4">
        <Sparkles className="w-4 h-4" /> Official Event Ceremony
      </div>
      <h1 className="font-display font-black text-4xl sm:text-6xl text-white uppercase mb-2">
        CAPITAL RUSH <span className="text-amber-400">CHAMPIONS</span>
      </h1>
      <p className="text-slate-400 text-sm mb-12">
        Finance & E-Cell • Indian Institute of Information Technology Kottayam
      </p>

      {/* Winner Podium Card */}
      {winner && (
        <div className="bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-8 sm:p-12 mb-12 relative overflow-hidden shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/40">
            <Crown className="w-12 h-12" />
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
            Grand Winner
          </div>
          <h2 className="font-display font-black text-4xl sm:text-6xl text-white mb-2">
            {winner.name}
          </h2>
          <div className="font-mono text-sm text-slate-400 mb-8">
            TEAM ID: {winner.teamId}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Final Capital</div>
              <div className="font-display font-black text-2xl text-amber-400 mt-1">
                ₹{winner.currentCapital.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Starting Capital</div>
              <div className="font-display font-black text-2xl text-slate-300 mt-1">
                ₹{winner.startingCapital.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Profit</div>
              <div className="font-display font-black text-2xl text-emerald-400 mt-1">
                +₹{winner.profitLoss.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Return %</div>
              <div className="font-display font-black text-2xl text-emerald-400 mt-1">
                +{winner.returnPercentage}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Podium Ranks 2 & 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {leaderboard[1] && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-300 text-slate-950 font-black flex items-center justify-center text-lg">
                #2
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">1st Runner Up</div>
                <div className="text-xl font-bold text-white">{leaderboard[1].name}</div>
                <div className="text-xs font-mono text-slate-500">{leaderboard[1].teamId}</div>
              </div>
            </div>
            <div className="text-right font-mono font-bold text-lg text-amber-400">
              ₹{leaderboard[1].currentCapital.toLocaleString('en-IN')}
            </div>
          </div>
        )}

        {leaderboard[2] && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-700 text-white font-black flex items-center justify-center text-lg">
                #3
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">2nd Runner Up</div>
                <div className="text-xl font-bold text-white">{leaderboard[2].name}</div>
                <div className="text-xs font-mono text-slate-500">{leaderboard[2].teamId}</div>
              </div>
            </div>
            <div className="text-right font-mono font-bold text-lg text-amber-400">
              ₹{leaderboard[2].currentCapital.toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </div>

      <Link
        to="/leaderboard"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
      >
        <Trophy className="w-4 h-4 text-amber-400" />
        View Complete Leaderboard
      </Link>
    </div>
  );
}
